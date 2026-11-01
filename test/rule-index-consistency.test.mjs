import test from "node:test";
import assert from "node:assert/strict";
import { address, cell, cellSet, merge } from "@red-cup-engineering/signcell/cell";
import {
  admitRule, admitRules, antecedentHolds, derivation, fire, fireRule, fireRuleIn, firedRuleNames, rule, always, step,
} from "../src/rules.mjs";

const premise = cell("source", "claims", "outcome");
const consequence = cell("recipient", "may-read", "outcome");
const forTelling = cell("source", "claims", "outcome", { for: ["source-witness"] });
const againstTelling = cell("source", "claims", "outcome", { against: ["counter-witness"] });
const positive = rule("positive", [{ cell: premise, atLeast: "potential" }],
  { cell: consequence, reading: "potential" });
const negative = rule("negative", [{ cell: premise, atLeast: "active" }],
  { cell: consequence, reading: "active" });
const contested = rule("contested", [{ cell: premise, atLeast: "stable" }],
  { cell: consequence, reading: "stable" });
const rules = [positive, negative, contested];

test("public rule admission retains native identity and ordered repeated occurrences", () => {
  assert.equal(admitRule(positive), positive);
  const source = [positive, negative, positive];
  const received = admitRules(source);
  assert.deepEqual(received, source);
  assert.equal(received[0], positive);
  assert.equal(received[2], positive);
  assert.ok(Object.isFrozen(received));
  source[0] = negative;
  source.length = 0;
  assert.equal(received[0], positive);
  assert.equal(received[1], negative);
  assert.equal(received.length, 3);
});

test("wire rule admission captures one immutable rule with its complete derivation identity", () => {
  const wire = JSON.parse(JSON.stringify(positive));
  const received = admitRule(wire);
  assert.deepEqual(derivation(received), derivation(positive));
  wire.antecedent[0].cell.subject = "substituted-source";
  wire.consequent.reading = "active";
  assert.deepEqual(derivation(received), derivation(positive));
  assert.deepEqual(fireRule(received, [forTelling]), fireRule(positive, [forTelling]));
  assert.equal(admitRule(received), received);
});

test("rule-family admission refuses executable and non-positional inputs without reading them", () => {
  let reads = 0;
  const accessor = [];
  Object.defineProperty(accessor, 0, { enumerable: true, get() { reads++; return positive; } });
  const iterator = [positive];
  iterator[Symbol.iterator] = function* () { reads++; yield positive; };
  const decorated = [positive];
  decorated.extra = true;
  const alteredMap = [positive];
  alteredMap.map = () => { reads++; return []; };
  for (const source of [accessor, iterator, decorated, alteredMap, new Array(1), { 0: positive, length: 1 }])
    assert.throws(() => admitRules(source), TypeError);
  const ruleGetter = { ...positive };
  Object.defineProperty(ruleGetter, "antecedent", { enumerable: true, get() { reads++; return []; } });
  assert.throws(() => admitRules([ruleGetter]), TypeError);
  assert.equal(reads, 0);
});

test("admission and public consequence readers reject the same foreign rule dialect", () => {
  const foreign = { when: premise, then: consequence };
  for (const invoke of [
    () => admitRule(foreign), () => admitRules([foreign]),
    () => fire([foreign], []), () => firedRuleNames([foreign], []),
  ]) assert.throws(invoke, /original rule positions/);
});

test("first/last occurrence order cannot change an admitted rule judgment", () => {
  const firstPositive = [forTelling, againstTelling];
  const firstNegative = [againstTelling, forTelling];
  for (const valuation of [firstPositive, firstNegative]) {
    for (const admitted of rules) {
      assert.equal(antecedentHolds(admitted, valuation), true, admitted.name);
    }
    assert.deepEqual(firedRuleNames(rules, valuation),
      ["positive", "negative", "contested"]);
  }
  assert.deepEqual(fire(rules, firstPositive), fire(rules, firstNegative));
  assert.deepEqual(step(rules, firstPositive), step(rules, firstNegative));
});

test("public rule firing and SignCraft's indexed rule firing share the same source evidence", () => {
  const merged = merge(forTelling, againstTelling);
  const indexed = new Map([[address(merged), merged]]);
  for (const admitted of rules) {
    assert.deepEqual(fireRule(admitted, [forTelling, againstTelling]),
      fireRuleIn(admitted, indexed));
  }
});

test("missing or one-sided testimony cannot be promoted into both-sided proof", () => {
  for (const valuation of [[], [cell("source", "claims", "outcome")],
    [forTelling], [againstTelling]]) {
    assert.equal(antecedentHolds(contested, valuation), false);
    assert.deepEqual(fireRule(contested, valuation), []);
    assert.equal(firedRuleNames([contested], valuation).length, 0);
  }
  assert.deepEqual(firedRuleNames([positive, negative], [forTelling]), ["positive"]);
  assert.deepEqual(firedRuleNames([positive, negative], [againstTelling]), ["negative"]);
});

test("public rule readers preserve Map evidence and refuse forged Map-key attribution", () => {
  const merged = merge(forTelling, againstTelling);
  const indexed = new Map([[address(merged), merged]]);
  // The public array and Map entry points must have identical consequences.
  for (const admitted of rules) {
    assert.equal(antecedentHolds(admitted, indexed), true, admitted.name);
    assert.deepEqual(fireRule(admitted, indexed), fireRule(admitted, [forTelling, againstTelling]));
  }
  assert.deepEqual(firedRuleNames(rules, indexed), ["positive", "negative", "contested"]);
  assert.deepEqual(fire(rules, indexed), fire(rules, [forTelling, againstTelling]));

  // A Map can carry two independent tellings of one triple under arbitrary
  // keys. It is not an authority to choose the cell's semantic address.
  const split = new Map([["source-A", forTelling], ["source-B", againstTelling]]);
  assert.equal(antecedentHolds(contested, split), true);
  assert.deepEqual(fireRule(contested, split), fireRule(contested, [forTelling, againstTelling]));

  const intruder = cell("unrelated", "claims", "outcome", {
    for: ["fake-positive"], against: ["fake-negative"],
  });
  const forged = new Map([[address(premise), intruder]]);
  assert.equal(antecedentHolds(contested, forged), false);
  assert.deepEqual(firedRuleNames(rules, forged), []);
  assert.deepEqual(fireRule(contested, forged), []);
});

test("rules cannot execute untrusted source reading or Cell coordinate getters",()=>{
  let calls = 0;
  const plain = {subject:"from",predicate:"claims",object:"to"};
  const tests = [
    () => {
      const condition = {cell:plain};
      Object.defineProperty(condition,"atLeast",{enumerable:true,get(){calls++;return "potential";}});
      return rule("bad-antecedent",[condition],{cell:plain,reading:"potential"});
    },
    () => {
      const consequence = {cell:plain};
      Object.defineProperty(consequence,"reading",{enumerable:true,get(){calls++;return "potential";}});
      return rule("bad-consequence",[],consequence);
    },
    () => {
      const sourceCell = {predicate:"claims",object:"to"};
      Object.defineProperty(sourceCell,"subject",{enumerable:true,get(){calls++;return "from";}});
      return rule("bad-cell",[{cell:sourceCell,atLeast:"potential"}],{cell:plain,reading:"potential"});
    },
    () => {
      const sourceCell = {predicate:"claims",object:"to"};
      Object.defineProperty(sourceCell,"subject",{enumerable:true,get(){calls++;return "from";}});
      return always(sourceCell,"potential");
    }
  ];
  for(const attempt of tests)
    assert.throws(attempt,/data property|accessor|inert own data/u);
  assert.equal(calls,0);
});

test("rule coordinates cannot erase malformed source evidence before Cell admission",()=>{
  const coordinate={subject:"from",predicate:"claims",object:"to"};
  let calls=0;
  const executable={...coordinate,against:[]};
  Object.defineProperty(executable,"for",{enumerable:true,get(){calls++;return [];}});
  for(const source of [
    {...coordinate,for:[]},
    {...coordinate,against:[]},
    {...coordinate,value:"stable"},
    {...coordinate,for:[],against:[],value:"unknown-reading"},
    {...coordinate,for:[],against:[],extraSourceAuthority:undefined},
    executable,
  ]){
    assert.throws(()=>rule("incomplete",[{cell:source,atLeast:"potential"}],
      {cell:consequence,reading:"potential"}),TypeError);
    assert.throws(()=>always(source,"potential"),TypeError);
  }
  assert.equal(calls,0,"no evidence getter can be hidden by triple projection");
  const written=cell("from","claims","to",{value:"stable"});
  const licensed=rule("written-only",[{cell:written,atLeast:"stable"}],
    {cell:consequence,reading:"potential"});
  assert.equal(antecedentHolds(licensed,[written]),true);
  assert.deepEqual(written.for,[]);
  assert.deepEqual(written.against,[]);
});

test("source rule antecedents refuse sparse, decorated and executable indexed arrays",()=>{
  const condition={cell:premise,atLeast:"potential"};
  const sparse=new Array(2);sparse[0]=condition;
  const decorated=[condition];decorated.authority="forged";
  let calls=0;
  const getters=[condition];
  Object.defineProperty(getters,"0",{enumerable:true,get(){calls++;return condition;}});
  for(const supplied of [sparse,decorated,getters]){
    assert.throws(()=>rule("bad-list",supplied,{cell:consequence,reading:"potential"}),
      /dense|undecorated|inert own data/u);
  }
  assert.equal(calls,0);
});

test("four positive global propagation rounds are required despite finite FOUR fibers",()=>{
  const symbols=["a","b","c","d","e"].map(x=>cell(x,"supports","claim"));
  const cascade=symbols.slice(0,-1).map((premise,i)=>
    rule("cascade:"+i,[{cell:premise,atLeast:"potential"}],
      {cell:symbols[i+1],reading:"potential"}));
  let state=cellSet([cell("a","supports","claim",{for:["seed"]})]);
  const counts=[1];
  for(let round=1;round<=4;round++){
    state=step(cascade,state);
    counts.push(state.filter(x=>x.for.length>0).length);
    if(round===3) assert.equal(state.some(x=>address(x)===address(symbols[4])),false,
      "three rounds cannot create a terminal FOUR witness through four dependencies");
  }
  assert.deepEqual(counts,[1,2,3,4,5]);
  assert.deepEqual(step(cascade,state),state,
    "a fixed-point test, not arbitrary fuel, certifies settlement");
});

test("public rule readers refuse forged executable rule records before any source getter",()=>{
 let executed=0;
 const malicious={kind:"signchain.rule",name:"foreign",consequent:{cell:consequence,reading:"potential"}};
 Object.defineProperty(malicious,"antecedent",{enumerable:true,get(){executed++;return []}});
 const source=[forTelling];
 for(const go of [
   ()=>antecedentHolds(malicious,source),()=>derivation(malicious),
   ()=>fireRule(malicious,source),()=>fireRuleIn(malicious,new Map()),
   ()=>fire([malicious],source),()=>step([malicious],source),
   ()=>firedRuleNames([malicious],source)
 ]) assert.throws(go,/inert original rule positions/u);
 assert.equal(executed,0);
 const decorated={...positive,sourceAuthority:"fabricated"};
 assert.throws(()=>fireRule(decorated,source),/inert original rule positions/u);
});

test("historical JSON rule re-admission preserves versioned derivation and four-sided evidence",()=>{
 const source=JSON.parse(JSON.stringify(positive));
 assert.deepEqual(fireRule(source,[forTelling]),fireRule(positive,[forTelling]));
 assert.deepEqual(fireRule(source,[againstTelling]),fireRule(positive,[againstTelling]));
 assert.deepEqual(derivation(source,1),derivation(positive,1),
   "legacy v1 derivation remains reproducible without rewriting the witness");
 assert.deepEqual(derivation(source,2),derivation(positive,2),
   "v2 derivation is still content-identified from the same admitted rule");
 const before=derivation(source,2).ruleId;
 source.consequent.reading="active";
 const after=derivation(source,2).ruleId;
 assert.notEqual(after,before,
   "mutable received JSON must be re-admitted at each read, not cached as source-owned");
});

test("public rule arrays cannot execute indexed getters or erase antecedents",()=>{
 let reads=0;
 const array=[positive];Object.defineProperty(array,"0",{enumerable:true,
   get(){reads++;return positive;}});
 for(const read of [()=>fire(array,[forTelling]),
   ()=>firedRuleNames(array,[forTelling]),()=>step(array,[forTelling])])
   assert.throws(read,/inert own data/u);
 assert.equal(reads,0);
});

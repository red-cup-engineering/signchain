import test from "node:test";
import assert from "node:assert/strict";
import * as signCellPredication from "@red-cup-engineering/signcell/predication";
const { predicationSite, specializationMorphism, predicateOfClaim, baseObjectCoincides } = signCellPredication;
import {mark} from "@red-cup-engineering/signcell/mark";
import {token,claim} from "@red-cup-engineering/signcell/utterance";
const isAdmittedPredicationBase = signCellPredication.isAdmittedPredicationBase;
// Do NOT call unqualified tests "passed" when the pinned source package lacks
// its constructor-origin guard; explicitly report those receiving cases skipped.
const hasBaseNodes = typeof signCellPredication.predicationBaseNodeOf === "function";
const hasAdmission = typeof isAdmittedPredicationBase === "function" && hasBaseNodes;
const originalSourceTest = (name, fn) => test(name, {
  skip: hasAdmission ? false :
    "installed SignCell predication producer lacks original base construction admission",
}, fn);
import { cell } from "@red-cup-engineering/signcell/cell";
import {
  cellOf,
  specializationInferenceMorphism,
  converseInferenceMorphism,
  inferenceMorphismIdentity,
  inferenceRules,
  theoryOfBase,
  derive,
  derivationValidity,
  derivationIdentity,
  typedTheoryProofCarrier,
} from "../src/typed-theory.mjs";

test("cellOf builds a (subject, predicate, object) cell", () => {
  const cell = cellOf("s", "p", "o");
  assert.deepEqual(cell, { subject: "s", predicate: "p", object: "o" });
});

test("inferenceMorphismIdentity: a morphism is identical to itself", () => {
  const judgment = inferenceMorphismIdentity(specializationInferenceMorphism, specializationInferenceMorphism);
  assert.equal(judgment.kind, "typedTheory.inferenceMorphismIdentity:witness");
});

test("inferenceMorphismIdentity: distinct morphism kinds are not identical", () => {
  const judgment = inferenceMorphismIdentity(specializationInferenceMorphism, converseInferenceMorphism);
  assert.equal(judgment.kind, "typedTheory.inferenceMorphismIdentity-obstruction");
});

test("inferenceRules: a cell witness yields three rules (converse, subject- and object-projection)", {
  skip:hasBaseNodes ? false : "pinned SignCell lacks source-owned predication-base nodes",
}, () => {
  const rules = inferenceRules([cellOf("s", "p", "o")]);
  assert.equal(rules.length, 3);
  assert.deepEqual(new Set(rules.map((rule) => rule.trace.morphisms[0].kind)), new Set([
    "typedTheory.inferenceMorphism.converse",
    "typedTheory.inferenceMorphism.subjectProjection",
    "typedTheory.inferenceMorphism.objectProjection",
  ]));
  const originalNode=signCellPredication.predicationBaseNodeOf(cellOf("s","p","o"));
  assert.equal(baseObjectCoincides(rules[0].domain,originalNode),true,
    "generic inference rules still use the original SignCell base-node role");
  assert.equal(baseObjectCoincides(rules[0].domain,[...originalNode]),false,
    "an unissued source array cannot impersonate a categorical node");
});

originalSourceTest("inferenceRules inherits one inert source list and SignCell-issued endpoints without executing caller source",()=>{
  const original=cellOf("alice","knows","bob");
  const rules=inferenceRules([original]);
  assert.equal(rules.length,3);
  assert.equal(rules[0].trace.morphisms[0].kind,
    "typedTheory.inferenceMorphism.converse");
  const produced=signCellPredication.predicationBaseNodeOf(original);
  for(const rule of rules)assert.equal(baseObjectCoincides(rule.domain,produced),true);
  assert.equal(baseObjectCoincides(rules[1].codomain,"alice"),true);
  assert.equal(baseObjectCoincides(rules[2].codomain,"bob"),true);

  let executed=0;
  const iterator=[original];
  Object.defineProperty(iterator,Symbol.iterator,{value(){
    executed++; return [original][Symbol.iterator]();
  }});
  assert.throws(()=>inferenceRules(iterator),/witnesses must be a dense unadorned array/);
  const accessor=[original];
  Object.defineProperty(accessor,"0",{enumerable:true,get(){
    executed++;return original;
  }});
  assert.throws(()=>inferenceRules(accessor),/witnesses entries must be own source data/);
  const sparse=new Array(2);
  sparse[0]=original;
  assert.throws(()=>inferenceRules(sparse),/witnesses must be a dense unadorned array/);
  class ForeignList extends Array {}
  assert.throws(()=>inferenceRules(new ForeignList(original)),/witnesses must be a finite source array/);
  assert.throws(()=>inferenceRules(new Set([original])),/witnesses must be a finite source array/);
  const hostile={...original};
  Object.defineProperty(hostile,"subject",{enumerable:true,get(){
    executed++;return original.subject;
  }});
  assert.throws(()=>inferenceRules([hostile]),/inert own Cell coordinates/);
  assert.equal(executed,0,"no caller-controlled iterator or getter may issue proof endpoints");

  const mutable={subject:{id:"before"},predicate:"observes",object:{id:"target"}};
  const derived=inferenceRules([mutable]);
  mutable.subject.id="edited";
  mutable.object.id="edited";
  assert.deepEqual(derived[1].codomain,{id:"before"},
    "proof source projections come from the immutable original SignCell base node");
  assert.deepEqual(derived[2].codomain,{id:"target"});
  assert.equal(Object.isFrozen(derived[1].codomain),true);
});

test("original typed derivation checker certifies real finite proof paths and identity only",()=>{
  // SignCell owns specialization direction and equality. SignChain owns
  // the proof path, its ExactNumber length and the certificate of validity.
  // This test intentionally has NO SKIP: it runs even when the older pinned
  // SignCell supplier has not shipped the new heterogeneous base-node API.
  const rules=inferenceRules([
    specializationMorphism("B","A"),
    specializationMorphism("C","B"),
  ]);
  const theory=Object.freeze({
    kind:"typedTheory.carrier",
    objects:Object.freeze(["A","B","C"]),
    rules:Object.freeze(rules),
  });
  const result=derive(theory,"A","C");
  assert.equal(result.kind,"typedTheory.derivationSearch:witness");
  assert.equal(result.derivation.steps.length,2);
  const certified=derivationValidity(theory,result.derivation);
  assert.equal(certified.kind,"typedTheory.derivationCheck:witness");
  assert.equal(Object.isFrozen(certified.derivation),true);
  assert.equal(Object.isFrozen(certified.derivation.steps),true);
  assert.equal(certified.derivation.length.value,"2");
  assert.equal(derivationIdentity(certified.derivation,result.derivation).kind,
    "typedTheory.derivationIdentity:witness",
    "the verified source cut is intensionally the same original rule path");

  const identity=derive(theory,"B","B");
  assert.equal(identity.kind,"typedTheory.derivationSearch:witness");
  assert.equal(identity.derivation.steps.length,0);
  const checkedIdentity=derivationValidity(theory,identity.derivation);
  assert.equal(checkedIdentity.kind,"typedTheory.derivationCheck:witness");
  assert.equal(checkedIdentity.derivation.length.value,"0");
  assert.equal(derive(theory,"C","A").kind,"typedTheory.derivationSearch-obstruction");

  // Exercise the actual higher-level original consumer: generated typing
  // judgments are never a completed proof carrier until the same source
  // checker has independently validated their exact finite path records.
  const carrier=typedTheoryProofCarrier(theory);
  assert.equal(carrier.kind,"typedTheory.proof.carrier");
  assert.equal(carrier.obstructions.length,0);
  assert.equal(carrier.validations.length,carrier.judgments.length);
  assert.ok(carrier.validations.every(item=>
    item.kind==="typedTheory.derivationCheck:witness"));
  assert.ok(carrier.validations.every(item=>
    item.derivation.theory===carrier.theory));
  assert.equal(carrier.rank.kind,"exactNumber.natural");
});

test("typed derivation validity refuses forged proof claims, executable steps and inconsistent exact lengths",()=>{
  const rule=inferenceRules([specializationMorphism("B","A")])[0];
  const theory=Object.freeze({
    kind:"typedTheory.carrier",
    objects:Object.freeze(["A","B"]),
    rules:Object.freeze([rule]),
  });
  const proved=derive(theory,"A","B").derivation;
  const refused=(source,label)=>{
    assert.equal(derivationValidity(theory,source).kind,
      "typedTheory.derivation-obstruction",label);
  };
  for(const [name,source] of [
    ["foreign carrier",{...proved,kind:"forged.derivation"}],
    ["foreign theorem theory",{...proved,theory:{...theory}}],
    ["counterfeit natural length",{...proved,length:{...proved.length,value:"999"}}],
    ["missing length",Object.fromEntries(Object.entries(proved).filter(([k])=>k!=="length"))],
    ["invented authority",{...proved,adminAuthority:"fabricated"}],
    ["wrong proof conclusion",{...proved,conclusion:"A"}],
    ["unadmitted proof object",{...proved,premise:"unknown"}],
    ["wrong source step kind",{...proved,steps:[{...proved.steps[0],kind:"foreign.step"}]}],
    ["added source step privilege",{...proved,steps:[{...proved.steps[0],authority:"granted"}]}],
    ["lookalike rule outside original theory",{...proved,steps:[{...proved.steps[0],rule:{...rule}}]}],
    ["wrong step codomain",{...proved,steps:[{...proved.steps[0],conclusion:"A"}]}],
    ["sparse declared proof steps",{...proved,steps:new Array(1)}],
    ["unissued extra proof step",{...proved,steps:[...proved.steps,proved.steps[0]]}],
  ])refused(source,name);

  let executed=0;
  const externalSteps=[proved.steps[0]];
  Object.defineProperty(externalSteps,Symbol.iterator,{value(){
    executed++;return [][Symbol.iterator]();
  }});
  refused({...proved,steps:externalSteps},"caller iterator cannot hide declared steps");
  const mutableProof={...proved};
  Object.defineProperty(mutableProof,"steps",{enumerable:true,get(){
    executed++;return [];
  }});
  refused(mutableProof,"proof fields must be inert own source data");
  const maliciousStep={...proved.steps[0]};
  Object.defineProperty(maliciousStep,"rule",{enumerable:true,get(){
    executed++;return rule;
  }});
  refused({...proved,steps:[maliciousStep]},"step rule must be inert own source data");
  const maliciousLength={...proved.length};
  Object.defineProperty(maliciousLength,"value",{enumerable:true,get(){
    executed++;return "1";
  }});
  refused({...proved,length:maliciousLength},"ExactNumber length must be inert data");
  assert.equal(executed,0,"no source getter or iterator is executed by the proof checker");

  // The validated result must not alias a mutable proof's source steps:
  // receiving a later mutation may change the external record, not the proof.
  const mutable={...proved,steps:[{...proved.steps[0]}]};
  mutable.steps[0].rule=rule;
  const checked=derivationValidity(theory,mutable);
  assert.equal(checked.kind,"typedTheory.derivationCheck:witness");
  const prior=checked.derivation.steps[0].conclusion;
  mutable.steps[0].conclusion="forged-after-admission";
  assert.equal(checked.derivation.steps[0].conclusion,prior);
  assert.equal(Object.isFrozen(checked.derivation.steps[0]),true);
});

test("even a zero-step identity refuses a malformed theory's rules and traces",()=>{
  const issued=inferenceRules([specializationMorphism("B","A")])[0];
  const objects=Object.freeze(["A","B"]);
  let called=0;
  const accessor=(source,key)=>{
    const altered={...source};
    Object.defineProperty(altered,key,{enumerable:true,get(){
      called++;return source[key];
    }});
    return altered;
  };
  const brokenTrace=[...issued.trace.morphisms];
  Object.defineProperty(brokenTrace,Symbol.iterator,{value(){
    called++;return [][Symbol.iterator]();
  }});
  const cases=[
    accessor(issued,"domain"),
    {...issued,extraInstitutionalRight:true},
    {...issued,kind:"foreign.rule"},
    {...issued,trace:accessor(issued.trace,"morphisms")},
    {...issued,trace:{...issued.trace,morphisms:brokenTrace}},
    {...issued,trace:{...issued.trace,morphisms:[accessor(issued.trace.morphisms[0],"kind")]}},
    {...issued,trace:{...issued.trace,morphisms:[{kind:"typedTheory.inferenceMorphism.unissued"}]}},
    {...issued,trace:{...issued.trace,morphisms:[]}},
  ];
  for(const badRule of cases){
    const badTheory=Object.freeze({
      kind:"typedTheory.carrier",objects,rules:Object.freeze([badRule]),
    });
    // derive() need not inspect rules to construct the identity at A. The
    // original derivation checker must nevertheless refuse an invalid
    // ambient theory instead of certifying a proof under it.
    const identity=derive(badTheory,"A","A");
    assert.equal(identity.kind,"typedTheory.derivationSearch:witness");
    assert.equal(identity.derivation.steps.length,0);
    assert.equal(derivationValidity(badTheory,identity.derivation).kind,
      "typedTheory.derivation-obstruction");
  }
  assert.equal(called,0,"unadmitted theory callbacks must never run");
});

// The actual source-owned predication site requires a typed Token-Predicate-Token
// Cell. Bare string SignCells are valid for the generic cell algebra but do NOT
// constitute a typed predication generator. Receive the real source type.
const originalTypedCell = () => cell(token(mark("alice")),
  predicateOfClaim(claim(mark("likes"))),token(mark("bob")));
const originalBase = () => predicationSite([originalTypedCell()]).base;

originalSourceTest("source-closed base projects all witnessed generator endpoints into one typed theory",()=>{
  const base=originalBase();
  const output=theoryOfBase(base);
  assert.equal(output.kind,"typedTheory.carrier");
  assert.equal(output.rules.length,3);
  assert.equal(output.objects.length,5);
  assert.deepEqual(output.rules.map(x=>x.trace.morphisms[0].kind),[
    "typedTheory.inferenceMorphism.converse",
    "typedTheory.inferenceMorphism.subjectProjection",
    "typedTheory.inferenceMorphism.objectProjection",
  ]);
  assert.equal(Object.isFrozen(output.objects),true);
  assert.equal(isAdmittedPredicationBase(base),true);
  assert.throws(()=>base.objects.push("foreign"),TypeError,
    "producer freezes the original category object carrier");
  assert.equal(output.objects.length,5,
    "the receiving theory retains the original closed object list");
});

originalSourceTest("typed theory preserves array-valued Mark terms without inventing a base node sort",()=>{
  const term=token(mark(["work","w1"]));
  const source=predicationSite([
    originalTypedCell(),
    specializationMorphism(["work","w2"],term),
  ]);
  const accepted=theoryOfBase(source.base);
  assert.equal(baseObjectCoincides(term,["work","w1"]),true,
    "plain array term and its Token-carried Mark have original source coincidence");
  assert.equal(baseObjectCoincides(["work","w1"],["work","w2"]),false);
  const originalNode=source.base.converse[0].domain;
  assert.equal(baseObjectCoincides(["work","w1"],originalNode),false,
    "a term array cannot impersonate the distinct Token-Predicate-Token node role");
  assert.equal(accepted.rules.length,4);
  assert.equal(accepted.rules[0].trace.morphisms[0].kind,
    "typedTheory.inferenceMorphism.specialization");
  for(const rule of accepted.rules)
    for(const endpoint of [rule.domain,rule.codomain])
      assert.ok(accepted.objects.some(x=>baseObjectCoincides(x,endpoint)),
        "source-qualified typed theory must retain every original generator endpoint");
});

originalSourceTest("incomplete original categorical source refuses; cannot invent absent nodes or specialization endpoints",()=>{
  const source=originalBase();
  for(const altered of [
    {...source,objects:["alice","bob","likes"]},
    {...source,objects:source.objects.filter(item=>!Array.isArray(item)||item[0]!=="bob")},
    {...source,specialization:[{domain:"specific",codomain:"general"}]},
    {...source,kind:"foreign.category"},
  ])assert.throws(()=>theoryOfBase(altered),/source|undeclared/u);
  const repaired=predicationSite([
    originalTypedCell(),
    specializationMorphism("specific","general")
  ]).base;
  const accepted=theoryOfBase(repaired);
  assert.equal(accepted.rules.length,4);
  assert.equal(accepted.rules[0].trace.morphisms[0].kind,
    "typedTheory.inferenceMorphism.specialization");
});

originalSourceTest("getter-backed source edges and sparse carriers never execute while obtaining proof rules",()=>{
  let calls=0;
  const source=originalBase();
  const bad={...source};
  Object.defineProperty(bad,"objects",{enumerable:true,get(){calls++;return source.objects;}});
  assert.throws(()=>theoryOfBase(bad),/originally constructed SignCell/u);
  const edge={codomain:"alice"};
  Object.defineProperty(edge,"domain",{enumerable:true,get(){calls++;return source.converse[0].domain;}});
  assert.throws(()=>theoryOfBase({...source,subjectProjection:[edge]}),/originally constructed SignCell/u);
  const list=[...source.converse];
  Object.defineProperty(list,"0",{enumerable:true,get(){calls++;return source.converse[0];}});
  assert.throws(()=>theoryOfBase({...source,converse:list}),/originally constructed SignCell/u);
  const sparse=new Array(2);sparse[0]=source.converse[0];
  assert.throws(()=>theoryOfBase({...source,converse:sparse}),/originally constructed SignCell/u);
  assert.equal(calls,0);
});

originalSourceTest("a syntactically closed forged base cannot enter an authentic inference theory",()=>{
 const genuine=originalBase(), forged=JSON.parse(JSON.stringify(genuine));
 assert.deepEqual(forged.objects,genuine.objects,
   "source identity and a matching mathematical object list are separate concerns");
 assert.equal(isAdmittedPredicationBase(forged),false);
 assert.throws(()=>theoryOfBase(forged),/originally constructed SignCell/u);
 assert.throws(()=>theoryOfBase({...genuine}),/originally constructed SignCell/u);
 const correct=theoryOfBase(genuine);
 assert.equal(correct.rules.length,3);
});

test("unqualified installed SignCell source refuses typed base construction instead of guessing",()=>{
  if (hasAdmission) {
    const valid=predicationSite([originalTypedCell()]).base;
    assert.equal(isAdmittedPredicationBase(valid),true);
    assert.equal(theoryOfBase(valid).kind,"typedTheory.carrier");
  } else if (typeof isAdmittedPredicationBase !== "function") {
    assert.throws(()=>theoryOfBase({kind:"predication.base"}),
      /source owner lacks predication-base construction admission/u);
  } else {
    assert.throws(()=>inferenceRules([cellOf("s","p","o")]),
      /pinned SignCell lacks source-owned base-node construction/u);
  }
});

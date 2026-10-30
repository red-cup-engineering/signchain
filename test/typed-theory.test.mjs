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

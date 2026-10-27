import test from "node:test";
import assert from "node:assert/strict";
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

test("inferenceRules: a cell witness yields three rules (converse, subject- and object-projection)", () => {
  const rules = inferenceRules([cellOf("s", "p", "o")]);
  assert.equal(rules.length, 3);
  assert.deepEqual(new Set(rules.map((rule) => rule.trace.morphisms[0].kind)), new Set([
    "typedTheory.inferenceMorphism.converse",
    "typedTheory.inferenceMorphism.subjectProjection",
    "typedTheory.inferenceMorphism.objectProjection",
  ]));
});

const originalBase = () => {
  const a=["alice","likes","bob"], b=["bob","likes","alice"];
  return {
    kind:"predication.base",
    objects:["alice","bob","likes",a,b],
    specialization:[],
    converse:[{domain:a,codomain:b}],
    subjectProjection:[{domain:a,codomain:"alice"}],
    objectProjection:[{domain:a,codomain:"bob"}],
  };
};

test("source-closed base projects all witnessed generator endpoints into one typed theory",()=>{
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
  base.objects.push("foreign");
  assert.equal(output.objects.length,5,"readout does not share a mutable object-list wrapper");
});

test("incomplete original categorical source refuses; cannot invent absent nodes or specialization endpoints",()=>{
  const source=originalBase();
  for(const altered of [
    {...source,objects:["alice","bob","likes"]},
    {...source,objects:source.objects.filter(item=>!Array.isArray(item)||item[0]!=="bob")},
    {...source,specialization:[{domain:"specific",codomain:"general"}]},
    {...source,kind:"foreign.category"},
  ])assert.throws(()=>theoryOfBase(altered),/source|undeclared/u);
  const repaired=originalBase();
  repaired.objects.push("specific","general");
  repaired.specialization=[{domain:"specific",codomain:"general"}];
  const accepted=theoryOfBase(repaired);
  assert.equal(accepted.rules.length,4);
  assert.equal(accepted.rules[0].trace.morphisms[0].kind,
    "typedTheory.inferenceMorphism.specialization");
});

test("getter-backed source edges and sparse carriers never execute while obtaining proof rules",()=>{
  let calls=0;
  const source=originalBase();
  const bad={...source};
  Object.defineProperty(bad,"objects",{enumerable:true,get(){calls++;return source.objects;}});
  assert.throws(()=>theoryOfBase(bad),/own data property/u);
  const edge={codomain:"alice"};
  Object.defineProperty(edge,"domain",{enumerable:true,get(){calls++;return source.converse[0].domain;}});
  assert.throws(()=>theoryOfBase({...source,subjectProjection:[edge]}),/own data property/u);
  const list=[...source.converse];
  Object.defineProperty(list,"0",{enumerable:true,get(){calls++;return source.converse[0];}});
  assert.throws(()=>theoryOfBase({...source,converse:list}),/own source data/u);
  const sparse=new Array(2);sparse[0]=source.converse[0];
  assert.throws(()=>theoryOfBase({...source,converse:sparse}),/dense unadorned/u);
  assert.equal(calls,0);
});

/** Strict ORIGINAL consumer assay: run explicitly before qualifying a
 * SignChain source package or downstream Fabrication/Circulation receiver.
 * Unlike the broad compatibility suite, this check never skips when an old
 * pinned SignCell lacks the constructor-origin capability.
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as signCell from "@red-cup-engineering/signcell/predication";
import { cell } from "@red-cup-engineering/signcell/cell";
import { theoryOfBase } from "../../src/typed-theory.mjs";

const { predicationSite, specializationMorphism, isAdmittedPredicationBase } = signCell;
const requiresOriginalProducer = () => {
  assert.equal(typeof predicationSite, "function", "installed SignCell lacks predicationSite");
  assert.equal(typeof specializationMorphism, "function", "installed SignCell lacks specializationMorphism");
  assert.equal(typeof isAdmittedPredicationBase, "function",
    "installed SignCell lacks source-constructed predication-base admission; this receiving test MUST NOT skip");
};

test("a pinned original SignCell producer constructs the source-closed theory consumed by SignChain",()=>{
  requiresOriginalProducer();
  const source = predicationSite([cell("alice","likes","bob")]);
  assert.equal(isAdmittedPredicationBase(source.base),true);
  const theory = theoryOfBase(source.base);
  assert.equal(theory.kind,"typedTheory.carrier");
  assert.equal(theory.objects.length,5);
  assert.deepEqual(theory.rules.map(x=>x.trace.morphisms[0].kind),[
    "typedTheory.inferenceMorphism.converse",
    "typedTheory.inferenceMorphism.subjectProjection",
    "typedTheory.inferenceMorphism.objectProjection",
  ]);
  assert.equal(Object.isFrozen(theory.objects),true);
});

test("original specialization without predications retains both typed endpoint objects",()=>{
  requiresOriginalProducer();
  const base = predicationSite([specializationMorphism("specific","general")]).base;
  assert.equal(isAdmittedPredicationBase(base),true);
  assert.equal(base.objects.length,2);
  assert.equal(theoryOfBase(base).rules.length,1);
});

test("transported lookalike category cannot manufacture an admitted proof theory",()=>{
  requiresOriginalProducer();
  const original=predicationSite([cell("alice","likes","bob")]).base;
  const forged=JSON.parse(JSON.stringify(original));
  assert.equal(isAdmittedPredicationBase(forged),false);
  assert.throws(()=>theoryOfBase(forged),/originally constructed SignCell/u);
  assert.throws(()=>theoryOfBase({...original}),/originally constructed SignCell/u);
  assert.equal(theoryOfBase(original).rules.length,3);
});

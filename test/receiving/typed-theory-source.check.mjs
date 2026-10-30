/** Strict ORIGINAL consumer assay: run explicitly before qualifying a
 * SignChain source package or downstream Fabrication/Circulation receiver.
 * Unlike the broad compatibility suite, this check never skips when an old
 * pinned SignCell lacks the constructor-origin capability.
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as signCell from "@red-cup-engineering/signcell/predication";
import { cell } from "@red-cup-engineering/signcell/cell";
import { utterance } from "@red-cup-engineering/signcell/utterance";
import { theoryOfBase } from "../../src/typed-theory.mjs";

const { predicationSite, specializationMorphism, isAdmittedPredicationBase } = signCell;
const requiresOriginalProducer = () => {
  assert.equal(typeof predicationSite, "function", "installed SignCell lacks predicationSite");
  assert.equal(typeof specializationMorphism, "function", "installed SignCell lacks specializationMorphism");
  assert.equal(typeof isAdmittedPredicationBase, "function",
    "installed SignCell lacks source-constructed predication-base admission; this receiving test MUST NOT skip");
};

// SignCell's ordinary Cell admits plain data, but predicationSite only
// admits original Token/Claim/Predicate hands. Construct this generator
// through the original producer, not a shape-compatible plain-data Cell.
function originalTypedPredication() {
  const report = utterance("alice", "likes");
  const observed = utterance("bob", "observes");
  const generator = signCell.cell(
    report.token,
    signCell.predicateOfClaim(report.claim),
    observed.token,
    { for: ["native-source-witness"] },
  );
  assert.equal(signCell.isCell(generator), true,
    "installed SignCell must admit its original typed predication carrier");
  return generator;
}

test("a pinned original SignCell producer constructs the source-closed theory consumed by SignChain",()=>{
  requiresOriginalProducer();
  const generator = originalTypedPredication();
  const source = predicationSite([generator]);
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
  // Neither "three rules" nor the generated kind alone proves preservation
  // of the source predicate projections. Refuse reversed/swapped endpoints.
  const originalNode = [generator.subject, generator.predicate, generator.object];
  const expected = [
    ["typedTheory.inferenceMorphism.converse", originalNode,
      [generator.object, generator.predicate, generator.subject]],
    ["typedTheory.inferenceMorphism.subjectProjection", originalNode, generator.subject],
    ["typedTheory.inferenceMorphism.objectProjection", originalNode, generator.object],
  ];
  assert.equal(typeof signCell.baseObjectCoincides, "function",
    "original SignCell must own predication endpoint equality");
  for(const [index,[kind,domain,codomain]] of expected.entries()){
    const rule=theory.rules[index];
    assert.equal(rule.kind,"typedTheory.inferenceRule");
    assert.equal(rule.trace.kind,"typedTheory.inferenceTrace");
    assert.equal(rule.trace.morphisms.length,1);
    assert.equal(rule.trace.morphisms[0].kind,kind);
    assert.equal(signCell.baseObjectCoincides(rule.domain,domain),true,
      "each rule must retain its actual source-generated domain");
    assert.equal(signCell.baseObjectCoincides(rule.codomain,codomain),true,
      "each rule must retain its actual source-generated codomain");
  }
});

test("the strict installed supplier preserves array-valued Term identities across heterogeneous generators",()=>{
  requiresOriginalProducer();
  const left=utterance(["work","w1"],"declares");
  const right=utterance(["work","w2"],"responds");
  const source=predicationSite([
    signCell.cell(left.token,signCell.predicateOfClaim(left.claim),right.token),
    specializationMorphism(["work","w2"],["work","w1"]),
  ]);
  const base=source.base;
  assert.equal(signCell.baseObjectCoincides(left.token,["work","w1"]),true,
    "a Token-carried array Mark and its original data term MUST coincide");
  assert.equal(signCell.baseObjectCoincides(["work","w1"],["work","w2"]),false);
  assert.equal(signCell.baseObjectCoincides(["work","w1"],base.converse[0].domain),false,
    "an array Term cannot be misidentified as a predication-node generator");
  const theory=theoryOfBase(base);
  assert.equal(theory.rules.length,4);
  for(const edge of theory.rules)
    for(const endpoint of [edge.domain,edge.codomain])
      assert.ok(theory.objects.some(object=>signCell.baseObjectCoincides(object,endpoint)),
        "every original source endpoint remains in the typed proof carrier");
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
  const original=predicationSite([originalTypedPredication()]).base;
  const forged=JSON.parse(JSON.stringify(original));
  assert.equal(isAdmittedPredicationBase(forged),false);
  assert.throws(()=>theoryOfBase(forged),/originally constructed SignCell/u);
  assert.throws(()=>theoryOfBase({...original}),/originally constructed SignCell/u);
  assert.equal(theoryOfBase(original).rules.length,3);
});


test("a plain evidenced Cell cannot impersonate a typed predication source", () => {
  requiresOriginalProducer();
  assert.throws(() => predicationSite([
    cell("alice", "likes", "bob", { for: ["ordinary-cell-witness"] }),
  ]), /unsupported or malformed source generator/u);
});

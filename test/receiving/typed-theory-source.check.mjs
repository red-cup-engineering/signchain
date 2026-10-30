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
import { theoryOfBase, inferenceRules, derive, derivationValidity, typedTheoryProofCarrier } from "../../src/typed-theory.mjs";

const { predicationSite, specializationMorphism, isAdmittedPredicationBase } = signCell;
const requiresOriginalProducer = () => {
  assert.equal(typeof predicationSite, "function", "installed SignCell lacks predicationSite");
  assert.equal(typeof specializationMorphism, "function", "installed SignCell lacks specializationMorphism");
  assert.equal(typeof isAdmittedPredicationBase, "function",
    "installed SignCell lacks source-constructed predication-base admission; this receiving test MUST NOT skip");
  assert.equal(typeof signCell.predicationBaseNodeOf, "function",
    "installed SignCell lacks original predication base-node issuance; a raw tuple is not source custody");
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
  // Original direct generic inference and declared-base inference must agree
  // on every source-issued generator endpoint, not only on three kind labels.
  const direct = inferenceRules([generator]);
  assert.equal(direct.length,theory.rules.length);
  for(let i=0;i<direct.length;i++){
    assert.equal(direct[i].trace.morphisms[0].kind,
      theory.rules[i].trace.morphisms[0].kind);
    assert.equal(signCell.baseObjectCoincides(direct[i].domain,theory.rules[i].domain),true,
      "generic inference source and original base must have coincident domains");
    assert.equal(signCell.baseObjectCoincides(direct[i].codomain,theory.rules[i].codomain),true,
      "generic inference source and original base must have coincident codomains");
  }
  // Neither "three rules" nor the generated kind alone proves preservation
  // of the source predicate projections. Refuse reversed/swapped endpoints.
  const originalNode = signCell.predicationBaseNodeOf(generator);
  const expected = [
    ["typedTheory.inferenceMorphism.converse", originalNode,
      signCell.predicationBaseNodeOf({
        subject:generator.object,predicate:generator.predicate,object:generator.subject,
      })],
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

test("strict installed SignCell source yields actual checked SignChain proof carrier",()=>{
  requiresOriginalProducer();
  const produced=predicationSite([originalTypedPredication()]);
  assert.equal(isAdmittedPredicationBase(produced.base),true);
  const theory=theoryOfBase(produced.base);
  const actualRule=theory.rules[0];
  const proof=derive(theory,actualRule.domain,actualRule.codomain);
  assert.equal(proof.kind,"typedTheory.derivationSearch:witness");
  assert.equal(derivationValidity(theory,proof.derivation).kind,
    "typedTheory.derivationCheck:witness",
    "only the exact installed SignCell rule positions license this finite path");
  const carrier=typedTheoryProofCarrier(theory);
  assert.equal(carrier.kind,"typedTheory.proof.carrier");
  assert.equal(carrier.obstructions.length,0);
  assert.equal(carrier.validations.length,carrier.judgments.length);
  assert.ok(carrier.validations.every(verdict=>
    verdict.kind==="typedTheory.derivationCheck:witness"));
  for(const verdict of carrier.validations){
    const proof=verdict.derivation;
    assert.equal(proof.theory,carrier.theory);
    assert.equal(Object.isFrozen(proof.steps),true);
    for(const step of proof.steps){
      assert.ok(carrier.theory.rules.includes(step.rule),
        "each validated step retains the source-issued installed rule");
      assert.equal(step.kind,"typedTheory.derivationStep");
    }
  }
  // This is a finite in-process proof of category-generator incidence.
  // It does not assert external witness, science kernel acceptance or
  // Graph/host operational receiving.
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
  const rawCopy=Object.freeze([...base.converse[0].domain]);
  assert.deepEqual(rawCopy,base.converse[0].domain);
  assert.equal(signCell.baseObjectCoincides(rawCopy,base.converse[0].domain),false,
    "even a JSON-identical three-role Mark value is NOT source-issued as a node");
  assert.equal(signCell.baseObjectCoincides(
    signCell.predicationBaseNodeOf({
      subject:left.token,predicate:signCell.predicateOfClaim(left.claim),object:right.token,
    }),base.converse[0].domain),true,
    "a separately source-issued presentation of the original triple is coincident");
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

test("strict installed source coincidence refuses executable hand roles before SignChain proof comparison",()=>{
  requiresOriginalProducer();
  const original=originalTypedPredication();
  const admitted=predicationSite([original]).base;
  const consumer=theoryOfBase(admitted);
  assert.equal(consumer.rules.length,3,
    "real SignChain theory must still receive the original typed generator");
  const term=original.subject;
  const claim=original.predicate.claim;
  assert.equal(signCell.baseObjectCoincides(term,JSON.parse(JSON.stringify(term.mark.value))),true,
    "the source-owned Token may coincide with its ordinary datum");
  assert.equal(signCell.predicateCoincides(original.predicate,claim),true,
    "source-owned Predicate and Claim have one original Mark value");
  let executed=0;
  const hostile=(input,field)=>{
    const received={...input};
    Object.defineProperty(received,field,{enumerable:true,get(){
      executed++;return input[field];
    }});
    return received;
  };
  assert.throws(()=>signCell.baseObjectCoincides(hostile(term,"kind"),term));
  assert.throws(()=>signCell.predicateCoincides(hostile(claim,"kind"),claim));
  assert.throws(()=>signCell.baseObjectCoincides(hostile(original.predicate,"kind"),original.predicate));
  assert.throws(()=>signCell.predicateCoincides(
    {...original.predicate,mark:original.subject.mark},claim),
    "a predicate cannot claim a second, noncoincident Mark");
  assert.equal(executed,0,
    "the original supplier's source-role equality cannot run callers' getters");
});

test("strict installed SignCell site refuses malformed evidence fields rather than reclassifying a triple",()=>{
  requiresOriginalProducer();
  const generator=originalTypedPredication();
  const bare={
    subject:generator.subject,
    predicate:generator.predicate,
    object:generator.object,
  };
  const good=predicationSite([bare]);
  const issued=theoryOfBase(good.base);
  assert.equal(issued.rules.length,3,
    "the original bare source triple still yields its three generator arrows");
  assert.equal(good.cells.cells.length,1);
  // A canonical identity projection may discard an undefined property.
  // The source admission must NOT use that reduction to erase an invalid
  // evidence role and then treat the malformed record as a bare triple.
  for(const input of [
    {...bare,for:undefined},
    {...bare,against:undefined},
    {...bare,value:undefined},
    {...bare,for:[],against:undefined},
    {...bare,for:undefined,against:[]},
    {...bare,for:[],against:[],value:undefined},
  ]) {
    assert.equal(signCell.isCell(input),false);
    assert.throws(()=>predicationSite([input]),
      /unsupported or malformed source generator/,
      "an invalid source-present evidence coordinate cannot become a proof edge");
  }
  assert.equal(theoryOfBase(predicationSite([{
    ...bare,for:[],against:[],
  }]).base).rules.length,3,
  "actual empty original testimony is distinguishable from a missing or invalid evidence field");
});

test("strict supplier refuses incomplete source before issuing inferred nodes",()=>{
  requiresOriginalProducer();
  const source={subject:"source",predicate:"reports",object:"recipient"};
  assert.equal(inferenceRules([source]).length,3);
  for(const malformed of [
    {...source,subject:undefined},
    {...source,predicate:undefined},
    {...source,object:undefined},
    {...source,for:undefined},
    {...source,against:undefined},
    {...source,value:undefined},
    {...source,for:[]},
    {...source,against:[]},
    {...source,for:[],against:[],value:undefined},
  ])assert.throws(()=>inferenceRules([malformed]),
    /complete original Cell source/,
    "source omission or partial evidence must never generate an inference node");
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

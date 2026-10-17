import test from "node:test";
import assert from "node:assert/strict";
import { cell } from "@red-cup-engineering/signcell/cell";
import { adjudicateCellEvidence, adjudicateEvidenceTransition } from "../src/bilattice.mjs";

const make=(a=[],b=[],value)=>cell("source","proposed-identification","target",
  {for:a,against:b,...(value===undefined?{}:{value})});

test("SignChain distinguishes two independent witness sides under BOTH derived FOUR orders",()=>{
  const examples=[
    [make(),"unobserved","absurd","neither"],
    [make(["t"]),"supported-unopposed","potential","true"],
    [make([],["f"]),"opposed-unopposed","active","false"],
    [make(["t"],["f"]),"contested","stable","both"],
  ];
  for(const [source,posture,knowledge,truth] of examples){
    const r=adjudicateCellEvidence(source);
    assert.equal(r.evidence.posture,posture);
    assert.equal(r.evidence.knowledge,knowledge);
    assert.equal(r.evidence.truth,truth);
    assert.equal(r.value.knowledge,knowledge);
    assert.equal(r.value.truth,truth);
    assert.equal(r.value.measured,true);
    assert.equal(r.identification.quotientAdmitted,false);
    assert.equal(r.regime,"finite-reading-only");
    assert.deepEqual(r.source,source);
  }
});

test("a written conflated/presumed FOUR value cannot forge a positive original witness",()=>{
  const empty=adjudicateCellEvidence(make([],[],"stable"));
  assert.equal(empty.evidence.knowledge,"absurd");
  assert.equal(empty.evidence.truth,"neither");
  assert.equal(empty.value.knowledge,"stable");
  assert.equal(empty.value.truth,"both");
  assert.equal(empty.value.measured,false);
  assert.equal(empty.identification.eligibleForRelationProof,false);
  const shifted=adjudicateCellEvidence(make(["a"],[],"active"));
  assert.equal(shifted.evidence.knowledge,"potential");
  assert.equal(shifted.value.knowledge,"active");
  assert.equal(shifted.identification.eligibleForRelationProof,false);
});

test("positive original evidence is a candidate for a relation proof, NOT Quot.sound",()=>{
  const supported=adjudicateCellEvidence(make(["origin","independent"]));
  assert.equal(supported.evidence.positiveWitnesses.length,2);
  assert.equal(supported.identification.eligibleForRelationProof,true);
  assert.equal(supported.identification.quotientAdmitted,false);
  assert.match(supported.identification.requires,/equivalence relation/);
  const opposed=adjudicateCellEvidence(make(["origin"],["counterexample"]));
  assert.equal(opposed.identification.eligibleForRelationProof,false);
  assert.equal(opposed.evidence.posture,"contested");
  assert.deepEqual(opposed.evidence.positiveWitnesses,["origin"]);
  assert.deepEqual(opposed.evidence.negativeWitnesses,["counterexample"]);
});

test("non-SignCell carriers and unsupported authority fields refuse",()=>{
  assert.throws(()=>adjudicateCellEvidence(null),/one original SignCell cell/);
  assert.throws(()=>adjudicateCellEvidence({subject:"a",predicate:"b",object:"c"}),
    /one original SignCell cell/);
  assert.throws(()=>adjudicateCellEvidence({...make(["a"]),issuerAuthenticated:true}),
    /one original SignCell cell/);
});


test("new opposing evidence ASCENDS knowledge and DESCENDS truth on the same Mark cell",()=>{
  const before=make(["affirm"]);
  const after=make(["affirm"],["oppose"]);
  const step=adjudicateEvidenceTransition(before,after);
  assert.equal(step.kind,"signchain.adjudicatedEvidenceTransition.v1");
  assert.equal(step.source.evidence.knowledge,"potential");
  assert.equal(step.target.evidence.knowledge,"stable");
  assert.equal(step.witnessOrders.knowledgeNondecreasing,true);
  assert.equal(step.witnessOrders.truthNondecreasing,false);
  assert.equal(step.valueOrders.knowledgeNondecreasing,true);
  assert.equal(step.valueOrders.truthNondecreasing,false);
  assert.equal(step.distinction,"knowledge-ascent-without-truth-ascent");
  assert.equal(step.noQuotientAdmission,true);
  assert.equal(step.closureRegime,"not inferred from one finite evidence transition");
});

test("finite witness transitions retain their own directions without inventing an ordinal",()=>{
  const increase=adjudicateEvidenceTransition(make(),make(["affirm"]));
  assert.equal(increase.witnessOrders.knowledgeNondecreasing,true);
  assert.equal(increase.witnessOrders.truthNondecreasing,true);
  const denial=adjudicateEvidenceTransition(make(),make([],["against"]));
  assert.equal(denial.witnessOrders.knowledgeNondecreasing,true);
  assert.equal(denial.witnessOrders.truthNondecreasing,false);
  const forgotten=adjudicateEvidenceTransition(make(["affirm"]),make());
  assert.equal(forgotten.witnessOrders.knowledgeNondecreasing,false);
  assert.equal(forgotten.distinction,"order-directions-are-separately-measured");
});

test("different original Mark cell identity refuses an untyped knowledge/truth morphism",()=>{
  const other=cell("different","identifies","target",{for:["witness"]});
  assert.throws(()=>adjudicateEvidenceTransition(make(["affirm"]),other),/same original cell/);
  assert.throws(()=>adjudicateEvidenceTransition(make(["affirm"]),{}),/same original cell/);
});

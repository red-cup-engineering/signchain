import test from "node:test";
import assert from "node:assert/strict";
import { cell, address } from "@red-cup-engineering/signcell/cell";
import { TellingLog } from "../src/log.mjs";
import { assessOriginalSourceWithdrawal as assay } from "../src/source-withdrawal.mjs";

const proposition=()=>cell({research:"institutional-adoption"},"reported-by","documentary-evidence");
const origin=(w,originalProducer)=>({witness:w,originalProducer});
const names = result=>result.withdrawals.map(x=>x.originalProducer);

test("Science documentary counterexample: two reports from one producer have zero source-withdrawal robustness",()=>{
  const c=proposition();
  const s30={sourceDocument:"S30",episode:"E13"},s31={sourceDocument:"S31",episode:"E14"};
  const history=new TellingLog().tell(c,s30).tell(c,s31).seal();
  const result=assay(history,{proposition:c,attributions:[
    origin(s30,"XR_UK_SOS"),origin(s31,"XR_UK_SOS")]});
  assert.equal(result.propositionAddress,address(c));
  assert.equal(result.original.knowledge,"potential");
  assert.equal(result.original.truth,"true");
  assert.equal(result.distinctWitnesses,2);
  assert.equal(result.attributedProducerCount,1);
  assert.deepEqual(names(result),["XR_UK_SOS"]);
  assert.equal(result.withdrawals[0].remaining.knowledge,"absurd");
  assert.equal(result.withdrawals[0].remaining.truth,"neither");
  assert.equal(result.withdrawals[0].removedWitnessAddresses.length,2);
  assert.equal(result.withdrawals[0].originalKnowledgeAboveRestricted,true);
  assert.equal(history.size,2);
  assert.equal(history.readingAt(c),"potential");
  assert.equal(history.sealed,true);
});

test("FOUR keeps supporting and opposing originals distinct under two counterfactual source withdrawals",()=>{
  const c=cell("public-report","supports","proposition");
  const one={recordNi:"ni:one",edition:"1"},two={recordNi:"ni:two",edition:"2"};
  const history=new TellingLog().tell(c,one).deny(c,two).seal();
  const result=assay(history,{proposition:c,attributions:[
    origin(one,"origin-a"),origin(two,"origin-b")]});
  assert.equal(result.original.knowledge,"stable");
  assert.equal(result.original.truth,"both");
  assert.deepEqual(names(result),["origin-a","origin-b"]);
  assert.deepEqual(result.withdrawals.map(x=>x.remaining.knowledge),["active","potential"]);
  assert.deepEqual(result.withdrawals.map(x=>x.remaining.truth),["false","true"]);
  assert.ok(result.withdrawals.every(x=>x.originalKnowledgeAboveRestricted));
  // Truth order is orthogonal: removing for- and against-evidence have different directions.
  assert.equal(result.withdrawals[0].restrictedTruthBelowOriginal,true);
  assert.equal(result.withdrawals[1].originalTruthBelowRestricted,true);
  assert.equal(history.readingAt(c),"stable");
});

test("same original witness on both sides is one witness assigned to one producer, not two independent sources",()=>{
  const c=cell("s","p","o"), same={source:"original",position:1};
  const log=new TellingLog().tell(c,same).deny(c,{position:1,source:"original"}).seal();
  const r=assay(log,{proposition:c,attributions:[origin(same,"one")]});
  assert.equal(r.distinctWitnesses,1);
  assert.equal(r.attributedProducerCount,1);
  assert.equal(r.withdrawals[0].remaining.knowledge,"absurd");
});

test("two independent producers remain supported when only one producer is hypothetically withheld",()=>{
  const c=cell("service","has-evidence","positive"), w1="published-a",w2="published-b";
  const log=new TellingLog().tell(c,w1).tell(c,w2).seal();
  const r=assay(log,{proposition:c,attributions:[
    origin(w1,"first"),origin(w2,"second")]});
  assert.equal(r.attributedProducerCount,2);
  assert.ok(r.withdrawals.every(x=>x.remaining.knowledge==="potential"));
  assert.deepEqual(r.withdrawals.map(x=>x.remaining.positiveWitnesses),[1,1]);
});

test("unattributed and foreign witness evidence cannot be silently treated as a distinct producer",()=>{
  const c=cell("s","p","o"),w1="observed-1",w2="observed-2";
  const log=new TellingLog().tell(c,w1).deny(c,w2).seal();
  assert.throws(()=>assay(log,{proposition:c,attributions:[origin(w1,"a")]}),/missing original-producer attribution/);
  assert.throws(()=>assay(log,{proposition:c,attributions:[
    origin(w1,"a"),origin(w2,"b"),origin("invented","c")]}),/not found in the original/);
  assert.throws(()=>assay(log,{proposition:c,attributions:[
    origin(w1,"a"),origin(w1,"b"),origin(w2,"b")]}),/multiply attributed/);
});

test("same semantic witness under reordered source JSON remains one identity",()=>{
  const c=cell("s","p","o"),a={id:"case",observed:"2026"},b={observed:"2026",id:"case"};
  const log=new TellingLog().tell(c,a).tell(c,b).seal();
  const r=assay(log,{proposition:c,attributions:[origin(a,"archive")]});
  assert.equal(r.distinctWitnesses,1);
  assert.equal(r.withdrawals[0].removedWitnessAddresses.length,1);
  assert.throws(()=>assay(log,{proposition:c,attributions:[
    origin(a,"archive"),origin(b,"different")]}),/multiply attributed/);
});

test("another proposition cannot borrow these original witnesses",()=>{
  const c=cell("s","p","o"),other=cell("s","p","different");
  const log=new TellingLog().tell(c,"only-here").seal();
  assert.throws(()=>assay(log,{proposition:other,attributions:[origin("only-here","a")]}),/not found in the original/);
  const unknown=assay(log,{proposition:other,attributions:[]});
  assert.equal(unknown.original.knowledge,"absurd");
  assert.equal(unknown.attributedProducerCount,0);
});

test("mutable logs, fabricated forms and handwritten value overrides refuse",()=>{
  const c=cell("s","p","o"),log=new TellingLog().tell(c,"one");
  assert.throws(()=>assay(log,{proposition:c,attributions:[origin("one","a")]}),/sealed original/);
  log.seal();
  assert.throws(()=>assay(log,{proposition:{subject:"s",predicate:"p",object:"o"},attributions:[origin("one","a")]}),/original unevidenced SignCell/);
  assert.throws(()=>assay(log,{proposition:cell("s","p","o",{value:"potential"}),attributions:[origin("one","a")]}),/unevidenced SignCell/);
  assert.throws(()=>assay(log,{proposition:c,attributions:[]}),/missing original-producer attribution/);
});

test("original source attribution must be a bounded plain data value, not a getter",()=>{
  const c=cell("s","p","o"),log=new TellingLog().tell(c,"one").seal();
  let called=0;
  const rogue={witness:"one",get originalProducer(){called++;return "author";}};
  assert.throws(()=>assay(log,{proposition:c,attributions:[rogue]}),/data property/);
  assert.equal(called,0);
});

test("results do not certify authority, source independence, source withdrawal, or work settlement",()=>{
  const c=cell("s","p","o");
  const r=assay(new TellingLog().seal(),{proposition:c,attributions:[]});
  assert.match(r.epistemicStanding,/conditional/);
  assert.ok(r.boundaries.some(s=>s.includes("independently verified")));
  assert.ok(r.boundaries.some(s=>s.includes("no source is actually withdrawn")));
  assert.equal(r.withdrawals.length,0);
});

test("conditional all-producer removal support distinguishes independent attributions from repeated documents",()=>{
  const c=cell("s","p","o"),a="report-a",b="report-b";
  const log=new TellingLog().tell(c,a).tell(c,b).seal();
  const same=assay(log,{proposition:c,attributions:[origin(a,"one"),origin(b,"one")]});
  const different=assay(log,{proposition:c,attributions:[origin(a,"one"),origin(b,"two")]});
  assert.equal(same.sourceRemovalSupport.evaluatedProducerCount,1);
  assert.equal(same.sourceRemovalSupport.supportSurvivesEverySingleProducerRemoval,false);
  assert.equal(different.sourceRemovalSupport.evaluatedProducerCount,2);
  assert.equal(different.sourceRemovalSupport.supportSurvivesEverySingleProducerRemoval,true);
  assert.equal(different.sourceRemovalSupport.oppositionSurvivesEverySingleProducerRemoval,false);
  assert.match(different.sourceRemovalSupport.standing,/conditional/);
});
test("zero producer attributions never produce vacuous source-independence certification",()=>{
  const c=cell("s","p","o");
  const r=assay(new TellingLog().seal(),{proposition:c,attributions:[]});
  assert.equal(r.sourceRemovalSupport.evaluatedProducerCount,0);
  assert.equal(r.sourceRemovalSupport.supportSurvivesEverySingleProducerRemoval,null);
  assert.equal(r.sourceRemovalSupport.oppositionSurvivesEverySingleProducerRemoval,null);
});

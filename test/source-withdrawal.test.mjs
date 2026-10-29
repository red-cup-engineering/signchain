import test from "node:test";
import assert from "node:assert/strict";
import { cell, address } from "@red-cup-engineering/signcell/cell";
import { TellingLog } from "../src/log.mjs";
import { assessOriginalSourceWithdrawal as assay, compareOriginalEvidenceSnapshots } from "../src/source-withdrawal.mjs";

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


test("snapshot comparison flags changed originals even when FOUR knowledge/truth remain unchanged", () => {
  const c = cell("research", "supported-by", "source-evidence");
  const first = new TellingLog().tell(c, {source:"archive-a"}).tell(c, {source:"archive-b"}).seal();
  const second = new TellingLog().tell(c, {source:"archive-a"}).tell(c, {source:"archive-c"}).seal();
  const r = compareOriginalEvidenceSnapshots(first, second, {propositions:[c]});
  assert.equal(r.monitoredPropositionCount, 1);
  assert.equal(r.readingChangedCount, 0);
  assert.equal(r.witnessChangedReadingUnchangedCount, 1);
  assert.deepEqual(r.changedPropositionAddresses, [address(c)]);
  assert.equal(r.comparisons[0].requiresReverification, true);
  assert.equal(r.comparisons[0].original.knowledge, "potential");
  assert.equal(r.comparisons[0].revised.knowledge, "potential");
  assert.equal(r.comparisons[0].forWitnessChanges.added.length, 1);
  assert.equal(r.comparisons[0].forWitnessChanges.removed.length, 1);
  assert.equal(r.comparisons[0].evidenceOrders.knowledgeNondecreasing, false);
  assert.equal(r.comparisons[0].evidenceOrders.knowledgeNonincreasing, false);
  assert.equal(first.size, 2);
  assert.equal(second.size, 2);
});

test("snapshot comparison treats repeated tellings of one witness as one original identity", () => {
  const c = cell("method", "cited", "paper"), witness={doi:"10.abc/a",page:3};
  const first = new TellingLog().tell(c, witness).tell(c,{page:3,doi:"10.abc/a"}).seal();
  const second = new TellingLog().tell(c, witness).seal();
  const r = compareOriginalEvidenceSnapshots(first, second, {propositions:[c]});
  assert.equal(r.comparisons[0].requiresReverification,false);
  assert.equal(r.comparisons[0].original.positiveWitnesses,1);
  assert.equal(r.comparisons[0].revised.positiveWitnesses,1);
  assert.deepEqual(r.changedPropositionAddresses,[]);
});

test("snapshot comparison distinguishes newly received opposition from unchanged support", () => {
  const c=cell("claim","has-status","contested"),w1="origin-support",w2="origin-opposition";
  const before=new TellingLog().tell(c,w1).seal();
  const after=new TellingLog().tell(c,w1).deny(c,w2).seal();
  const r=compareOriginalEvidenceSnapshots(before,after,{propositions:[c]});
  assert.equal(r.comparisons[0].original.truth,"true");
  assert.equal(r.comparisons[0].revised.truth,"both");
  assert.equal(r.comparisons[0].readingChanged,true);
  assert.equal(r.comparisons[0].againstWitnessChanges.added.length,1);
  assert.equal(r.comparisons[0].evidenceOrders.knowledgeNondecreasing,true);
  assert.equal(r.comparisons[0].evidenceOrders.truthNondecreasing,false);
});

test("snapshot comparison respects explicit scope across multiple propositions", () => {
  const one=cell("claim-one","asserted-in","paper"), two=cell("claim-two","asserted-in","paper");
  const before=new TellingLog().tell(one,"source-1").tell(two,"source-2").seal();
  const after=new TellingLog().tell(one,"source-1").deny(two,"source-3").seal();
  const r=compareOriginalEvidenceSnapshots(before,after,{propositions:[one,two]});
  assert.deepEqual(r.changedPropositionAddresses,[address(two)]);
  assert.equal(r.comparisons[0].requiresReverification,false);
  assert.equal(r.comparisons[1].requiresReverification,true);
  assert.equal(r.comparisons[1].original.knowledge,"potential");
  assert.equal(r.comparisons[1].revised.knowledge,"active");
  assert.equal(r.readingChangedCount,1);
});

test("snapshot comparison preserves a no-evidence reading and does not invent a change", () => {
  const c=cell("unknown","is","unknown");
  const r=compareOriginalEvidenceSnapshots(new TellingLog().seal(),new TellingLog().seal(),{propositions:[c]});
  assert.equal(r.comparisons[0].original.knowledge,"absurd");
  assert.equal(r.comparisons[0].revised.truth,"neither");
  assert.equal(r.comparisons[0].requiresReverification,false);
  assert.equal(r.inspectedTellings,0);
  assert.match(r.standing,/conditional/);
});

test("snapshot comparison refuses mutable histories, forged coordinates, duplicated claims and executable selectors", () => {
  const c=cell("s","p","o"),before=new TellingLog().tell(c,"w");
  const after=new TellingLog().tell(c,"w").seal();
  const compare=(a,b,coordinates)=>compareOriginalEvidenceSnapshots(a,b,{propositions:coordinates});
  assert.throws(()=>compare(before,after,[c]),/two sealed original/);
  before.seal();
  assert.throws(()=>compare(before,after,[c,c]),/cannot be compared twice/);
  assert.throws(()=>compare(before,after,[{subject:"s",predicate:"p",object:"o"}]),/original unevidenced SignCell/);
  assert.throws(()=>compare(before,after,[cell("s","p","o",{for:["w"]})]),/original unevidenced SignCell/);
  assert.throws(()=>compare(before,after,new Array(1)),/dense inert array/);
  let called=0;
  const malicious={get propositions(){called++;return [c];}};
  assert.throws(()=>compareOriginalEvidenceSnapshots(before,after,malicious),/data property/);
  assert.equal(called,0);
  assert.throws(()=>compare(before,after,new Array(129).fill(c)),/at most 128/);
});

test("all 16 bounded FOUR evidence-polarity transitions preserve witness-level change and separate order directions",()=>{
  const c=cell("FOUR","under","revision");
  const snapshot=state=>{
    const log=new TellingLog();
    if(state&1)log.tell(c,"positive-original");
    if(state&2)log.deny(c,"negative-original");
    return log.seal();
  };
  for(let before=0;before<4;before++)for(let after=0;after<4;after++){
    const r=compareOriginalEvidenceSnapshots(snapshot(before),snapshot(after),{propositions:[c]});
    const x=r.comparisons[0];
    assert.equal(x.requiresReverification,before!==after);
    assert.equal(x.readingChanged,before!==after);
    assert.equal(x.evidenceOrders.knowledgeNondecreasing,(before&after)===before);
    assert.equal(x.evidenceOrders.knowledgeNonincreasing,(before&after)===after);
    assert.equal(x.evidenceOrders.truthNondecreasing,
      (!(before&1)||Boolean(after&1)) && (!(after&2)||Boolean(before&2)));
  }
});

test("same witness and changed observation clock needs research re-verification even without verdict change",()=>{
  const c=cell("claim","supported-by","release");
  const first=new TellingLog().tell(c,{doi:"10.12/release"},"2026-10-27T23:00:00Z").seal();
  const second=new TellingLog().tell(c,{doi:"10.12/release"},"2026-10-28T00:30:00Z").seal();
  const r=compareOriginalEvidenceSnapshots(first,second,{propositions:[c]});
  const x=r.comparisons[0];
  assert.equal(x.witnessesChanged,false);
  assert.equal(x.observationsChanged,true);
  assert.equal(x.readingChanged,false);
  assert.equal(x.requiresReverification,true);
  assert.equal(x.forWitnessChanges.added.length,0);
  assert.equal(x.forWitnessChanges.removed.length,0);
  assert.equal(x.forObservationChanges.added.length,1);
  assert.equal(x.forObservationChanges.removed.length,1);
  assert.equal(x.forObservationChanges.added[0].observedAt,"2026-10-28T00:30:00Z");
  assert.equal(x.forObservationChanges.removed[0].observedAt,"2026-10-27T23:00:00Z");
  assert.deepEqual(r.changedPropositionAddresses,[address(c)]);
  assert.equal(r.observationChangedWitnessesUnchangedCount,1);
});

test("replayed identical source and observation time is not fabricated independence or revision",()=>{
  const c=cell("claim","repeated","citation");
  const old=new TellingLog().tell(c,"one","2026-10-27T23:00:00Z").seal();
  const same=new TellingLog().tell(c,"one","2026-10-27T23:00:00Z")
    .tell(c,"one","2026-10-27T23:00:00Z").seal();
  const x=compareOriginalEvidenceSnapshots(old,same,{propositions:[c]}).comparisons[0];
  assert.equal(x.witnessesChanged,false);
  assert.equal(x.observationsChanged,false);
  assert.equal(x.requiresReverification,false);
  assert.equal(x.forObservationChanges.added.length,0);
  assert.equal(x.revised.positiveWitnesses,1);
});

test("absent clock and explicitly present null are not silently equivalent",()=>{
  const c=cell("claim","timestamp","unverified");
  const before=new TellingLog().tell(c,"one").seal();
  const after=new TellingLog().tell(c,"one",null).seal();
  const x=compareOriginalEvidenceSnapshots(before,after,{propositions:[c]}).comparisons[0];
  assert.equal(x.witnessesChanged,false);
  assert.equal(x.observationsChanged,true);
  assert.equal(x.requiresReverification,true);
  assert.deepEqual(x.forObservationChanges.added.map(y=>y.observedAtPresent),[true]);
  assert.deepEqual(x.forObservationChanges.removed.map(y=>y.observedAtPresent),[false]);
});

test("a revised opposition observation clock remains visible without erasing contradiction",()=>{
  const c=cell("claim","has-conflicting","research-evidence");
  const before=new TellingLog().tell(c,"support","2026-10-27T12:00:00Z")
    .deny(c,"oppose","2026-10-27T12:00:00Z").seal();
  const after=new TellingLog().tell(c,"support","2026-10-27T12:00:00Z")
    .deny(c,"oppose","2026-10-28T12:00:00Z").seal();
  const x=compareOriginalEvidenceSnapshots(before,after,{propositions:[c]}).comparisons[0];
  assert.equal(x.original.knowledge,"stable");
  assert.equal(x.revised.knowledge,"stable");
  assert.equal(x.againstWitnessChanges.added.length,0);
  assert.equal(x.againstObservationChanges.added.length,1);
  assert.equal(x.againstObservationChanges.removed.length,1);
  assert.equal(x.requiresReverification,true);
  assert.equal(x.evidenceOrders.knowledgeNondecreasing,true);
});


test("review control: >20k genuine source tellings refuse before unbounded projection",()=>{
  const c=cell("budget","limits","source-materialization");
  class GuardedLog extends TellingLog {
    where(){throw new Error("unbounded where invoked");}
    against(){throw new Error("unbounded against invoked");}
    cells(){throw new Error("unbounded cells invoked");}
    readingAt(){throw new Error("unbounded readingAt invoked");}
  }
  const history=new GuardedLog();
  for(let i=0;i<20001;i++)history.tell(c,i);
  history.seal();
  assert.equal(history.size,20001);
  assert.throws(()=>history.boundedAt(c,20000),/budget exceeded before materialization/);
  assert.throws(()=>compareOriginalEvidenceSnapshots(history,new TellingLog().seal(),{
    propositions:[c]}),/budget exceeded before materialization/);
  assert.equal(history.size,20001);
});

test("bounded snapshot comparison is native evidence-equivalent under its admitted index budget",()=>{
  const a=cell("trial","verified-by","first"), b=cell("trial","verified-by","second");
  const before=new TellingLog().tell(a,"same").deny(a,"counter").tell(b,"other").seal();
  const current=new TellingLog().tell(a,"same").deny(a,"counter").tell(b,"replacement").seal();
  const sliced=before.boundedAt(a,2);
  assert.equal(sliced.candidatesInspected,2);
  assert.equal(sliced.matchedTellings,2);
  assert.deepEqual(sliced.for,before.where(a));
  assert.deepEqual(sliced.against,before.against(a));
  const result=compareOriginalEvidenceSnapshots(before,current,{propositions:[a,b]});
  assert.equal(result.inspectedCandidates,6);
  assert.equal(result.inspectedTellings,6);
  assert.equal(result.comparisons[0].original.knowledge,before.readingAt(a));
  assert.equal(result.comparisons[1].revised.knowledge,current.readingAt(b));
  assert.deepEqual(result.changedPropositionAddresses,[address(b)]);
});

test("bounded query refuses on missing coordinates, non-integer limits, and index over-budget",()=>{
  const a=cell("x","p","y"), b=cell("z","p","y");
  const log=new TellingLog().tell(a,"a").tell(b,"b").seal();
  assert.throws(()=>log.boundedAt({subject:"x"},2),/complete subject/);
  for(const limit of [-1,20001,1.5,NaN])assert.throws(()=>log.boundedAt(a,limit),/candidate limit/);
  assert.throws(()=>log.boundedAt(a,0),/budget exceeded before materialization/);
  assert.equal(log.boundedAt(a,1).matchedTellings,1);
  assert.equal(log.boundedAt(cell("unknown","p","none"),0).matchedTellings,0);
});


test("256 dual-proposition FOUR history pairs preserve original indexed readings under the bounded projection",()=>{
  const a=cell("source-a","asserts","claim-a"), b=cell("source-b","asserts","claim-b");
  const build=mask=>{
    const history=new TellingLog();
    if(mask&1)history.tell(a,"a-for");
    if(mask&2)history.deny(a,"a-against");
    if(mask&4)history.tell(b,"b-for");
    if(mask&8)history.deny(b,"b-against");
    return history.seal();
  };
  const count=mask=>[1,2,4,8].filter(bit=>mask&bit).length;
  const states=Array.from({length:16},(_,i)=>build(i));
  for(let old=0;old<16;old++)for(let next=0;next<16;next++){
    const before=states[old],after=states[next];
    const result=compareOriginalEvidenceSnapshots(before,after,{propositions:[a,b]});
    assert.equal(result.inspectedCandidates,count(old)+count(next));
    assert.equal(result.inspectedTellings,result.inspectedCandidates);
    for(const [index,coord,bits] of [[0,a,3],[1,b,12]]){
      const actual=result.comparisons[index];
      assert.equal(actual.original.knowledge,before.readingAt(coord));
      assert.equal(actual.revised.knowledge,after.readingAt(coord));
      assert.equal(actual.requiresReverification,(old&bits)!==(next&bits));
      assert.equal(actual.witnessesChanged,actual.requiresReverification);
    }
  }
});

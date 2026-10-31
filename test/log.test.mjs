import assert from "node:assert/strict";
import test from "node:test";
import { TellingLog, telling, cellsOfRows, logOfSeavtRows } from "../src/log.mjs";
import { cell, witnessFor, witnessAgainst } from "@red-cup-engineering/signcell/cell";
import { seavtOfSignCell } from "@red-cup-engineering/signcell/seavt";

const decomposed = "ta\u0302che";
const composed = "tâche";
const marked = () => ({
  subject: { [decomposed]: decomposed },
  predicate: decomposed,
  object: [decomposed],
});
const equivalent = () => ({
  subject: { [composed]: composed },
  predicate: composed,
  object: [composed],
});

test("SignChain indexed queries are complete under SCA coincidence", () => {
  const log = new TellingLog();
  log.tell(marked(), { source: "alpha" });
  assert.equal(log.where({ subject: equivalent().subject }).length, 1);
  assert.equal(log.where({ predicate: equivalent().predicate }).length, 1);
  assert.equal(log.where({ object: equivalent().object }).length, 1);
  assert.equal(log.readingAt(equivalent()), "potential");
  log.deny(equivalent(), { source: "beta" });
  assert.equal(log.against({ subject: marked().subject }).length, 1);
  assert.equal(log.readingAt(marked()), "stable");
  const cells = log.cells(equivalent());
  assert.equal(cells.length, 1);
  assert.equal(cells[0].for.length, 1);
  assert.equal(cells[0].against.length, 1);
});

test("SignChain tellings keep original representatives and own provider input", () => {
  const at = marked(), witness = { payload: { text: decomposed }, observed: [1] };
  const log = new TellingLog().tell(at, witness);
  at.subject[decomposed] = "changed";
  at.object[0] = "changed";
  witness.payload.text = "changed";
  witness.observed.push(2);
  assert.deepEqual(log.rows[0].subject, { [decomposed]: decomposed });
  assert.deepEqual(log.rows[0].object, [decomposed]);
  assert.deepEqual(log.rows[0].witness, { payload: { text: decomposed }, observed: [1] });
  assert.equal(log.where({ subject: equivalent().subject }).length, 1);
  assert.equal(Object.isFrozen(log.rows[0].witness.payload), true);
  assert.throws(() => telling(marked(), undefined), /must carry a witness/);
});

test("native SEAVT rows form an SCA-witnessed SignChain with proper as-of filtration", () => {
  const t0 = "2026-10-12T13:00:00Z", t1 = "2026-10-12T13:01:00Z";
  const proposition = cell("BLK", { relation: "return", horizon: "5d" }, { valueAtomic: "500", decimals: 4 });
  const positive = witnessFor(proposition, { issuer: "filing", source: "ni:source:a" });
  const contested = witnessAgainst(positive, { issuer: "price-feed", source: "ni:source:b" });
  const early = seavtOfSignCell(positive, t0), late = seavtOfSignCell(contested, t1);
  const stream = [early, early, late];
  const whole = logOfSeavtRows(stream);
  assert.equal(whole.size, 2, "cumulative snapshots do not duplicate tellings");
  assert.equal(whole.readingAt(proposition), "stable");
  assert.deepEqual(whole.rows.map(row => row.observedAt), [t0, t1]);
  const before = logOfSeavtRows(stream, { asOf: t0 });
  assert.equal(before.size, 1);
  assert.equal(before.readingAt(proposition), "potential");
  assert.equal(logOfSeavtRows(stream, { asOf: "2026-10-12T12:59:59Z" }).size, 0);
  assert.throws(() => logOfSeavtRows([late, early]), /time-ordered/);
  assert.throws(() => logOfSeavtRows(stream, { asOf: "yesterday" }), /absolute timestamp/);
  assert.throws(() => logOfSeavtRows(stream, { asOf: "2026-02-30T00:00:00Z" }), /absolute timestamp/);
  assert.throws(() => logOfSeavtRows([
    seavtOfSignCell(cell("BLK", "future-return", "value", { value: "potential" }), t0)
  ]), /non-measured SignCell/);
});

test("as-of SignChain replay never interprets future SEAVT contents", () => {
  const t0 = "2026-10-12T13:00:00Z", t1 = "2026-10-12T14:00:00Z";
  const known = seavtOfSignCell(witnessFor(cell("asset", "claim", "value"), "source"), t0);
  const invalidFuture = { t: t1, e: ["not-a-term"], a: ["not-a-term"], v: ["not-a-term"] };
  const knownOnly = logOfSeavtRows([known], { asOf: t0 });
  const withFuture = logOfSeavtRows([known, invalidFuture], { asOf: t0 });
  assert.deepEqual(withFuture.rows, knownOnly.rows);
  assert.throws(() => logOfSeavtRows([known, invalidFuture]), /SEAVT|SEN|term/i);
});

test("FOUR cannot conflate positive and negative evidence about different market propositions", () => {
  const fiveDay = { subject: "BLK", predicate: "expected-excess-return-positive", object: { horizon: "5d", benchmark: "SPY" } };
  const sixtyDay = { subject: "BLK", predicate: "expected-excess-return-positive", object: { horizon: "60d", benchmark: "SPY" } };
  const history = new TellingLog().tell(fiveDay, { observedAt: "2026-10-12T13:00:00Z" })
    .deny(sixtyDay, { observedAt: "2026-10-12T13:00:00Z" });
  assert.equal(history.readingAt(fiveDay), "potential");
  assert.equal(history.readingAt(sixtyDay), "active");
  assert.equal(history.cells().length, 2);
  assert.throws(() => history.readingWhere({ subject: "BLK" }), /complete subject\/predicate\/object/);
  assert.throws(() => history.readingWhere(), /complete subject\/predicate\/object/);
  assert.throws(() => history.readingWhere({ ...fiveDay, object: undefined }), /complete subject\/predicate\/object/);
  history.deny(fiveDay, "counter-witness");
  assert.equal(history.readingAt(fiveDay), "stable");
  assert.equal(history.readingAt(sixtyDay), "active");
});

test("persisted telling rows refuse unknown or missing evidence side", () => {
  const at = { subject: "BLK", predicate: "forecast", object: "five-day" };
  for (const side of [undefined, null, "unknown", "both"]) {
    const row = { ...at, witness: { source: "feed" }, side };
    assert.throws(() => new TellingLog([row]), /explicit for\/against side/);
    assert.throws(() => cellsOfRows([row]), /explicit for\/against side/);
  }
  assert.deepEqual(new TellingLog([{ ...at, witness: "source", side: "against" }]).rows[0].side, "against");
});

test("untrusted outer source accessors never execute or append witness history", () => {
  const at = { subject: "s", predicate: "p", object: "o" };
  const log = new TellingLog().tell(at, "seed");
  let called=0;
  const rogue = { ...at };
  Object.defineProperty(rogue, "subject", { enumerable:true, get(){called++;return "forged";} });
  assert.throws(()=>telling(rogue,"unlicensed"),/data property/);
  assert.throws(()=>log.tell(rogue,"unlicensed"),/data property/);
  assert.throws(()=>log.deny(rogue,"unlicensed"),/data property/);
  assert.equal(log.size,1);
  assert.equal(log.readingAt(at),"potential");
  const row={...at,witness:"source",side:"for"};
  Object.defineProperty(row,"side",{enumerable:true,get(){called++;return "for";}});
  assert.throws(()=>new TellingLog([row]),/data property/);
  assert.throws(()=>cellsOfRows([row]),/data property/);
  const timestamp={...at,witness:"source",side:"against"};
  Object.defineProperty(timestamp,"observedAt",{enumerable:true,get(){called++;return "later";}});
  assert.throws(()=>new TellingLog([timestamp]),/data property/);
  const seavt={e:"s",a:"p",v:"o",get t(){called++;return "2026-10-26T00:00:00Z";}};
  assert.throws(()=>logOfSeavtRows([seavt]),/data property/);
  assert.equal(called,0);
});

test("indexed read queries never execute accessor-backed coordinates",()=>{
 const at={subject:"s",predicate:"p",object:"o"};
 const log=new TellingLog().tell(at,"support").deny(at,"opposition");
 let calls=0;
 for(const role of ["subject","predicate","object"]){
   const malicious={...at};
   Object.defineProperty(malicious,role,{enumerable:true,get(){calls++;return "forged";}});
   for(const query of [()=>log.where(malicious),()=>log.against(malicious),
      ()=>log.latest(malicious),()=>log.cells(malicious),
      ()=>log.readingWhere(malicious),()=>log.readingAt(malicious)])
     assert.throws(query,/data property/u);
 }
 assert.equal(calls,0);
 assert.equal(log.readingAt(at),"stable");
 assert.equal(log.size,2);
});
test("readingWhere evaluates one original complete source-pattern snapshot",()=>{
 const triple={subject:"w",predicate:"claims",object:"x"};
 const log=new TellingLog().tell(triple,"one").deny(triple,"two");
 const visited=[];
 const pattern=new Proxy({...triple},{
   get(target,key){ if(["subject","predicate","object"].includes(key)) assert.fail("no direct coordinate getters"); return Reflect.get(target,key); },
   getOwnPropertyDescriptor(target,key){if(["subject","predicate","object"].includes(key))visited.push(key);return Reflect.getOwnPropertyDescriptor(target,key);}
 });
 assert.equal(log.readingWhere(pattern),"stable");
 assert.deepEqual(visited,["subject","predicate","object"],
   "a witnessed proposition is never split into two independently read patterns");
 assert.equal(log.where({subject:"w"}).length,1);
 assert.equal(log.against({subject:"w"}).length,1);
});

test("ordinary source-pattern reader receives null-prototype caller data without a second codec",()=>{
  const c=cell("research","has-source","dated-report");
  const selector=Object.create(null);
  selector.subject="research";
  selector.predicate="has-source";
  selector.object="dated-report";
  const original=new TellingLog().tell(c,"attested-for","2026-10-28T12:00:00Z")
    .deny(c,"attested-against","2026-10-28T13:00:00Z").seal();
  assert.equal(original.where(selector).length,1);
  assert.equal(original.against(selector).length,1);
  assert.equal(original.cells(selector).length,1);
  assert.equal(original.readingAt(selector),"stable");
  // Canonical query admission does not grant authority or mutate the source.
  assert.equal(original.size,2);
  assert.equal(Object.getPrototypeOf(selector),null);
  let invoked=0;
  const hostile={subject:"research"};
  Object.defineProperty(hostile,"predicate",{enumerable:true,get(){invoked++;return "forged";}});
  assert.throws(()=>original.where(hostile),/data property/);
  assert.throws(()=>original.readingWhere(hostile),/data property/);
  assert.equal(invoked,0);
});


test("indexed bounded source reading checks candidate budget before constructing row arrays",()=>{
  const c=cell("claim","source","research");
  const history=new TellingLog().tell(c,"support").deny(c,"opposition").seal();
  const result=history.boundedAt(c,2);
  assert.equal(result.candidatesInspected,2);
  assert.deepEqual(result.for,history.where(c));
  assert.deepEqual(result.against,history.against(c));
  assert.equal(Object.isFrozen(result.for),true);
  assert.throws(()=>history.boundedAt(c,1),/budget exceeded before materialization/);
  // The original helper now returns an ordinary inert source record; the
 // caller may still supply a null-prototype coordinate envelope.
  const selector=Object.assign(Object.create(null),{subject:"claim",predicate:"source",object:"research"});
  assert.equal(history.boundedAt(selector,2).matchedTellings,2);
});


test("oversized index intersection conservatively refuses even if exact query matches nothing",()=>{
  const target=cell("same-subject","same-predicate","same-object");
  const history=new TellingLog();
  for(let i=0;i<7;i++){
    history.tell(cell("same-subject","other-predicate-"+i,"other-object-"+i),i);
    history.tell(cell("other-subject-"+i,"same-predicate","other-object-"+i),i);
    history.tell(cell("other-subject-"+i,"other-predicate-"+i,"same-object"),i);
  }
  history.seal();
  assert.equal(history.where(target).length,0);
  assert.throws(()=>history.boundedAt(target,6),/budget exceeded before materialization/);
  assert.equal(history.boundedAt(target,7).matchedTellings,0);
});

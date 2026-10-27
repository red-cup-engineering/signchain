import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cell, address } from '@red-cup-engineering/signcell/cell';
import { channel, message } from '@red-cup-engineering/signcell/signal';
import { cellToCloudEvent, cellEventMessage, cellEventOfMessage, cellFromCloudEvent } from '@red-cup-engineering/signcell/cloud-events';
import { logOfCellEventMessages, TellingLog } from '../src/log.mjs';

const first = '2026-10-26T18:00:00.000000001Z';
const second = '2026-10-26T18:00:00.000000002Z';
const source = 'urn:sensor:alpha';
const on = channel({name:'claims',resource:{'service.name':'claim-observer'}});
const other = channel({name:'forwarded',resource:{'service.name':'claim-receiver'}});
const witness = {source:'urn:reading:original',revision:'r1'};
const against = {source:'urn:reading:opposed',revision:'r1'};
const claim = () => cell('sample','temperature',{value:3,unit:'C'},{for:[witness],against:[against]});
const event = (at=claim(),id='one',producer=source) => cellToCloudEvent(at,{id,source:producer});
const observed = (value,at=first,line=on,causes=[]) => cellEventMessage({event:value,channel:line,observedAt:at,causes});

test('CL1/CL2: original opposing witnesses enter the existing sealed telling log',()=>{
  const original=claim(), carrier=observed(event(original));
  const log=logOfCellEventMessages([carrier]);
  assert.equal(log.sealed,true); assert.equal(log.size,2);
  assert.deepEqual(log.where()[0].witness,witness);
  assert.deepEqual(log.against()[0].witness,against);
  assert.equal(log.rows[0].observedAt,first);
  assert.equal(log.readingAt(original),'stable');
  assert.equal(address(log.cells()[0]),address(original));
  assert.throws(()=>log.tell(original,'invented'),/sealed/u);
  assert.deepEqual(cellFromCloudEvent(cellEventOfMessage(carrier)),original);
});

test('CL3: retry and cross-channel forwarding do not manufacture witnesses',()=>{
  const e=event(),a=observed(e),b=observed(e,second,other,[a]);
  const log=logOfCellEventMessages([a,a,b]);
  assert.notEqual(a.id,b.id); assert.equal(log.size,2);
  assert.deepEqual(log.cells()[0].for,[witness]);
  assert.deepEqual(log.cells()[0].against,[against]);
});

test('CL3: cumulative claim snapshots add only new original witnesses',()=>{
  const a=cell('s','p','o',{for:['w1']});
  const b=cell('s','p','o',{for:['w1','w2'],against:['w3']});
  const log=logOfCellEventMessages([observed(event(a,'a')),observed(event(b,'b'),second)]);
  assert.equal(log.size,3); assert.deepEqual(log.cells()[0].for,['w1','w2']);
  assert.deepEqual(log.cells()[0].against,['w3']);
  assert.deepEqual(log.rows.map(row=>row.observedAt),[first,second,second]);
});

test('CL4: equal ids under distinct sources are distinct occurrences',()=>{
  const a=cell('s','p','a',{for:['one']}), b=cell('s','p','b',{against:['two']});
  const log=logOfCellEventMessages([observed(event(a,'same','urn:a')),observed(event(b,'same','urn:b'),second)]);
  assert.equal(log.size,2); assert.equal(log.cells().length,2);
});

test('CL4: reused event identity with changed content refuses instead of replacing evidence',()=>{
  const a=observed(event()),b=observed(event(cell('s','p','changed',{for:['other']})),second);
  assert.throws(()=>logOfCellEventMessages([a,b]),error=>error.code==='event-identity-conflict');
});

test('CL4: extension order is immaterial but exact extension spelling remains content',()=>{
  const e={...event(),label:'ta\u0302che',attempt:1};
  const reordered=Object.fromEntries(Object.entries(e).reverse());
  assert.equal(logOfCellEventMessages([observed(e),observed(reordered,second)]).size,2);
  assert.throws(()=>logOfCellEventMessages([observed(e),observed({...e,label:'tâche'},second)]),error=>error.code==='event-identity-conflict');
});

test('CL5: exact observation cut excludes a later witness despite an earlier claimed event time',()=>{
  const a=observed(event());
  const e={...event(cell('late','p','o',{for:['late']}),'late'),time:'2026-01-01T00:00:00Z'};
  const b=observed(e,second);
  const log=logOfCellEventMessages([a,b],{asOf:first});
  assert.equal(log.size,2); assert.equal(log.where({subject:'late'}).length,0);
  assert.equal(logOfCellEventMessages([a,b],{asOf:second}).size,3);
});

test('CL5: instant ordering is numeric, not lexical fractional-second spelling',()=>{
  const a=observed(event(),'2026-10-26T18:00:00Z');
  const b=observed(event(claim(),'later'),'2026-10-26T18:00:00.1Z');
  assert.equal(logOfCellEventMessages([a,b]).size,2);
  assert.throws(()=>logOfCellEventMessages([b,a]),RangeError);
  assert.throws(()=>logOfCellEventMessages([a],{asOf:'yesterday'}),TypeError);
});

test('CL1: forged observations and unrelated log bodies cannot become claims',()=>{
  const a=observed(event());
  assert.throws(()=>logOfCellEventMessages([{...a,id:'invented'}]),TypeError);
  assert.throws(()=>logOfCellEventMessages([message({channel:on,observedAt:first,body:{body:{stringValue:'success'}}})]),TypeError);
});

test('CL2/CL6: unasserted claims stay unasserted and explicit valuation loss refuses',()=>{
  assert.equal(logOfCellEventMessages([observed(event(cell('s','p','o')))]).size,0);
  const posited=cell('s','p','o',{for:['w'],value:'absurd'});
  assert.throws(()=>logOfCellEventMessages([observed(event(posited))]),/valuation/u);
});

test('CL2: byte-valued claims and exact integers retain the native evidence carrier',()=>{
  const original=cell('s','has',{bytes:new Uint8Array([0,128,255]),amount:9007199254740993n},{for:[witness]});
  const log=logOfCellEventMessages([observed(event(original))]);
  assert.equal(address(log.cells()[0]),address(original));
  assert.equal(log.rows[0].object.amount,9007199254740993n);
  assert.deepEqual([...log.rows[0].object.bytes],[0,128,255]);
});

test('CL2/CL3: retained byte witnesses deduplicate without losing either evidence side',()=>{
  const bytes=new Uint8Array([0,128,255]);
  const original=cell('s','has','bytes',{for:[{bytes}],against:[{bytes:new Uint8Array([0,127,255])}]});
  bytes.fill(7);
  const e=event(original),a=observed(e),b=observed(e,second,other,[a]);
  const log=logOfCellEventMessages([a,b]);
  assert.equal(log.size,2);
  assert.equal(log.readingAt(original),'stable');
  assert.equal(address(log.cells()[0]),address(original));
  assert.deepEqual([...log.where()[0].witness.bytes],[0,128,255]);
  assert.deepEqual([...log.against()[0].witness.bytes],[0,127,255]);
  log.where()[0].witness.bytes.fill(9);
  assert.deepEqual([...log.where()[0].witness.bytes],[0,128,255]);
});

test('claim retention still refuses unowned witness accessors without executing them',()=>{
  let reads=0;
  const foreign={get bytes(){reads++;return new Uint8Array([1]);}};
  const log=new TellingLog();
  assert.throws(()=>log.tell({subject:'s',predicate:'p',object:'o'},foreign),/accessors/u);
  assert.equal(reads,0);
  assert.equal(log.size,0);
});

test('CL1/CL3/CL5: retained RFC3986 event sources reach the telling log without changing evidence',()=>{
  // This observation was produced by the independently issued Cell225. Keeping
  // its original wire message exercises this consumer's parser, rather than
  // asking the same supplier to construct the event that it must receive.
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/rfc3986-native-event.json',import.meta.url),'utf8'));
  const before=JSON.stringify(fixture);
  const a=fixture.message;
  const b=message({channel:other,observedAt:second,body:a.body,causes:[a]});
  const log=logOfCellEventMessages([a,a,b]);
  assert.equal(log.sealed,true);
  assert.equal(log.size,2,'retry and forwarding add no new witness');
  assert.deepEqual(log.where()[0].witness,witness);
  assert.deepEqual(log.against()[0].witness,against);
  assert.equal(log.readingAt(claim()),'stable','the original opposing evidence remains opposed');
  assert.equal(address(log.cells()[0]),address(claim()));
  assert.deepEqual(log.rows.map(row=>row.observedAt),[first,first]);
  assert.equal(logOfCellEventMessages([a,b],{asOf:'2026-10-26T18:00:00Z'}).size,0);
  assert.equal(logOfCellEventMessages([a,b],{asOf:first}).size,2);
  assert.equal(cellEventOfMessage(a).source,fixture.source,'IPvFuture and percent-encoded spelling are retained exactly');
  assert.equal(cellEventOfMessage(b).source,fixture.source);
  assert.equal(JSON.stringify(fixture),before,'reading cannot mutate the source observation');
});

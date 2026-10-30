import test from "node:test";
import assert from "node:assert/strict";
import { sourceField, sourcePattern } from "../src/telling-source.mjs";

test("outer source admission never invokes role, side or observation accessors",()=>{
 let calls=0;
 const row={subject:"s",predicate:"p",object:"o",side:"for",witness:"w"};
 Object.defineProperty(row,"subject",{enumerable:true,get(){calls++;return "fake";}});
 Object.defineProperty(row,"observedAt",{enumerable:true,get(){calls++;return "now";}});
 assert.throws(()=>sourceField(row,"subject"),/data property/);
 assert.throws(()=>sourceField(row,"observedAt"),/data property/);
 assert.equal(calls,0);
});

test("plain source rows retain nested original semiotic terms, optional fields are absent",()=>{
 const record=Object.create(null);
 record.subject={bytes:new Uint8Array([0,128])};
 assert.strictEqual(sourceField(record,"subject"),record.subject);
 assert.equal(sourceField(record,"observedAt",false),undefined);
 assert.throws(()=>sourceField(record,"witness"),/needs an own witness/);
 for(const item of [null,42,[],new Date(),Object.create({subject:"s"})])
   assert.throws(()=>sourceField(item,"subject"),/plain record/);
});

test("hidden or accessor-bearing evidence lanes are not promoted to data",()=>{
 let calls=0;
 const record={side:"for"};
 Object.defineProperty(record,"witness",{enumerable:true,get(){calls++;return "forged";}});
 Object.defineProperty(record,"observedAt",{value:"today",enumerable:false});
 assert.throws(()=>sourceField(record,"witness"),/data property/);
 assert.throws(()=>sourceField(record,"observedAt"),/enumerable data property/);
 assert.equal(calls,0);
});

test("sourcePattern refuses query accessors before executing them",()=>{
 let reads=0;
 for(const role of ["subject","predicate","object"]){
   const supplied={ignored:"not-a-selector"};
   Object.defineProperty(supplied,role,{enumerable:true,get(){reads++;return "forged";}});
   assert.throws(()=>sourcePattern(supplied),/data property/u);
 }
 assert.equal(reads,0);
 const term={bytes:new Uint8Array([0,128])};
 const selected=sourcePattern({subject:term,object:0,irrelevant:1});
 assert.strictEqual(selected.subject,term);
 assert.deepEqual(Object.keys(selected),["subject","object"]);
 assert.equal(Object.getPrototypeOf(selected),Object.prototype); // SignCell retains only ordinary records
 assert.equal(Object.isFrozen(selected),true);
});
test("sourcePattern uses only own fields and refuses nonplain query envelopes",()=>{
 const nullProto=Object.create(null);
 nullProto.predicate="source";
 assert.equal(sourcePattern(nullProto).predicate,"source");
 assert.deepEqual(Object.keys(sourcePattern({})),[]);
 for(const input of [null,17,[],new Date(),Object.create({subject:"borrowed"})])
   assert.throws(()=>sourcePattern(input),/plain record/u);
});

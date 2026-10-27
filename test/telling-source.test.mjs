import test from "node:test";
import assert from "node:assert/strict";
import { sourceField } from "../src/telling-source.mjs";

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

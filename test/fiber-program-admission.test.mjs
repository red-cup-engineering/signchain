import assert from 'node:assert/strict';
import test from 'node:test';
import { cell, retainedCarrier } from '@red-cup-engineering/signcell/cell';
import { tokenFrame } from '@red-cup-engineering/signcell/token-frame';
import { executeFiberProgram } from '../src/fiber-program.mjs';
const wrap=expression=>({kind:'signchain.fiber-program',version:1,expression});
const read=()=>({op:'read',predicate:'p',object:'q'});
const frame=tokenFrame([cell('s','p','q',{for:['w']})]);
test('program and expression accessors refuse without invocation',()=>{
  for(const location of ['kind','op','predicate']) {
    let calls=0;
    const input=wrap(read()),target=location==='kind'?input:input.expression;
    Object.defineProperty(target,location,{enumerable:true,get(){calls++;return location==='kind'?'signchain.fiber-program':location==='op'?'read':'p';}});
    assert.throws(()=>executeFiberProgram(frame,input),TypeError);
    assert.equal(calls,0);
  }
});
test('cyclic syntax and executable or sparse families refuse before evaluation',()=>{
  const cyclic={op:'linear-not'};cyclic.of=cyclic;
  assert.throws(()=>executeFiberProgram(frame,wrap(cyclic)),/cyclic/u);
  for(const terms of [new Array(1),Object.assign([read()],{map(){throw Error('must not run');}})])
    assert.throws(()=>executeFiberProgram(frame,wrap({op:'family',quantifier:'all',order:'truth',terms})),TypeError);
  let calls=0;const terms=[read()];
  Object.defineProperty(terms,'0',{enumerable:true,get(){calls++;return read();}});
  assert.throws(()=>executeFiberProgram(frame,wrap({op:'family',quantifier:'all',order:'truth',terms})),TypeError);
  assert.equal(calls,0);
});
test('unsupported hidden fields and explicit undefined metadata are not erased',()=>{
  for(const value of ['transfinite',undefined]) {
    const input=wrap(read());Object.defineProperty(input,'closureRegime',{value,enumerable:false});
    assert.throws(()=>executeFiberProgram(frame,input),/undeclared field/u);
  }
  assert.throws(()=>executeFiberProgram(frame,{...wrap(read()),closureRegime:undefined}),/undeclared field/u);
  const input=wrap(read());Object.defineProperty(input,'version',{value:1,enumerable:false});
  assert.throws(()=>executeFiberProgram(frame,input),/needs version/u);
});
test('operator lookup refuses inherited and coerced names even on an empty frame',()=>{
  for(const operation of ['constructor','toString','__proto__',['join'],['tensor']])
    assert.throws(()=>executeFiberProgram(tokenFrame([]),wrap({op:'binary',operation,order:'truth',left:read(),right:read()})),TypeError);
});
test('shared finite subterms remain lawful; contradictory evidence is unchanged',()=>{
  const term=read();
  const shared=wrap({op:'binary',operation:'join',order:'knowledge',left:term,right:term});
  const contested=tokenFrame([cell('s','p','q',{for:['yes'],against:['no']})]);
  assert.equal(executeFiberProgram(contested,shared).valuation[0].reading,'stable');
});
test('same-owner retained byte and bigint literals remain compatible',()=>{
  const literal=retainedCarrier({bytes:new Uint8Array([0,128,255]),amount:9007199254740993n});
  const original=tokenFrame([cell('s','p',literal,{for:['w']})]);
  const input=wrap({op:'read',predicate:'p',object:literal});
  assert.equal(executeFiberProgram(original,input).valuation[0].reading,'potential');
  literal.bytes.fill(7);
  assert.equal(executeFiberProgram(original,input).valuation[0].reading,'potential');
});

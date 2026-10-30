import assert from "node:assert/strict";
import test from "node:test";
import { cell, claimCoordinate } from "@red-cup-engineering/signcell/cell";
import { SPECIALIZES, tokenFrame } from "@red-cup-engineering/signcell/token-frame";
import {
  knowledgeImplyReading, knowledgeJoinReading, knowledgeMeetReading, negateReading, readingAs, readingFamilies, truthImplyReading, truthJoinReading, truthMeetReading,
} from "@red-cup-engineering/computer-data-engineering-services-section/four";
import { knowledgeWithin, necessitate, necessitateIn, pointwise, possibilize, possibilizeIn, truthWithin, valuationOf, truthPoleClosure, truthNuclearQuartet } from "../src/token-fiber.mjs";

const told = (special, general) => cell(special, SPECIALIZES, general, { for: ["leader"] });
const readingAt = (valuation, token) => valuation.find((entry) => entry.token === token).reading;
const vocabulary = [told("unit", "thing"), told("repository", "unit"), told("services-section", "repository"), told("signcell", "services-section")];

test("a valuation reads what is told of each token, told nothing where nothing is", () => {
  const frame = tokenFrame([
    ...vocabulary,
    cell("signcell", "requires", "zero-failing-tests", { for: ["signcell-maintainer"] }),
    cell("unit", "requires", "zero-failing-tests", { against: ["an-old-agent-note"] }),
    cell("unit", "requires", "repository-name-equals-package-name", { for: ["leader"] }),
  ]);
  const v = valuationOf(frame, "requires", "zero-failing-tests");
  assert.deepEqual(v.map((entry) => entry.token), frame.tokens);
  assert.equal(readingAt(v, "signcell"), "potential");
  assert.equal(readingAt(v, "unit"), "active");
  assert.equal(readingAt(v, "repository"), "absurd");
  const possible = possibilize(frame, v);
  assert.equal(readingAt(possible, "signcell"), "stable", "told for at itself and against at a generalization");
  assert.equal(readingAt(possible, "repository"), "active");
  assert.equal(readingAt(possible, "thing"), "absurd");
});

test("two actors' same-token evidence joins in FOUR rather than overwriting by order", () => {
  const frame = tokenFrame([told("workshop", "enterprise"), told("enterprise", "territory")]);
  const forWitness = { token: "workshop", reading: "potential" };
  const againstWitness = { token: "workshop", reading: "active" };
  const forward = [forWitness, againstWitness];
  const reverse = [againstWitness, forWitness];
  const truth = pointwise(frame, (v) => v, forward);
  const opposite = pointwise(frame, (v) => v, reverse);
  assert.deepEqual(truth, opposite, "federated testimony is order-independent");
  assert.equal(readingAt(truth, "workshop"), "stable",
    "both sides remain visible in the same token fiber");
  assert.equal(readingAt(truth, "territory"), "absurd",
    "contradiction does not give unrelated tokens an invented witness");
  const joined = possibilize(frame, forward);
  assert.equal(readingAt(joined, "workshop"), "stable",
    "specialization preserves the joined contradiction");
  const repeated = pointwise(frame, (v) => v, [forWitness, forWitness]);
  assert.equal(readingAt(repeated, "workshop"), "potential",
    "duplicate positive testimony does not fabricate negative evidence");
  assert.throws(() => pointwise(frame, (v) => v, [forWitness,
    { token: "not-a-frame-token", reading: "active" }]), /not a token/u);
});

test("necessitating reads at a type what its whole extent holds", () => {
  const releases = [told("signcell-release", "release"), told("signgraph-release", "release")];
  const published = (token) => cell(token, "is-on", "registry.561.group", { for: ["npm-view"] });
  const all = tokenFrame([...releases, published("release"), published("signcell-release"), published("signgraph-release")]);
  assert.equal(readingAt(necessitate(all, valuationOf(all, "is-on", "registry.561.group")), "release"), "potential");
  const gap = tokenFrame([...releases, published("release"), published("signcell-release")]);
  const somewhere = necessitate(gap, valuationOf(gap, "is-on", "registry.561.group"));
  assert.equal(readingAt(somewhere, "release"), "absurd", "one silent member leaves the type's necessity unknown");
  assert.equal(readingAt(somewhere, "signcell-release"), "potential");
  assert.equal(readingAt(possibilize(gap, valuationOf(gap, "is-on", "registry.561.group")), "signgraph-release"), "potential", "yet it is possible there");
});

// Every valuation of a four-token diamond frame: a below b and c, both below d.
const diamond = tokenFrame([told("a", "b"), told("a", "c"), told("b", "d"), told("c", "d")]);
const points = readingFamilies.knowledge;
const valuations = [];
for (let code = 0; code < points.length ** diamond.tokens.length; code++) {
  valuations.push(diamond.tokens.map((token, index) => ({ token, reading: points[Math.floor(code / points.length ** index) % points.length] })));
}

test("the fiber is FOUR taken pointwise: each order's meet is residuated by its implication", () => {
  const sample = valuations.filter((_, index) => index % 7 === 0);
  for (const [meet, imply, within] of [[knowledgeMeetReading, knowledgeImplyReading, knowledgeWithin], [truthMeetReading, truthImplyReading, truthWithin]]) {
    for (const w of sample) for (const v of sample) for (const u of sample) {
      assert.equal(within(diamond, pointwise(diamond, meet, w, v), u), within(diamond, w, pointwise(diamond, imply, v, u)));
    }
  }
  const v = valuations[93];
  assert.deepEqual(pointwise(diamond, negateReading, pointwise(diamond, negateReading, v)), pointwise(diamond, (x) => x, v), "negation is an involution");
});

test("possibilizing is a closure, necessitating an interior, and they are adjoint", () => {
  const possible = valuations.map((v) => possibilize(diamond, v));
  const necessary = valuations.map((v) => necessitate(diamond, v));
  valuations.forEach((v, i) => {
    assert.ok(knowledgeWithin(diamond, v, possible[i]) && knowledgeWithin(diamond, possibilize(diamond, possible[i]), possible[i]), "◇ is inflationary and idempotent");
    assert.ok(knowledgeWithin(diamond, necessary[i], v) && knowledgeWithin(diamond, necessary[i], necessitate(diamond, necessary[i])), "□ is deflationary and idempotent");
  });
  for (let i = 0; i < valuations.length; i++) {
    for (let j = 0; j < valuations.length; j++) {
      assert.equal(knowledgeWithin(diamond, possible[i], valuations[j]), knowledgeWithin(diamond, valuations[i], necessary[j]), "◇v ≤ₖ w exactly when v ≤ₖ □w");
    }
  }
  const [v, w] = [valuations[37], valuations[201]];
  assert.ok(knowledgeWithin(diamond, possibilize(diamond, pointwise(diamond, knowledgeJoinReading, v, w)), pointwise(diamond, knowledgeJoinReading, possibilize(diamond, v), possibilize(diamond, w))), "◇ preserves joins");
  assert.ok(knowledgeWithin(diamond, pointwise(diamond, knowledgeMeetReading, necessitate(diamond, v), necessitate(diamond, w)), necessitate(diamond, pointwise(diamond, knowledgeMeetReading, v, w))), "□ preserves meets");
  assert.throws(() => possibilize(diamond, [{ token: "a", reading: "maybe" }]), /reads FOUR/u);
  assert.throws(() => necessitate(diamond, [{ token: "kalshi", reading: "potential" }]), /not a token of this frame/u);
});

test("truth-order modality retains a contradiction's different logical reading", () => {
  const frame = tokenFrame([told("specific", "general")]);
  const state = [{ token: "specific", reading: "potential" }, { token: "general", reading: "active" }];
  assert.equal(readingAt(possibilizeIn(frame, state, "knowledge"), "specific"), "stable",
    "knowledge join retains both independent positive and negative reports");
  assert.equal(readingAt(possibilizeIn(frame, state, "truth"), "specific"), "potential",
    "truth disjunction retains a supporting side without inventing a contrary side");
  assert.equal(readingAt(necessitateIn(frame, state, "knowledge"), "general"), "absurd",
    "knowledge consensus cannot infer a common telling from opposed observers");
  assert.equal(readingAt(necessitateIn(frame, state, "truth"), "general"), "active",
    "truth conjunction is refuted by one opposing specialization");
  assert.deepEqual(possibilizeIn(frame, state, "knowledge"), possibilize(frame, state));
  assert.deepEqual(necessitateIn(frame, state, "knowledge"), necessitate(frame, state));
  assert.throws(() => possibilizeIn(frame, state, "mixed"), /unknown modal fiber order/u);
  assert.throws(() => necessitateIn(frame, state, "both"), /unknown modal fiber order/u);
});

test("both distinct modal adjoint pairs satisfy S4 laws over all finite two-token FOUR fibers", () => {
  const frame = tokenFrame([told("specific", "general")]);
  const samples = [];
  for (const left of readingFamilies.knowledge) for (const right of readingFamilies.knowledge)
    samples.push([{ token: "specific", reading: left }, { token: "general", reading: right }]);
  for (const [order, within] of [["knowledge", knowledgeWithin], ["truth", truthWithin]]) {
    for (const v of samples) {
      const possible = possibilizeIn(frame, v, order);
      const necessary = necessitateIn(frame, v, order);
      assert.ok(within(frame, v, possible), `${order}: existential is inflationary`);
      assert.ok(within(frame, necessary, v), `${order}: universal is deflationary`);
      assert.deepEqual(possibilizeIn(frame, possible, order), possible, `${order}: existential is idempotent`);
      assert.deepEqual(necessitateIn(frame, necessary, order), necessary, `${order}: universal is idempotent`);
      for (const w of samples)
        assert.equal(within(frame, possible, w), within(frame, v, necessitateIn(frame, w, order)),
          `${order}: existential and universal are adjoint`);
    }
  }
});

test("FOUR claim fiber uses SignCell's canonical predicate/object coordinate", () => {
  const original = { beta: [2, 1], alpha: { z: "last", a: "first" } };
  const equivalent = { alpha: { a: "first", z: "last" }, beta: [2, 1] };
  const source = tokenFrame([
    cell("specific", "specializes", "general", { for: ["source-classification"] }),
    cell("general", "holds", original, { for: ["maker"] }),
    cell("general", "holds", original, { against: ["receiver"] }),
    cell("specific", "holds", "other", { for: ["unrelated"] }),
  ]);
  assert.equal(claimCoordinate("holds", original), claimCoordinate("holds", equivalent));
  const vals = valuationOf(source, "holds", equivalent);
  assert.equal(readingAt(vals, "general"), "stable");
  assert.equal(readingAt(vals, "specific"), "absurd");
  assert.equal(readingAt(possibilize(source, vals), "specific"), "stable",
    "inheritance preserves contradictory original testimony");
  assert.equal(readingAt(valuationOf(source, "holds", "absent"), "general"), "absurd");
  assert.notEqual(claimCoordinate(original, "holds"), claimCoordinate("holds", original));
});

test("FOUR valuation uses one original SignCell-owned frame cut, never a second foreign source read", () => {
  const original = tokenFrame([
    told("child", "parent"),
    cell("parent", "supports", "version", { for: ["source:first"] }),
  ]);
  const wire = { kind: original.kind, predicate: original.predicate, cells: [...original.cells] };
  const first = valuationOf(wire, "supports", "version");
  assert.equal(readingAt(first, "parent"), "potential");
  const claimIndex = wire.cells.findIndex(at => at.predicate === "supports");
  assert.notEqual(claimIndex, -1);
  wire.cells[claimIndex] = cell("parent", "supports", "version", {
    against: ["source:contrary"],
  });
  const second = valuationOf(wire, "supports", "version");
  assert.equal(readingAt(second, "parent"), "active");
  assert.equal(readingAt(first, "parent"), "potential",
    "a prior FOUR projection cannot be changed by a later wire revision");

  let invoked = 0;
  const getter = { ...wire };
  Object.defineProperty(getter, "cells", {
    enumerable: true, get() { invoked++; return wire.cells; },
  });
  assert.throws(() => valuationOf(getter, "supports", "version"),
    /must be source data, not a getter/);
  const special = [...wire.cells];
  Object.defineProperty(special, Symbol.iterator, {
    value() { invoked++; return wire.cells[Symbol.iterator](); },
  });
  assert.throws(() => valuationOf({ ...wire, cells: special }, "supports", "version"),
    /dense undecorated data array/);
  assert.equal(invoked, 0, "no caller-supplied getter or iterator ran");
});

test("transported claim tellings preserve both evidence sides in either wire order", () => {
  const positive = cell("token", "reports", { value: "source" }, { for: ["observer"] });
  const negative = cell("token", "reports", { value: "source" }, { against: ["challenger"] });
  const canonical = tokenFrame([positive, negative]);
  const expected = valuationOf(canonical, "reports", { value: "source" });
  assert.equal(readingAt(expected, "token"), "stable");
  for (const cells of [[positive, negative], [negative, positive]]) {
    const wire = { ...canonical, cells };
    const actual = valuationOf(wire, "reports", { value: "source" });
    assert.deepEqual(actual, expected);
    assert.deepEqual(possibilize(wire, actual), possibilize(canonical, expected));
  }
});

test("every fiber reader derives transported tokens from original SignCells", () => {
  const source = tokenFrame([
    told("specific", "general"),
    cell("general", "reports", "claim", { for: ["observer"], against: ["challenger"] }),
  ]);
  const valuation = valuationOf(source, "reports", "claim");
  const left = [{ token: "specific", reading: "potential" }];
  const right = [];
  for (const tokens of [[], ["foreign"], ["general", "general"], undefined]) {
    const wire = { ...source, tokens };
    assert.deepEqual(valuationOf(wire, "reports", "claim"), valuation);
    assert.deepEqual(pointwise(wire, x => x, valuation), pointwise(source, x => x, valuation));
    assert.deepEqual(pointwise(wire, () => "potential"), pointwise(source, () => "potential"));
    assert.equal(knowledgeWithin(wire, left, right), false, "an omitted source token still participates");
    assert.equal(truthWithin(wire, left, right), false);
    for (const order of ["knowledge", "truth"]) {
      assert.deepEqual(possibilizeIn(wire, valuation, order), possibilizeIn(source, valuation, order));
      assert.deepEqual(necessitateIn(wire, valuation, order), necessitateIn(source, valuation, order));
    }
    const foreign = [{ token: "foreign", reading: "potential" }];
    for (const read of [
      () => pointwise(wire, x => x, foreign),
      () => knowledgeWithin(wire, foreign, []),
      () => truthWithin(wire, [], foreign),
      () => possibilize(wire, foreign),
      () => necessitate(wire, foreign),
    ]) assert.throws(read, /not a token of this frame/u);
  }
});

test("a transported frame's display token accessor is never an admission authority", () => {
  const source = tokenFrame([told("specific", "general")]);
  const wire = { kind: source.kind, predicate: source.predicate, cells: source.cells };
  Object.defineProperty(wire, "tokens", { enumerable: true, get() {
    throw new Error("display token projection was executed");
  } });
  Object.freeze(wire);
  assert.deepEqual(valuationOf(wire, "absent", "claim"), valuationOf(source, "absent", "claim"));
  assert.deepEqual(pointwise(wire, () => "potential"), pointwise(source, () => "potential"));
  assert.deepEqual(possibilize(wire, []), possibilize(source, []));
  assert.deepEqual(necessitate(wire, []), necessitate(source, []));
  assert.throws(() => valuationOf({ ...source, kind: "foreign.frame" }, "reports", "claim"), /made by tokenFrame/u);
});

test("mutated transported source cells are read again instead of trusting stale display tokens", () => {
  const wire = JSON.parse(JSON.stringify(tokenFrame([
    cell({ id: "old" }, "reports", "claim", { for: ["observer"] }),
  ])));
  assert.deepEqual(valuationOf(wire, "reports", "claim"), [{ token: { id: "old" }, reading: "potential" }]);
  wire.cells[0].subject.id = "new";
  assert.deepEqual(valuationOf(wire, "reports", "claim"), [{ token: { id: "new" }, reading: "potential" }]);
  const newValuation = [{ token: { id: "new" }, reading: "active" }];
  assert.deepEqual(pointwise(wire, x => x, newValuation), newValuation);
  assert.deepEqual(possibilize(wire, newValuation), newValuation);
  assert.deepEqual(necessitate(wire, newValuation), newValuation);
  assert.throws(() => pointwise(wire, x => x, [{ token: { id: "old" }, reading: "potential" }]), /not a token/u);
});

test("truth poles are total typed SignCell fibers, not invented absent observations",()=>{
 const frame=tokenFrame([told("specific","general")]);
 const complete=[{token:"specific",reading:"absurd"},{token:"general",reading:"potential"}];
 const sample=[{token:"specific",reading:"stable"}];
 assert.equal(truthPoleClosure(frame,complete,sample).length,2);
 const bad=[
  [],[{token:"specific",reading:"absurd"}],
  [{token:"specific",reading:"potential"},{token:"specific",reading:"active"}],
  [{token:"specific",reading:"absurd"},{token:"foreign",reading:"potential"}],
  [{token:"specific",reading:"not-a-four-reading"},{token:"general",reading:"active"}],
 ];
 for(const pole of bad)assert.throws(()=>truthPoleClosure(frame,pole,sample),/truth pole/u);
 let reads=0;
 const forged={get token(){reads++;return "specific";},reading:"absurd"};
 assert.throws(()=>truthPoleClosure(frame,[forged,complete[1]],sample),/inert data/u);
 assert.equal(reads,0);
});
test("truth poles normalize every original Data FOUR reading family, including unknown",()=>{
 const frame=tokenFrame([told("specific","general")]);
 const sample=[{token:"specific",reading:"stable"}];
 for(const names of Object.values(readingFamilies))for(const reading of names){
  const declared=[{token:"specific",reading},{token:"general",reading}];
  const normalized=declared.map(entry=>({...entry,reading:readingAs("knowledge",entry.reading)}));
  assert.deepEqual(truthPoleClosure(frame,declared,sample),truthPoleClosure(frame,normalized,sample));
 }
 assert.equal(readingAs("knowledge","unknown"),"absurd");
});
test("all finite FOUR truth pole nuclei preserve meet, order and idempotence",()=>{
 const frame=tokenFrame([cell("one","asserts","claim")]);
 const readings=readingFamilies.knowledge;
 const v=r=>[{token:"one",reading:r}];
 let checked=0;
 for(const a of readings)for(const x of readings)for(const y of readings){
   const pole=v(a),one=truthPoleClosure(frame,pole,v(x));
   const other=truthPoleClosure(frame,pole,v(y));
   assert.equal(truthWithin(frame,v(x),one),true,"truth-extensive");
   assert.deepEqual(truthPoleClosure(frame,pole,one),one,"truth-idempotent");
   if(truthWithin(frame,v(x),v(y)))assert.equal(truthWithin(frame,one,other),true,"truth-monotone");
   const lhs=truthPoleClosure(frame,pole,pointwise(frame,truthMeetReading,v(x),v(y)));
   const rhs=pointwise(frame,truthMeetReading,one,other);
   assert.deepEqual(lhs,rhs,"meet-preserving nucleus");
   assert.deepEqual(one,pointwise(frame,truthJoinReading,pole,v(x)));
   checked++;
 }
 assert.equal(checked,64);
});
test("two truth nuclei commute and fix exactly their common layer on complete two-token fibers",()=>{
 const frame=tokenFrame([told("specific","general")]);
 const four=readingFamilies.knowledge;
 const values=four.flatMap(x=>four.map(y=>[{token:"specific",reading:x},{token:"general",reading:y}]));
 let checked=0;
 for(const a of values)for(const b of values)for(const state of values){
   const reading=truthNuclearQuartet(frame,a,b,state);
   assert.equal(reading.kind,"signchain.finite-truth-nuclear-quartet.v1");
   assert.deepEqual(reading.both,truthPoleClosure(frame,b,truthPoleClosure(frame,a,state)),
     "two truth nuclei commute over FOUR^T");
   assert.deepEqual(reading.both,truthPoleClosure(frame,a,reading.both),"fixed by first");
   assert.deepEqual(reading.both,truthPoleClosure(frame,b,reading.both),"fixed by second");
   assert.equal(truthWithin(frame,state,reading.both),true);
   checked++;
 }
 assert.equal(checked,4096);
});
test("truth nuclear closure is not falsely advertised as a knowledge nucleus",()=>{
 const frame=tokenFrame([cell("source","reports","claim")]);
 const pole=[{token:"source",reading:"absurd"}],state=[{token:"source",reading:"stable"}];
 const changed=truthPoleClosure(frame,pole,state);
 assert.equal(changed[0].reading,"potential");
 assert.equal(truthWithin(frame,state,changed),true);
 assert.equal(knowledgeWithin(frame,state,changed),false,
   "Obsmetrologia's counterexample: truth closure need not be knowledge inflationary");
});

test("every native fiber reader refuses accessor-backed source valuations before invoking getters",()=>{
 const frame=tokenFrame([cell("one","reports","claim")]);
 let read=0;
 const entry={reading:"potential"};
 Object.defineProperty(entry,"token",{enumerable:true,get(){read++;return "one";}});
 const malicious=[entry];
 const calls=[
   ()=>pointwise(frame,x=>x,malicious),
   ()=>knowledgeWithin(frame,malicious,[]),
   ()=>truthWithin(frame,[],malicious),
   ()=>possibilizeIn(frame,malicious,"knowledge"),
   ()=>necessitateIn(frame,malicious,"truth"),
   ()=>truthPoleClosure(frame,[{token:"one",reading:"potential"}],malicious),
   ()=>truthNuclearQuartet(frame,[{token:"one",reading:"potential"}],
     [{token:"one",reading:"active"}],malicious),
 ];
 for(const readFiber of calls) assert.throws(readFiber,/inert data/u);
 assert.equal(read,0);
 const array=[{token:"one",reading:"potential"}];
 Object.defineProperty(array,"0",{enumerable:true,get(){read++;return entry;}});
 assert.throws(()=>pointwise(frame,x=>x,array),/inert data/u);
 assert.throws(()=>truthPoleClosure(frame,array,[]),/inert data/u);
 assert.equal(read,0);
});
test("fiber data arrays refuse hidden extras, prototypes and gaps, preserving valid repeated knowledge joins",()=>{
 const frame=tokenFrame([cell("one","reports","claim")]);
 const original=[{token:"one",reading:"potential"},{token:"one",reading:"active"}];
 assert.deepEqual(pointwise(frame,x=>x,original),[{token:"one",reading:"stable"}]);
 const sparse=new Array(2);sparse[0]=original[0];
 const decorated=[original[0]];decorated.unlicensed=true;
 const symbol=[original[0]];symbol[Symbol("hidden")]=true;
 const foreign=[Object.create({token:"one",reading:"potential"})];
 for(const bad of [sparse,decorated,symbol,foreign])
   assert.throws(()=>pointwise(frame,x=>x,bad),/array|plain records/u);
});

test("FOUR fibers refuse extra, hidden or executable source coordinates across mathematical readers",()=>{
  const frame=tokenFrame([cell("one","reports","claim")]);
  const valid=[{token:"one",reading:"potential"}];
  assert.deepEqual(pointwise(frame,x=>x,valid),valid,
    "a canonical TWO-field source valuation remains unchanged");
  let calls=0;
  const extra={token:"one",reading:"potential",actor:"unadmitted"};
  const hidden={token:"one",reading:"potential"};
  Object.defineProperty(hidden,"authority",{value:"not evidence"});
  const symbolic={token:"one",reading:"potential"};
  Object.defineProperty(symbolic,Symbol("hidden"),{value:true});
  const getter={token:"one",reading:"potential"};
  Object.defineProperty(getter,"source",{enumerable:true,
    get(){calls++;throw Error("executed source accessor");}});
  for(const row of [extra,hidden,symbolic,getter]){
    const valuation=[row];
    assert.throws(()=>pointwise(frame,x=>x,valuation),
      /exactly token and reading/u);
    assert.throws(()=>knowledgeWithin(frame,valuation,valid),
      /exactly token and reading/u);
    assert.throws(()=>truthWithin(frame,valid,valuation),
      /exactly token and reading/u);
    assert.throws(()=>possibilizeIn(frame,valuation,"knowledge"),
      /exactly token and reading/u);
    assert.throws(()=>necessitateIn(frame,valuation,"truth"),
      /exactly token and reading/u);
    assert.throws(()=>truthPoleClosure(frame,valid,valuation),
      /exactly token and reading/u);
    assert.throws(()=>truthNuclearQuartet(frame,valid,valid,valuation),
      /exactly token and reading/u);
    assert.throws(()=>truthPoleClosure(frame,valuation,valid),
      /exactly token and reading/u);
  }
  assert.equal(calls,0,"no source getter executed or mislabeled as evidence");
  assert.deepEqual(truthPoleClosure(frame,valid,valid),
    pointwise(frame,truthJoinReading,valid,valid),
    "previous nucleus laws remain available to exact native records");
});

import assert from "node:assert/strict";
import test from "node:test";
import { cell, claimCoordinate } from "@red-cup-engineering/signcell/cell";
import { SPECIALIZES, tokenFrame } from "@red-cup-engineering/signcell/token-frame";
import {
  knowledgeImplyReading, knowledgeJoinReading, knowledgeMeetReading, negateReading, readingFamilies, truthImplyReading, truthMeetReading,
} from "@red-cup-engineering/computer-data-engineering-services-section/four";
import { knowledgeWithin, necessitate, necessitateIn, pointwise, possibilize, possibilizeIn, truthWithin, valuationOf } from "../src/token-fiber.mjs";

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

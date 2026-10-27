import assert from "node:assert/strict";
import test from "node:test";

// Independent assay derived from the directional-cut and observation-custody
// clauses before inspecting their repaired implementation. Every dependency
// comes from the actual selected SignChain checkout; no supplier substitutes.
const {
  predicatesCompose, relationalContract, contractsCompose,
  composeRelationalContracts, contractExposure, contractExposureReport,
} = await import("../src/contracts/contract.mjs");
const { instrumentsCompose } = await import("../src/contracts/instrument.mjs");
const { schemaOperationsCompose } = await import("../src/contracts/contract-operation.mjs");
const { semanticJudgmentWitnessed, fiberAspectWitnessed } =
  await import("../src/contracts/judgment.mjs");

function fixture(id, options = {}) {
  return relationalContract({
    id,
    material: {
      id: `${id}:material`, loci: ["schema:input", "schema:cut", "schema:output"],
      incidence: [], fibers: [], valueAlgebra: "FOUR", constraints: [], closure: [], boundary: [],
    },
    precondition: options.pre ?? { id: "predicate:entry" },
    move: {
      id: `${id}:move`, description: "Independent finite contract assay",
      domain: "schema:cut", codomain: "schema:cut", partial: false,
      deterministic: true, effects: [], ...options.move,
    },
    postcondition: options.post ?? { id: "predicate:entry" },
    phase: {
      id: "phase:finite", closure: { finiteBase: true, scottContinuous: true, countableCofinality: true },
    },
    lens: {
      id: "lens:original-observation", domain: "schema:cut", boundary: "schema:cut",
      preserves: ["source", "at", "caller", "boundary"], hides: [],
      output: "schema:cut", evidenceRequired: true,
    },
    evidencePolicy: {
      id: "policy:source-observation", required: true, records: ["time", "caller", "boundary"],
      time: "required", caller: "required", boundaryObject: "full",
    },
    energetics: [], refinements: [],
  });
}

function instrumentOf(contract) {
  return {
    ...contract,
    presentations: [{ address: "schema:cut" }],
    projections: [],
  };
}

function refused(call, context) {
  let result;
  try { result = call(); }
  catch (error) {
    assert.ok(error instanceof TypeError || error instanceof RangeError, context);
    return;
  }
  assert.equal(result, false, context);
}

function witnessed(report) {
  return semanticJudgmentWitnessed(report.judgment);
}

test("PC: identity and explicitly directed declarations still establish the finite cut", () => {
  assert.equal(predicatesCompose({ id: "predicate:ready" }, { id: "predicate:ready" }), true);
  assert.equal(predicatesCompose(
    { id: "predicate:insured", entails: ["predicate:ready", "predicate:known"] },
    { id: "predicate:ready", entails: ["predicate:known"] }), true);
  assert.equal(predicatesCompose(
    { id: "predicate:ready", entails: [] },
    { id: "predicate:ready", entails: [] }), true);
});

test("PC: common consequences and inverse edges never discharge a different precondition", () => {
  const pairs = [
    [{ id: "predicate:insured", entails: ["predicate:known"] },
      { id: "predicate:cancelled", entails: ["predicate:known"] }],
    [{ id: "predicate:known" },
      { id: "predicate:insured", entails: ["predicate:known"] }],
    [{ id: "predicate:has-one", entails: ["predicate:a", "predicate:b"] },
      { id: "predicate:has-two", entails: ["predicate:a", "predicate:b"] }],
    [{ id: "predicate:start", entails: ["predicate:middle"] },
      { id: "predicate:finish" }],
  ];
  for (const [post, pre] of pairs) assert.equal(predicatesCompose(post, pre), false);
});

test("PC: finite implication oracle rejects every missing direct edge", () => {
  // This oracle is a finite relation definition, not a copy of source branches.
  const names = ["predicate:a", "predicate:b", "predicate:c"];
  for (let postMask = 0; postMask < 8; postMask += 1) {
    const edges = names.filter((_, i) => postMask & (1 << i));
    for (let preMask = 0; preMask < 8; preMask += 1) {
      const consumerEdges = names.filter((_, i) => preMask & (1 << i));
      for (const postId of names) for (const preId of names) {
        const relation = new Set([[postId, postId], ...edges.map(to => [postId, to])]
          .map(pair => JSON.stringify(pair)));
        const expected = relation.has(JSON.stringify([postId, preId]));
        assert.equal(predicatesCompose({ id: postId, entails: edges },
          { id: preId, entails: consumerEdges }), expected,
          `consumer's own consequences cannot reverse or complete ${postId} -> ${preId}`);
      }
    }
  }
});

test("PC: malformed identity or entailment data never licenses composition", () => {
  const badIds = [undefined, null, false, 0, "", " ", [], {}];
  for (const id of badIds) {
    refused(() => predicatesCompose({ id }, { id }), "equal malformed IDs");
    refused(() => predicatesCompose({ id: "predicate:producer", entails: [id] }, { id }), "malformed target");
  }
  for (const entails of ["predicate:consumer", null, false, 42, {}, [""], [null]]) {
    refused(() => predicatesCompose({ id: "predicate:producer", entails },
      { id: "predicate:consumer" }), "entails must be an admitted list of predicate identities");
  }
});

test("PC: caller accessors and inherited declarations are not source evidence", () => {
  let invoked = 0;
  for (const property of ["id", "entails"]) {
    const candidate = { id: "predicate:producer", entails: ["predicate:consumer"] };
    Object.defineProperty(candidate, property, {
      enumerable: true,
      get() { invoked += 1; throw new TypeError("caller accessor executed"); },
    });
    refused(() => predicatesCompose(candidate, { id: "predicate:consumer" }), "accessor-backed declaration");
  }
  const inherited = Object.create({ id: "predicate:consumer" });
  refused(() => predicatesCompose(inherited, { id: "predicate:consumer" }), "inherited identity");
  assert.equal(invoked, 0, "declaration admission must not evaluate caller code");
});

test("PC: boundary metadata and contract construction preserve directional refusal", () => {
  const producer = fixture("contract:producer", {
    post: { id: "predicate:served", entails: ["predicate:exists"] },
  });
  const consumer = fixture("contract:consumer", {
    pre: { id: "predicate:paid", entails: ["predicate:exists"] },
  });
  const report = contractsCompose(producer, consumer);
  assert.equal(fiberAspectWitnessed(report.aspects, "predicate-compatibility"), false);
  assert.equal(witnessed(report), false);
  assert.throws(() => composeRelationalContracts(producer, consumer), TypeError);
  assert.equal(witnessed(instrumentsCompose(instrumentOf(producer), instrumentOf(consumer))), false);

  const licensed = fixture("contract:licensed", {
    post: { id: "predicate:served-and-paid", entails: ["predicate:paid"] },
  });
  const composite = composeRelationalContracts(licensed, consumer);
  assert.equal(witnessed(composite.report), true);
  assert.equal(composite.contract.precondition.id, licensed.precondition.id);
  assert.equal(composite.contract.postcondition.id, consumer.postcondition.id);
  assert.equal(witnessed(instrumentsCompose(instrumentOf(licensed), instrumentOf(consumer))), true);
});

test("BC: relational composition uses the existing admitted schema boundary law", () => {
  const sharedObject = { schema: "not-an-address" };
  const candidates = [undefined, null, false, 0, "", " ", [], sharedObject, "schema:cut", "schema:other"];
  for (const codomain of candidates) for (const domain of candidates) {
    const left = fixture("contract:left", { move: { codomain } });
    const right = fixture("contract:right", { move: { domain } });
    const expected = schemaOperationsCompose({ codomain }, { domain });
    const report = contractsCompose(left, right);
    assert.equal(fiberAspectWitnessed(report.aspects, "boundary-compatibility"), expected);
    assert.equal(witnessed(report), expected);
    if (!expected) assert.throws(() => composeRelationalContracts(left, right), TypeError);
  }
});

const observation = () => ({
  at: { source: "clock:receipt", instant: "2026-10-26T21:30:00-05:00", sequence: 1 },
  caller: { actor: "urn:actor:receiver", grant: { resource: "urn:work:one", rights: ["read"] } },
  boundary: { result: { count: 3, source: "urn:artifact:one" }, receipt: "urn:observation:one" },
});

test("EX: native and JSON-roundtripped exact observations remain accountable", () => {
  const c = fixture("contract:source");
  const exposure = contractExposure(c, observation());
  assert.equal(witnessed(contractExposureReport(c, exposure)), true);
  assert.equal(witnessed(contractExposureReport(c, JSON.parse(JSON.stringify(exposure)))), true);
});

test("EX: conflicting duplicated time, caller and boundary are refused independently", () => {
  const c = fixture("contract:source");
  const good = contractExposure(c, observation());
  const changed = {
    at: { ...good.at, sequence: 2 },
    caller: { ...good.caller, grant: { ...good.caller.grant, rights: ["write"] } },
    boundary: { ...good.boundary, result: { ...good.boundary.result, count: 4 } },
  };
  for (const key of ["at", "caller", "boundary"]) {
    const nestedChange = { ...good, coordinates: { ...good.coordinates, [key]: changed[key] } };
    const outerChange = { ...good, [key]: changed[key] };
    assert.equal(witnessed(contractExposureReport(c, nestedChange)), false, `${key}: changed nested source`);
    assert.equal(witnessed(contractExposureReport(c, outerChange)), false, `${key}: changed outer source`);
  }
});

test("EX: canonical equality admits key order and NFC equivalence while retaining each original", () => {
  const c = fixture("contract:unicode");
  const lexical = "e\u0301";
  const original = contractExposure(c, {
    at: { sequence: 3, source: "clock:one" },
    caller: { actor: "urn:actor:one", name: lexical },
    boundary: { title: lexical, data: [1, 2], nested: { left: true, right: false } },
  });
  const transported = {
    ...original,
    coordinates: {
      ...original.coordinates,
      at: { source: "clock:one", sequence: 3 },
      caller: { name: "\u00e9", actor: "urn:actor:one" },
      boundary: { nested: { right: false, left: true }, data: [1, 2], title: "\u00e9" },
    },
  };
  assert.equal(witnessed(contractExposureReport(c, transported)), true);
  assert.equal(transported.boundary.title, lexical, "the original lexical source is not rewritten");
  assert.equal(transported.coordinates.boundary.title, "\u00e9", "the received lexical source is retained");
});

test("EX: absent required observations and stale contract identities cannot be upgraded", () => {
  const c = fixture("contract:source");
  const good = contractExposure(c, observation());
  for (const key of ["at", "caller", "boundary"]) {
    const incomplete = { ...good, coordinates: { ...good.coordinates } };
    delete incomplete[key];
    delete incomplete.coordinates[key];
    assert.equal(witnessed(contractExposureReport(c, incomplete)), false);
  }
  const changed = fixture("contract:source", { post: { id: "predicate:new-condition" } });
  assert.equal(witnessed(contractExposureReport(changed, good)), false);
});

test("EX: shape similarity cannot substitute changed nested source content", () => {
  const c = fixture("contract:source");
  const good = contractExposure(c, observation());
  const impostors = [
    { result: { count: "3", source: "urn:artifact:one" }, receipt: "urn:observation:one" },
    { result: { count: 3, source: "urn:artifact:two" }, receipt: "urn:observation:one" },
    { result: { count: 3, source: "urn:artifact:one" }, receipt: "urn:observation:two" },
    { result: { count: 3, source: "urn:artifact:one" }, receipt: "urn:observation:one", unexpected: true },
  ];
  for (const boundary of impostors) {
    assert.equal(witnessed(contractExposureReport(c, {
      ...good, coordinates: { ...good.coordinates, boundary },
    })), false);
  }
});

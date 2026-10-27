import assert from "node:assert/strict";
import test from "node:test";

// Independent evidence/replay acceptance clauses, written against the declared
// interface without inspecting the implementation. Suppliers are the actual
// selected native packages, with no replacement hashing, FOUR, or rule engine.
const {
  relationalContract, contractsCompose, contractCompositionEvidence,
  admitContractCompositionEvidence, contractCompositionEvidenceSchema,
} = await import("../src/contracts/contract.mjs");
const { instrumentsCompose, instrumentContract } = await import("../src/contracts/instrument.mjs");
const { cell, address, coincides, semanticId, told, sameCell, merge } =
  await import("@red-cup-engineering/signcell/cell");
const { rule, fireRule } = await import("../src/rules.mjs");
const { TellingLog } = await import("../src/log.mjs");
const { validateJsonSchema, validateJsonSchemaDocument } =
  await import("@red-cup-engineering/json-schema-services-section/validation");

function fixture(id, options = {}) {
  return relationalContract({
    id,
    material: {
      id: `${id}:material`, loci: ["schema:input", "schema:cut", "schema:output"],
      incidence: [], fibers: [], valueAlgebra: "FOUR", constraints: [], closure: [], boundary: [],
    },
    precondition: options.pre ?? { id: "predicate:entry" },
    move: {
      id: `${id}:move`, description: "Independent source custody assay",
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

const copy = value => JSON.parse(JSON.stringify(value));
const pair = () => [
  fixture("contract:producer", { post: {
    id: "predicate:submitted", entails: ["predicate:unrelated", "predicate:admitted"],
  } }),
  fixture("contract:consumer", { pre: { id: "predicate:admitted" } }),
];
const instrument = c => ({ ...c, presentations: [{ address: "schema:cut" }], projections: [] });
function reseal(envelope) {
  const { id: ignored, ...body } = envelope;
  return { ...body, id: semanticId(body) };
}
function refusal(left, right, received, reason) {
  const result = admitContractCompositionEvidence(left, right, received);
  assert.equal(result.admitted, false, reason);
  assert.equal(result.value, undefined, "refusal must not supply a usable admitted value");
}
function stringsIn(value) {
  if (typeof value === "string") return [value];
  if (value === null || typeof value !== "object") return [];
  return Object.values(value).flatMap(stringsIn);
}

test("CE: exact contract sources, body identity, and native premise/conclusion ancestry", () => {
  const [left, right] = pair();
  const evidence = contractCompositionEvidence(left, right);
  assert.equal(evidence.kind, "signchain.contract-composition-evidence");
  assert.equal(evidence.version, 1);
  assert.deepEqual(evidence.sources.left.contract, left);
  assert.deepEqual(evidence.sources.right.contract, right);
  assert.equal(evidence.sources.left.id, semanticId(left));
  assert.equal(evidence.sources.right.id, semanticId(right));
  assert.equal(evidence.id, reseal(evidence).id);
  assert.equal(evidence.premises.length, 2);
  assert.equal(evidence.rule.antecedent.length, 2);
  assert.deepEqual(evidence.rule.antecedent.map(item => item.atLeast), ["potential", "potential"]);
  assert.equal(evidence.rule.consequent.reading, "potential");
  assert.deepEqual(evidence.rule.antecedent.map(item => address(item.cell)).sort(),
    evidence.premises.map(address).sort());
  assert.equal(address(evidence.rule.consequent.cell), address(evidence.conclusion));
  for (const premise of evidence.premises) {
    assert.deepEqual(told(premise), [true, false]);
    const contents = stringsIn(premise);
    assert.ok(contents.includes(evidence.sources.left.id));
    assert.ok(contents.includes(evidence.sources.right.id));
    assert.ok(evidence.cells.some(candidate => coincides(candidate, premise)));
  }
  const [derived] = fireRule(evidence.rule, evidence.premises);
  assert.ok(coincides(derived, evidence.conclusion), "the native rule must actually produce the stored conclusion");
  assert.ok(evidence.cells.some(candidate => coincides(candidate, evidence.conclusion)));
  assert.equal(evidence.conclusion.for[0].ruleId, semanticId(evidence.rule));
  assert.deepEqual([...evidence.conclusion.for[0].from].sort(), evidence.premises.map(address).sort());
});

test("CE: the predicate witness names the observed directed source edge", () => {
  const [left, right] = pair();
  const evidence = contractCompositionEvidence(left, right);
  const witnessStrings = stringsIn(evidence.premises[1].for);
  assert.ok(witnessStrings.some(value => value.includes("/postcondition/entails/1")),
    "the enabling edge is the producer's second explicit entailment declaration");
  const identityLeft = fixture("contract:identity-left", { post: { id: "predicate:admitted" } });
  const identity = contractCompositionEvidence(identityLeft, right);
  assert.ok(stringsIn(identity.premises[1].for).some(value => value.includes("identity")),
    "identity must be represented as an identity law, not a nonexistent edge observation");
  assert.ok(!stringsIn(identity.premises[1].for).some(value => value.includes("/postcondition/entails/")));
});

test("CE: missing cut remains untold and has a separate witnessed diagnostic", () => {
  const [left, right] = pair();
  const missing = fixture(left.id, { post: { id: "predicate:submitted", entails: ["predicate:unrelated"] } });
  const evidence = contractCompositionEvidence(missing, right);
  assert.deepEqual(told(evidence.premises[0]), [true, false]);
  assert.deepEqual(told(evidence.premises[1]), [false, false]);
  assert.deepEqual(told(evidence.conclusion), [false, false]);
  assert.equal(fireRule(evidence.rule, evidence.premises).length, 0);
  const diagnostic = evidence.cells.find(candidate =>
    candidate.predicate === "signchain.contract.unestablished-cut" && candidate.object.reason === "predicate-compatibility" &&
    candidate.object.right === evidence.sources.right.id);
  assert.ok(diagnostic);
  assert.deepEqual(told(diagnostic), [true, false]);
  assert.ok(evidence.cells.every(candidate => candidate.against.length === 0),
    "failure to establish an implication is not testimony against that implication");
  const followOn = cell(evidence.sources.left.id, "review:can-use-declared-composite", evidence.sources.right.id);
  const downstream = rule("review:declared-cut-consumer", [{ cell: evidence.conclusion, atLeast: "potential" }],
    { cell: followOn, reading: "potential" });
  assert.equal(fireRule(downstream, evidence.cells).length, 0);
});

test("CE: missing typed boundary cannot be promoted by a valid predicate cut", () => {
  const [left, right] = pair();
  const malformed = { ...left, move: { ...left.move, codomain: null } };
  const evidence = contractCompositionEvidence(malformed, right);
  assert.deepEqual(told(evidence.premises[0]), [false, false]);
  assert.deepEqual(told(evidence.premises[1]), [true, false]);
  assert.deepEqual(told(evidence.conclusion), [false, false]);
  assert.ok(evidence.cells.some(candidate => candidate.predicate === "signchain.contract.unestablished-cut" &&
    candidate.object.reason === "boundary-compatibility" && candidate.object.right === evidence.sources.right.id && candidate.for.length > 0));
});

test("CE: ordinary contract and instrument consumers expose the source-bearing projection", () => {
  const [left, right] = pair();
  assert.ok(coincides(contractsCompose(left, right).cellEvidence, contractCompositionEvidence(left, right)));
  const [a, b] = [instrument(left), instrument(right)];
  const [ac, bc] = [instrumentContract(a), instrumentContract(b)];
  assert.ok(coincides(instrumentsCompose(a, b).cellEvidence, contractsCompose(ac, bc).cellEvidence));
});

test("CE: retained sources cannot be rewritten by later provider mutation", () => {
  const [l, r] = pair();
  const [left, right] = [copy(l), copy(r)];
  left.originalObservation = { source: "review:source", labels: ["first"] };
  const expectedLeft = copy(left);
  const evidence = contractCompositionEvidence(left, right);
  const oldId = evidence.id;
  left.originalObservation.labels[0] = "rewritten";
  left.postcondition.entails[1] = "predicate:changed";
  right.move.domain = "schema:changed";
  assert.deepEqual(evidence.sources.left.contract, expectedLeft);
  assert.equal(evidence.id, oldId);
  assert.equal(reseal(evidence).id, oldId);
  refusal(left, right, evidence, "a past source snapshot cannot certify changed caller objects");
});

test("CE: JSON transport admits only replay against the same complete supplied sources", () => {
  const [left, right] = pair();
  const evidence = contractCompositionEvidence(left, right);
  const receipt = copy(evidence);
  const admitted = admitContractCompositionEvidence(left, right, receipt);
  assert.equal(admitted.admitted, true);
  assert.ok(coincides(admitted.value, evidence));
  const renamedContent = { ...left, move: { ...left.move, description: "Changed but same public ID" } };
  refusal(renamedContent, right, receipt, "all original source data, not just display IDs, bind the receipt");
  const reordered = { ...left, postcondition: { ...left.postcondition, entails: [...left.postcondition.entails].reverse() } };
  refusal(reordered, right, receipt, "changed edge index/order is changed source evidence");
  refusal(right, left, receipt, "source roles remain ordered");
  refusal(left, { ...right, extraObservation: "new source datum" }, receipt, "unread source data still belongs to source identity");
});

test("CE: recomputing a checksum never licenses changed premises, rule, sources, or conclusion", () => {
  const [left, right] = pair();
  const evidence = contractCompositionEvidence(left, right);
  const mutations = [
    value => { value.sources.left.id = value.sources.right.id; },
    value => { value.sources.left.contract.move.description = "forged source content"; },
    value => { value.premises.pop(); },
    value => { value.premises.reverse(); },
    value => { value.rule.antecedent[0].atLeast = "unknown"; },
    value => { value.rule.antecedent.shift(); },
    value => { value.rule.consequent.cell.object = "review:unrelated-object"; },
    value => { value.conclusion.for[0].from = []; },
    value => { value.conclusion.for[0].ruleId = "review:substitute-rule"; },
    value => { value.premises[1].for = [{ source: "review:forged-observation" }]; },
    value => { value.cells.pop(); },
    value => { value.cells.push(copy(cell("review:subject", "review:extra", "review:object", { for: ["added"] }))); },
  ];
  for (const mutate of mutations) {
    const candidate = copy(evidence);
    mutate(candidate);
    refusal(left, right, reseal(candidate), mutate.toString());
  }
  refusal(left, right, { ...copy(evidence), id: "review:wrong-id" }, "an altered envelope ID is refused");
});

test("CE: a fabricated positive conclusion cannot repair a missing source edge", () => {
  const [left, right] = pair();
  const missing = { ...left, postcondition: { id: "predicate:submitted", entails: [] } };
  const evidence = contractCompositionEvidence(missing, right);
  const candidate = copy(evidence);
  candidate.premises[1].for.push({ source: "review:asserted-edge-with-no-source" });
  candidate.conclusion.for.push({ source: "review:asserted-success-with-no-license" });
  candidate.cells = [...candidate.premises, candidate.conclusion];
  refusal(missing, right, reseal(candidate), "caller supplied truth flags cannot upgrade missing declarations");
});

test("CE: received accessors and inherited carriers do not execute caller code", () => {
  const [left, right] = pair();
  const evidence = contractCompositionEvidence(left, right);
  let reads = 0;
  const accessor = { ...evidence };
  Object.defineProperty(accessor, "sources", { enumerable: true, get() {
    reads += 1;
    throw new Error("untrusted source getter");
  } });
  refusal(left, right, accessor, "accessor-backed receipt");
  refusal(left, right, Object.create(evidence), "inherited receipt");
  assert.equal(reads, 0);
});

test("CE: canonical equality retains supplied lexical representatives without claiming byte provenance", () => {
  const [l, right] = pair();
  const left = { ...l, move: { ...l.move, description: "e\u0301" } };
  const evidence = contractCompositionEvidence(left, right);
  const receipt = copy(evidence);
  receipt.sources.left.contract.move.description = "\u00e9";
  assert.equal(semanticId(receipt.sources.left.contract), evidence.sources.left.id);
  const admitted = admitContractCompositionEvidence(left, right, receipt);
  assert.equal(admitted.admitted, true, "canonical equivalence is the declared replay relation");
  assert.equal(admitted.value.sources.left.contract.move.description, "e\u0301",
    "reconstruction keeps the supplied original's representative");
  assert.equal(receipt.sources.left.contract.move.description, "\u00e9",
    "the transported representative remains available for a distinct provenance record");
});

test("CE: a native byte source is retained as a snapshot, independently of JSON transport", () => {
  const [l, right] = pair();
  const bytes = new Uint8Array([3, 1, 4, 1, 5]);
  const left = { ...l, originalObservation: { source: "review:byte-source", content: bytes } };
  const evidence = contractCompositionEvidence(left, right);
  const originalId = evidence.sources.left.id;
  bytes[0] = 9;
  assert.equal(semanticId(evidence.sources.left.contract), originalId);
  assert.notEqual(semanticId(left), originalId);
  refusal(left, right, evidence, "mutated provider bytes cannot rewrite the held source");
});

test("CE: native log/rules consume the Cells and preserve later opposing testimony", () => {
  const [left, right] = pair();
  const evidence = contractCompositionEvidence(left, right);
  const log = new TellingLog();
  for (const atCell of evidence.cells) {
    for (const witness of atCell.for) log.tell(atCell, witness);
    for (const witness of atCell.against) log.deny(atCell, witness);
  }
  const target = cell("review:consumer", "review:has-declared-cut", evidence.id);
  const downstream = rule("review:source-bound-cut-consumer", [{ cell: evidence.conclusion, atLeast: "potential" }],
    { cell: target, reading: "potential" });
  const [derived] = fireRule(downstream, log.cells());
  assert.ok(sameCell(derived, target));
  assert.deepEqual(told(derived), [true, false]);
  const contrary = { source: "review:later-independent-audit", claim: "declared cut disputed" };
  log.deny(evidence.conclusion, contrary);
  const observed = log.cells().find(candidate => sameCell(candidate, evidence.conclusion));
  assert.deepEqual(told(observed), [true, true]);
  assert.ok(observed.against.some(witness => coincides(witness, contrary)));
  assert.deepEqual(told(evidence.conclusion), [true, false]);
  const augmented = { ...evidence, conclusion: merge(evidence.conclusion,
    cell(evidence.conclusion.subject, evidence.conclusion.predicate, evidence.conclusion.object, { against: [contrary] })) };
  refusal(left, right, reseal(augmented), "merged testimony is valid Cell evidence but a different receipt");
});

test("CE: the real schema evaluator validates wire shape while replay checks source meaning", () => {
  const [left, right] = pair();
  const evidence = copy(contractCompositionEvidence(left, right));
  const document = validateJsonSchemaDocument(contractCompositionEvidenceSchema);
  assert.equal(document.valid, true, JSON.stringify(document));
  const valid = validateJsonSchema(evidence, contractCompositionEvidenceSchema);
  assert.equal(valid.valid, true, JSON.stringify(valid));
  for (const candidate of [
    { ...evidence, version: "1" },
    { ...evidence, kind: "review:another-kind" },
    { ...evidence, premises: [] },
    { ...evidence, sources: { left: evidence.sources.left } },
    { ...evidence, conclusion: { subject: "s", predicate: "p", object: "o" } },
  ]) assert.equal(validateJsonSchema(candidate, contractCompositionEvidenceSchema).valid, false);
  const semanticallyWrong = copy(evidence);
  semanticallyWrong.sources.left.id = evidence.sources.right.id;
  assert.equal(validateJsonSchema(semanticallyWrong, contractCompositionEvidenceSchema).valid, true,
    "a schema cannot replace recomputing the source-bound rule");
  refusal(left, right, reseal(semanticallyWrong), "shape-valid substituted source identity");
});

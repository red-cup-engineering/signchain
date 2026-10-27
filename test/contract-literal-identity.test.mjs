import assert from "node:assert/strict";
import test from "node:test";

const {
  relationalContract, contractsCompose, contractCompositionEvidence,
  admitContractCompositionEvidence,
} = await import("../src/contracts/contract.mjs");
const { instrumentsCompose } = await import("../src/contracts/instrument.mjs");
const { schemaOperationsCompose } = await import("../src/contracts/contract-operation.mjs");
const { address, semanticId, coincides, told } =
  await import("@red-cup-engineering/signcell/cell");
const { fireRule } = await import("../src/rules.mjs");
const { TellingLog } = await import("../src/log.mjs");

function fixture(id, overrides = {}) {
  return relationalContract({
    id,
    material: { id: `${id}:material`, loci: ["schema:one"], incidence: [], fibers: [],
      valueAlgebra: "FOUR", constraints: [], closure: [], boundary: [] },
    precondition: { id: "predicate:one" }, postcondition: { id: "predicate:one" },
    move: { id: `${id}:move`, domain: "schema:one", codomain: "schema:one", effects: [] },
    phase: { id: "phase:one", closure: {} },
    lens: { id: "lens:one", domain: "schema:one", boundary: "schema:one", preserves: [], hides: [] },
    evidencePolicy: { id: "policy:one", required: true, records: [], time: "none", caller: "optional", boundaryObject: "none" },
    energetics: [], refinements: [], ...overrides,
  });
}
const nfc = "caf\u00e9", nfd = "cafe\u0301";

test("LC: distinct literal schema coordinates cannot share a cut premise or conclusion", () => {
  const left = fixture("contract:left"), right = fixture("contract:right");
  const a = { ...left, move: { ...left.move, codomain: `schema:${nfc}` } };
  const b = { ...right, move: { ...right.move, domain: `schema:${nfc}` } };
  const equivalent = { ...b, move: { ...b.move, domain: `schema:${nfd}` } };
  assert.ok(coincides(b, equivalent), "source content identity deliberately uses the native canonical quotient");
  assert.equal(schemaOperationsCompose(a.move, b.move), true);
  assert.equal(schemaOperationsCompose(a.move, equivalent.move), false, "named schema identity remains literal");
  const accepted = contractCompositionEvidence(a, b);
  const refused = contractCompositionEvidence(a, equivalent);
  assert.equal(accepted.sources.right.id, refused.sources.right.id);
  assert.notEqual(address(accepted.premises[0]), address(refused.premises[0]));
  assert.equal(address(accepted.premises[1]), address(refused.premises[1]));
  assert.notEqual(address(accepted.conclusion), address(refused.conclusion));
  assert.deepEqual(told(accepted.premises[0]), [true, false]);
  assert.deepEqual(told(refused.premises[0]), [false, false]);
  assert.deepEqual(told(refused.conclusion), [false, false]);
  assert.equal(admitContractCompositionEvidence(a, equivalent, accepted).admitted, false);
});

test("LC: literal predicate identities remain distinguished despite coincident source contracts", () => {
  const left = fixture("contract:left", { postcondition: { id: `predicate:${nfc}` } });
  const right = fixture("contract:right", { precondition: { id: `predicate:${nfc}` } });
  const equivalent = { ...right, precondition: { id: `predicate:${nfd}` } };
  const accepted = contractCompositionEvidence(left, right);
  const refused = contractCompositionEvidence(left, equivalent);
  assert.equal(accepted.sources.right.id, refused.sources.right.id);
  assert.equal(address(accepted.premises[0]), address(refused.premises[0]));
  assert.notEqual(address(accepted.premises[1]), address(refused.premises[1]));
  assert.notEqual(address(accepted.conclusion), address(refused.conclusion));
  assert.deepEqual(told(accepted.premises[1]), [true, false]);
  assert.deepEqual(told(refused.premises[1]), [false, false]);
});

test("LC: changing the exact producer entails target cannot transplant the old source edge", () => {
  const left = fixture("contract:left", { postcondition: { id: "predicate:source", entails: [`predicate:${nfc}`] } });
  const equivalent = { ...left, postcondition: { id: "predicate:source", entails: [`predicate:${nfd}`] } };
  const right = fixture("contract:right", { precondition: { id: `predicate:${nfc}` } });
  const accepted = contractCompositionEvidence(left, right);
  const refused = contractCompositionEvidence(equivalent, right);
  assert.equal(accepted.sources.left.id, refused.sources.left.id);
  assert.notEqual(address(accepted.premises[1]), address(refused.premises[1]));
  assert.deepEqual(told(accepted.conclusion), [true, false]);
  assert.deepEqual(told(refused.conclusion), [false, false]);
  assert.equal(fireRule(refused.rule, accepted.cells).length, 0);
});

test("LC: canonically collapsed entails entries still retain the actual observed edge index", () => {
  const left = fixture("contract:left", {
    postcondition: { id: "predicate:source", entails: [`predicate:${nfd}`, `predicate:${nfc}`] },
  });
  const right = fixture("contract:right", { precondition: { id: `predicate:${nfc}` } });
  const reordered = { ...left, postcondition: { ...left.postcondition, entails: [...left.postcondition.entails].reverse() } };
  assert.ok(coincides(left, reordered), "both array entries normalize to the same canonical string");
  const a = contractCompositionEvidence(left, right), b = contractCompositionEvidence(reordered, right);
  assert.equal(a.sources.left.id, b.sources.left.id);
  assert.deepEqual(told(a.conclusion), [true, false]);
  assert.deepEqual(told(b.conclusion), [true, false]);
  assert.notEqual(address(a.premises[1]), address(b.premises[1]));
  assert.notEqual(address(a.conclusion), address(b.conclusion));
  assert.ok(JSON.stringify(a.premises[1].for).includes("/postcondition/entails/1"));
  assert.ok(JSON.stringify(b.premises[1].for).includes("/postcondition/entails/0"));
});

test("LC: two literally equal decomposed coordinates still establish their own cut", () => {
  const left = fixture("contract:left"), right = fixture("contract:right");
  const nfcLeft = { ...left, move: { ...left.move, codomain: `schema:${nfc}` } };
  const nfcRight = { ...right, move: { ...right.move, domain: `schema:${nfc}` } };
  const nfdLeft = { ...left, move: { ...left.move, codomain: `schema:${nfd}` } };
  const nfdRight = { ...right, move: { ...right.move, domain: `schema:${nfd}` } };
  const a = contractCompositionEvidence(nfcLeft, nfcRight), b = contractCompositionEvidence(nfdLeft, nfdRight);
  assert.equal(a.sources.left.id, b.sources.left.id);
  assert.equal(a.sources.right.id, b.sources.right.id);
  assert.deepEqual(told(a.conclusion), [true, false]);
  assert.deepEqual(told(b.conclusion), [true, false]);
  assert.notEqual(address(a.premises[0]), address(b.premises[0]));
  assert.notEqual(address(a.conclusion), address(b.conclusion));
});

test("LC: native logs cannot complete the different literal cut from coincident source identities", () => {
  const left = fixture("contract:left", { postcondition: { id: `predicate:${nfc}` } });
  const right = fixture("contract:right", { precondition: { id: `predicate:${nfc}` } });
  const equivalent = { ...right, precondition: { id: `predicate:${nfd}` } };
  const original = contractCompositionEvidence(left, right), different = contractCompositionEvidence(left, equivalent);
  const log = new TellingLog();
  for (const entry of [...original.cells, ...different.cells]) {
    for (const witness of entry.for) log.tell(entry, witness);
    for (const witness of entry.against) log.deny(entry, witness);
  }
  assert.equal(fireRule(original.rule, log.cells()).length, 1);
  assert.equal(fireRule(different.rule, log.cells()).length, 0);
  const contrary = { source: "review:literal-boundary-audit", actual: "different lexical receiver" };
  log.deny(different.conclusion, contrary);
  const originalConclusion = log.cells().find(candidate => address(candidate) === address(original.conclusion));
  const differentConclusion = log.cells().find(candidate => address(candidate) === address(different.conclusion));
  assert.deepEqual(told(originalConclusion), [true, false]);
  assert.deepEqual(told(differentConclusion), [false, true]);
});

test("LC: exact literal admission does not collapse distinct lone surrogate strings", () => {
  const left = fixture("contract:left"), right = fixture("contract:right");
  const first = "schema:\ud800", second = "schema:\ud801";
  const a = { ...left, move: { ...left.move, codomain: first } };
  const b = { ...right, move: { ...right.move, domain: first } };
  const c = { ...b, move: { ...b.move, domain: second } };
  // If the actual carrier owner excludes these strings, this is outside the
  // admitted domain. If it admits them, the literal comparator must distinguish.
  let admitted;
  try { semanticId(a); semanticId(b); semanticId(c); admitted = true; }
  catch (error) {
    assert.equal(error.code, "non-canonical-cbor");
    assert.match(error.message, /unpaired Unicode surrogate/);
    admitted = false;
  }
  if (!admitted) {
    assert.throws(() => contractCompositionEvidence(a, b), error => error.code === "non-canonical-cbor");
    assert.throws(() => contractCompositionEvidence(a, c), error => error.code === "non-canonical-cbor");
    return;
  }
  const x = contractCompositionEvidence(a, b), y = contractCompositionEvidence(a, c);
  assert.notEqual(address(x.premises[0]), address(y.premises[0]));
  assert.deepEqual(told(x.conclusion), [true, false]);
  assert.deepEqual(told(y.conclusion), [false, false]);
});

test("LC: the public evidence constructor does not emit schema-invalid primitive contract sources", () => {
  const left = fixture("contract:left"), right = fixture("contract:right");
  for (const malformed of ["contract:label", 1, true, [], null]) {
    assert.throws(() => contractCompositionEvidence(malformed, right), TypeError);
    assert.throws(() => contractCompositionEvidence(left, malformed), TypeError);
  }
});

test("LC: ordinary composition readers reject provider getters before consulting them", () => {
  let reads = 0;
  const l = fixture("contract:left"), r = fixture("contract:right");
  const instr = c => ({ ...c, presentations: [{ address: "schema:one" }], projections: [] });
  for (const consume of [contractsCompose, instrumentsCompose]) {
    for (const side of [0, 1]) for (const key of ["move", "phase", "postcondition"]) {
      const pair = consume === instrumentsCompose ? [instr(l), instr(r)] : [{ ...l }, { ...r }];
      Object.defineProperty(pair[side], key, { enumerable: true, get() {
        reads += 1;
        throw new TypeError("untrusted composition getter");
      } });
      assert.throws(() => consume(...pair), TypeError);
    }
  }
  assert.equal(reads, 0);
});

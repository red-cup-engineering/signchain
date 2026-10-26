import assert from "node:assert/strict";
import test from "node:test";
import { bytesToHex, semanticBytes, semanticId } from "@red-cup-engineering/semiotic-content-address";
import { address, cell, evidence, semanticId as cellSemanticId, valueOf } from "@red-cup-engineering/signcell/cell";
import { derivation, fireRule, rule } from "../src/rules.mjs";
import { knowledgeJoin, knowledgeLeq, knowledgeMeet, truthJoin, truthLeq, truthMeet } from "../src/bilattice.mjs";

test("rule derivations retain full carrier identity and explicit historical version one", () => {
  const premise = cell("fixture:subject", "fixture:premise", "fixture:object");
  const conclusion = cell("fixture:subject", "fixture:conclusion", "fixture:object");
  const license = rule("fixture:rule", [{ cell: premise, atLeast: "held" }], { cell: conclusion, reading: "held" });
  const historical = { rule: license.name, from: [address(premise)] };
  assert.deepEqual(derivation(license, 1), historical);
  assert.deepEqual(derivation(license), { ...historical, ruleId: semanticId(license) });
  assert.deepEqual(derivation(license, 2), derivation(license));
  assert.throws(() => derivation(license, 3), /unsupported version/);
});

test("same rule labels do not erase different version two licenses", () => {
  const conclusion = cell("fixture:subject", "fixture:conclusion", "fixture:object");
  const held = rule("fixture:same-name", [], { cell: conclusion, reading: "held" });
  const denied = rule("fixture:same-name", [], { cell: conclusion, reading: "denied" });
  assert.deepEqual(derivation(held, 1), derivation(denied, 1));
  assert.notEqual(derivation(held).ruleId, derivation(denied).ruleId);
});

test("rule identity and firing use the owner of byte-valued source cells", () => {
  const bytes = new Uint8Array([0, 128, 255]);
  const premise = cell("source", "has", { bytes, amount: 9007199254740993n }, { for: [{ bytes }] });
  const conclusion = cell("source", "retains", { bytes });
  const license = rule("byte-carrier", [{ cell: premise, atLeast: "potential" }], { cell: conclusion, reading: "potential" });
  bytes.fill(7);
  const witness = derivation(license);
  assert.equal(witness.ruleId, cellSemanticId(license));
  assert.deepEqual(witness.from, [address(premise)]);
  const [result] = fireRule(license, [premise]);
  assert.equal(address(result), address(conclusion));
  assert.deepEqual([...result.object.bytes], [0, 128, 255]);
  assert.deepEqual(result.for, [witness]);
  assert.deepEqual(derivation(license, 1), { rule: license.name, from: [address(premise)] });
});

test("firing preserves the selected derivation version in its evidence", () => {
  const conclusion = cell("fixture:subject", "fixture:conclusion", "fixture:object");
  const license = rule("fixture:fire", [], { cell: conclusion, reading: "held" });
  for (const version of [1, 2]) {
    const [result] = fireRule(license, [], version);
    assert.equal(address(result), address(conclusion));
    assert.deepEqual(result.for, [derivation(license, version)]);
    assert.deepEqual(result.against, []);
  }
});

test("witness inclusion follows complete canonical carrier bytes on each evidence side", () => {
  const first = { label: "cafe\u0301", payload: "x".repeat(80), count: 2n, bytes: new Uint8Array([0, 255]) };
  const same = { bytes: new Uint8Array([0, 255]), count: 2n, payload: "x".repeat(80), label: "caf\u00e9" };
  const different = { ...same, bytes: new Uint8Array([0, 254]) };
  const key = value => bytesToHex(semanticBytes(value));
  assert.ok(key(first).length > 64); // This reference key contains the complete CBOR, not a digest.
  assert.equal(key(first), key(same));
  assert.notEqual(key(first), key(different));
  const small = { for: [first], against: [] };
  const large = { for: [same, different], against: [] };
  assert.equal(knowledgeLeq(small, large), true);
  assert.equal(knowledgeLeq(large, small), false);
  assert.equal(knowledgeLeq(small, { for: [different], against: [] }), false);
  assert.equal(knowledgeLeq({ for: [], against: [first] }, { for: [], against: [same] }), true);
  assert.equal(truthLeq({ for: [], against: [first, different] }, { for: [], against: [same] }), true);
  assert.equal(truthLeq({ for: [], against: [first] }, { for: [], against: [same, different] }), false);
});

test("lattice value operations retain evidence on both sides", () => {
  const left = evidence({ for: [{ witness: "fixture:for" }] });
  const right = evidence({ against: [{ witness: "fixture:against" }] });
  for (const [combine, reading] of [[knowledgeJoin, "stable"], [knowledgeMeet, "absurd"], [truthJoin, "potential"], [truthMeet, "active"]]) {
    const result = combine(left, right);
    assert.deepEqual(result.for, left.for);
    assert.deepEqual(result.against, right.against);
    assert.equal(valueOf(result), reading);
  }
});

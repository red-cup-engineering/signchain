import test from "node:test";
import assert from "node:assert/strict";
import { address, cell, merge } from "@red-cup-engineering/signcell/cell";
import {
  antecedentHolds, fire, fireRule, fireRuleIn, firedRuleNames, rule, step,
} from "../src/rules.mjs";

const premise = cell("source", "claims", "outcome");
const consequence = cell("recipient", "may-read", "outcome");
const forTelling = cell("source", "claims", "outcome", { for: ["source-witness"] });
const againstTelling = cell("source", "claims", "outcome", { against: ["counter-witness"] });
const positive = rule("positive", [{ cell: premise, atLeast: "potential" }],
  { cell: consequence, reading: "potential" });
const negative = rule("negative", [{ cell: premise, atLeast: "active" }],
  { cell: consequence, reading: "active" });
const contested = rule("contested", [{ cell: premise, atLeast: "stable" }],
  { cell: consequence, reading: "stable" });
const rules = [positive, negative, contested];

test("first/last occurrence order cannot change an admitted rule judgment", () => {
  const firstPositive = [forTelling, againstTelling];
  const firstNegative = [againstTelling, forTelling];
  for (const valuation of [firstPositive, firstNegative]) {
    for (const admitted of rules) {
      assert.equal(antecedentHolds(admitted, valuation), true, admitted.name);
    }
    assert.deepEqual(firedRuleNames(rules, valuation),
      ["positive", "negative", "contested"]);
  }
  assert.deepEqual(fire(rules, firstPositive), fire(rules, firstNegative));
  assert.deepEqual(step(rules, firstPositive), step(rules, firstNegative));
});

test("public rule firing and SignCraft's indexed rule firing share the same source evidence", () => {
  const merged = merge(forTelling, againstTelling);
  const indexed = new Map([[address(merged), merged]]);
  for (const admitted of rules) {
    assert.deepEqual(fireRule(admitted, [forTelling, againstTelling]),
      fireRuleIn(admitted, indexed));
  }
});

test("missing or one-sided testimony cannot be promoted into both-sided proof", () => {
  for (const valuation of [[], [cell("source", "claims", "outcome")],
    [forTelling], [againstTelling]]) {
    assert.equal(antecedentHolds(contested, valuation), false);
    assert.deepEqual(fireRule(contested, valuation), []);
    assert.equal(firedRuleNames([contested], valuation).length, 0);
  }
  assert.deepEqual(firedRuleNames([positive, negative], [forTelling]), ["positive"]);
  assert.deepEqual(firedRuleNames([positive, negative], [againstTelling]), ["negative"]);
});

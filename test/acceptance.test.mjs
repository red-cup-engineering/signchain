import assert from "node:assert/strict";
import test from "node:test";
import { cell } from "@red-cup-engineering/signcell/cell";
import { fireRule, rule } from "@red-cup-engineering/signchain/rules";

const premise = cell("rain", "reaches", "garden");
const result = cell("garden", "is", "wet");
const consequence = { cell: result, reading: "potential" };

test("SCH-RULE-GUARD", () => {
  const water = rule("watering", [{ cell: premise, atLeast: "potential" }], consequence);
  assert.deepEqual(fireRule(water, []), []);
});

test("SCH-RULE-READING", () => {
  assert.throws(() => rule("watering", [{ cell: premise, atLeast: "unrecognized" }], consequence), TypeError);
});

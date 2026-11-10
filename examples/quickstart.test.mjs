import assert from "node:assert/strict";
import test from "node:test";
import { cell, knowledgeReading, sameCell } from "@red-cup-engineering/signcell/cell";
import { fireRule, rule } from "@red-cup-engineering/signchain/rules";

test("An affirmed premise fires its rule and produces the expected consequence.", () => {
  const premise = cell("rain", "reaches", "garden", { for: ["sensor"] });
  const wet = cell("garden", "is", "wet");
  const watering = rule("watering", [{ cell: premise, atLeast: "potential" }], {
    cell: wet, reading: "potential",
  });
  const [consequence] = fireRule(watering, [premise]);
  assert.ok(sameCell(consequence, wet));
  assert.equal(knowledgeReading(consequence), "potential");
});

import assert from "node:assert/strict";
import test from "node:test";
import { cell, valueOf } from "@red-cup-engineering/signcell/cell";
import { SPECIALIZES, tokenFrame } from "@red-cup-engineering/signcell/token-frame";
import { possibilize, valuationOf } from "../src/token-fiber.mjs";

const predicate = "requires", object = "source-qualified-market-claim";
const claim = cell("service-type", predicate, object, {for: ["customer-requirement"]});

for (const [name, evidence, expected] of [
  ["unwitnessed classification cannot transmit a requirement", {value: "potential"}, "absurd"],
  ["lowered classification cannot erase a witnessed path", {for: ["classification-sensor"], value: "absurd"}, "potential"],
  ["positive written value cannot overturn negative classification", {against: ["counterexample"], value: "potential"}, "absurd"],
]) {
  test(name, () => {
    const classification = cell("service-instance", SPECIALIZES, "service-type", evidence);
    const frame = tokenFrame([classification, claim]);
    const modal = possibilize(frame, valuationOf(frame, predicate, object));
    assert.equal(modal.find(at => at.token === "service-instance").reading, expected);
    assert.equal(modal.find(at => at.token === "service-type").reading, "potential");
    const retained = frame.cells.find(at => at.predicate === SPECIALIZES);
    assert.equal(valueOf(retained), evidence.value);
    assert.deepEqual(retained.for, classification.for);
    assert.deepEqual(retained.against, classification.against);
  });
}

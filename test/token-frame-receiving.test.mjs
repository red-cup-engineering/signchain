import assert from "node:assert/strict";
import test from "node:test";
import { cell } from "@red-cup-engineering/signcell";
import {
  SPECIALIZES, admitTokenFrame, specializes, tokenFrame,
} from "@red-cup-engineering/signchain/token-frame";

test("a restored token order retains the positive path and its opposing witness", () => {
  const first = cell("specific", SPECIALIZES, "intermediate", { for: ["first"] });
  const second = cell("intermediate", SPECIALIZES, "general", { for: ["second"] });
  const denial = cell("specific", SPECIALIZES, "general", { against: ["denial"] });
  const asserted = cell("other", SPECIALIZES, "general", { value: "potential" });
  const frame = admitTokenFrame(JSON.parse(JSON.stringify(tokenFrame([first, second, denial, asserted]))));
  assert.equal(specializes(frame, "specific", "general"), true);
  assert.equal(specializes(frame, "other", "general"), false);
  assert.deepEqual(frame.contested, [{ special: "specific", general: "general", denial, path: [first, second] }]);
});

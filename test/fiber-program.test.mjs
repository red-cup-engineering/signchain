import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { cell } from "@red-cup-engineering/signcell/cell";
import { SPECIALIZES, tokenFrame } from "@red-cup-engineering/signcell/token-frame";
import {
  readingFamilies, sidesOfReading,
} from "@red-cup-engineering/computer-data-engineering-services-section/four";
import { truthWithin } from "../src/token-fiber.mjs";
import { compareFiberPrograms, executeFiberProgram } from "../src/fiber-program.mjs";

const program = (expression) => ({
  kind: "signchain.fiber-program", version: 1, expression,
});
const read = (predicate, object) => ({ op: "read", predicate, object });
const binary = (operation, left, right, order) => ({
  op: "binary", operation, ...(order === undefined ? {} : { order }), left, right,
});
const family = (quantifier, order, ...terms) => ({ op: "family", quantifier, order, terms });
const readingAt = (result, token) => result.valuation.find((value) => value.token === token)?.reading;

test("the checked-in JSON Schema is a recursive executable expression grammar", () => {
  const schema = JSON.parse(readFileSync(new URL("../data/schema/fiber-program.schema.json", import.meta.url), "utf8"));
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.$defs.expression.oneOf.length, 6);
  assert.equal(schema.$defs.family.properties.terms.minItems, 1);
  assert.equal(schema.$defs.latticeBinary.properties.order.enum.length, 2);
  assert.deepEqual(schema.$defs.multiplicativeBinary.properties.operation.enum, ["tensor", "lollipop", "par"]);
});

test("schema runs distinct truth/knowledge quantifiers across an enumerated family", () => {
  const frame = tokenFrame([
    cell("detail", SPECIALIZES, "kind", { for: ["source-specialization"] }),
    cell("detail", "scenario-a", "outcome", { for: ["source-for"] }),
    cell("detail", "scenario-b", "outcome", { against: ["source-against"] }),
  ]);
  const terms = [read("scenario-a", "outcome"), read("scenario-b", "outcome")];
  const actual = (quantifier, order) =>
    executeFiberProgram(frame, program(family(quantifier, order, ...terms)));
  assert.equal(readingAt(actual("all", "truth"), "detail"), "active",
    "one contrary descent refutes truth-order necessity");
  assert.equal(readingAt(actual("all", "knowledge"), "detail"), "absurd",
    "knowledge-order consensus has neither side in common");
  assert.equal(readingAt(actual("some", "truth"), "detail"), "potential",
    "some descent supports possibility");
  assert.equal(readingAt(actual("some", "knowledge"), "detail"), "stable",
    "knowledge join retains BOTH competing witness sides");
  assert.equal(readingAt(actual("some", "knowledge"), "kind"), "absurd",
    "no unrelated token acquires evidence from contradiction");
  assert.equal(actual("all", "truth").transfiniteSettlement, "not-established");
  assert.equal(actual("some", "knowledge").effectAuthority, "not-established");
});

test("indexed quantifiers compose with native linear negation in a schema program", () => {
  const frame = tokenFrame([
    cell("child", SPECIALIZES, "parent", { for: ["taxonomic-witness"] }),
    cell("child", "qualifies", "candidate", { for: ["witness-1"], against: ["witness-2"] }),
    cell("parent", "qualifies", "candidate", { against: ["witness-3"] }),
  ]);
  const term = read("qualifies", "candidate");
  const indexed = (quantifier, order) =>
    program({ op: "indexed", quantifier, order, of: term });
  assert.equal(readingAt(executeFiberProgram(frame, indexed("some", "knowledge")), "child"), "stable");
  assert.equal(readingAt(executeFiberProgram(frame, indexed("some", "truth")), "child"), "potential");
  assert.equal(readingAt(executeFiberProgram(frame, indexed("all", "knowledge")), "parent"), "active");
  assert.equal(readingAt(executeFiberProgram(frame, indexed("all", "truth")), "parent"), "active");
  const negated = program({ op: "linear-not", of: indexed("some", "truth").expression });
  assert.equal(readingAt(executeFiberProgram(frame, negated), "child"), "active");
});

test("schema's multiplicative tensor and residual preserve truth-order adjunction", () => {
  const tokens = readingFamilies.knowledge;
  const cells = tokens.map((point, index) => {
    const [positive, negative] = sidesOfReading(point);
    return cell("single-token", "has", String(index), {
      for: positive ? ["positive:" + index] : [],
      against: negative ? ["negative:" + index] : [],
    });
  });
  const frame = tokenFrame(cells);
  const expressions = tokens.map((_, index) => read("has", String(index)));
  for (const a of expressions) for (const b of expressions) for (const c of expressions) {
    const tensor = program(binary("tensor", a, b));
    const residual = program(binary("lollipop", b, c));
    const aProgram = program(a), cProgram = program(c);
    assert.equal(
      compareFiberPrograms(frame, tensor, cProgram, "truth").entails,
      compareFiberPrograms(frame, aProgram, residual, "truth").entails,
      "the multiplicative residuum is right-adjoint to fusion"
    );
  }
  assert.equal(readingAt(executeFiberProgram(frame, program(binary("par", expressions[1], expressions[2]))), "single-token"), "stable");
});

test("malformed, unauthorized and falsely transfinite program shapes refuse execution", () => {
  const frame = tokenFrame([cell("source", "p", "q", { for: ["w"] })]);
  const good = read("p", "q");
  assert.throws(() => executeFiberProgram(frame, program(family("all", "truth"))), /nonempty/u);
  assert.throws(() => executeFiberProgram(frame, program({ op: "indexed", order: "temporal", quantifier: "some", of: good })), /unknown order/u);
  assert.throws(() => executeFiberProgram(frame, program({ op: "unknown", of: good })), /unknown expression/u);
  assert.throws(() => executeFiberProgram(frame, program(binary("tensor", good, good, "truth"))), /no extra lattice order/u);
  assert.throws(() => executeFiberProgram(frame, { ...program(good), closureRegime: "aperiodic" }), /undeclared field/u);
  assert.throws(() => executeFiberProgram(frame, { ...program(good), version: 999 }), /unsupported/u);
  assert.throws(() => executeFiberProgram(null, program(good)), /native SignCell token frame/u);
  assert.throws(() => compareFiberPrograms(frame, program(good), program(good), "mixed"), /unknown order/u);
  assert.deepEqual(executeFiberProgram(frame, program(good)).valuation,
    executeFiberProgram(frame, program(good)).valuation,
    "replay on the same unchanged source is deterministic");
});

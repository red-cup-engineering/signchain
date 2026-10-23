import assert from "node:assert/strict";
import test from "node:test";
import {
  schemaOperationAuditSchema, schemaOperationsCompose, auditSchemaOperation,
} from "../src/contracts/contract-operation.mjs";

// Original R11-SCH-M1: inspect -> transform -> validate. Pure boundaries only,
// not fabricated tool calls, model decisions, or installed agent execution.
const inspect = { id: "inspect", domain: "fixture/input", codomain: "fixture/observation", hasPortableBody: true };
const transform = { id: "transform", domain: "fixture/observation", codomain: "fixture/result", hasPortableBody: true };
const validate = { id: "validate", domain: "fixture/result", codomain: "fixture/validated", hasPortableBody: true };

test("three-stage named operation cuts preserve their typed intended sequence", () => {
  assert.equal(schemaOperationsCompose(inspect, transform), true);
  assert.equal(schemaOperationsCompose(transform, validate), true);
  assert.equal(schemaOperationsCompose(validate, inspect), false);
  assert.equal(schemaOperationsCompose(inspect, { ...transform, domain: "fixture/other" }), false);
  for (const step of [inspect, transform, validate]) {
    const report = auditSchemaOperation(step);
    assert.equal(report.relation, "operation");
    assert.equal(report.domain, step.domain);
    assert.equal(report.codomain, step.codomain);
    assert.equal(Object.isFrozen(report), true);
  }
});

test("non-string, empty and missing coordinates never compose by JS equality", () => {
  const invalid = [undefined, null, 0, false, "", " ", {}, []];
  for (const left of invalid) for (const right of invalid) {
    assert.equal(schemaOperationsCompose({ codomain: left }, { domain: right }), false);
  }
  for (const value of invalid) {
    assert.equal(schemaOperationsCompose({ codomain: value }, { domain: "fixture/observation" }), false);
    assert.equal(schemaOperationsCompose({ codomain: "fixture/observation" }, { domain: value }), false);
  }
  assert.equal(schemaOperationsCompose(null, transform), false);
  assert.equal(schemaOperationsCompose(inspect, null), false);
  assert.equal(schemaOperationsCompose({ codomain: "fixture/observation" },
    { domain: "fixture/observation" }), true);
});

test("missing boundaries are preserved, malformed claimed coordinates are refused", () => {
  const base = { id: "fixture:boundary", hasPortableBody: false };
  assert.deepEqual(auditSchemaOperation(base), {
    kind: "metroplat.contracts.operation-audit", id: "fixture:boundary",
    relation: "boundary", hasPortableBody: false, reason: "untyped boundary",
  });
  assert.equal(auditSchemaOperation({ ...base, codomain: "fixture/result" }).reason, "admission boundary");
  assert.equal(auditSchemaOperation({ ...base, domain: "fixture/input" }).reason, "transport boundary");
  for (const malformed of [null, false, 0, "", " ", [], {}]) {
    for (const coordinate of ["domain", "codomain"]) {
      assert.throws(() => auditSchemaOperation({ ...base, [coordinate]: malformed }),
        /must be a nonblank schema address/);
    }
  }
  assert.throws(() => auditSchemaOperation(null), /presentation is required/);
  assert.throws(() => auditSchemaOperation([]), /presentation is required/);
  assert.equal(schemaOperationAuditSchema.properties.domain.minLength, 1);
  assert.equal(schemaOperationAuditSchema.properties.codomain.minLength, 1);
  assert.equal(schemaOperationAuditSchema.properties.domain.pattern, "\\S");
  assert.equal(schemaOperationAuditSchema.properties.codomain.pattern, "\\S");
});

/**
 * contracts/shape-contract - a schema contract over one shape literal, checked
 * by SignCell's carrier shapes.
 */

import { compileShape } from "@red-cup-engineering/signcell/shape";

const shapesOf = (contracts) => contracts.flatMap((contract) => [contract.schema, ...shapesOf(contract.references)]);

/** A contract: its shape literal, the contracts its `$ref`s name by `$id`, and `validate`, `assert` and `errors`. */
export function shapeContract(schema, references = []) {
  const shape = compileShape(schema, { references: shapesOf(references) });
  const errors = (candidate) => Object.freeze(shape.validate(candidate).issues.map((issue) => `${issue.path || "/"} ${issue.keyword}: ${issue.message}`));
  return Object.freeze({
    kind: "schema-contract",
    id: schema.$id,
    schema,
    references: Object.freeze([...references]),
    validate: (candidate) => shape.validate(candidate).valid,
    assert: (candidate, context = schema.$id) => {
      if (shape.validate(candidate).valid) return candidate;
      throw new TypeError(`${context}: ${errors(candidate).join("; ")}`);
    },
    errors,
  });
}

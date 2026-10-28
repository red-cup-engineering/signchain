/**
 * SignChain — a schema-borne finite predication-fiber program.
 *
 * The source program is a typed JSON expression, not JavaScript and not a
 * declaration-only profile. Evaluating it invokes the existing SignCell frame,
 * SignChain fiber operations and the Data-owned FOUR/twist-product operators.
 *
 * The two lattice orders, indexed quantification over token specialization,
 * multiplicative linear operations, and finite-family quantification are
 * DISTINCT structures. Results are finite projections, not transfinite
 * settlements, evidence signatures, semantic admission or effect authority.
 */
import {
  fusionReading, knowledgeImplyReading, knowledgeJoinAll, knowledgeJoinReading,
  knowledgeMeetAll, knowledgeMeetReading, linearNegationReading, parReading,
  residuumReading, truthImplyReading, truthJoinAll, truthJoinReading,
  truthMeetAll, truthMeetReading,
} from "@red-cup-engineering/computer-data-engineering-services-section/four";
import { assertInertCarrierSource } from "@red-cup-engineering/semiotic-content-address";
import { tokenFrame } from "@red-cup-engineering/signcell/token-frame";
import { semanticId } from "@red-cup-engineering/signcell/cell";
import {
  knowledgeWithin, necessitateIn, pointwise, possibilizeIn, truthWithin, valuationOf,
} from "./token-fiber.mjs";

const freeze = (value) => Object.freeze(value);
const record = (value, location) => {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("signchain fiber program: " + location + " must be an object");
  return value;
};
const fields = (value, required, permitted, location) => {
  record(value, location);
  const got = Object.getOwnPropertyNames(value);
  for (const name of required) if (!Object.getOwnPropertyDescriptor(value, name)?.enumerable)
    throw new TypeError("signchain fiber program: " + location + " needs " + name);
  for (const name of got) if (!permitted.includes(name))
    throw new TypeError("signchain fiber program: " + location + " has undeclared field " + name);
};
const orderOf = (order) => {
  if (order !== "truth" && order !== "knowledge")
    throw new TypeError("signchain fiber program: unknown order " + String(order));
  return order;
};

const binary = freeze({
  join: freeze({ knowledge: knowledgeJoinReading, truth: truthJoinReading }),
  meet: freeze({ knowledge: knowledgeMeetReading, truth: truthMeetReading }),
  imply: freeze({ knowledge: knowledgeImplyReading, truth: truthImplyReading }),
});
const multiplicative = freeze({
  tensor: fusionReading,
  lollipop: residuumReading,
  par: parReading,
});
const foldByOrder = freeze({
  knowledge: freeze({ all: knowledgeMeetAll, some: knowledgeJoinAll }),
  truth: freeze({ all: truthMeetAll, some: truthJoinAll }),
});

const expression = (frame, node) => {
  record(node, "expression");
  switch (node.op) {
    case "read":
      fields(node, ["op", "predicate", "object"], ["op", "predicate", "object"], "read");
      return valuationOf(frame, node.predicate, node.object);

    case "linear-not":
      fields(node, ["op", "of"], ["op", "of"], "linear-not");
      return pointwise(frame, linearNegationReading, expression(frame, node.of));

    case "binary": {
      fields(node, ["op", "operation", "left", "right"],
        ["op", "operation", "order", "left", "right"], "binary");
      if (typeof node.operation !== "string")
        throw new TypeError("signchain fiber program: binary operation must be a declared name");
      const operation = Object.hasOwn(multiplicative, node.operation)
        ? (() => {
            if (Object.hasOwn(node, "order"))
              throw new TypeError("signchain fiber program: a multiplicative linear operator has no extra lattice order");
            return multiplicative[node.operation];
          })()
        : (() => {
            const op = Object.hasOwn(binary, node.operation) ? binary[node.operation] : undefined;
            if (op === undefined)
              throw new TypeError("signchain fiber program: unknown binary operation " + String(node.operation));
            return op[orderOf(node.order)];
          })();
      return pointwise(frame, operation, expression(frame, node.left), expression(frame, node.right));
    }

    case "indexed": {
      fields(node, ["op", "quantifier", "order", "of"],
        ["op", "quantifier", "order", "of"], "indexed");
      const order = orderOf(node.order), term = expression(frame, node.of);
      if (node.quantifier === "some") return possibilizeIn(frame, term, order);
      if (node.quantifier === "all") return necessitateIn(frame, term, order);
      throw new TypeError("signchain fiber program: unknown indexed quantifier " + String(node.quantifier));
    }

    case "family": {
      fields(node, ["op", "quantifier", "order", "terms"],
        ["op", "quantifier", "order", "terms"], "family");
      const order = orderOf(node.order);
      if (node.quantifier !== "some" && node.quantifier !== "all")
        throw new TypeError("signchain fiber program: unknown family quantifier " + String(node.quantifier));
      if (!Array.isArray(node.terms) || node.terms.length === 0)
        throw new TypeError("signchain fiber program: a finite descent family must be nonempty and explicitly enumerated");
      const terms = node.terms.map((term) => expression(frame, term));
      return pointwise(frame, (...readings) => foldByOrder[order][node.quantifier](readings, "knowledge"), ...terms);
    }

    default:
      throw new TypeError("signchain fiber program: unknown expression " + String(node.op));
  }
};

/**
 * Execute a typed finite program against one native token frame.
 * A family quantifier ranges over exactly the listed expressions, not every
 * future, model, admissible causal descent or ordinal stage in some universe.
 * The finite frontier is not a proof that the family is exhaustive.
 */
export function executeFiberProgram(frame, program) {
  // Original SCA admits inert semiotic data before grammar reads. It preserves
  // explicit undefined fields, byte/bigint claim literals and owner snapshots.
  // This is not a sandbox for arbitrary Proxy objects or untrusted intrinsics.
  assertInertCarrierSource(program);
  fields(program, ["kind", "version", "expression"],
    ["kind", "version", "expression"], "program");
  if (program.kind !== "signchain.fiber-program" || program.version !== 1)
    throw new TypeError("signchain fiber program: unsupported program kind or version");
  if (frame?.kind !== "signcell.token-frame" || !Array.isArray(frame.cells) || !Array.isArray(frame.tokens))
    throw new TypeError("signchain fiber program: a native SignCell token frame is required");
  // Reconstruct the original generated frame. A caller-authored token list is not a source witness.
  const generated = tokenFrame(frame.cells, { predicate: frame.predicate });
  if (semanticId(generated) !== semanticId(frame))
    throw new TypeError("signchain fiber program: declared frame differs from its source-generated token frame");
  const valuation = expression(generated, program.expression);
  return freeze({
    kind: "signchain.fiber-program-result",
    version: 1,
    carrier: "FOUR^T",
    scope: "finite-enumerated-frame",
    valuation,
    // No ordinal/cofinality certificate is manufactured from a four-valued readout.
    transfiniteSettlement: "not-established",
    effectAuthority: "not-established",
  });
}

/** Compare two executable program valuations only in the explicitly named order. */
export function compareFiberPrograms(frame, left, right, order) {
  const within = orderOf(order) === "knowledge" ? knowledgeWithin : truthWithin;
  const a = executeFiberProgram(frame, left).valuation;
  const b = executeFiberProgram(frame, right).valuation;
  return freeze({ kind: "signchain.fiber-program-entailment", order, entails: within(frame, a, b) });
}

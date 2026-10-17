# Executable schema-borne FOUR fiber programs

**Scope:** finite, source-generated token frames. This pure interpreter operates over existing SignCell and Data FOUR operations. It does **not** certify transfinite/aperiodic closure, exhaustive causal futures, source identity of arbitrary claims, actor powers or effects.

## Production chain

| Stage | Current original |
| --- | --- |
| Mathematical conformance | Obsmetrologia: Calculus/Logic/LinearLogicChu.lean, Language/Positing/FiberAlgebra.lean and Calculus/Logic/TwistProductResiduation.lean |
| Scientific requirement | [Lenticule Computer Science](https://github.com/lenticule-science/computer-science-services-section/blob/main/research/regime-lift-computing/2026-10-17-schema-borne-dual-order-linear-computing.md) |
| Engineering requirement | [Bigraded fiber computing](../data/records/requirements-records/schema-borne-bigraded-fiber-computing-20261017.json) |
| Specification | [Recursive JSON Schema, Draft 2020-12](../data/schema/fiber-program.schema.json) and the input/output contract below |
| Architecture | Native SignCell frame → SignChain pointwise/indexed fiber algebra → existing Data FOUR twist product; interpreter composes, does not duplicate |
| Design | [Expression interpreter](../src/fiber-program.mjs); [two-order modalities](../src/token-fiber.mjs) |
| Tests | [Schema execution](../test/fiber-program.test.mjs); [two-order modal laws](../test/token-fiber.test.mjs) |
| Delivery | SignChain package exports and schema/sample payload; downstream consumer installation still unreceived |
| Operations | Existing authorized Coesite Saturday/use-and-improve method; original Work, budget, receiver and any external authority remain elsewhere |

A program expression is a **downstream image** of Obsmetrologia's already-generated Marks/Articulating/Predicating/Positing structure. A JSON parser is not the generating source of relationality.

## Grammar and execution

Supply the **original generated** SignCell token frame and a JSON program of kind signchain.fiber-program, version 1. The interpreter **regenerates** the frame from its cells and refuses a changed presentation. The program is an executable expression, not a declaration-only checklist.

Operators, whose valid arities are in the schema:

- **read(predicate, object)** — observe the original for/against testimony at each frame token.
- **binary(join | meet | imply, order, left, right)** — use either the *knowledge* or *truth* Heyting order.
- **binary(tensor | lollipop | par, left, right)** — use existing Data FOUR multiplicative linear logic, with no fake lattice-order argument.
- **linear-not(of)** — existing multiplicative linear negation.
- **indexed(some | all, order, of)** — existential over generalizations, or universal over extents, of the original specialization preorder. Each pair is adjoint within its own order.
- **family(some | all, order, terms)** — use exactly the **explicitly enumerated nonempty family** of term valuations. This is distinct from token-indexed modality and never promises an exhaustive causal future.

Every term returns a pointwise FOUR-valued fiber; no rules invent external witnesses. Output reports scope finite-enumerated-frame, transfiniteSettlement not-established and effectAuthority not-established. The additional compareFiberPrograms function computes entailment only in an explicitly chosen order.

The JSON Schema specifies program grammar; evaluation checks semantic shape and uses native carriers. External Draft 2020-12 schema validation, if required by a caller, must come from the source-owned JSON Schema service. A successful schema admission cannot appoint an actor or authorize a tool action.

## Two visibly different computations from the same witnesses

On an original two-token specialization chain, take lower-token positive-only testimony and upper-token negative-only testimony for the same claim.

- Knowledge existential at the lower token becomes **stable** (both sides retained); truth existential becomes **potential** (some support).
- Knowledge universal at the upper token becomes **absurd** (no common testimony); truth universal becomes **active** (one denial refutes conjunction).

For an explicitly enumerated pair of *alternative descents*, one positive-only and the other negative-only at the same token:

- Knowledge family some = **stable**, knowledge family all = **absurd**.
- Truth family some = **potential**, truth family all = **active**.

These are four correct answers to four **distinct questions**. They cannot be collapsed into a scalar validity, a majority vote, or a supposed universal future. [This example program](../data/examples/schema-borne-necessity.json) composes knowledge-indexed possibility, linear negation and truth-order finite-family necessity.

### Native usage after package installation

~~~js
import { cell } from "@red-cup-engineering/signcell/cell";
import { tokenFrame } from "@red-cup-engineering/signcell/token-frame";
import { executeFiberProgram } from "@red-cup-engineering/signchain/fiber-program";

const frame = tokenFrame([
  cell("local", "scenario-a", "outcome", { for: ["observed-a"] }),
  cell("local", "scenario-b", "outcome", { against: ["observed-b"] }),
]);

const read = (predicate) => ({ op: "read", predicate, object: "outcome" });
const program = {
  kind: "signchain.fiber-program",
  version: 1,
  expression: {
    op: "family", order: "truth", quantifier: "all",
    terms: [read("scenario-a"), read("scenario-b")],
  },
};
const result = executeFiberProgram(frame, program);
// At "local": active — a member of the finite family refutes universal support.
// Not a transfinite theorem or a proof of exhaustive admissible futures.
~~~

## Qualification and refusal

- Reject unknown operators/orders, undeclared metadata and unsupported versions.
- Reject linear operators with an invented independent order field.
- Reject an empty family rather than passing vacuous truth off as a forecast.
- Reject a forged token-frame presentation inconsistent with its original cells.
- Retain contradictions and unrelated unknown tokens without explosive inference.
- Test both indexed modal adjunctions, their closure/interior laws and 64 fusion/residual triples on FOUR.

The previous SignChain source offered a knowledge-only indexed pair and manual operator composition. The new **capability** is data-authored recursive composition with an independent truth-order pair and linear operators. An external market-beat has **not** been measured.

Run the source-owned package tests against its real registry dependencies before claiming qualification. A source commit, passing local fixture, published package, selected consumer dependency, deployed service, accepted Work and economic effect are distinct receipts. No repository-authored test file by itself establishes that the new implementation executed successfully.

## Unresolved higher-regime mathematics

A later program may carry (1) actual source-derived Chu forward/backward transports preserving two witness incidences, (2) cohomological obstruction and commuting KZ witnesses, (3) proven ordinal/cofinality limit stages, and (4) a witnessed generator-adding change to its own theory. This interpreter supplies **none of those proofs**. Its existing finite output gives the future Science/Engineering loop a real lower-regime experiment instead of another profile document.

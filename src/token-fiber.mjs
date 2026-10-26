/**
 * SignChain — the fiber algebra over a token frame.
 *
 * SignCell's token frame is the Heyting algebra of a token order: each token is its extent ↓t, the
 * Yoneda embedding of the order into its frame of down-closed sets, and an extent says of every token
 * one bit, in or out. A fiber says one point of FOUR instead: a valuation reads a claim (predicate,
 * object) at every token as what is told of (token, predicate, object). The fiber algebra is FOUR^T,
 * FOUR taken pointwise over the frame's tokens (Obsmetrologia `Language/Positing/FiberAlgebra.lean`):
 * knowledge join and meet, truth join and meet, negation, and one Heyting implication per order, each
 * residuating its meet (w ∧ v ≤ u exactly when w ≤ v ⇒ u, in ≤k and in ≤t separately).
 *
 * Possibilizing and necessitating are maps between fibers along the directed order:
 * ◇v reads at t the knowledge join of v over t's generalizations, told of something t is; □v reads the
 * knowledge meet over t's extent, told of everything that is t. Specialization is reflexive and
 * transitive, an S4 frame, so ◇ is a closure, □ an interior, and ◇v ≤ₖ w exactly when v ≤ₖ □w.
 * The two covers are converse directions of one relation. This finite relation
 * adjunction is distinct from Science's same-fiber S5 `Closure/Modal.lean`;
 * no symmetry or source-generated Mark equality is inferred here.
 *
 * Gluing fibers into sections over covers is the layer above this one: SignGraph's token sheaf.
 */
import { cellSet, claimCoordinate, coincidenceKey, sidesOf } from "@red-cup-engineering/signcell/cell";
import { extent, generalizations, top } from "@red-cup-engineering/signcell/token-frame";
import { isReading, knowledgeJoinAll, knowledgeLeqReading, knowledgeMeetAll, readingAs, readingOfSides, truthJoinAll, truthLeqReading, truthMeetAll } from "@red-cup-engineering/computer-data-engineering-services-section/four";

const frozen = (values) => Object.freeze([...values]);
// The canonical predicate/object coordinate is owned upstream by SignCell.

// A valuation's readings by token key, every frame token present; absent tokens read absurd.
function readingsOf(tokens, valuation) {
  const known = new Set(tokens.map(coincidenceKey));
  const readings = new Map();
  for (const { token, reading } of valuation) {
    if (!isReading(reading)) throw new TypeError(`signchain: a valuation reads FOUR, not ${JSON.stringify(reading)}`);
    const key = coincidenceKey(token);
    if (!known.has(key)) throw new TypeError(`signchain: ${JSON.stringify(token)} is not a token of this frame`);
    const next = readingAs("knowledge", reading);
    // A valuation is a point of FOUR^T. Repeated tellings at the same token
    // join evidence in the knowledge order; last-writer-wins would erase one
    // side of contradiction and make the fiber depend on arrival order.
    readings.set(key, readings.has(key)
      ? knowledgeJoinAll([readings.get(key), next], "knowledge") : next);
  }
  return (token) => readings.get(coincidenceKey(token)) ?? "absurd";
}

const over = (tokens, readingAt) => frozen(tokens.map((token) => Object.freeze({ token, reading: readingAt(token) })));

/** The valuation of one claim (predicate, object): each frame token's FOUR reading of what is told
 *  directly of (token, predicate, object) in the frame's cells, in the frame's token order. */
export function valuationOf(frame, predicate, object) {
  // `tokens` on a transported frame is a display projection, not admission.
  // The owning SignCell reader re-derives its carrier from original cells.
  const tokens = top(frame);
  const target = claimCoordinate(predicate, object);
  const told = new Map();
  // Transported frames may carry separate source tellings of one cell. Read
  // their upstream knowledge join, exactly as the native frame constructor
  // does, instead of letting the last wire row erase contrary evidence.
  for (const at of cellSet(frame.cells)) if (claimCoordinate(at.predicate, at.object) === target) told.set(coincidenceKey(at.subject), at);
  return over(tokens, (token) => {
    const at = told.get(coincidenceKey(token));
    return at === undefined ? "absurd" : readingOfSides("knowledge", ...sidesOf(at));
  });
}

/** A FOUR operation taken pointwise over the frame: `operation` applied, token by token, to the
 *  readings of the given valuations (negation to one, a join, meet or implication to two). */
export function pointwise(frame, operation, ...valuations) {
  const tokens = top(frame);
  const reads = valuations.map((valuation) => readingsOf(tokens, valuation));
  return over(tokens, (token) => readingAs("knowledge", operation(...reads.map((read) => read(token)))));
}

const pointwiseLeq = (leq) => (frame, left, right) => {
  const tokens = top(frame);
  const [l, r] = [readingsOf(tokens, left), readingsOf(tokens, right)];
  return tokens.every((token) => leq(l(token), r(token)));
};
/** The fiber's knowledge order: every token's reading below the other's in ≤k. */
export const knowledgeWithin = pointwiseLeq(knowledgeLeqReading);
/** The fiber's truth order: every token's reading below the other's in ≤t. */
export const truthWithin = pointwiseLeq(truthLeqReading);

const modal = (frame, valuation, coverOf, fold) => {
  const tokens = top(frame);
  const read = readingsOf(tokens, valuation);
  return over(tokens, (token) => fold(coverOf(frame, token).map(read), "knowledge"));
};

const modalFold = (order, knowledgeFold, truthFold) => {
  if (order === "knowledge") return knowledgeFold;
  if (order === "truth") return truthFold;
  throw new TypeError(`signchain: unknown modal fiber order ${String(order)}`);
};

/**
 * The two independently indexed existential operators over a token frame.
 * Knowledge order preserves both tellings; truth order uses logical disjunction
 * (for if any generalization is for; against only if every one is against).
 * A FOUR value is not a closure ordinal; both are finite fiber projections.
 */
export const possibilizeIn = (frame, valuation, order) =>
  modal(frame, valuation, generalizations, modalFold(order, knowledgeJoinAll, truthJoinAll));

/**
 * The two indexed universal operators, right-adjoint to their existential
 * counterparts: knowledge consensus versus truth-order conjunction
 * (for iff all specializations support; against iff any one denies).
 */
export const necessitateIn = (frame, valuation, order) =>
  modal(frame, valuation, extent, modalFold(order, knowledgeMeetAll, truthMeetAll));

/** Backward-compatible knowledge-order existential and universal. */
export const possibilize = (frame, valuation) => possibilizeIn(frame, valuation, "knowledge");
export const necessitate = (frame, valuation) => necessitateIn(frame, valuation, "knowledge");

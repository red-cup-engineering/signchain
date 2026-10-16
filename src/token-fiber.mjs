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
 * Possibilizing and necessitating are maps between fibers along the order (`Closure/Modal.lean`):
 * ◇v reads at t the knowledge join of v over t's generalizations, told of something t is; □v reads the
 * knowledge meet over t's extent, told of everything that is t. Specialization is reflexive and
 * transitive, an S4 frame, so ◇ is a closure, □ an interior, and ◇v ≤ₖ w exactly when v ≤ₖ □w.
 *
 * Gluing fibers into sections over covers is the layer above this one: SignGraph's token sheaf.
 */
import { address, cell, coincidenceKey, sidesOf } from "@red-cup-engineering/signcell/cell";
import { extent, generalizations } from "@red-cup-engineering/signcell/token-frame";
import { isReading, knowledgeJoinAll, knowledgeLeqReading, knowledgeMeetAll, readingAs, readingOfSides, truthLeqReading } from "@red-cup-engineering/computer-data-engineering-services-section/four";

const frozen = (values) => Object.freeze([...values]);
const claimKey = (predicate, object) => address(cell(null, predicate, object));

// A valuation's readings by token key, every frame token present; absent tokens read absurd.
function readingsOf(frame, valuation) {
  const known = new Set(frame.tokens.map(coincidenceKey));
  const readings = new Map();
  for (const { token, reading } of valuation) {
    if (!isReading(reading)) throw new TypeError(`signchain: a valuation reads FOUR, not ${JSON.stringify(reading)}`);
    const key = coincidenceKey(token);
    if (!known.has(key)) throw new TypeError(`signchain: ${JSON.stringify(token)} is not a token of this frame`);
    readings.set(key, readingAs("knowledge", reading));
  }
  return (token) => readings.get(coincidenceKey(token)) ?? "absurd";
}

const over = (frame, readingAt) => frozen(frame.tokens.map((token) => Object.freeze({ token, reading: readingAt(token) })));

/** The valuation of one claim (predicate, object): each frame token's FOUR reading of what is told
 *  directly of (token, predicate, object) in the frame's cells, in the frame's token order. */
export function valuationOf(frame, predicate, object) {
  const target = claimKey(predicate, object);
  const told = new Map();
  for (const at of frame.cells) if (claimKey(at.predicate, at.object) === target) told.set(coincidenceKey(at.subject), at);
  return over(frame, (token) => {
    const at = told.get(coincidenceKey(token));
    return at === undefined ? "absurd" : readingOfSides("knowledge", ...sidesOf(at));
  });
}

/** A FOUR operation taken pointwise over the frame: `operation` applied, token by token, to the
 *  readings of the given valuations (negation to one, a join, meet or implication to two). */
export function pointwise(frame, operation, ...valuations) {
  const reads = valuations.map((valuation) => readingsOf(frame, valuation));
  return over(frame, (token) => readingAs("knowledge", operation(...reads.map((read) => read(token)))));
}

const pointwiseLeq = (leq) => (frame, left, right) => {
  const [l, r] = [readingsOf(frame, left), readingsOf(frame, right)];
  return frame.tokens.every((token) => leq(l(token), r(token)));
};
/** The fiber's knowledge order: every token's reading below the other's in ≤k. */
export const knowledgeWithin = pointwiseLeq(knowledgeLeqReading);
/** The fiber's truth order: every token's reading below the other's in ≤t. */
export const truthWithin = pointwiseLeq(truthLeqReading);

const modal = (frame, valuation, coverOf, fold) => {
  const read = readingsOf(frame, valuation);
  return over(frame, (token) => fold(coverOf(frame, token).map(read), "knowledge"));
};

/** ◇: each token reads the knowledge join of the valuation over its generalizations (itself included). */
export const possibilize = (frame, valuation) => modal(frame, valuation, generalizations, knowledgeJoinAll);

/** □: each token reads the knowledge meet of the valuation over its extent (itself included). */
export const necessitate = (frame, valuation) => modal(frame, valuation, extent, knowledgeMeetAll);

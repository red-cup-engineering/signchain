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
import { claimCoordinate, coincidenceKey, sidesOf } from "@red-cup-engineering/signcell/cell";
import { admitTokenFrame, extent, generalizations, top } from "@red-cup-engineering/signcell/token-frame";
import { isReading, knowledgeJoinAll, knowledgeLeqReading, knowledgeMeetAll, readingAs, readingOfSides, truthJoinAll, truthJoinReading, truthLeqReading, truthMeetAll } from "@red-cup-engineering/metrologic/four";

const frozen = (values) => Object.freeze([...values]);

/**
 * A finite valuation is plain positional data, not an executable iterator or
 * getter-backed observation. Read own descriptors BEFORE evaluating terms.
 * Original SignCell coincidence and Computer Data FOUR remain the only
 * semantic admission, identification and lattice owners.
 *
 * This does not sandbox Proxy traps or authenticate who made a valuation.
 */
function inertFiberEntries(values, label) {
  if (!Array.isArray(values) || Object.getPrototypeOf(values) !== Array.prototype)
    throw new TypeError("signchain: " + label + " must be an ordinary finite data array");
  const descriptors = Object.getOwnPropertyDescriptors(values);
  if (Reflect.ownKeys(descriptors).length !== values.length + 1)
    throw new TypeError("signchain: " + label + " must not be a sparse or decorated array");
  const entries = [];
  for (let i = 0; i < values.length; i++) {
    const item = descriptors[String(i)];
    if (!item || !item.enumerable || !Object.hasOwn(item, "value"))
      throw new TypeError("signchain: " + label + " entries must be inert data, not accessors");
    const row = item.value;
    if (!row || typeof row !== "object" || Array.isArray(row) ||
        ![Object.prototype, null].includes(Object.getPrototypeOf(row)))
      throw new TypeError("signchain: " + label + " entries must be plain records");
    const fields = Object.getOwnPropertyDescriptors(row);
    const names = Reflect.ownKeys(fields);
    if (names.length !== 2 ||
        names.some(name => name !== "token" && name !== "reading"))
      throw new TypeError("signchain: " + label + " coordinates must be exactly token and reading");
    const token = fields.token, reading = fields.reading;
    if (!token || !reading || !token.enumerable || !reading.enumerable ||
        !Object.hasOwn(token, "value") || !Object.hasOwn(reading, "value"))
      throw new TypeError("signchain: " + label + " coordinates must be inert data, not accessors");
    entries.push(Object.freeze({ token: token.value, reading: reading.value }));
  }
  return Object.freeze(entries);
}

// The canonical predicate/object coordinate is owned upstream by SignCell.

// A valuation's readings by token key, every frame token present; absent tokens read absurd.
function readingsOf(tokens, valuation) {
  const known = new Set(tokens.map(coincidenceKey));
  const readings = new Map();
  for (const { token, reading } of inertFiberEntries(valuation, "valuation")) {
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
  // Admit ONE original source snapshot and use both its token order and its
  // canonical merged cells. Reading top(frame) before a second raw frame.cells
  // access could combine different wire revisions or execute a source getter.
  // Original SignCell owns all Cell coincidence, witness joins and topology.
  const source = admitTokenFrame(frame);
  const tokens = top(source);
  const target = claimCoordinate(predicate, object);
  const told = new Map();
  for (const at of source.cells) if (claimCoordinate(at.predicate, at.object) === target) told.set(coincidenceKey(at.subject), at);
  return over(tokens, (token) => {
    const at = told.get(coincidenceKey(token));
    return at === undefined ? "absurd" : readingOfSides("knowledge", ...sidesOf(at));
  });
}

/** A FOUR operation taken pointwise over the frame: `operation` applied, token by token, to the
 *  readings of the given valuations (negation to one, a join, meet or implication to two). */
export function pointwise(frame, operation, ...valuations) {
  const source = admitTokenFrame(frame);
  const tokens = top(source);
  const reads = valuations.map((valuation) => readingsOf(tokens, valuation));
  return over(tokens, (token) => readingAs("knowledge", operation(...reads.map((read) => read(token)))));
}

const pointwiseLeq = (leq) => (frame, left, right) => {
  const source = admitTokenFrame(frame);
  const tokens = top(source);
  const [l, r] = [readingsOf(tokens, left), readingsOf(tokens, right)];
  return tokens.every((token) => leq(l(token), r(token)));
};
/** The fiber's knowledge order: every token's reading below the other's in ≤k. */
export const knowledgeWithin = pointwiseLeq(knowledgeLeqReading);
/** The fiber's truth order: every token's reading below the other's in ≤t. */
export const truthWithin = pointwiseLeq(truthLeqReading);

const modal = (frame, valuation, coverOf, fold) => {
  // Order and covers must be one admitted source cut. Consulting a mutable
  // transported frame afresh for each token could mix incompatible revisions.
  const source = admitTokenFrame(frame);
  const tokens = top(source);
  const read = readingsOf(tokens, valuation);
  return over(tokens, (token) => fold(coverOf(source, token).map(read), "knowledge"));
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

/**
 * A total FOUR^T truth-order pole, not an inference from absent testimony.
 * Require one lawful reading for every original SignCell frame token; distinct
 * spellings with the same canonical source term cannot appear twice.
 * Uses SignCell's original token/coincidence owners, not a new frame or hash.
 */
function completeTruthPole(frame, declared) {
  const tokens = top(frame);
  const entries = inertFiberEntries(declared, "truth pole");
  if (entries.length !== tokens.length)
    throw new TypeError("signchain: truth pole must explicitly cover every original frame token");
  const allowed = new Set(tokens.map(coincidenceKey)), byToken = new Map();
  for (const entry of entries) {
    const key = coincidenceKey(entry.token);
    if (!allowed.has(key) || byToken.has(key) || !isReading(entry.reading))
      throw new TypeError("signchain: truth pole has foreign, repeated or invalid FOUR testimony");
    byToken.set(key, readingAs("knowledge", entry.reading));
  }
  return over(tokens, token => byToken.get(coincidenceKey(token)));
}

/**
 * Exact finite nucleus j_s(v) = s ∨_truth v, lifted pointwise from the
 * original Computer Data FOUR operation and the original SignCell token frame.
 * Any fully specified pole supplies a truth-order inflationary, monotone,
 * idempotent meet-preserving closure. Neither a pole nor its result confers
 * source testimony, closure ordinals, execution rights or the generated
 * Obsmetrologia sigma/Delta settlement regime.
 */
export function truthPoleClosure(frame, pole, valuation) {
  const source = admitTokenFrame(frame);
  return pointwise(source, truthJoinReading, completeTruthPole(source, pole), valuation);
}

/**
 * Four finite readings of one original fiber valuation under two commuting
 * truth-order nuclei. The native theorem is j_a j_b = j_b j_a and the
 * common-fixed layer is Fix(j_a) ∩ Fix(j_b), not an asserted physical regime.
 * The poles are explicit caller-qualified mathematical parameters.
 */
export function truthNuclearQuartet(frame, firstPole, secondPole, valuation) {
  // Both nuclei, their source and all four readings live in one source frame.
  // The label "source" below is the original valuation, NOT a new frame.
  const originalFrame = admitTokenFrame(frame);
  const a = completeTruthPole(originalFrame, firstPole);
  const b = completeTruthPole(originalFrame, secondPole);
  const source = pointwise(originalFrame, x => x, valuation);
  const first = pointwise(originalFrame, truthJoinReading, a, source);
  const second = pointwise(originalFrame, truthJoinReading, b, source);
  const both = pointwise(originalFrame, truthJoinReading, a, second);
  return Object.freeze({
    kind: "signchain.finite-truth-nuclear-quartet.v1",
    poles: Object.freeze([a, b]), source, first, second, both,
    qualification: "abstract-finite-truth-fiber-not-source-generated-settlement",
  });
}

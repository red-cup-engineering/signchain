/**
 * SignChain — the evidence bilattice over SignCell's cells.
 *
 * A cell's evidence is a pair (F, A): the witnesses told for it and against
 * it. Its value is a point of FOUR (Belnap 1977; Ginsberg 1988), ordered two
 * ways — knowledge (how much is told) and truth (which way it leans) — with
 * negation swapping the sides. This is Obsmetrologia's Valued (Evidence.lean):
 *
 *   - every operation is lossless on evidence: joinK, meetK, joinT and meetT
 *     all union both sides, whatever they do to the value
 *     (evidence_accumulates_joinK and its mates);
 *   - the value is the four-point operation on the operands' values. The
 *     knowledge join of Measured tellings is Measured (joinK_measured); a meet
 *     can fall below what its witnesses show — "absurd reached, witnesses
 *     kept" (meetK_not_measured) — and the cell then writes its value;
 *   - negation swaps value and sides together and stays Measured
 *     (negate_measured); conflation moves the value alone; presumption raises a
 *     side no witness told without manufacturing a witness, the one
 *     sanctioned breach of Measured (presumeFree).
 *
 * The witness sets are ordered too (knowledgeLeq, truthLeq): inclusion of what
 * has been told, the order evidence grows in.
 */
import { cell, cellSet, coincidenceKey, evidence, evidenced, hasTriple, isCell, admitCell, sameCell, valueOf, measured, knowledgeReading, truthReading } from "@red-cup-engineering/signcell/cell";
import { knowledgeLeqReading, truthLeqReading, conflateReading, knowledgeJoinAll, readingSchema, knowledgeJoinReading, knowledgeMeetReading, knowledgeTop, negateReading, readingOfSides, samePoint, sidesOfReading, truthJoinReading, truthMeetReading } from "@red-cup-engineering/computer-data-engineering-services-section/four";


// — the bilattice on cells: values combined, evidence accumulated —

const includes = (small, large) => { const has = new Set(large.map(coincidenceKey)); return small.every((w) => has.has(coincidenceKey(w))); };

const sameShape = (left, right) => {
  if (hasTriple(left) !== hasTriple(right)) throw new TypeError("signchain: a cell combines only with a cell, a bare evidence pair only with a pair");
  if (hasTriple(left) && !sameCell(left, right)) throw new TypeError("signchain: evidence of different cells does not combine");
};

/** Rebuild `like` (a cell or a bare pair) with new sides and value. */
const shaped = (like, sides) => hasTriple(like) ? cell(like.subject, like.predicate, like.object, sides) : evidence(sides);

/** Combine two tellings: their values by `operation`, their evidence unioned on both sides. */
const combined = (operation) => (left, right) => {
  sameShape(left, right);
  return shaped(left, { for: [...left.for, ...right.for], against: [...left.against, ...right.against], value: operation(valueOf(left), valueOf(right)) });
};

/** Knowledge join (Valued.joinK): everything either telling told (on cells, SignCell's merge). */
export const knowledgeJoin = combined(knowledgeJoinReading);
/** Knowledge meet (Valued.meetK): the value both tellings share, every witness of either kept. */
export const knowledgeMeet = combined(knowledgeMeetReading);
/** Truth join (Valued.joinT): the value leaning truer, every witness kept. */
export const truthJoin = combined(truthJoinReading);
/** Truth meet (Valued.meetT): the conjunction of the values, every witness kept. */
export const truthMeet = combined(truthMeetReading);

/** Negation (Valued.negate): the same cell (or bare pair) with its sides and its value's poles swapped
 *  together — a witness for is a witness against the negation. Antitone in truth, monotone in knowledge,
 *  involutive, and Measured when its operand is; also the linear negation (the residuum into the
 *  multiplicative unit told-both). */
export const negate = (value) => shaped(value, { for: value.against, against: value.for, value: negateReading(valueOf(value)) });

/** Conflation (Valued.conflate): the value's knowledge negation, the evidence untouched. It may raise the
 *  value above what the evidence shows. */
export const conflate = (value) => shaped(value, { for: value.for, against: value.against, value: conflateReading(valueOf(value)) });

/** Presumption (Valued.presumeFree): every side no witness has told raised to told, no witness made for
 *  it — the one sanctioned breach of Measured. A side the value already tells stays told. */
export function presumeFree(value) {
  const [forTold, againstTold] = sidesOfReading(valueOf(value));
  return shaped(value, { for: value.for, against: value.against, value: readingOfSides("knowledge", forTold || value.for.length === 0, againstTold || value.against.length === 0) });
}

/** A list of cells with each cell told more than once folded into one by a lattice operation on its
 *  value (knowledgeJoin, the default; knowledgeMeet what every telling shares; truthJoin and truthMeet
 *  the truth order's). Every witness of every telling is kept whichever operation folds. */
export const foldCells = (cells, operation = knowledgeJoin) => cellSet(cells, (left, right) => evidenced(left, operation(left, right)));

/** Whether `left`'s evidence is no more than `right`'s, side by side. */
export function knowledgeLeq(left, right) {
  sameShape(left, right);
  return includes(left.for, right.for) && includes(left.against, right.against);
}

/** Whether `left`'s evidence leans no more true than `right`'s: no more for, no less against. */
export function truthLeq(left, right) {
  sameShape(left, right);
  return includes(left.for, right.for) && includes(right.against, left.against);
}

/** The evidence that tells a reading's sides, each told side witnessed by `witness` — the least evidence
 *  a single witness can give that reads as `name` (knowledgeReading inverts it). */
export function witnessedReading(name, witness) {
  const [forTold, againstTold] = sidesOfReading(name);
  return evidence({ for: forTold ? [witness] : [], against: againstTold ? [witness] : [] });
}

/** Bare evidence pairs: nothing told, one witness for, one witness against. */
export const noEvidence = evidence();
export const witnessedFor = (witness) => evidence({ for: [witness] });
export const witnessedAgainst = (witness) => evidence({ against: [witness] });

/** The JSON Schema of a bare evidence pair. */
export const evidenceSchema = Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://schemas.561.group/signchain/evidence.schema.json",
  title: "Evidence", description: "The witnesses told for and against, each side a set, and the value when it is not what the witnesses show.",
  type: "object", required: ["for", "against"],
  properties: { for: { type: "array", uniqueItems: true }, against: { type: "array", uniqueItems: true }, value: readingSchema("knowledge") },
  additionalProperties: false,
});

/** Settle named judgments ({ value: reading, ... }) at their knowledge join, keeping every judgment and
 *  separately the ones that are themselves told both ways (a held contradiction is retained, not folded). */
export function settleJudgments(judgments) {
  const records = Object.freeze([...judgments]);
  return Object.freeze({
    kind: "signchain.judgment-settlement",
    value: knowledgeJoinAll(records.map((judgment) => judgment.value)),
    judgments: records,
    stableJudgments: Object.freeze(records.filter((judgment) => samePoint(judgment.value, knowledgeTop()))),
  });
}



/**
 * An epistemic (knowledge/truth) adjudication of ORIGINAL SignCell evidence.
 *
 * Distinguishes the evidence actually told for or against a predication cell
 * from any written value of that cell. Knowledge and truth are two ORDERS over
 * the SAME generated FOUR, not two independent primitive epistemic substances
 * and not two nuclei of one order. An identification needs a source-proved
 * equivalence relation before Quot.sound may transport it; witness polarity,
 * byte coincidence, majority, a positive settled value or a semantic-judgment
 * label alone never grants that relation proof.
 *
 * No hidden logical exhaustion/ordinal is inferred from a four-valued state:
 * this is a finite per-cell reading. Transfinite closure requires its own
 * ordinal/cofinality and limit-stage transport, not a package label.
 */
export function adjudicateCellEvidence(original) {
  if(!isCell(original))
    throw new TypeError("SignChain adjudication requires one original SignCell cell with separately retained evidence sides");
  const source=admitCell(original);
  const positive=source.for.length>0,negative=source.against.length>0;
  const posture=positive
    ?negative?"contested":"supported-unopposed"
    :negative?"opposed-unopposed":"unobserved";
  return Object.freeze({
    kind:"signchain.cellEvidenceAdjudication.v1",
    source,
    evidence:Object.freeze({
      positiveWitnesses:source.for,
      negativeWitnesses:source.against,
      knowledge:readingOfSides("knowledge",positive,negative),
      truth:readingOfSides("truth",positive,negative),
      posture,
    }),
    value:Object.freeze({
      knowledge:knowledgeReading(source),
      truth:truthReading(source),
      measured:measured(source),
    }),
    identification:Object.freeze({
      proposition:"source testimony about a candidate identification, not a proved equivalence relation",
      eligibleForRelationProof:posture==="supported-unopposed"&&measured(source),
      quotientAdmitted:false,
      requires:"an independently established source equivalence relation and relation proof, plus competent effects authority",
    }),
    regime:"finite-reading-only",
  });
}


/**
 * Two different orders on the SAME native finite SignCell evidence.
 *
 * A knowledge-inflationary source transition can move down in the truth
 * order when genuine against-evidence is newly received. This is a
 * concrete finite obstruction to identifying the knowledge closure with
 * the truth closure and is an appropriate local input to the future
 * transfinite proof, not itself an ordinal/cofinality witness.
 */
export function adjudicateEvidenceTransition(before,after) {
  if(!isCell(before)||!isCell(after)||!sameCell(before,after))
    throw new TypeError("SignChain transition requires two native evidence states of the same original cell");
  const source=adjudicateCellEvidence(before);
  const target=adjudicateCellEvidence(after);
  const knowledgeEvidenceLeq=knowledgeLeq(before,after);
  const truthEvidenceLeq=truthLeq(before,after);
  const knowledgeValueLeq=knowledgeLeqReading(source.value.knowledge,target.value.knowledge);
  const truthValueLeq=truthLeqReading(source.value.knowledge,target.value.knowledge);
  return Object.freeze({
    kind:"signchain.adjudicatedEvidenceTransition.v1",
    source,target,
    witnessOrders:Object.freeze({
      knowledgeNondecreasing:knowledgeEvidenceLeq,
      truthNondecreasing:truthEvidenceLeq,
    }),
    valueOrders:Object.freeze({
      knowledgeNondecreasing:knowledgeValueLeq,
      truthNondecreasing:truthValueLeq,
    }),
    distinction:knowledgeEvidenceLeq&&!truthEvidenceLeq
      ?"knowledge-ascent-without-truth-ascent":"order-directions-are-separately-measured",
    closureRegime:"not inferred from one finite evidence transition",
    noQuotientAdmission:true,
  });
}

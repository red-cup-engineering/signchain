/**
 * Source/producer withdrawal over an actual, fixed SignChain telling history.
 *
 * Original witnesses stay in the source log. Attribution is an independently
 * supplied *hypothesis* about source origins, never inferred from URLs or
 * admitted as a SignCell witness merely by being supplied here.
 *
 * This is a finite restriction on evidence at ONE original cell, read in
 * Obsmetrologia's separately ordered knowledge/truth FOUR fiber. It is not
 * a retraction, proven source independence, truth adjudication or quotient.
 */
import { cell, address, coincidenceKey, isCell, measured, semanticId } from "@red-cup-engineering/signcell/cell";
import { TellingLog } from "./log.mjs";
import { adjudicateCellEvidence, knowledgeLeq, truthLeq } from "./bilattice.mjs";
import { sourceField } from "./telling-source.mjs";

const LIMIT = 5000;
const cmp = (a,b) => a < b ? -1 : a > b ? 1 : 0;
function requireEvidence(condition, message) {
  if (!condition) throw new TypeError("signchain original-source withdrawal: " + message);
}
function reading(state) {
  const j=adjudicateCellEvidence(state);
  return Object.freeze({
    knowledge:j.evidence.knowledge,
    truth:j.evidence.truth,
    posture:j.evidence.posture,
    positiveWitnesses:j.evidence.positiveWitnesses.length,
    negativeWitnesses:j.evidence.negativeWitnesses.length,
    measured:j.value.measured,
  });
}
/**
 * @param {TellingLog} history A SEALED original observed testimony history.
 * @param {{proposition: SignCell, attributions: Array<{witness: any, originalProducer: string}>}} input
 * Attribution is required for EVERY distinct witness on the selected cell.
 * Identical original witness identities in the two polarities share one
 * attribution. Unmatched, extra and conflicting attribution records refuse.
 *
 * @returns a deterministic conditional leave-one-producer-out sensitivity
 * report, with source NI witness identities and knowledge/truth separately.
 */
export function assessOriginalSourceWithdrawal(history, {proposition,attributions}={}) {
  requireEvidence(history instanceof TellingLog && history.sealed,
    "requires one sealed original SignChain TellingLog");
  requireEvidence(isCell(proposition) && measured(proposition) &&
    proposition.for.length===0 && proposition.against.length===0,
    "requires an original unevidenced SignCell proposition coordinate");
  requireEvidence(Array.isArray(attributions) && attributions.length<=LIMIT,
    "requires bounded explicit original-producer attributions");

  // Read original history through the indexed source operations, NOT a second
  // independent parser of source rows or re-created predicate identity.
  const positive=history.where(proposition).map(row=>row.witness);
  const negative=history.against(proposition).map(row=>row.witness);
  requireEvidence(positive.length+negative.length<=LIMIT,
    "original proposition has too many tellings for a bounded sensitivity assay");
  const originalCell=history.cells(proposition)[0] ??
    cell(proposition.subject,proposition.predicate,proposition.object);
  const original=reading(originalCell);
  requireEvidence(original.knowledge===history.readingAt(proposition),
    "original log and SignCell/FOUR reading disagree");

  const observed=new Map();
  for(const [side,values] of [["for",positive],["against",negative]]) {
    for(const witness of values) {
      const key=coincidenceKey(witness);
      const record=observed.get(key) ?? {witness, sides:new Set()};
      record.sides.add(side);
      observed.set(key,record);
    }
  }
  const claimed=new Map();
  for(const entry of attributions) {
    const witness=sourceField(entry,"witness");
    const producer=sourceField(entry,"originalProducer");
    requireEvidence(typeof producer==="string" &&
      producer.trim()!=="" && producer.length<=256,
      "original producer is a bounded, nonempty supplied identifier");
    const key=coincidenceKey(witness);
    requireEvidence(observed.has(key),
      "attribution claims a witness not found in the original selected cell");
    requireEvidence(!claimed.has(key),
      "one original witness cannot be multiply attributed or relabeled");
    claimed.set(key,producer);
  }
  requireEvidence(claimed.size===observed.size,
    "missing original-producer attribution for a witnessed source");
  const origins=[...new Set(claimed.values())].sort(cmp);
  requireEvidence(origins.length<=LIMIT,
    "too many original-producer assignments");
  const remove=(xs,origin)=>xs.filter(w=>claimed.get(coincidenceKey(w))!==origin);
  const withdrawals=origins.map(originalProducer=>{
    const retained=cell(proposition.subject,proposition.predicate,proposition.object,{
      for:remove(positive,originalProducer), against:remove(negative,originalProducer),
    });
    const after=reading(retained);
    return Object.freeze({
      originalProducer,
      removedWitnessAddresses:[...observed].filter(([k])=>claimed.get(k)===originalProducer)
        .map(([,v])=>semanticId(v.witness)).sort(cmp),
      remaining:after,
      originalKnowledgeAboveRestricted:knowledgeLeq(retained,originalCell),
      restrictedTruthBelowOriginal:truthLeq(retained,originalCell),
      originalTruthBelowRestricted:truthLeq(originalCell,retained),
      intervention:"counterfactual-withholding-not-an-observed-source-retraction",
    });
  });
  return Object.freeze({
    type:"signchain.originalSourceWithdrawal.v1",
    propositionAddress:address(originalCell),
    original:original,
    distinctWitnesses:observed.size,
    attributedProducerCount:origins.length,
    attributedProducers:origins,
    withdrawals,
    // Universal quantification is over the supplied COMPLETE attribution partition,
    // not a certificate of independent, authentic or independently located sources.
    // Zero-producer cases are explicitly unknown, not vacuous corroboration.
    sourceRemovalSupport:{
      evaluatedProducerCount:origins.length,
      supportSurvivesEverySingleProducerRemoval:origins.length===0 ? null :
        withdrawals.every(w=>w.remaining.positiveWitnesses>0),
      oppositionSurvivesEverySingleProducerRemoval:origins.length===0 ? null :
        withdrawals.every(w=>w.remaining.negativeWitnesses>0),
      standing:"conditional on the supplied original-producer partition, not an independent-source certificate",
    },
    epistemicStanding:"conditional finite FOUR evidence restriction over source-declared origin partitions",
    boundaries:Object.freeze([
      "original source and institution identity must be independently verified",
      "document count is not original-producer independence",
      "no source is actually withdrawn and no historical witness is deleted",
      "no truth, research release, source rights, work authority or settlement follows",
    ]),
  });
}

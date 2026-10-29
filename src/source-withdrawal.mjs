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


/**
 * Compare two sealed, original SignChain evidence histories at explicitly
 * nominated SignCell propositions. The caller supplies the two snapshots;
 * their temporal order and the authenticity of their witnesses are NOT proved
 * by this function. This is a read projection, never a second provenance log.
 *
 * A change of original source witnesses requires downstream research review
 * even when the FOUR reading remains exactly the same. Repeated tellings of
 * one witnessed identity are not independent corroboration. The ordinary
 * SignCell coincidence/semantic identities, not JSON serialization, own the
 * witness relation. No permission or task transition is made here.
 */
export function compareOriginalEvidenceSnapshots(previous, current, input = {}) {
  requireEvidence(previous instanceof TellingLog && previous.sealed &&
    current instanceof TellingLog && current.sealed,
    "requires two sealed original SignChain TellingLogs");
  const propositions = sourceField(input, "propositions");
  requireEvidence(Array.isArray(propositions) &&
    Object.getPrototypeOf(propositions) === Array.prototype &&
    propositions.length <= 128,
    "requires at most 128 explicitly nominated proposition coordinates");
  const seen = new Set();
  let inspectedTellings = 0;
  const changes = [];
  const witnessMap = (history, proposition, side) => {
    const rows = side === "for" ? history.where(proposition) : history.against(proposition);
    inspectedTellings += rows.length;
    requireEvidence(inspectedTellings <= 20000,
      "evidence comparison exceeds the 20000-telling read budget");
    const result = new Map();
    for (const row of rows) {
      const key = coincidenceKey(row.witness);
      if (!result.has(key)) result.set(key, semanticId(row.witness));
    }
    return result;
  };
  const delta = (before, after) => Object.freeze({
    added: Object.freeze([...after].filter(([key]) => !before.has(key))
      .map(([, id]) => id).sort(cmp)),
    removed: Object.freeze([...before].filter(([key]) => !after.has(key))
      .map(([, id]) => id).sort(cmp)),
  });
  for (let index = 0; index < propositions.length; index++) {
    const slot = Object.getOwnPropertyDescriptor(propositions, String(index));
    requireEvidence(slot && slot.enumerable && Object.hasOwn(slot, "value"),
      "proposition coordinates must be dense inert array entries");
    const proposition = slot.value;
    requireEvidence(isCell(proposition) && measured(proposition) &&
      proposition.for.length === 0 && proposition.against.length === 0,
      "requires original unevidenced SignCell proposition coordinates");
    const propositionAddress = address(proposition);
    requireEvidence(!seen.has(propositionAddress),
      "the same original proposition cannot be compared twice");
    seen.add(propositionAddress);
    const before = previous.cells(proposition)[0] ??
      cell(proposition.subject, proposition.predicate, proposition.object);
    const after = current.cells(proposition)[0] ??
      cell(proposition.subject, proposition.predicate, proposition.object);
    const original = reading(before), revised = reading(after);
    requireEvidence(original.knowledge === previous.readingAt(proposition) &&
      revised.knowledge === current.readingAt(proposition),
      "original log and SignCell/FOUR readings disagree");
    const forWitnessChanges = delta(
      witnessMap(previous, proposition, "for"),
      witnessMap(current, proposition, "for"));
    const againstWitnessChanges = delta(
      witnessMap(previous, proposition, "against"),
      witnessMap(current, proposition, "against"));
    const witnessesChanged = [forWitnessChanges, againstWitnessChanges]
      .some(x => x.added.length > 0 || x.removed.length > 0);
    const readingChanged = original.knowledge !== revised.knowledge ||
      original.truth !== revised.truth || original.posture !== revised.posture;
    changes.push(Object.freeze({
      propositionAddress, original, revised, forWitnessChanges,
      againstWitnessChanges, witnessesChanged, readingChanged,
      requiresReverification: witnessesChanged,
      evidenceOrders: Object.freeze({
        knowledgeNondecreasing: knowledgeLeq(before, after),
        knowledgeNonincreasing: knowledgeLeq(after, before),
        truthNondecreasing: truthLeq(before, after),
        truthNonincreasing: truthLeq(after, before),
      }),
    }));
  }
  return Object.freeze({
    type: "signchain.originalEvidenceSnapshotComparison.v1",
    monitoredPropositionCount: changes.length,
    inspectedTellings,
    changedPropositionAddresses: Object.freeze(changes
      .filter(x => x.requiresReverification).map(x => x.propositionAddress)),
    readingChangedCount: changes.filter(x => x.readingChanged).length,
    witnessChangedReadingUnchangedCount: changes
      .filter(x => x.witnessesChanged && !x.readingChanged).length,
    comparisons: Object.freeze(changes),
    standing: "conditional read comparison of caller-supplied sealed original histories",
    boundaries: Object.freeze([
      "snapshot order, provenance authenticity and source rights are not established",
      "identical FOUR readings do not mean the original evidence is unchanged",
      "only explicitly nominated propositions are inspected; dependent claims require original SignGraph or Work owners",
      "this read projection neither withdraws sources nor schedules revalidation or settles Work",
    ]),
  });
}

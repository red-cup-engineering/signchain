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
export function assessOriginalSourceWithdrawal(history, input={}) {
  requireEvidence(history instanceof TellingLog && history.sealed,
    "requires one sealed original SignChain TellingLog");
  // Original outer source-field guards must run before a getter-backed
  // options envelope can fabricate coordinates or a source partition.
  const proposition=sourceField(input,"proposition");
  const attributions=sourceField(input,"attributions");
  requireEvidence(isCell(proposition) && measured(proposition) &&
    proposition.for.length===0 && proposition.against.length===0,
    "requires an original unevidenced SignCell proposition coordinate");
  requireEvidence(Array.isArray(attributions) &&
    Object.getPrototypeOf(attributions)===Array.prototype &&
    attributions.length<=LIMIT,
    "requires bounded explicit original-producer attributions");
  const attributionSlots=Object.getOwnPropertyDescriptors(attributions);
  requireEvidence(Reflect.ownKeys(attributionSlots).length===attributions.length+1 &&
    Array.from({length:attributions.length},(_,i)=>attributionSlots[String(i)])
      .every(slot=>slot && slot.enumerable && Object.hasOwn(slot,"value")),
    "original-producer attributions must be a dense undecorated inert array");

  // The existing smallest-bucket source index enforces the FULL budget
  // BEFORE materializing rows. The former where/against/cells/readingAt
  // path checked its 5,000 limit only AFTER unbounded row projection.
  // This is a conservative candidate-row cap: many irrelevant rows in a
  // narrow bucket can cause a valid refusal rather than a time/byte bound.
  const selected=TellingLog.prototype.boundedAt.call(history,proposition,LIMIT);
  const positive=selected.for.map(row=>row.witness);
  const negative=selected.against.map(row=>row.witness);
  // Build the exact ORIGINAL SignCell/FOUR reading from those original
  // indexed rows; no second verdict algebra or unbounded log reader.
  const originalCell=cell(proposition.subject,proposition.predicate,proposition.object,{
    for:positive,against:negative,
  });
  const original=reading(originalCell);

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
 * A change of original source witnesses OR the associated observedAt clock
 * testimony requires downstream research review even when the FOUR reading
 * remains exactly the same. Repeated tellings of
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
  // A coordinate family is finite source DATA, not an arbitrary iterator or
  // a carrier for concealed authorities. Reject decorated/sparse/accessor
  // arrays BEFORE the original indexed histories are touched.
  const propositionSlots = Object.getOwnPropertyDescriptors(propositions);
  requireEvidence(Reflect.ownKeys(propositionSlots).length === propositions.length + 1,
    "proposition coordinates must be a dense undecorated inert array");
  for (let index = 0; index < propositions.length; index++) {
    const slot = propositionSlots[String(index)];
    requireEvidence(slot && slot.enumerable && Object.hasOwn(slot, "value"),
      "proposition coordinates must be dense inert array entries");
  }
  const seen = new Set();
  let inspectedTellings = 0, inspectedCandidates = 0;
  const changes = [];
  // These are already bounded ORIGINAL rows returned by TellingLog.boundedAt,
  // not a second interpretation of raw SEAVT records or an unbounded log query.
  const evidenceMap = (rows) => {
    const witnesses = new Map(), observations = new Map();
    for (const row of rows) {
      const witnessKey = coincidenceKey(row.witness);
      const witnessAddress = semanticId(row.witness);
      if (!witnesses.has(witnessKey)) witnesses.set(witnessKey, witnessAddress);
      // An original witness and its observed reception are different
      // coordinates. A timestamp correction need not change the FOUR value.
      // The typed tag separates absent clocks from explicitly present null.
      const clockPresent = Object.hasOwn(row, "observedAt");
      const observationKey = coincidenceKey([
        row.witness, clockPresent ? ["present", row.observedAt] : ["absent"],
      ]);
      if (!observations.has(observationKey)) observations.set(
        observationKey, Object.freeze({
          witnessAddress,
          observedAtPresent: clockPresent,
          observedAt: clockPresent ? row.observedAt : null,
        }));
    }
    return { witnesses, observations };
  };
  const delta = (before, after) => Object.freeze({
    added: Object.freeze([...after].filter(([key]) => !before.has(key))
      .map(([, id]) => id).sort(cmp)),
    removed: Object.freeze([...before].filter(([key]) => !after.has(key))
      .map(([, id]) => id).sort(cmp)),
  });
  const observationDelta = (before, after) => Object.freeze({
    added: Object.freeze([...after].filter(([key]) => !before.has(key))
      .sort(([a], [b]) => cmp(a, b)).map(([, value]) => value)),
    removed: Object.freeze([...before].filter(([key]) => !after.has(key))
      .sort(([a], [b]) => cmp(a, b)).map(([, value]) => value)),
  });
  for (let index = 0; index < propositions.length; index++) {
    const proposition = propositionSlots[String(index)].value;
    requireEvidence(isCell(proposition) && measured(proposition) &&
      proposition.for.length === 0 && proposition.against.length === 0,
      "requires original unevidenced SignCell proposition coordinates");
    const propositionAddress = address(proposition);
    requireEvidence(!seen.has(propositionAddress),
      "the same original proposition cannot be compared twice");
    seen.add(propositionAddress);
    // Original role-index bucket sizes are checked BEFORE a matched-row
    // array is constructed. Both snapshots share the same 20k candidate
    // visit/row-allocation budget, even across 128 nominated propositions.
    const priorRows = TellingLog.prototype.boundedAt.call(
      previous, proposition, 20000 - inspectedCandidates);
    inspectedCandidates += priorRows.candidatesInspected;
    const laterRows = TellingLog.prototype.boundedAt.call(
      current, proposition, 20000 - inspectedCandidates);
    inspectedCandidates += laterRows.candidatesInspected;
    inspectedTellings += priorRows.matchedTellings + laterRows.matchedTellings;
    const priorFor = evidenceMap(priorRows.for), laterFor = evidenceMap(laterRows.for);
    const priorAgainst = evidenceMap(priorRows.against), laterAgainst = evidenceMap(laterRows.against);
    // Rebuild the measured proposition from the original bounded testimony.
    // Native SignCell still owns witness coincidence, canonicalization and
    // the FOUR evidence reading. Never call unbounded cells/readingAt here.
    const fromRows = rows => cell(proposition.subject, proposition.predicate, proposition.object, {
      for: rows.for.map(row => row.witness),
      against: rows.against.map(row => row.witness),
    });
    const before = fromRows(priorRows), after = fromRows(laterRows);
    const original = reading(before), revised = reading(after);
    requireEvidence(original.positiveWitnesses === priorFor.witnesses.size &&
      original.negativeWitnesses === priorAgainst.witnesses.size &&
      revised.positiveWitnesses === laterFor.witnesses.size &&
      revised.negativeWitnesses === laterAgainst.witnesses.size,
      "bounded source rows and SignCell/FOUR evidence reading disagree");
    const forWitnessChanges = delta(priorFor.witnesses, laterFor.witnesses);
    const againstWitnessChanges = delta(priorAgainst.witnesses, laterAgainst.witnesses);
    const forObservationChanges = observationDelta(priorFor.observations, laterFor.observations);
    const againstObservationChanges = observationDelta(priorAgainst.observations, laterAgainst.observations);
    const witnessesChanged = [forWitnessChanges, againstWitnessChanges]
      .some(x => x.added.length > 0 || x.removed.length > 0);
    const observationsChanged = [forObservationChanges, againstObservationChanges]
      .some(x => x.added.length > 0 || x.removed.length > 0);
    const readingChanged = original.knowledge !== revised.knowledge ||
      original.truth !== revised.truth || original.posture !== revised.posture;
    changes.push(Object.freeze({
      propositionAddress, original, revised, forWitnessChanges,
      againstWitnessChanges, forObservationChanges, againstObservationChanges,
      witnessesChanged, observationsChanged, readingChanged,
      requiresReverification: witnessesChanged || observationsChanged,
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
    inspectedCandidates,
    changedPropositionAddresses: Object.freeze(changes
      .filter(x => x.requiresReverification).map(x => x.propositionAddress)),
    readingChangedCount: changes.filter(x => x.readingChanged).length,
    witnessChangedReadingUnchangedCount: changes
      .filter(x => x.witnessesChanged && !x.readingChanged).length,
    observationChangedWitnessesUnchangedCount: changes
      .filter(x => x.observationsChanged && !x.witnessesChanged).length,
    comparisons: Object.freeze(changes),
    standing: "conditional read comparison of caller-supplied sealed original histories",
    boundaries: Object.freeze([
      "snapshot order, provenance authenticity and source rights are not established",
      "identical FOUR readings do not mean original witnesses or observed receipt clocks are unchanged",
      "observedAt is caller-supplied source testimony, not independent evidence of when a source became public",
      "only explicitly nominated propositions are inspected; dependent claims require original SignGraph or Work owners",
      "the 20000 candidate-row bound conservatively refuses large index buckets, even when few rows match all three terms; it does not bound opaque witness byte sizes",
      "this read projection neither withdraws sources nor schedules revalidation or settles Work",
    ]),
  });
}

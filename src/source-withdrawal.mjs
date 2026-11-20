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
import { cell, address, isCell, measured } from "@red-cup-engineering/signcell";
import { exactCarrier, exactIdentity, readSourceArray } from "@red-cup-engineering/semiotic-content-address-system";
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
  const proposition=sourceField(input,"proposition");
  const attributions=readSourceArray(sourceField(input,"attributions"), "original-producer attributions", LIMIT);
  requireEvidence(isCell(proposition) && measured(proposition) &&
    proposition.for.length===0 && proposition.against.length===0,
    "requires an original unevidenced SignCell proposition coordinate");
  const selected=TellingLog.prototype.boundedAt.call(history,proposition,LIMIT);
  const positive=selected.for.map(row=>row.witness);
  const negative=selected.against.map(row=>row.witness);
  const originalCell=cell(proposition.subject,proposition.predicate,proposition.object,{
    for:positive,against:negative,
  });
  const original=reading(originalCell);

  const observed=new Set([...positive,...negative].map(exactIdentity));
  const claimed=new Map();
  for(const entry of attributions) {
    const witness=sourceField(entry,"witness");
    const producer=sourceField(entry,"originalProducer");
    requireEvidence(typeof producer==="string" &&
      producer.trim()!=="" && producer.length<=256,
      "original producer is a bounded, nonempty supplied identifier");
    const key=exactIdentity(exactCarrier(witness));
    requireEvidence(observed.has(key),
      "attribution claims a witness not found in the original selected cell");
    requireEvidence(!claimed.has(key),
      "one original witness cannot be multiply attributed or relabeled");
    claimed.set(key,producer);
  }
  requireEvidence(claimed.size===observed.size,
    "missing original-producer attribution for a witnessed source");
  const origins=Object.freeze([...new Set(claimed.values())].sort(cmp));
  requireEvidence(origins.length<=LIMIT,
    "too many original-producer assignments");
  const remove=(xs,origin)=>xs.filter(w=>claimed.get(exactIdentity(w))!==origin);
  const withdrawals=Object.freeze(origins.map(originalProducer=>{
    const retained=cell(proposition.subject,proposition.predicate,proposition.object,{
      for:remove(positive,originalProducer), against:remove(negative,originalProducer),
    });
    const after=reading(retained);
    return Object.freeze({
      originalProducer,
      removedWitnessAddresses:Object.freeze([...observed]
        .filter(id=>claimed.get(id)===originalProducer).sort(cmp)),
      remaining:after,
      originalKnowledgeAboveRestricted:knowledgeLeq(retained,originalCell),
      restrictedTruthBelowOriginal:truthLeq(retained,originalCell),
      originalTruthBelowRestricted:truthLeq(originalCell,retained),
      intervention:"counterfactual-withholding-not-an-observed-source-retraction",
    });
  }));
  return Object.freeze({
    type:"signchain.originalSourceWithdrawal.v1",
    propositionAddress:address(originalCell),
    original:original,
    distinctWitnesses:observed.size,
    attributedProducerCount:origins.length,
    attributedProducers:origins,
    withdrawals,
    /** Quantify over the supplied attribution partition. Zero producers give an unknown result. */
    sourceRemovalSupport:Object.freeze({
      evaluatedProducerCount:origins.length,
      supportSurvivesEverySingleProducerRemoval:origins.length===0 ? null :
        withdrawals.every(w=>w.remaining.positiveWitnesses>0),
      oppositionSurvivesEverySingleProducerRemoval:origins.length===0 ? null :
        withdrawals.every(w=>w.remaining.negativeWitnesses>0),
      standing:"conditional on the supplied original-producer partition, not an independent-source certificate",
    }),
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
 * remains exactly the same. An exact evidence address identifies a witness
 * across repeated tellings. A separate address binds any reception clock.
 */
export function compareOriginalEvidenceSnapshots(previous, current, input = {}) {
  requireEvidence(previous instanceof TellingLog && previous.sealed &&
    current instanceof TellingLog && current.sealed,
    "requires two sealed original SignChain TellingLogs");
  const propositions = readSourceArray(sourceField(input,"propositions"), "propositions", 128);
  const seen = new Set();
  let inspectedTellings = 0, inspectedCandidates = 0;
  const changes = [];
  /** Index exact witnesses and reception clocks from the bounded original rows. */
  const evidenceMap = (rows) => {
    const witnesses = new Map(), observations = new Map();
    for (const row of rows) {
      const witnessAddress = exactIdentity(row.witness);
      witnesses.set(witnessAddress, witnessAddress);
      const clockPresent = Object.hasOwn(row, "observedAt");
      const observationKey = exactIdentity([
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
  for (const proposition of propositions) {
    requireEvidence(isCell(proposition) && measured(proposition) &&
      proposition.for.length === 0 && proposition.against.length === 0,
      "requires original unevidenced SignCell proposition coordinates");
    const propositionAddress = address(proposition);
    requireEvidence(!seen.has(propositionAddress),
      "the same original proposition cannot be compared twice");
    seen.add(propositionAddress);
    /** Both snapshots share one 20,000-row candidate budget across all nominated propositions. */
    const priorRows = TellingLog.prototype.boundedAt.call(
      previous, proposition, 20000 - inspectedCandidates);
    inspectedCandidates += priorRows.candidatesInspected;
    const laterRows = TellingLog.prototype.boundedAt.call(
      current, proposition, 20000 - inspectedCandidates);
    inspectedCandidates += laterRows.candidatesInspected;
    inspectedTellings += priorRows.matchedTellings + laterRows.matchedTellings;
    const priorFor = evidenceMap(priorRows.for), laterFor = evidenceMap(laterRows.for);
    const priorAgainst = evidenceMap(priorRows.against), laterAgainst = evidenceMap(laterRows.against);
    /** SignCell computes the measured reading from the bounded original rows. */
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

import assert from "node:assert/strict";
import test from "node:test";
import { address, cell, knowledgeReading } from "@red-cup-engineering/signcell";
import { exactIdentity, semanticId } from "@red-cup-engineering/semiotic-content-address-system";
import { knowledgeLeq } from "@red-cup-engineering/signchain/bilattice";
import { appendCellWitnesses, telling, TellingLog } from "@red-cup-engineering/signchain/log";
import { replayTellingEvents, repairTellingEvent, tellingEvent } from "@red-cup-engineering/signchain/replicated-log";
import { antecedentHolds, derivation, fireRule, fireRuleIn, rule, step } from "@red-cup-engineering/signchain/rules";
import { assessOriginalSourceWithdrawal, compareOriginalEvidenceSnapshots } from "@red-cup-engineering/signchain/source-withdrawal";
import { contractOutcome } from "@red-cup-engineering/signchain/contracts/contract-report";
import { phaseEnergeticObligation } from "@red-cup-engineering/signchain/contracts/energetics";
import { instrumentContract, relationalInstrument } from "@red-cup-engineering/signchain/contracts/instrument";
import { strictFinitePhase as phase } from "@red-cup-engineering/signchain/contracts/phase";
import {
  instrumentConfigurationReportFor, instrumentRealizationReportFor,
  instrumentVerificationCertificateFor, instrumentVerificationPlan,
} from "@red-cup-engineering/signchain/contracts/verification";

const composed = "é";
const decomposed = "e\u0301";
const at = cell(composed, "reaches", "garden");
const coincident = cell(decomposed, "reaches", "garden");
const wet = cell("garden", "is", "wet");

test("ordered tellings keep exact witnesses under a semantic proposition query", () => {
  const evidence = cell(at.subject, at.predicate, at.object, { for: [composed, decomposed] });
  const log = new TellingLog(), seen = new Set();
  appendCellWitnesses(log, seen, evidence, "first");
  appendCellWitnesses(log, seen, evidence, "retry");
  log.deny(coincident, decomposed, "second");

  assert.equal(log.size, 3);
  assert.equal(log.latest(coincident).observedAt, "first");
  assert.deepEqual(new Set(log.where({ subject: decomposed }).map(row => row.witness)), new Set(evidence.for));
  assert.deepEqual(log.cells(coincident)[0].for, evidence.for);
  assert.equal(log.readingAt(coincident), "stable");
  assert.deepEqual(log.boundedAt(coincident, 3).against, log.against(at));
  assert.throws(() => log.boundedAt(coincident, 2), /budget exceeded/);
  assert.throws(() => log.readingWhere({ subject: composed }), /complete/);
  assert.ok(!knowledgeLeq(cell(at.subject, at.predicate, at.object, { for: [composed] }),
    cell(at.subject, at.predicate, at.object, { for: [decomposed] })));

  const receipts = new Set();
  assert.throws(() => appendCellWitnesses(log.seal(), receipts, evidence), /sealed/);
  assert.equal(receipts.size, 0);
});

test("replica addresses retain exact data and source occurrence independently of the cell projection", () => {
  const first = tellingEvent(telling(at, composed), { source: "sensor:alpha", id: "1" });
  const second = tellingEvent(telling(at, decomposed), { source: "sensor:alpha", id: "2" });
  const repeated = tellingEvent(telling(at, composed), { source: "sensor:beta", id: "1" });
  const events = replayTellingEvents([first, second, repeated, first]);

  assert.equal(new Set([first.id, second.id, repeated.id]).size, 3);
  assert.notEqual(tellingEvent(telling(at, composed)).id, tellingEvent(telling(at, decomposed)).id);
  assert.equal(events.original.rows.length, 3);
  assert.deepEqual(new Set(events.effective.cells()[0].for), new Set([composed, decomposed]));
  assert.deepEqual(replayTellingEvents(JSON.parse(JSON.stringify(events.events))).events, events.events);

  const forged = { ...first, row: { ...first.row, witness: decomposed } };
  assert.deepEqual(replayTellingEvents([forged]).findings, [{ id: first.id, code: "identity-mismatch" }]);
});

test("conflicting source occurrence variants and dependent repairs contribute no effective evidence", () => {
  const occurrence = { source: "sensor:alpha", id: "3" };
  const first = tellingEvent(telling(at, "yes"), occurrence);
  const denial = tellingEvent(telling(at, "no", "against"));
  const repair = repairTellingEvent([first, denial], at, "for", "resolving");
  const conflicting = tellingEvent(telling(at, "different contents"), occurrence);
  const admitted = replayTellingEvents([first, denial, repair]);
  const merged = replayTellingEvents(admitted.events, [conflicting]);
  const reversed = replayTellingEvents([conflicting], admitted.events);

  assert.deepEqual(merged.active, [denial]);
  assert.equal(merged.original.rows.length, 3);
  assert.equal(merged.effective.readingAt(at), "active");
  assert.deepEqual(merged.events, reversed.events);
  assert.deepEqual(merged.findings, reversed.findings);
  assert.equal(merged.findings.filter(finding => finding.code === "occurrence-conflict").length, 2);
  assert.ok(merged.findings.some(finding => finding.id === repair.id && finding.code === "invalid-repair-basis"));
});

test("source study sees exact witness changes even when FOUR stays constant", () => {
  const early = new TellingLog().tell(at, composed, "clock:1").seal();
  const later = new TellingLog().tell(at, decomposed, "clock:1").seal();
  const { comparisons: [difference] } = compareOriginalEvidenceSnapshots(early, later, { propositions: [at] });
  assert.equal(difference.readingChanged, false);
  assert.equal(difference.requiresReverification, true);
  assert.deepEqual(difference.forWitnessChanges, { added: [exactIdentity(decomposed)], removed: [exactIdentity(composed)] });

  const history = new TellingLog().tell(at, composed).deny(at, decomposed).seal();
  const result = assessOriginalSourceWithdrawal(history, {
    proposition: at,
    attributions: [{ witness: composed, originalProducer: "source:1" }, { witness: decomposed, originalProducer: "source:2" }],
  });
  assert.equal(result.distinctWitnesses, 2);
  assert.deepEqual(result.withdrawals.map(row => row.remaining.knowledge), ["active", "potential"]);
});

test("a rule joins exact premises and refuses a foreign value at a consulted address", () => {
  const r = rule("watering", [{ cell: at, atLeast: "stable" }], { cell: wet, reading: "potential" });
  const support = cell(at.subject, at.predicate, at.object, { for: [composed] });
  const opposition = cell(coincident.subject, at.predicate, at.object, { against: [decomposed] });

  assert.deepEqual(fireRule(r, []), []);
  assert.ok(!antecedentHolds(r, [support]));
  assert.ok(antecedentHolds(r, [opposition, support]));
  const [consequence] = fireRule(JSON.parse(JSON.stringify(r)), [support, opposition]);
  assert.equal(address(consequence), address(wet));
  assert.equal(knowledgeReading(consequence), "potential");
  assert.deepEqual(consequence.for, [{ rule: r.name, from: [address(at)], ruleId: semanticId(r) }]);
  assert.deepEqual(derivation(r, 1), { rule: r.name, from: [address(at)] });
  assert.throws(() => rule("wrong threshold", [{ cell: at, atLeast: "invalid" }], r.consequent), /valid FOUR/);

  const foreign = cell("another subject", at.predicate, at.object, { for: ["foreign"], against: ["foreign"] });
  assert.throws(() => fireRuleIn(r, new Map([[address(at), foreign]])), /differs from its valuation coordinate/);
  assert.deepEqual(fireRule(r, new Map([[address(at), foreign]])), []);
  const valuation = new Map([["first input", support], ["second input", opposition]]);
  const next = step([r], valuation);
  assert.equal(next.find(value => address(value) === address(at)).against[0], decomposed);
  assert.deepEqual(step([r], next), next);
});

const rankInstrument = relationalInstrument({
  id: "rank-instrument",
  material: {
    id: "rank", loci: [], incidence: [], fibers: [], valueAlgebra: "rank",
    constraints: [], closure: ["observe"], boundary: ["observation"],
    phaseEvidence: [{ id: "rank-closure", phase: phase.id, stages: [0], settledAt: 0 }],
  },
  precondition: { id: "pre", entails: ["observation"] },
  postcondition: { id: "post", entails: ["observation"] },
  move: { id: "observe", domain: "observation", codomain: "observation", partial: false, deterministic: true, effects: ["boundary"] },
  phase,
  lens: { id: "rank-lens", domain: "observation", boundary: "observation", output: "observation", preserves: ["rank"], hides: [], evidenceRequired: false },
  evidencePolicy: { id: "rank-policy", required: false, records: ["boundary"], time: "none", caller: "none", boundaryObject: "required" },
  energetics: [phaseEnergeticObligation({
    id: "rank-energy", phase, source: "pre", target: "post", invariant: "rank decreases", measure: "rank", evidenceRequired: false,
  })],
  presentations: [{
    id: "rank-presentation", material: "rank", address: "observation", admissibility: { id: "present" },
    invariants: ["rank"], permittedLenses: ["rank-lens"], projections: ["function"],
  }],
  projections: [{ id: "rank-projection", projection: "function", implementation: "observe", refines: "observe", preserves: ["rank"] }],
});

const restored = value => JSON.parse(JSON.stringify(value));

test("an instrument receives its genuine plan, certificate and configuration after restoration", () => {
  const plan = instrumentVerificationPlan(rankInstrument);
  const certificate = instrumentVerificationCertificateFor(rankInstrument, restored(plan));
  const configuration = instrumentConfigurationReportFor(rankInstrument, restored(certificate));
  const outcome = contractOutcome(instrumentContract(rankInstrument), {
    materialBefore: { rank: 1 }, materialAfter: { rank: 0 }, boundary: { rank: 0 },
  });
  const realization = instrumentRealizationReportFor(rankInstrument, outcome, restored(configuration));

  for (const report of [plan, certificate, configuration, realization]) {
    assert.equal(report.judgment.polarity, "witness", JSON.stringify(report.missing));
  }
  assert.deepEqual(certificate, instrumentVerificationCertificateFor(rankInstrument));
  assert.deepEqual(configuration, instrumentConfigurationReportFor(rankInstrument));
  assert.deepEqual(realization, instrumentRealizationReportFor(rankInstrument, outcome));
  const forged = { ...configuration, implementations: ["unrelated"] };
  assert.ok(instrumentRealizationReportFor(rankInstrument, outcome, forged).missing.includes("configuration-source-mismatch"));
});

test("edited or foreign instrument reports cannot supply positive verification evidence", () => {
  const incomplete = { ...rankInstrument, presentations: [] };
  const plan = instrumentVerificationPlan(incomplete);
  const certificate = instrumentVerificationCertificateFor(incomplete, restored(plan));
  assert.equal(certificate.judgment.polarity, "obstruction");
  assert.ok(certificate.failedChecks.some(id => id.endsWith(".material-admission")));

  const witness = { polarity: "witness", reasons: [] };
  const forgedPlan = { ...plan, judgment: witness, checks: plan.checks.map(check => ({ ...check, judgment: witness })) };
  const refusal = instrumentVerificationCertificateFor(incomplete, forgedPlan);
  assert.ok(refusal.missing.includes("plan-source-mismatch"));
  assert.deepEqual(refusal.failedChecks, certificate.failedChecks);

  const foreignCertificate = instrumentVerificationCertificateFor(rankInstrument);
  const configuration = instrumentConfigurationReportFor(incomplete, foreignCertificate);
  assert.ok(configuration.missing.includes("certificate-source-mismatch"));
  assert.ok(configuration.missingStages.includes("evidenced-refinement"));

  let reads = 0;
  const accessor = { ...plan, get judgment() { reads++; return plan.judgment; } };
  assert.ok(instrumentVerificationCertificateFor(incomplete, accessor).missing.includes("plan-source-mismatch"));
  assert.throws(() => instrumentVerificationPlan({ ...incomplete, get id() { reads++; return incomplete.id; } }), /inert/);
  assert.equal(reads, 0);
});

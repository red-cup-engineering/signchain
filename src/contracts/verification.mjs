/**
 * contracts/verification - self-derived verification plans, configuration
 * reports, and implementation refinement/realization for an instrument.
 */

import { exactCarrier, exactIdentity, retainedCarrier } from "@red-cup-engineering/semiotic-content-address-system";
import { contractExposure, contractExposureReport, normalizedToken, uniqueStrings } from "./contract.mjs";
import { semanticJudgment, semanticJudgmentWitnessed, semanticJudgmentAspectWitnessed, fiberAspectWitnessed } from "./judgment.mjs";
import { semanticJudgmentContract } from "./judgment-schema.mjs";
import {
  instrumentMaterialReport, instrumentDerivedObligations, instrumentContract, relationalInstrument, slug,
} from "./instrument.mjs";
import { shapeContract } from "./shape-contract.mjs";
import { contractOutcomeReport, contractStaticReports } from "./contract-report.mjs";

/** Executable boundary for the configuration report owned by this module. */
export const instrumentConfigurationReportSchema = {
  $id: "metroplat/contracts/instrument-configuration",
  title: "InstrumentConfigurationReport",
  description: "A carried report that an instrument follows contract -> projection -> implementation -> evidenced refinement configuration discipline.",
  type: "object",
  required: [
    "kind", "id", "instrument", "contract", "material", "precondition", "move", "postcondition",
    "phase", "lens", "evidencePolicy", "stages", "configuredStages", "missingStages", "projectionKinds",
    "implementations", "refinementReports", "certificate", "evidence", "missing", "aspects", "judgment",
  ],
  properties: {
    kind: { const: "metroplat.instrument-configuration" },
    id: { type: "string", minLength: 1 },
    instrument: { type: "string", minLength: 1 },
    contract: { type: "string", minLength: 1 },
    material: { type: "string", minLength: 1 },
    precondition: { type: "string", minLength: 1 },
    move: { type: "string", minLength: 1 },
    postcondition: { type: "string", minLength: 1 },
    phase: { type: "string", minLength: 1 },
    lens: { type: "string", minLength: 1 },
    evidencePolicy: { type: "string", minLength: 1 },
    stages: { type: "array", items: { enum: ["contract", "projection", "implementation", "evidenced-refinement"] } },
    configuredStages: { type: "array", items: { enum: ["contract", "projection", "implementation", "evidenced-refinement"] } },
    missingStages: { type: "array", items: { enum: ["contract", "projection", "implementation", "evidenced-refinement"] } },
    projectionKinds: { type: "array", items: { enum: ["function", "schema", "route", "tool", "document", "evidence", "codec", "resource"] } },
    implementations: { type: "array", items: { type: "string", minLength: 1 } },
    refinementReports: { type: "array", items: { type: "string", minLength: 1 } },
    certificate: { type: "string", minLength: 1 },
    evidence: { type: "array", items: { type: "string", minLength: 1 } },
    missing: { type: "array", items: { type: "string", minLength: 1 } },
    aspects: { type: "array", items: { $ref: "metroplat/contracts/semantic-judgment" } },
    judgment: { $ref: "metroplat/contracts/semantic-judgment" },
  },
  additionalProperties: false,
};

export const instrumentConfigurationReportContract = shapeContract(
  instrumentConfigurationReportSchema,
  [semanticJudgmentContract],
);

/** A Node test module generated from an instrument verification plan and its derived obligations. */

export const generatedInstrumentTestModuleSchema = {
  $id: "metroplat/contracts/verification/generated-instrument-test-module",
  type: "object",
  required: ["kind", "id", "instrument", "plan", "path", "format", "source", "checks", "obligations", "verifies"],
  properties: {
    kind: { const: "metroplat.generated-test-module" },
    id: { type: "string" },
    instrument: { type: "string" },
    plan: { type: "string" },
    path: { type: "string" },
    format: { const: "node-test" },
    source: { type: "string" },
    checks: { type: "array", items: { type: "string" } },
    obligations: { type: "array", items: { type: "string" } },
    verifies: { type: "array", items: { type: "string" } },
  },
  additionalProperties: false,
  title: "GeneratedInstrumentTestModule",
  description: "A self-derived node-test module generated from an instrument's verification plan.",
};

export function instrumentVerificationCheck(
  spec,
) {
  return Object.freeze({
    kind: "metroplat.instrument-verification-check",
    id: spec.id,
    instrument: spec.instrument,
    contract: spec.contract,
    check: spec.check,
    subject: spec.subject,
    verifies: Object.freeze([...spec.verifies]),
    evidence: Object.freeze([...spec.evidence]),
    missing: Object.freeze([...spec.missing]),
    judgment: spec.judgment,
  });
}

export function generatedInstrumentTestModule(
  spec,
) {
  return Object.freeze({
    kind: "metroplat.generated-test-module",
    id: spec.id,
    instrument: spec.instrument,
    plan: spec.plan,
    path: spec.path,
    format: "node-test",
    source: spec.source,
    checks: Object.freeze([...spec.checks]),
    obligations: Object.freeze([...spec.obligations]),
    verifies: Object.freeze([...spec.verifies]),
  });
}

export function instrumentVerificationCertificate(
  spec,
) {
  return Object.freeze({
    kind: "metroplat.instrument-verification-certificate",
    id: spec.id,
    instrument: spec.instrument,
    contract: spec.contract,
    plan: spec.plan,
    material: spec.material,
    precondition: spec.precondition,
    move: spec.move,
    postcondition: spec.postcondition,
    phase: spec.phase,
    lens: spec.lens,
    evidencePolicy: spec.evidencePolicy,
    requiredChecks: Object.freeze([...spec.requiredChecks]),
    dischargedChecks: Object.freeze([...spec.dischargedChecks]),
    missingChecks: Object.freeze([...spec.missingChecks]),
    failedChecks: Object.freeze([...spec.failedChecks]),
    obligations: Object.freeze([...spec.obligations]),
    evidence: Object.freeze([...spec.evidence]),
    missing: Object.freeze([...spec.missing]),
    aspects: Object.freeze([...spec.aspects]),
    judgment: spec.judgment,
  });
}

export function instrumentConfigurationReport(
  spec,
) {
  return Object.freeze({
    kind: "metroplat.instrument-configuration",
    id: spec.id,
    instrument: spec.instrument,
    contract: spec.contract,
    material: spec.material,
    precondition: spec.precondition,
    move: spec.move,
    postcondition: spec.postcondition,
    phase: spec.phase,
    lens: spec.lens,
    evidencePolicy: spec.evidencePolicy,
    stages: Object.freeze([...spec.stages]),
    configuredStages: Object.freeze([...spec.configuredStages]),
    missingStages: Object.freeze([...spec.missingStages]),
    projectionKinds: Object.freeze([...spec.projectionKinds]),
    implementations: Object.freeze([...spec.implementations]),
    refinementReports: Object.freeze([...spec.refinementReports]),
    certificate: spec.certificate,
    evidence: Object.freeze([...spec.evidence]),
    missing: Object.freeze([...spec.missing]),
    aspects: Object.freeze([...spec.aspects]),
    judgment: spec.judgment,
  });
}

export function instrumentRealizationReport(
  spec,
) {
  return Object.freeze({
    kind: "metroplat.instrument-realization",
    id: spec.id,
    instrument: spec.instrument,
    contract: spec.contract,
    outcome: spec.outcome,
    outcomeContract: spec.outcomeContract,
    material: spec.material,
    precondition: spec.precondition,
    move: spec.move,
    postcondition: spec.postcondition,
    phase: spec.phase,
    lens: spec.lens,
    evidencePolicy: spec.evidencePolicy,
    configuration: spec.configuration,
    projectionKinds: Object.freeze([...spec.projectionKinds]),
    implementationReports: Object.freeze([...spec.implementationReports]),
    realizedProjections: Object.freeze([...spec.realizedProjections]),
    unrealizedProjections: Object.freeze([...spec.unrealizedProjections]),
    evidence: Object.freeze([...spec.evidence]),
    missing: Object.freeze([...spec.missing]),
    aspects: Object.freeze([...spec.aspects]),
    judgment: spec.judgment,
  });
}

function contractReferences(contract) {
  const roles = ["material", "precondition", "move", "postcondition", "phase", "lens", "evidencePolicy"];
  return Object.fromEntries(roles.map(role => [role, contract[role].id]));
}

function componentEvidence(contract) {
  const { evidencePolicy, ...components } = contractReferences(contract);
  return [...Object.entries(components).map(([role, id]) => `${role}:${id}`), `evidence-policy:${evidencePolicy}`];
}

const needsExposure = instrument => instrument.move.effects.includes("boundary") ||
  instrument.move.effects.includes("evidence") || instrument.evidencePolicy.required;

function verificationFacts(source) {
  const instrument = relationalInstrument(retainedCarrier(source));
  const contract = instrumentContract(instrument);
  return {
    instrument, contract, ...contractStaticReports(contract),
    material: instrumentMaterialReport(instrument),
    refinements: refinementsOf(instrument, contract),
  };
}

function planOf({ instrument, contract, material, move, validity, phase, lens, energetics, evidencePolicy, refinements }) {
  const prefix = `${instrument.id}.verification`;
  const check = (name, subject, verifies, evidence, report, suffix = name) =>
    instrumentVerificationCheck({
      id: `${prefix}.${suffix}`, instrument: instrument.id, contract: contract.id,
      check: name, subject, verifies, evidence, missing: report.missing, judgment: report.judgment,
    });
  const judgmentEvidence = report => [
    `judgment:${report.judgment.polarity}`,
    ...report.judgment.reasons.map(reason => `missing:${reason}`),
  ];
  const checks = [
    check("material-admission", instrument.material.id,
      ["admissibility-presentations", "move-domain", "move-codomain", "admissibility", "lens-permission", "implementation-targets"],
      [`presentation-count:${instrument.presentations.length}`, `presentation-addresses:${material.boundaryAddresses.join(",")}`],
      material),
    check("move-admissibility", instrument.move.id,
      ["move-domain", "move-codomain", "material-effect", "boundary-effect", "evidence-effect", "phase-effect", "determinism"],
      [
        `domain:${instrument.move.domain ?? "boundary-admission"}`,
        `codomain:${instrument.move.codomain ?? "boundary-output"}`,
        `effects:${instrument.move.effects.join(",")}`,
        `partial:${instrument.move.partial}`, `deterministic:${instrument.move.deterministic}`,
      ], move),
    check("contract-validity", contract.id,
      ["hoare-precondition", "hoare-move", "hoare-postcondition", "phase-regime", "observational-lens", "evidence-policy", "energetics", "refinement-obligations"],
      componentEvidence(contract), validity),
    check("phase-admissibility", instrument.phase.id,
      ["regime", "finality", "coordination-lens", "evidence-policy", "energetics"],
      [`regime:${phase.regime}`, `finality:${phase.finality}`, `cost:${instrument.phase.cost}`], phase),
    check("lens-admissibility", instrument.lens.id,
      ["lens-domain", "lens-boundary", "lens-output", "lens-preserve-hide", "lens-evidence", "phase-coordination"],
      [
        `domain:${lens.domain}`, `boundary:${lens.boundary}`, `output:${lens.output}`,
        `preserves:${instrument.lens.preserves.length}`, `hides:${instrument.lens.hides.length}`,
      ], lens),
    check("energetics", contract.id, ["phase-energy", "coordination-cost", "evidenced-cost", "finality-accounting"],
      [`phase-energy:${energetics.phaseEnergy}`, `obligations:${energetics.obligations.length}`], energetics),
    check("evidence-policy-admissibility", instrument.evidencePolicy.id,
      ["evidence-records", "time-or-stage", "caller", "boundary-object", "lens-requirement", "phase-requirement", "move-requirement"],
      [
        `required:${evidencePolicy.required}`, `records:${evidencePolicy.requiredRecords.join(",")}`,
        `time:${instrument.evidencePolicy.time}`, `caller:${instrument.evidencePolicy.caller}`,
        `boundary-object:${instrument.evidencePolicy.boundaryObject}`,
      ], evidencePolicy, "coordinates-policy-admissibility"),
    ...refinements.map(report => check("implementation-refinement", report.projection,
      [report.implementation, report.refines, report.projectionKind, ...report.obligations],
      judgmentEvidence(report), report, `refinement.${slug(report.projection)}`)),
  ];
  if (needsExposure(instrument)) {
    const exposure = contractExposure(contract, {
      caller: { generator: "instrumentVerificationPlan", instrument: instrument.id },
      boundary: { instrument: instrument.id, move: instrument.move.id, lens: instrument.lens.id },
    });
    const report = contractExposureReport(contract, exposure);
    checks.push(check("exposure-accountability", instrument.evidencePolicy.id,
      ["contract-match", "witness-match", "required-records", "time-or-stage", "caller", "boundary-object"],
      [`records:${report.recordsPresent.join(",")}`, ...judgmentEvidence(report)], report));
  }

  const id = `${instrument.id}.verification-plan`;
  const missing = checks.flatMap(check => check.judgment.reasons.map(reason => `${check.id}:${reason}`));
  return Object.freeze({
    kind: "metroplat.instrument-verification-plan", id, instrument: instrument.id, contract: contract.id,
    checks: Object.freeze(checks), obligations: instrumentDerivedObligations(instrument),
    missing: Object.freeze(missing), aspects: Object.freeze(checks.map(check => check.judgment)),
    judgment: semanticJudgment(id, missing),
  });
}

/** Derive ordered static checks and outstanding obligations from an inert instrument declaration. */
export const instrumentVerificationPlan = instrument => planOf(verificationFacts(instrument));

const baseVerificationCheckClasses = Object.freeze([
  "material-admission",
  "move-admissibility",
  "contract-validity",
  "phase-admissibility",
  "lens-admissibility",
  "evidence-policy-admissibility",
  "energetics",
]);

function requiredVerificationCheckClasses(instrument) {
  return Object.freeze([
    ...baseVerificationCheckClasses,
    ...(instrument.projections.length === 0 ? [] : ["implementation-refinement"]),
    ...(needsExposure(instrument) ? ["exposure-accountability"] : []),
  ]);
}

function sameReport(source, derived) {
  if (source === undefined) return true;
  try { return exactIdentity(exactCarrier(source)) === exactIdentity(derived); }
  catch { return false; }
}

function certificateOf({ instrument, contract }, plan, planMatches = true) {
  const requiredChecks = requiredVerificationCheckClasses(instrument);
  const failedChecks = [], checkEvidence = [];
  const results = new Map();
  for (const check of plan.checks) {
    const witnessed = semanticJudgmentWitnessed(check.judgment);
    results.set(check.check, (results.get(check.check) ?? true) && witnessed);
    if (witnessed) checkEvidence.push(`check:${check.id}`);
    else failedChecks.push(check.id);
  }
  const dischargedChecks = requiredChecks.filter(check => results.get(check) === true);
  const missingChecks = requiredChecks.filter(check => !results.has(check));
  const validityEvidence = plan.checks.find(check => check.check === "contract-validity").evidence;
  const contractComponentsAccounted = componentEvidence(contract).every(entry => validityEvidence.includes(entry));
  const obligationsProjected = plan.obligations.length > 0 &&
    plan.obligations.every(obligation => obligation.verifies.length > 0 && obligation.evidence.length > 0);
  const evidence = [
    `plan:${plan.id}`, `contract:${contract.id}`, ...checkEvidence,
    ...plan.obligations.map(obligation => `obligation:${obligation.id}`),
  ];
  const sourceObstructions = planMatches ? [] : ["plan-source-mismatch"];
  const checkObstructions = [
    ...missingChecks.map(check => `check:${check}`),
    ...failedChecks.map(check => `failed:${check}`),
  ];
  const componentObstructions = contractComponentsAccounted ? [] : ["contract-components"];
  const obligationObstructions = obligationsProjected ? [] : ["derived-obligations"];
  const missing = [
    ...sourceObstructions, ...plan.missing.map(reason => `plan:${reason}`),
    ...checkObstructions, ...componentObstructions, ...obligationObstructions,
  ];
  const id = `${plan.id}.certificate`;
  return instrumentVerificationCertificate({
    id, instrument: instrument.id, contract: contract.id, plan: plan.id, ...contractReferences(contract),
    requiredChecks, dischargedChecks, missingChecks, failedChecks,
    obligations: plan.obligations.map(obligation => obligation.id), evidence, missing,
    aspects: [
      plan.judgment,
      semanticJudgment("plan-instrument-contract-match", sourceObstructions),
      semanticJudgment("required-checks", checkObstructions),
      semanticJudgment("contract-components", componentObstructions),
      semanticJudgment("derived-obligations", obligationObstructions),
    ],
    judgment: semanticJudgment(id, missing),
  });
}

/** Certify the original instrument plan. A supplied copy must carry the same exact report. */
export function instrumentVerificationCertificateFor(instrument, suppliedPlan) {
  const facts = verificationFacts(instrument);
  const plan = planOf(facts);
  return certificateOf(facts, plan, sameReport(suppliedPlan, plan));
}

const configurationStages = Object.freeze([
  "contract",
  "projection",
  "implementation",
  "evidenced-refinement",
]);

function uniqueImplementationProjectionKinds(projections) {
  return Object.freeze([...new Set(projections.map((projection) => projection.projection))]);
}

function configurationOf({ instrument, contract, material, validity, evidencePolicy, refinements }, certificate, certificateMatches = true) {
  const contractStage = semanticJudgmentWitnessed(validity.judgment) && semanticJudgmentWitnessed(material.judgment);
  const projectionStage = instrument.projections.length > 0 &&
    instrument.projections.every((projection) => projection.refines.length > 0 && projection.implementation.length > 0);
  const implementationStage = refinements.length > 0 && refinements.every((report) => semanticJudgmentWitnessed(report.judgment));
  const evidencedStage = certificateMatches && semanticJudgmentWitnessed(evidencePolicy.judgment) &&
    semanticJudgmentWitnessed(certificate.judgment) &&
    certificate.requiredChecks.includes("exposure-accountability") &&
    certificate.dischargedChecks.includes("exposure-accountability");
  const stageStatus = {
    contract: contractStage,
    projection: projectionStage,
    implementation: implementationStage,
    "evidenced-refinement": evidencedStage,
  };
  const configuredStages = configurationStages.filter((stage) => stageStatus[stage]);
  const missingStages = configurationStages.filter((stage) => !stageStatus[stage]);
  const evidence = [
    `contract:${contract.id}`,
    `material-report:${material.instrument}`,
    `contract-validity:${validity.contract}`,
    `evidence-policy:${evidencePolicy.evidencePolicy}`,
    `certificate:${certificate.id}`,
    ...refinements.map((report) => `refinement:${report.projection}`),
  ];
  const missing = [
    ...(certificateMatches ? [] : ["certificate-source-mismatch"]),
    ...missingStages.map((stage) => `stage:${stage}`),
    ...validity.judgment.reasons.map((entry) => `contract:${entry}`),
    ...material.judgment.reasons.map((entry) => `material:${entry}`),
    ...evidencePolicy.judgment.reasons.map((entry) => `evidence-policy:${entry}`),
    ...certificate.judgment.reasons.map((entry) => `certificate:${entry}`),
    ...refinements.flatMap((report) => report.judgment.reasons.map((entry) => `refinement:${report.projection}:${entry}`)),
  ];
  return instrumentConfigurationReport({
    id: `${instrument.id}.configuration`,
    instrument: instrument.id,
    contract: contract.id,
    ...contractReferences(contract),
    stages: configurationStages,
    configuredStages,
    missingStages,
    projectionKinds: uniqueImplementationProjectionKinds(instrument.projections),
    implementations: instrument.projections.map((projection) => projection.implementation),
    refinementReports: refinements.map((report) => report.projection),
    certificate: certificate.id,
    evidence,
    missing,
    aspects: Object.freeze([
      semanticJudgment("configuration-stages", missingStages.map((stage) => `stage:${stage}`)),
      validity.judgment,
      material.judgment,
      semanticJudgment("projections-declared", projectionStage ? [] : ["projections-declared"]),
      ...refinements.map((report) => report.judgment),
      evidencePolicy.judgment,
      certificate.judgment,
    ]),
    judgment: semanticJudgment(`${instrument.id}.configuration`, missing),
  });
}

/** Read configuration from the original facts and a freshly derived certificate. */
export function instrumentConfigurationReportFor(instrument, suppliedCertificate) {
  const facts = verificationFacts(instrument);
  const certificate = certificateOf(facts, planOf(facts));
  return configurationOf(facts, certificate, sameReport(suppliedCertificate, certificate));
}

function projectionTokens(projection) {
  return Object.freeze([
    ...(projection.lens === undefined ? [] : [projection.lens]),
    ...(projection.evidencePolicy === undefined ? [] : [projection.evidencePolicy]),
    ...projection.preserves,
  ].map(normalizedToken));
}

function hasToken(tokens, accepted) {
  const normalized = accepted.map(normalizedToken);
  return tokens.some((token) => normalized.some((candidate) => token === candidate || token.includes(candidate)));
}

function projectionTargets(instrument, contract) {
  return Object.freeze([
    instrument.id,
    instrument.material.id,
    instrument.precondition.id,
    instrument.move.id,
    instrument.postcondition.id,
    instrument.phase.id,
    instrument.lens.id,
    instrument.evidencePolicy.id,
    contract.id,
    contract.material.id,
    contract.precondition.id,
    contract.move.id,
    contract.postcondition.id,
    contract.phase.id,
    contract.lens.id,
    contract.evidencePolicy.id,
    ...instrument.presentations.flatMap((presentation) => [presentation.id, presentation.material, presentation.address, presentation.admissibility.id]),
  ]);
}

function projectionObligations(projection) {
  const obligations = ["target"];
  switch (projection.projection) {
    case "schema":
      obligations.push("admissibility");
      break;
    case "function":
      obligations.push("move");
      break;
    case "route":
    case "tool":
      obligations.push("contract", "boundary", "lens", "evidence-policy");
      break;
    case "document":
    case "resource":
      obligations.push("contract", "boundary", "lens");
      if (projection.evidencePolicy !== undefined) obligations.push("evidence-policy");
      break;
    case "evidence":
      obligations.push("evidence-policy", "contract-exposure");
      break;
    case "codec":
      obligations.push("boundary");
      break;
  }
  return uniqueStrings(obligations);
}

function projectionSatisfies(
  obligation,
  instrument,
  contract,
  projection,
  tokens,
  targetCompatible,
  lensCompatible,
  evidencePolicyCompatible,
) {
  switch (obligation) {
    case "target":
      return targetCompatible;
    case "admissibility":
      return hasToken(tokens, ["admissibility", "admissible", instrument.precondition.id, contract.precondition.id]);
    case "move":
      return projection.refines === instrument.move.id ||
        projection.refines === contract.move.id ||
        hasToken(tokens, ["move", instrument.move.id, contract.move.id]);
    case "contract":
      return projection.refines === instrument.id ||
        projection.refines === contract.id ||
        hasToken(tokens, ["contract", "contract id", instrument.id, contract.id]);
    case "boundary":
      return hasToken(tokens, [
        "boundary",
        "input presentation",
        "output presentation",
        instrument.lens.boundary,
        contract.lens.boundary,
        instrument.lens.output,
        contract.lens.output,
        ...instrument.material.boundary,
      ]);
    case "lens":
      return lensCompatible || hasToken(tokens, [instrument.lens.id, contract.lens.id]);
    case "evidence-policy":
      return evidencePolicyCompatible || hasToken(tokens, [instrument.evidencePolicy.id, contract.evidencePolicy.id]);
    case "contract-exposure":
      return hasToken(tokens, ["contract exposure", "exposure", "contract coordinates", "statement coordinate", "boundary"]);
    default:
      return false;
  }
}

/**
 * Decide whether one implementation projection is a refinement of its instrument's contract material.
 *
 * The report is intentionally not a type check. It is the package-level
 * refinement judgment from the instrument note: a concrete function, schema,
 * route, tool, document, resource, codec, or journal admissionr must target an
 * admissible part of the instrument and preserve the obligations appropriate to
 * that projection kind.
 */

export function implementationRefinementReport(instrument, projection) {
  return refinementOf(instrument, instrumentContract(instrument), projection);
}

function refinementOf(instrument, contract, projection) {
  const targets = projectionTargets(instrument, contract);
  const targetCompatible = targets.includes(projection.refines);
  const lensCompatible = projection.lens === undefined ||
    projection.lens === instrument.lens.id ||
    projection.lens === contract.lens.id ||
    projection.preserves.includes(instrument.lens.id) ||
    projection.preserves.includes(contract.lens.id);
  const evidencePolicyCompatible = projection.evidencePolicy === undefined ||
    projection.evidencePolicy === instrument.evidencePolicy.id ||
    projection.evidencePolicy === contract.evidencePolicy.id ||
    projection.preserves.includes(instrument.evidencePolicy.id) ||
    projection.preserves.includes(contract.evidencePolicy.id);
  const tokens = projectionTokens(projection);
  const obligations = projectionObligations(projection);
  const satisfied = obligations.filter((obligation) =>
    projectionSatisfies(
      obligation,
      instrument,
      contract,
      projection,
      tokens,
      targetCompatible,
      lensCompatible,
      evidencePolicyCompatible,
    ));
  const missing = obligations.filter((obligation) => !satisfied.includes(obligation));
  const reasons = [
    ...(targetCompatible ? [] : ["target-compatibility"]),
    ...(lensCompatible ? [] : ["lens-compatibility"]),
    ...(evidencePolicyCompatible ? [] : ["evidence-policy-compatibility"]),
    ...missing.map((obligation) => `obligation:${obligation}`),
  ];
  return Object.freeze({
    kind: "metroplat.implementation-refinement",
    instrument: instrument.id,
    contract: contract.id,
    projection: projection.id,
    projectionKind: projection.projection,
    implementation: projection.implementation,
    refines: projection.refines,
    obligations,
    satisfied: Object.freeze(satisfied),
    missing: Object.freeze(missing),
    aspects: Object.freeze([
      semanticJudgment("target-compatibility", targetCompatible ? [] : ["target-compatibility"]),
      semanticJudgment("lens-compatibility", lensCompatible ? [] : ["lens-compatibility"]),
      semanticJudgment("evidence-policy-compatibility", evidencePolicyCompatible ? [] : ["evidence-policy-compatibility"]),
      semanticJudgment("obligations", missing.map((obligation) => `obligation:${obligation}`)),
    ]),
    judgment: semanticJudgment(`${projection.id}.refinement`, reasons),
  });
}

/** Report all implementation refinements claimed by an instrument. */

export function implementationRefinementReports(instrument) {
  return instrument.projections.length === 0 ? Object.freeze([]) : refinementsOf(instrument, instrumentContract(instrument));
}

function refinementsOf(instrument, contract) {
  return Object.freeze(instrument.projections.map(projection => refinementOf(instrument, contract, projection)));
}

function implementationRealizationObligations(projection) {
  const obligations = new Set(["static-refinement", "outcome-contract", "phase", "lens", "evidence-policy"]);
  switch (projection.projection) {
    case "function":
      obligations.add("precondition");
      obligations.add("postcondition");
      obligations.add("energetics");
      obligations.add("material");
      break;
    case "route":
    case "tool":
      obligations.add("precondition");
      obligations.add("postcondition");
      obligations.add("energetics");
      obligations.add("material");
      obligations.add("boundary");
      obligations.add("evidence");
      break;
    case "evidence":
      obligations.add("precondition");
      obligations.add("postcondition");
      obligations.add("energetics");
      obligations.add("material");
      obligations.add("boundary");
      obligations.add("evidence");
      obligations.add("exposure");
      break;
    case "resource":
    case "document":
      obligations.add("boundary");
      obligations.add("evidence");
      obligations.add("exposure");
      break;
    case "codec":
      obligations.add("boundary");
      break;
    case "schema":
      obligations.add("precondition");
      obligations.add("postcondition");
      break;
  }
  const tokens = projectionTokens(projection);
  if (hasToken(tokens, ["precondition", "observed p"])) obligations.add("precondition");
  if (hasToken(tokens, ["postcondition", "observed q"])) obligations.add("postcondition");
  if (hasToken(tokens, ["predicate", "predicates", "p/q"])) {
    obligations.add("precondition");
    obligations.add("postcondition");
  }
  if (hasToken(tokens, ["energy", "energetic", "energetics", "cost"])) obligations.add("energetics");
  if (hasToken(tokens, ["material", "state", "transition", "presentation"])) obligations.add("material");
  if (hasToken(tokens, ["boundary", "output", "body", "wire"])) obligations.add("boundary");
  if (hasToken(tokens, ["evidence", "trace", "time", "stage"])) obligations.add("evidence");
  if (hasToken(tokens, ["exposure", "contract exposure"])) obligations.add("exposure");
  return Object.freeze([...obligations]);
}

function realizationSatisfies(
  obligation,
  refinement,
  outcomeReport,
) {
  switch (obligation) {
    case "static-refinement":
      return semanticJudgmentWitnessed(refinement.judgment);
    case "outcome-contract":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "contract");
    case "precondition":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "precondition");
    case "postcondition":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "postcondition");
    case "energetics":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "energetics");
    case "material":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "material");
    case "boundary":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "boundary");
    case "phase":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "phase");
    case "lens":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "lens")
        && semanticJudgmentAspectWitnessed(outcomeReport.judgment, "lens-observation");
    case "evidence-policy":
      return fiberAspectWitnessed(refinement.aspects, "evidence-policy-compatibility") && semanticJudgmentAspectWitnessed(outcomeReport.judgment, "evidence");
    case "evidence":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "evidence");
    case "exposure":
      return semanticJudgmentAspectWitnessed(outcomeReport.judgment, "exposure");
    default:
      return false;
  }
}

/**
 * Judge whether one concrete implementation projection is realized by an actual
 * Hoare outcome. Static refinement only says the projection points at the right
 * contract material; this report also checks the observed behavior.
 */

export function implementationRealizationReport(instrument, projection, outcome) {
  const contract = instrumentContract(instrument);
  return realizationOf(instrument, contract, projection, outcome,
    refinementOf(instrument, contract, projection), contractOutcomeReport(contract, outcome));
}

function realizationOf(instrument, contract, projection, outcome, refinement, outcomeReport) {
  const obligations = implementationRealizationObligations(projection);
  const satisfied = obligations.filter((obligation) => realizationSatisfies(obligation, refinement, outcomeReport));
  const failed = obligations.filter((obligation) => !satisfied.includes(obligation));
  const evidencePolicyCompatible = fiberAspectWitnessed(refinement.aspects, "evidence-policy-compatibility") &&
    outcome.evidencePolicy === contract.evidencePolicy.id &&
    outcome.exposure.evidencePolicy === contract.evidencePolicy.id;
  const lensCompatible = fiberAspectWitnessed(refinement.aspects, "lens-compatibility") && outcome.lens === contract.lens.id;
  const missing = [
    ...failed,
    ...refinement.judgment.reasons.map((entry) => `refinement:${entry}`),
    ...outcomeReport.missing.map((entry) => `outcome:${entry}`),
    ...(evidencePolicyCompatible ? [] : ["evidence-policy-compatibility"]),
  ];
  return Object.freeze({
    kind: "metroplat.implementation-realization",
    instrument: instrument.id,
    contract: contract.id,
    projection: projection.id,
    projectionKind: projection.projection,
    implementation: projection.implementation,
    refines: projection.refines,
    outcome: `${outcome.contract}:${outcome.fingerprint}`,
    outcomeContract: outcome.contract,
    obligations: Object.freeze(obligations),
    satisfied: Object.freeze(satisfied),
    missing: Object.freeze(missing),
    aspects: Object.freeze([
      refinement.judgment,
      outcomeReport.judgment,
      semanticJudgment("lens-compatibility", lensCompatible ? [] : ["lens-compatibility"], true),
      semanticJudgment("evidence-policy-compatibility", evidencePolicyCompatible ? [] : ["evidence-policy-compatibility"]),
      semanticJudgment("obligations", failed),
    ]),
    judgment: semanticJudgment(`${projection.id}.realization`, missing),
  });
}

/** Judge every implementation projection of an instrument against one realized outcome. */

export function implementationRealizationReports(instrument, outcome) {
  if (instrument.projections.length === 0) return Object.freeze([]);
  const contract = instrumentContract(instrument);
  return realizationsOf(instrument, contract, outcome, refinementsOf(instrument, contract), contractOutcomeReport(contract, outcome));
}

function realizationsOf(instrument, contract, outcome, refinements, outcomeReport) {
  return Object.freeze(instrument.projections.map((projection, index) =>
    realizationOf(instrument, contract, projection, outcome, refinements[index], outcomeReport)));
}

/**
 * Judge whether one realized Hoare outcome realizes the whole configured
 * instrument, not only one implementation projection. This is the runtime
 * counterpart of configuration order: configured contract material must be
 * observed through the outcome, and every declared projection must be realized.
 */

export function instrumentRealizationReportFor(source, outcome, suppliedConfiguration) {
  const facts = verificationFacts(source);
  const { instrument, contract, refinements } = facts;
  const configuration = configurationOf(facts, certificateOf(facts, planOf(facts)));
  const configurationMatches = sameReport(suppliedConfiguration, configuration);
  const outcomeReport = contractOutcomeReport(contract, outcome);
  const realizationReports = realizationsOf(instrument, contract, outcome, refinements, outcomeReport);
  const realizedProjections = realizationReports.filter((report) => semanticJudgmentWitnessed(report.judgment)).map((report) => report.projection);
  const unrealizedProjections = realizationReports.filter((report) => !semanticJudgmentWitnessed(report.judgment)).map((report) => report.projection);
  const configurationAccounted = configurationMatches && semanticJudgmentWitnessed(configuration.judgment);
  const outcomeAccounted = semanticJudgmentWitnessed(outcomeReport.judgment) &&
    outcome.contract === contract.id &&
    outcome.material === contract.material.id &&
    outcome.precondition === contract.precondition.id &&
    outcome.move === contract.move.id &&
    outcome.postcondition === contract.postcondition.id &&
    outcome.phase === contract.phase.id &&
    outcome.lens === contract.lens.id &&
    outcome.evidencePolicy === contract.evidencePolicy.id;
  const implementationReports = realizationReports.map((report) => report.projection);
  const evidence = [
    `configuration:${configuration.id}`,
    `contract:${contract.id}`,
    `outcome:${outcome.contract}:${outcome.fingerprint}`,
    `exposure:${outcome.exposure.contract}:${outcome.exposure.fingerprint}`,
    `witness:${outcome.coordinates.kind}:${outcome.coordinates.fingerprint}`,
    ...realizationReports.map((report) => `implementation-realization:${report.projection}`),
  ];
  const missing = [
    ...(configurationAccounted ? [] : ["configuration"]),
    ...(configurationMatches ? [] : ["configuration-source-mismatch"]),
    ...configuration.missing.map((entry) => `configuration:${entry}`),
    ...(outcomeAccounted ? [] : ["outcome"]),
    ...outcomeReport.missing.map((entry) => `outcome:${entry}`),
    ...realizationReports.flatMap((report) => report.judgment.reasons.map((entry) => `projection:${report.projection}:${entry}`)),
  ];
  return instrumentRealizationReport({
    id: `${instrument.id}.realization.${slug(outcome.fingerprint)}`,
    instrument: instrument.id,
    contract: contract.id,
    outcome: `${outcome.contract}:${outcome.fingerprint}`,
    outcomeContract: outcome.contract,
    ...contractReferences(contract),
    configuration: configuration.id,
    projectionKinds: uniqueImplementationProjectionKinds(instrument.projections),
    implementationReports,
    realizedProjections,
    unrealizedProjections,
    evidence,
    missing,
    aspects: Object.freeze([
      configuration.judgment,
      outcomeReport.judgment,
      semanticJudgment("configuration-match", configurationAccounted ? [] : ["configuration"]),
      semanticJudgment("outcome-match", outcomeAccounted ? [] : ["outcome"]),
      ...realizationReports.map((report) => report.judgment),
    ]),
    judgment: semanticJudgment(`${instrument.id}.realization.${slug(outcome.fingerprint)}`, missing),
  });
}

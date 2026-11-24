import {
  dihedralMul, dihedral,
} from "@red-cup-engineering/metrologic/articulation/predicating/positing/dihedral-gauge";
import {
  admitCell, knowledgeReading, cell, address, measured, presence, recordOf,
} from "@red-cup-engineering/signcell";
import {
  coincides,
} from "@red-cup-engineering/semiotic-content-address-system";
import {
  record, sidesOfReading, readingOfRecord,
} from "@red-cup-engineering/metrologic/four";

/**
 * FOUR rotations, source-evidenced C4 paths, and typed physical
 * observation cells. Metrologic supplies the rotations and record operations.
 */

const quarterTurn = "order-swap-negation";
const halfTurn = dihedralMul(quarterTurn, quarterTurn);
const turnActions = ["id", quarterTurn, halfTurn, dihedralMul(quarterTurn, halfTurn)];
const FOUR_SPIN_CYCLE = Object.freeze(turnActions.map(action => dihedral(action, "absurd")));

function quarterTurns(value, role = "quarterTurns") {
  if (!Number.isSafeInteger(value) || value < 0 || value > 3) {
    throw new TypeError("signcell/charge-spin: " + role + " must be an integer in 0..3");
  }
  return value;
}

function originalCharge(reading) {
  if (!FOUR_SPIN_CYCLE.includes(reading)) {
    throw new TypeError("signcell/charge-spin: charge must be an original FOUR knowledge reading");
  }
  return reading;
}

/** Apply a quarter-turn rotation to a FOUR knowledge reading. */
function rotateFourCharge(reading, steps = 1) {
  const charge = originalCharge(reading);
  return dihedral(turnActions[quarterTurns(steps, "steps")], charge);
}

function composeQuarterTurns(first, second) {
  return (quarterTurns(first, "first") + quarterTurns(second, "second")) % 4;
}

function inverseQuarterTurns(steps) {
  return (4 - quarterTurns(steps, "steps")) % 4;
}

/** Change the source and target gauges for a directed phase. */
function rebaseQuarterTurns(phase, sourceGauge, targetGauge) {
  return (quarterTurns(phase, "phase")
    + quarterTurns(targetGauge, "targetGauge")
    - quarterTurns(sourceGauge, "sourceGauge") + 4) % 4;
}

function sourceCell(value, role) {
  try { return admitCell(value); }
  catch (cause) { throw new TypeError(`signcell: invalid ${role} cell`, { cause }); }
}

function predicateName(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError("signcell/charge-spin: a caller-owned, nonempty predicate is required");
  }
  return value;
}

/** Create a cell carrying the rotated FOUR reading and a reference to the source cell. */
function fourSpinProjectionCell(source, { predicate, steps = 1 } = {}) {
  const original = sourceCell(source, "source");
  const base = knowledgeReading(original);
  const n = quarterTurns(steps, "steps");
  return cell(address(original), predicateName(predicate), Object.freeze({
    kind: "signcell.four-spin-projection.v1",
    sourceReading: base,
    quarterTurns: n,
    projectedReading: rotateFourCharge(base, n)
  }));
}

function witnessed(value, role) {
  const source = sourceCell(value, role);
  if (!source.for.length || source.against.length || !measured(source))
    throw new TypeError(`signcell: ${role} needs unopposed supporting witnesses and a matching reading`);
  return source;
}

/** Admit an edge and its separately witnessed phase. */
function fourSpinLink({ edgeCell, phaseCell, phasePredicate } = {}) {
  const edge = witnessed(edgeCell, "edge");
  const phase = witnessed(phaseCell, "phase");
  const predicate = predicateName(phasePredicate);
  if (!coincides(phase.subject, address(edge)) || !coincides(phase.predicate, predicate)) {
    throw new TypeError("signcell/charge-spin: phase must reference this edge and predicate");
  }
  const n = quarterTurns(phase.object, "phaseCell.object");
  return Object.freeze({
    kind: "signcell.four-spin-link.v1",
    from: edge.subject,
    to: edge.object,
    quarterTurns: n,
    edgeAddress: address(edge),
    phaseAddress: address(phase),
    edgeCell: edge,
    phaseCell: phase
  });
}

/** Compose the phases along an ordered chain of links, optionally requiring a loop. */
function fourSpinPath(links, { initialCharge = "absurd", requireLoop = false } = {}) {
  if (!Array.isArray(links) || links.length === 0 || links.length > 256) {
    throw new TypeError("signcell/charge-spin: path requires 1..256 witnessed links");
  }
  const charge = originalCharge(initialCharge);
  const verified = links.map((link) => {
    if (link?.kind !== "signcell.four-spin-link.v1") {
      throw new TypeError("signcell/charge-spin: path accepts fourSpinLink results only");
    }

    return fourSpinLink({
      edgeCell: link.edgeCell,
      phaseCell: link.phaseCell,
      phasePredicate: link.phaseCell.predicate
    });
  });
  let accumulated = 0;
  for (let i = 0; i < verified.length; i++) {
    const link = verified[i];
    if (i > 0 && !coincides(verified[i - 1].to, link.from)) {
      throw new TypeError("signcell/charge-spin: path is not oriented and continuous");
    }
    accumulated = composeQuarterTurns(accumulated, link.quarterTurns);
  }
  const start = verified[0].from;
  const end = verified[verified.length - 1].to;
  const loop = coincides(start, end);
  if (requireLoop && !loop) {
    throw new TypeError("signcell/charge-spin: claimed closed loop has different endpoint");
  }
  return Object.freeze({
    kind: "signcell.four-spin-path.v1",
    links: Object.freeze(verified),
    start,
    end,
    closed: loop,
    quarterTurns: accumulated,
    initialCharge: charge,
    finalCharge: rotateFourCharge(charge, accumulated),
    flatLoop: loop ? accumulated === 0 : null
  });
}

/** Convert a FOUR reading to the minimal corresponding witness counts. */
function ascendChargeRecord(reading) {
  const [forTold, againstTold] = sidesOfReading(reading);
  return record(Number(forTold), Number(againstTold));
}

/** Convert bounded witness counts to a FOUR reading. */
function descendRecordCharge(r) {
  if (!r || typeof r !== "object") {
    throw new TypeError("signcell/charge-spin: record must carry original finite tallies");
  }
  return readingOfRecord(record(r.pos, r.neg), "knowledge");
}

/** Reduce counts to the minimum needed to represent their FOUR reading. */
function recordDescentInterior(r) {
  return ascendChargeRecord(descendRecordCharge(r));
}

/** Compare the cell's stated reading with the reading derived from witness counts. */
function chargeRecordTowerOfCell(source) {
  const original = admitCell(source);
  const tallies = recordOf(original);
  const observedCharge = presence(original);
  const minimum = recordDescentInterior(tallies);
  return Object.freeze({
    kind: "signcell.charge-record-tower.v1",
    sourceAddress: address(original),
    sourceCell: original,
    record: tallies,
    observedCharge,
    valuedCharge: knowledgeReading(original),
    measured: measured(original),
    minimumRecord: minimum,
    retainedSurplus: record(tallies.pos - minimum.pos, tallies.neg - minimum.neg)
  });
}

function observationEvidence(supportive, opposing) {
  if (!Array.isArray(supportive) || !Array.isArray(opposing)) {
    throw new TypeError("signcell/charge-spin: for and against must be witness arrays");
  }
  return { for: supportive, against: opposing };
}

const scientificDecimal = /^[+-]?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:e[+-]?(?:0|[1-9][0-9]*))?$/u;

/** Record testimony about an electrical charge quantity for a source cell. */
function electricChargeCell({
  source, predicate, decimal, unit, for: supportive = [], against: opposing = []
} = {}) {
  const original = sourceCell(source, "source");
  if (typeof decimal !== "string" || decimal.length > 160 || !scientificDecimal.test(decimal)) {
    throw new TypeError("signcell/charge-spin: electric charge needs a finite exact decimal text");
  }
  if (unit !== "C" && unit !== "e") {
    throw new TypeError("signcell/charge-spin: physical electric charge unit must be C or e");
  }
  return cell(address(original), predicateName(predicate), Object.freeze({
    kind: "signcell.physical.electric-charge.v1",
    decimal, unit
  }), observationEvidence(supportive, opposing));
}

/** Record testimony about spin quantum numbers in half-integer units. */
function quantumSpinProjectionCell({
  source, predicate, twiceJ, twiceM, basis,
  for: supportive = [], against: opposing = []
} = {}) {
  const original = sourceCell(source, "source");
  if (!Number.isSafeInteger(twiceJ) || twiceJ < 0
      || !Number.isSafeInteger(twiceM) || Math.abs(twiceM) > twiceJ
      || ((twiceJ - twiceM) % 2) !== 0) {
    throw new TypeError("signcell/charge-spin: 2j and 2m must be compatible spin quantum numbers");
  }
  if (typeof basis !== "string" || basis.trim() === "") {
    throw new TypeError("signcell/charge-spin: source-defined spin measurement basis is required");
  }
  return cell(address(original), predicateName(predicate), Object.freeze({
    kind: "signcell.physical.quantum-spin-projection.v1",
    twiceJ, twiceM, basis, unit: "hbar"
  }), observationEvidence(supportive, opposing));
}

export {
  FOUR_SPIN_CYCLE, ascendChargeRecord, chargeRecordTowerOfCell, composeQuarterTurns,
  descendRecordCharge, electricChargeCell, fourSpinLink, fourSpinPath, fourSpinProjectionCell,
  inverseQuarterTurns, quantumSpinProjectionCell, rebaseQuarterTurns, recordDescentInterior,
  rotateFourCharge,
};

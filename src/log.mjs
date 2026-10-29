/**
 * SignChain — the telling log: tellings in the order they were told.
 *
 * A telling is one row: a cell's triple, the side it tells (for or against),
 * and its witness — by default its position in the log, the way an EAVT row's
 * time witnesses its fact. Telling against is information about the same cell
 * (Belnap's "told false"), not the absence of telling for. The log only grows.
 * Read by pattern it gives back rows in order (so "the latest telling about
 * this" is well defined); read as cells it gives the cell set, each cell's
 * sides gathered from its rows. A cell set forgets order; the log keeps it.
 */
import { address, cell, cellSet, coincides, coincidenceKey, knowledgeReading, measured,
  retainedCarrier, semanticId } from "@red-cup-engineering/signcell/cell";
import { signCellOfSeavt } from "@red-cup-engineering/signcell/seavt";
import { admitMessage } from "@red-cup-engineering/signcell/signal";
import { cellEventOfMessage, cellFromCloudEvent } from "@red-cup-engineering/signcell/cloud-events";
import { observedTimeUnixNano } from "@red-cup-engineering/signcell/observability";
import { isAbsoluteSeavtClock, compareAbsoluteSeavtClocks } from "@red-cup-engineering/semiotic-eavt-services-section/admit-seavt-row";
import { readingOfSides } from "@red-cup-engineering/computer-data-engineering-services-section/four";
import { sourceField, sourcePattern } from "./telling-source.mjs";

const ROLES = ["subject", "predicate", "object"];
const SIDES = ["for", "against"];
const matches = (pattern, row) => ROLES.every((role) => !Object.hasOwn(pattern, role) || coincides(pattern[role], row[role]));

/** Index by exactly the canonical SCA coincidence relation used by SignCell.
 * JSON.stringify is not an identity function: NFC-equivalent marks and keys
 * would otherwise be present in the log but absent from indexed queries. */
const keyOf = coincidenceKey;

/** One telling: a triple, the side it tells, and its witness. */
export function telling(at, witness, side = "for", observedAt = undefined) {
  // Do not evaluate role accessors while copying an unadmitted witness.
  const [subject, predicate, object] = ROLES.map((role) => sourceField(at, role));
  for (const [role, term] of [["subject", subject], ["predicate", predicate], ["object", object]])
    if (term === undefined) throw new TypeError(`signchain log: a telling needs a ${role}`);
  if (!SIDES.includes(side)) throw new TypeError(`signchain log: a telling's side is "for" or "against", not ${JSON.stringify(side)}`);
  if (witness === undefined) throw new TypeError("signchain log: a telling must carry a witness");
  // Original SignCell/SCA owns nested terms and witnesses, including bytes.
  return retainedCarrier({ subject, predicate, object, side, witness,
    ...(observedAt === undefined ? {} : { observedAt }) });
}

/** Persisted rows must carry an explicit polarity. A missing side is never "for". */
function persistedTelling(row) {
  const side = sourceField(row, "side", false);
  if (!SIDES.includes(side))
    throw new TypeError("signchain log: persisted telling requires an explicit for/against side");
  return telling(row, sourceField(row, "witness", false), side, sourceField(row, "observedAt", false));
}

/** The cells a list of tellings tells. Unknown/missing sides must never
 * silently become affirmative evidence. */
export const cellsOfRows = (rows) => cellSet(rows.map((row) => {
  const admitted = persistedTelling(row);
  return cell(admitted.subject, admitted.predicate, admitted.object, { [admitted.side]: [admitted.witness] });
}));

/** An append-only log of tellings, optionally sealed as one fixed history. */
export class TellingLog {
  #rows = [];
  #sealed = false;
  // Row positions by each role's term key, so a pattern is read from its narrowest role.
  #byRole = Object.fromEntries(ROLES.map((role) => [role, new Map()]));

  constructor(rows = []) {
    for (const row of rows) this.#push(persistedTelling(row));
  }

  #assertAppendable() {
    if (this.#sealed) throw new TypeError("signchain log: a sealed history cannot receive tellings");
  }

  #push(row) {
    this.#assertAppendable();
    // Obtain every canonical key BEFORE changing rows or indexes. Failure of
    // carrier/key admission must not create a partially indexed telling.
    const keys = ROLES.map(role => keyOf(row[role]));
    this.#assertAppendable(); // preserve reentrant-source safety
    const position = this.#rows.length;
    this.#rows.push(row);
    for (let i = 0; i < ROLES.length; i++) {
      const role = ROLES[i], key = keys[i], positions = this.#byRole[role].get(key);
      if (positions) positions.push(position); else this.#byRole[role].set(key, [position]);
    }
  }

  /** The rows a pattern can match, in order: those under its narrowest role, or all. */
  #candidates(pattern) {
    let narrowest = null;
    for (const role of ROLES) {
      if (!Object.hasOwn(pattern, role)) continue;
      const positions = this.#byRole[role].get(keyOf(pattern[role])) ?? [];
      if (narrowest === null || positions.length < narrowest.length) narrowest = positions;
    }
    return narrowest === null ? this.#rows : narrowest.map((position) => this.#rows[position]);
  }

  /**
   * Read one complete original proposition through the EXISTING role index,
   * with a conservative hard cap on candidate row visits and row allocation.
   * Unlike where/against/cells, this checks the narrowest role bucket's length
   * before constructing any selected array or scanning any of its members.
   *
   * A large bucket containing mostly other propositions may be refused even
   * when the actual matches would fit. This intentional conservative refusal
   * keeps the source inspection bound honest; it cannot prove a time/byte cap
   * for arbitrary-size opaque evidence terms.
   */
  boundedAt(at, maxCandidateReads) {
    if (!Number.isSafeInteger(maxCandidateReads) || maxCandidateReads < 0 ||
        maxCandidateReads > 20000)
      throw new RangeError("signchain log: bounded read requires a candidate limit in [0,20000]");
    const guarded = sourcePattern(at);
    if (!ROLES.every(role => Object.hasOwn(guarded, role) && guarded[role] !== undefined))
      throw new TypeError("signchain log: bounded read requires one complete subject/predicate/object proposition");
    const selected = retainedCarrier({ ...guarded });
    let narrowest = null;
    for (const role of ROLES) {
      const positions = this.#byRole[role].get(keyOf(selected[role])) ?? [];
      if (narrowest === null || positions.length < narrowest.length) narrowest = positions;
    }
    // The index owns the count; no O(N) #candidates(...).map/filter precedes
    // this refusal. This cap is shared across queries by the caller.
    if (narrowest.length > maxCandidateReads)
      throw new RangeError("signchain log: bounded candidate read budget exceeded before materialization");
    const positive = [], negative = [];
    for (const position of narrowest) {
      const row = this.#rows[position];
      if (!matches(selected, row)) continue;
      if (row.side === "for") positive.push(row);
      else negative.push(row);
    }
    return Object.freeze({
      for: Object.freeze(positive),
      against: Object.freeze(negative),
      candidatesInspected: narrowest.length,
      matchedTellings: positive.length + negative.length,
    });
  }

  /** Tell a triple for (witness defaults to the row's position). */
  tell(at, witness = this.#rows.length, observedAt = undefined) { this.#assertAppendable(); this.#push(telling(at, witness, "for", observedAt)); return this; }

  /** Tell a triple against. */
  deny(at, witness = this.#rows.length, observedAt = undefined) { this.#assertAppendable(); this.#push(telling(at, witness, "against", observedAt)); return this; }

  /** Irreversibly finish construction. This same indexed history remains readable. */
  seal() { this.#sealed = true; return Object.freeze(this); }

  /** Whether this log has finished receiving tellings. */
  get sealed() { return this.#sealed; }

  /** The rows, in order. */
  get rows() { return Object.freeze([...this.#rows]); }

  /** How many tellings, repeats included. */
  get size() { return this.#rows.length; }

  // Read and retain a single immutable coordinate snapshot. A query cannot
  // execute a user-defined getter, nor change its predicate between index
  // selection and matching. SignCell still owns canonical nested identities.
  #pattern(input) {
    // sourcePattern intentionally builds a null-prototype inert selector.
    // Original SCA retainedCarrier accepts ordinary Object.prototype records,
    // not that guard representation; copy only its already-vetted own role
    // data into the native carrier without revisiting the untrusted input.
    return retainedCarrier({ ...sourcePattern(input) });
  }

  /** The rows telling for a triple matching a pattern of any of subject, predicate, object, in order. */
  where(pattern = {}) {
    const selected = this.#pattern(pattern);
    return Object.freeze(this.#candidates(selected).filter(row => row.side === "for" && matches(selected, row)));
  }

  /** The rows telling against a triple matching a pattern, in order. */
  against(pattern = {}) {
    const selected = this.#pattern(pattern);
    return Object.freeze(this.#candidates(selected).filter(row => row.side === "against" && matches(selected, row)));
  }

  /** The latest row telling for a pattern, if any. */
  latest(pattern = {}) { const found = this.where(pattern); return found[found.length - 1]; }

  /** The cells (all of them, or those matching a pattern). */
  cells(pattern = {}) {
    const selected = this.#pattern(pattern);
    return Object.freeze(cellsOfRows(this.#candidates(selected).filter(row => matches(selected, row))));
  }

  /** FOUR is a valuation of one proposition, never an aggregation across
   * unrelated cells. Broad where/against queries remain possible for discovery,
   * but asking for a knowledge value requires all three predication terms. */
  readingWhere(input = {}) {
    const source = sourcePattern(input);
    if (!ROLES.every(role => Object.hasOwn(source, role) && source[role] !== undefined))
      throw new TypeError("signchain log: a FOUR reading requires one complete subject/predicate/object proposition");
    // Match #pattern's guard-to-native admission boundary. The original
    // source record is frozen null-prototype, not itself an SCA JSON carrier.
    const selected = retainedCarrier({ ...source });
    const candidates = this.#candidates(selected).filter(row => matches(selected, row));
    return readingOfSides("knowledge",
      candidates.some(row => row.side === "for"),
      candidates.some(row => row.side === "against"));
  }

  /** The knowledge reading at one triple; no early getter-backed coordinate reads. */
  readingAt(at) { return this.readingWhere(at); }
}

/** Tell a triple on the sides given as [for, against]. */
export function tellSides(log, at, [forSide, againstSide]) {
  if (forSide) log.tell(at);
  if (againstSide) log.deny(at);
  return log;
}

/** A cell's knowledge reading, re-exported for readers of the log's cells. */
export { knowledgeReading };

/** Both source readers retain exactly the same original witnessed tellings.
 * Valuation overrides cannot be represented by a telling-only projection. */
function appendWitnesses(log, seen, at, observedAt) {
  if (!measured(at))
    throw new TypeError("signchain log: non-measured SignCell requires a witnessed valuation, not a telling");
  const cellAddress = address(at);
  for (const side of SIDES) for (const witness of at[side]) {
    const key = semanticId([cellAddress, side, witness]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (side === "for") log.tell(at, witness, observedAt);
    else log.deny(at, witness, observedAt);
  }
}

/**
 * Reconstruct the append-only tellings of witnessed SignCells from existing
 * native SEN/SEAVT rows. The SEAVT store remains the authoritative custody;
 * this is a read projection, not a second journal or a new receipt format.
 *
 * The supplied stream must be nondecreasing in the SEAVT observation clock.
 * The optional asOf cut excludes future observations; it does NOT independently
 * establish a source's publication/availability time. Every cell must be
 * Measured: a telling log cannot represent an unwitnessed value override.
 * Repeated cumulative snapshots do not create fresh witnesses.
 */
export function logOfSeavtRows(rows, { asOf } = {}) {
  if (rows == null || typeof rows[Symbol.iterator] !== "function")
    throw new TypeError("signchain log: SEAVT rows must be iterable");
  if (asOf !== undefined && !isAbsoluteSeavtClock(asOf))
    throw new TypeError("signchain log: asOf must be an absolute timestamp");
  const log = new TellingLog(), seen = new Set();
  let preceding = null;
  for (const row of rows) {
    const observedAt = sourceField(row, "t", false);
    if (!isAbsoluteSeavtClock(observedAt))
      throw new TypeError("signchain log: SEAVT observation clock must be absolute");
    if (preceding !== null && compareAbsoluteSeavtClocks(observedAt, preceding) < 0)
      throw new RangeError("signchain log: SEAVT observations must be time-ordered");
    preceding = observedAt;
    // Exact fractional-second filtration: no future witness may cross a cut
    // merely because two distinct instants share a JavaScript millisecond.
    if (asOf !== undefined && compareAbsoluteSeavtClocks(observedAt, asOf) > 0) break;
    const at = signCellOfSeavt(row); // SEN admission and SCA subject verification
    appendWitnesses(log, seen, at, observedAt);
  }
  return log;
}

/**
 * Compare already-admitted CloudEvents by structural JSON member content:
 * object key order is immaterial, while array position and literal text
 * spelling are not. Never use this read-only comparison as an SCA identifier.
 */
function cloudEventComparison(event) {
  const walk = value => {
    if (Array.isArray(value)) return ["array", value.map(walk)];
    if (value !== null && typeof value === "object")
      return ["object", Object.entries(value)
        .sort(([a],[b])=>a<b?-1:a>b?1:0)
        .map(([key,member])=>[key,walk(member)])];
    return ["scalar", value];
  };
  return JSON.stringify(walk(event));
}

/**
 * Read retained native claim-event observations through the existing telling
 * log. The receiver's observation clock selects the cut; the event's asserted
 * occurrence time never makes a later-received witness available earlier.
 *
 * CloudEvents source/id and scalar envelope spelling have exact protocol
 * equality, separate from the SCA coincidence relation of cells and witnesses.
 * Receipt adds no evidence. Conflicting event identities refuse before any
 * result is exposed; complete event history remains in the source messages.
 */
export function logOfCellEventMessages(messages, { asOf } = {}) {
  if (messages == null || typeof messages[Symbol.iterator] !== "function")
    throw new TypeError("signchain log: claim-event messages must be iterable");
  const cut = asOf === undefined ? undefined : BigInt(observedTimeUnixNano(asOf));
  const log = new TellingLog(), seen = new Set(), events = new Map();
  let preceding;
  for (const input of messages) {
    const admitted = admitMessage(input);
    if (!admitted.ok) throw new TypeError(`signchain log: ${admitted.refusal.message}`);
    const message = admitted.value;
    const instant = BigInt(observedTimeUnixNano(message.observedAt));
    if (preceding !== undefined && instant < preceding)
      throw new RangeError("signchain log: claim-event observations must be time-ordered");
    preceding = instant;
    if (cut !== undefined && instant > cut) break;
    const event = cellEventOfMessage(message);
    const eventKey = JSON.stringify([event.source, event.id]);
    // Recursive JSON object order is immaterial; original codepoints are not.
    const content = cloudEventComparison(event);
    if (events.has(eventKey) && events.get(eventKey) !== content) {
      const conflict = new TypeError("signchain log: CloudEvents source/id identifies conflicting envelope content");
      conflict.code = "event-identity-conflict";
      throw conflict;
    }
    events.set(eventKey, content);
    appendWitnesses(log, seen, cellFromCloudEvent(event), message.observedAt);
  }
  return log.seal();
}

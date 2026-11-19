import { hasFields, exactIdentity, isNiUri, readSourceArray, readSourceRecord, retainedCarrier } from "@red-cup-engineering/semiotic-content-address-system";
import { tripleKey } from "@red-cup-engineering/signcell";
import { validateTelling, telling, TellingLog } from "./log.mjs";

const originalKind = "signchain.telling.v1";
const repairKind = "signchain.repair.v1";
const twoSides = events => new Set(events.map(({ row }) => row.side)).size === 2;
const eventOf = body => retainedCarrier({ ...body, id: exactIdentity(body) });

function occurrenceOf(input) {
  if (input === undefined) return {};
  const occurrence = readSourceRecord(input, "telling source occurrence");
  if (!hasFields(occurrence, ["source", "id"]) ||
      [occurrence.source, occurrence.id].some(value => typeof value !== "string" || !value.trim())) {
    throw new TypeError("a telling source occurrence requires nonempty source and id");
  }
  return { occurrence: { source: occurrence.source, id: occurrence.id } };
}

/** Identify a retained exact telling and any independently supplied occurrence. */
export function tellingEvent(row, occurrence) {
  return eventOf({ kind: originalKind, row: validateTelling(row), ...occurrenceOf(occurrence) });
}

function checkEvent(source) {
  const { id, ...body } = retainedCarrier(source);
  if (!isNiUri(id) || exactIdentity(body) !== id) return { id, code: "identity-mismatch" };
  let event;
  try {
    const row = validateTelling(body.row);
    const occurrence = occurrenceOf(body.occurrence);
    if (body.kind === originalKind) event = eventOf({ kind: originalKind, row, ...occurrence });
    if (body.kind === repairKind && Array.isArray(body.over) &&
        body.over.every(isNiUri) && new Set(body.over).size === body.over.length) {
      event = eventOf({ kind: repairKind, row, over: [...body.over].sort(), ...occurrence });
    }
  } catch {
    return { id, code: "invalid-event" };
  }
  return event?.id === id ? { event } : { id, code: "invalid-event" };
}

function conflictingOccurrences(events) {
  const groups = new Map();
  for (const { occurrence, id } of events) {
    if (occurrence === undefined) continue;
    const key = exactIdentity(occurrence);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(id);
  }
  return new Set([...groups.values()].filter(ids => ids.length > 1).flat());
}

function validBasis(basis, byId, proposition) {
  if (!twoSides(basis) || basis.some(event => tripleKey(event.row) !== proposition)) return false;
  const selected = new Set(basis.map(event => event.id));
  const seen = new Set();
  const pending = basis.flatMap(event => event.over ?? []);
  while (pending.length > 0) {
    const id = pending.pop();
    if (selected.has(id)) return false;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const parent of byId.get(id).over ?? []) pending.push(parent);
  }
  return true;
}

/**
 * Union verified events and derive sealed projections in event-address order.
 * Missing bases and conflicting source occurrences remain available for merge.
 * Only admitted repairs can suppress the basis they observed.
 */
export function replayTellingEvents(...histories) {
  const byId = new Map(), findings = [];
  const report = (id, code) => findings.push(Object.freeze({ id: typeof id === "string" ? id : null, code }));
  for (const history of histories) {
    for (const source of readSourceArray(history, "SignChain event history")) {
      try {
        const { event, id, code } = checkEvent(source);
        if (event) byId.set(event.id, event);
        else report(id, code);
      } catch {
        report(null, "invalid-event");
      }
    }
  }

  const events = [...byId.keys()].sort().map(id => byId.get(id));
  const conflicts = conflictingOccurrences(events);
  const remaining = new Map(), dependents = new Map(), ready = [];
  for (const event of events) {
    const basis = event.over ?? [];
    remaining.set(event.id, basis.length);
    if (basis.length === 0) ready.push(event);
    for (const id of basis) {
      if (!dependents.has(id)) dependents.set(id, []);
      dependents.get(id).push(event);
    }
  }

  const validated = new Set(), superseded = new Set();
  for (let index = 0; index < ready.length; index++) {
    const event = ready[index];
    if (conflicts.has(event.id)) {
      report(event.id, "occurrence-conflict");
    } else if (event.over && (!event.over.every(id => validated.has(id)) ||
        !validBasis(event.over.map(id => byId.get(id)), byId, tripleKey(event.row)))) {
      report(event.id, "invalid-repair-basis");
    } else {
      validated.add(event.id);
      for (const id of event.over ?? []) superseded.add(id);
    }
    for (const child of dependents.get(event.id) ?? []) {
      const count = remaining.get(child.id) - 1;
      remaining.set(child.id, count);
      if (count === 0) ready.push(child);
    }
  }
  for (const event of events) {
    if (remaining.get(event.id) > 0) report(event.id,
      conflicts.has(event.id) ? "occurrence-conflict" : "unresolved-repair-basis");
  }

  const active = events.filter(event => validated.has(event.id) && !superseded.has(event.id));
  const originals = events.filter(event => event.kind === originalKind);
  return Object.freeze({
    events: Object.freeze(events),
    active: Object.freeze(active),
    findings: Object.freeze(findings),
    original: new TellingLog(originals.map(event => event.row)).seal(),
    effective: new TellingLog(active.map(event => event.row)).seal(),
  });
}

/** Record the live opposed evidence at one proposition as the scope of a repair. */
export function repairTellingEvent(history, at, side, witness, observedAt, occurrence) {
  if (side !== "for" && side !== "against") {
    throw new TypeError("SignChain repair requires an explicit for/against side");
  }
  const row = telling(at, witness, side, observedAt);
  const proposition = tripleKey(row);
  const basis = replayTellingEvents(history).active.filter(event => tripleKey(event.row) === proposition);
  if (!twoSides(basis)) throw new RangeError("SignChain repair requires a contested cell");
  return eventOf({ kind: repairKind, row, over: basis.map(event => event.id), ...occurrenceOf(occurrence) });
}

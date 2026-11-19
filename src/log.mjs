import { address, admitCell, cell, cellSet, knowledgeReading, measured } from "@red-cup-engineering/signcell";
import {
  coincidenceKey, exactIdentity, readSourceArray, readSourceRecord, retainedCarrier,
} from "@red-cup-engineering/semiotic-content-address-system";
import { readingOfSides } from "@red-cup-engineering/metrologic/four";
import { sourcePattern } from "./telling-source.mjs";

const roles = ["subject", "predicate", "object"];
const sides = ["for", "against"];

function rowOf({ subject, predicate, object }, witness, side, observedAt) {
  if ([subject, predicate, object].includes(undefined)) {
    throw new TypeError("a SignChain telling requires subject, predicate and object");
  }
  if (!sides.includes(side)) throw new TypeError("a SignChain telling requires an explicit for/against side");
  if (witness === undefined) throw new TypeError("a SignChain telling requires a witness");
  return retainedCarrier({ subject, predicate, object, side, witness,
    ...(observedAt === undefined ? {} : { observedAt }) });
}

/** Read the predication once, then retain the supplied witness and observation time. */
export function telling(at, witness, side = "for", observedAt) {
  return rowOf(readSourceRecord(at, "telling proposition"), witness, side, observedAt);
}

/** Persisted rows supply their own explicit polarity. */
export function validateTelling(input) {
  const row = readSourceRecord(input, "persisted telling");
  return rowOf(row, row.witness, row.side, row.observedAt);
}

function cellOfRow(row) {
  return cell(row.subject, row.predicate, row.object, { [row.side]: [row.witness] });
}

/** Project ordered testimony into a SignCell set. */
export function cellsOfRows(rows) {
  return cellSet(readSourceArray(rows, "telling rows").map(row => cellOfRow(validateTelling(row))));
}

/** An ordered append-only history, optionally sealed for repeatable reads. */
export class TellingLog {
  #entries = [];
  #index = roles.map(() => new Map());
  #sealed = false;

  constructor(rows = []) {
    for (const row of readSourceArray(rows, "telling history")) this.#append(validateTelling(row));
  }

  #assertAppendable() {
    if (this.#sealed) throw new TypeError("a sealed SignChain history cannot receive tellings");
  }

  #append(row) {
    const keys = roles.map(role => coincidenceKey(row[role]));
    this.#assertAppendable();
    const position = this.#entries.length;
    this.#entries.push({ row, keys });
    for (const [index, key] of keys.entries()) {
      const positions = this.#index[index].get(key);
      if (positions) positions.push(position);
      else this.#index[index].set(key, [position]);
    }
    return this;
  }

  #select(input, complete = false) {
    const pattern = sourcePattern(input);
    if (complete && roles.some(role => pattern[role] === undefined)) {
      throw new TypeError("a SignChain evidence reading requires one complete subject/predicate/object proposition");
    }
    const terms = [];
    let positions;
    for (const [index, role] of roles.entries()) {
      if (!Object.hasOwn(pattern, role)) continue;
      const key = coincidenceKey(pattern[role]);
      terms.push([index, key]);
      const bucket = this.#index[index].get(key) ?? [];
      if (positions === undefined || bucket.length < positions.length) positions = bucket;
    }
    return { positions, terms };
  }

  *#matches({ positions, terms }, side) {
    for (const position of positions ?? this.#entries.keys()) {
      const { keys, row } = this.#entries[position];
      if ((side === undefined || row.side === side) && terms.every(([index, key]) => keys[index] === key)) {
        yield row;
      }
    }
  }

  /** Refuse an over-budget indexed bucket before visiting or materializing any rows. */
  boundedAt(at, maxCandidateReads) {
    if (!Number.isSafeInteger(maxCandidateReads) || maxCandidateReads < 0 || maxCandidateReads > 20_000) {
      throw new RangeError("a SignChain bounded read requires a candidate limit in [0,20000]");
    }
    const selection = this.#select(at, true);
    const candidatesInspected = selection.positions.length;
    if (candidatesInspected > maxCandidateReads) {
      throw new RangeError("SignChain bounded candidate read budget exceeded before materialization");
    }
    const bySide = { for: [], against: [] };
    for (const row of this.#matches(selection)) bySide[row.side].push(row);
    return Object.freeze({
      for: Object.freeze(bySide.for), against: Object.freeze(bySide.against),
      candidatesInspected, matchedTellings: bySide.for.length + bySide.against.length,
    });
  }

  tell(at, witness = this.size, observedAt) {
    this.#assertAppendable();
    return this.#append(telling(at, witness, "for", observedAt));
  }

  deny(at, witness = this.size, observedAt) {
    this.#assertAppendable();
    return this.#append(telling(at, witness, "against", observedAt));
  }

  /** Seal the history and keep the same indexed readout. */
  seal() { this.#sealed = true; return Object.freeze(this); }
  get sealed() { return this.#sealed; }
  get rows() { return Object.freeze(this.#entries.map(({ row }) => row)); }
  get size() { return this.#entries.length; }

  where(pattern = {}) { return Object.freeze([...this.#matches(this.#select(pattern), "for")]); }
  against(pattern = {}) { return Object.freeze([...this.#matches(this.#select(pattern), "against")]); }
  latest(pattern = {}) { return this.where(pattern).at(-1); }

  cells(pattern = {}) {
    return cellSet(Array.from(this.#matches(this.#select(pattern)), cellOfRow));
  }

  /** Read FOUR on one complete proposition, including both witnessed polarities. */
  readingWhere(at = {}) {
    const selected = this.#select(at, true);
    let support = false, opposition = false;
    for (const { side } of this.#matches(selected)) {
      if (side === "for") support = true;
      else opposition = true;
      if (support && opposition) break;
    }
    return readingOfSides("knowledge", support, opposition);
  }

  readingAt(at) { return this.readingWhere(at); }
}

export function tellSides(log, at, [support, opposition]) {
  if (support) log.tell(at);
  if (opposition) log.deny(at);
  return log;
}

export { knowledgeReading };

/** Append each exact witness of an admitted measured cell once per caller-owned receipt set. */
export function appendCellWitnesses(log, seen, input, observedAt) {
  const at = admitCell(input);
  if (!measured(at)) throw new TypeError("a SignChain telling requires measured SignCell evidence");
  const id = address(at);
  for (const side of sides) for (const witness of at[side]) {
    const key = exactIdentity([id, side, witness]);
    if (seen.has(key)) continue;
    if (side === "for") log.tell(at, witness, observedAt);
    else log.deny(at, witness, observedAt);
    seen.add(key);
  }
}

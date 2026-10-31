/**
 * Read an outer source row through native SignCell/SCA admission.
 * This is NOT a new canonical carrier, address, schema or journal. Nested
 * semiotic terms and original witness bytes belong to SignCell.
 * JavaScript Proxy traps cannot be made inert by an in-process library.
 */
import { readSourceRecord } from "@red-cup-engineering/signcell/cell";

const sourceRecord = source => {
  try { return readSourceRecord(source, "signchain log: source row"); }
  catch (cause) {
    throw new TypeError("signchain log: a source row must be a plain record; every field must be an enumerable data property, not a foreign accessor", { cause });
  }
};

export function sourceField(source, name, required = true) {
  const row = sourceRecord(source);
  if (!Object.hasOwn(row, name)) {
    if (!required) return undefined;
    throw new TypeError(`signchain log: a source row needs an own ${name} data property`);
  }
  return row[name];
}

/**
 * Retain one snapshot of a query's own predication coordinates before any
 * canonical lookup. Unknown auxiliary fields are not selectors. This outer
 * descriptor guard does not reimplement SignCell's nested semantic carrier.
 */
export function sourcePattern(source) {
  const row = sourceRecord(source);
  // A plain record: SignCell retains only ordinary data records, and only these three names are defined.
  const selected = {};
  for (const name of ["subject", "predicate", "object"]) {
    if (!Object.hasOwn(row, name)) continue;
    Object.defineProperty(selected, name, { value: row[name], enumerable: true });
  }
  return Object.freeze(selected);
}

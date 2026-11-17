import { readSourceRecord } from "@red-cup-engineering/semiotic-content-address-system";

const coordinates = ["subject", "predicate", "object"];

function sourceRecord(input) {
  return readSourceRecord(input, "SignChain source row");
}

/** Read one named field from admitted own data. */
export function sourceField(input, name, required = true) {
  const row = sourceRecord(input);
  if (required && !Object.hasOwn(row, name)) {
    throw new TypeError(`SignChain source row needs an own ${name} data property`);
  }
  return row[name];
}

/** Select the supplied predication coordinates from one inert record. */
export function sourcePattern(input) {
  const row = sourceRecord(input);
  return Object.freeze(Object.fromEntries(
    coordinates.filter(name => Object.hasOwn(row, name)).map(name => [name, row[name]]),
  ));
}

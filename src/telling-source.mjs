/**
 * Read an outer source row by descriptor before native SignCell/SCA admission.
 * This is NOT a new canonical carrier, address, schema or journal. Nested
 * semiotic terms and original witness bytes belong to SignCell.
 * JavaScript Proxy traps cannot be made inert by an in-process library.
 */
export function sourceField(source, name, required = true) {
  if (source === null || typeof source !== "object" || Array.isArray(source))
    throw new TypeError("signchain log: a source row must be a plain record");
  const prototype = Object.getPrototypeOf(source);
  if (prototype !== Object.prototype && prototype !== null)
    throw new TypeError("signchain log: a source row must be a plain record");
  const field = Object.getOwnPropertyDescriptor(source, name);
  if (!field) {
    if (!required) return undefined;
    throw new TypeError(`signchain log: a source row needs an own ${name} data property`);
  }
  if (!Object.hasOwn(field, "value") || !field.enumerable)
    throw new TypeError(`signchain log: ${name} must be an enumerable data property, not an accessor`);
  return field.value;
}

/**
 * Retain one snapshot of a query's own predication coordinates before any
 * canonical lookup. Unknown auxiliary fields are not selectors. This outer
 * descriptor guard does not reimplement SignCell's nested semantic carrier.
 */
export function sourcePattern(source) {
  if (source === null || typeof source !== "object" || Array.isArray(source) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(source)))
    throw new TypeError("signchain log: a query pattern must be a plain record");
  // A plain record: SignCell retains only ordinary data records, and only these three names are defined.
  const selected = {};
  for (const name of ["subject", "predicate", "object"]) {
    const field = Object.getOwnPropertyDescriptor(source, name);
    if (field === undefined) continue;
    if (!Object.hasOwn(field, "value") || !field.enumerable)
      throw new TypeError(`signchain log: query ${name} must be an enumerable data property, not an accessor`);
    Object.defineProperty(selected, name, { value: field.value, enumerable: true });
  }
  return Object.freeze(selected);
}

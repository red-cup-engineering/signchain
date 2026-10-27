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

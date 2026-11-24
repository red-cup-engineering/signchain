

/** Inert lens declaration. The listed preserves/hides are claims to verify at a receiver, not an applied projection or preservation proof. */
export function observationalLens(spec) {
  return Object.freeze({
    ...spec,
    preserves: Object.freeze([...spec.preserves]),
    hides: Object.freeze([...spec.hides]),
  });
}

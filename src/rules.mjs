/**
 * SignChain — rules and the immediate-consequence step over cell sets.
 *
 * A rule has positive threshold antecedents — "this cell reads at least this
 * point in the knowledge order" — and one consequent: a cell and the point it
 * tells it (Fitting 1991: logic programs over bilattices, valued in the
 * knowledge order). Firing a rule tells its consequent with a derivation as the
 * witness: the rule's content identity, name and the addresses of its premises. So every
 * derived telling is content-addressed back to what licensed it — the chain.
 * The rule language has no negation: an antecedent reading told against is a
 * threshold on the cell's against side, and a consequent told against tells
 * that side.
 *
 * `step` is Fitting's immediate-consequence operator T(v) = v ⊔ fire(v): monotone
 * and inflationary in the knowledge order. Repeating a derivation tells the same
 * witness again, which the evidence sets absorb, so iterating T on finitely many
 * rules reaches its least fixed point above the seed.
 */
import { address, cell, cellSet, knowledgeReading, merge, mergeCellSets, semanticId, triple } from "@red-cup-engineering/signcell/cell";
import { isReading, sidesOfReading, knowledgeLeqReading } from "@red-cup-engineering/computer-data-engineering-services-section/four";
import { sourceField } from "./telling-source.mjs";

/** Index one functional valuation, joining repeated tellings of the SAME cell
 * through SignCell rather than letting first/last insertion order choose which
 * evidence can license a derivation. Public readers accept either cell arrays
 * or Maps of addressed cells; Map keys are untrusted here, so derive addresses
 * from their values. SignCraft's already-admitted index goes directly to
 * fireRuleIn without rebuilding this index. */
function indexValuation(valuation) {
  const indexed = new Map();
  for (const at of valuation instanceof Map ? valuation.values() : valuation) {
    const key = address(at), prior = indexed.get(key);
    indexed.set(key, prior === undefined ? at : merge(prior, at));
  }
  return indexed;
}
const indexedCellAtTriple = (valuation, at) => valuation.get(address(at)) ?? cell(at.subject, at.predicate, at.object);
const validateDerivationVersion = (version) => {
  if (version !== 1 && version !== 2) throw new TypeError("signchain derivation: unsupported version");
};

/** Read one source triple through original SignCell retained-carrier custody.
 * SourceField is a descriptor guard, not a competing schema or content hash.
 */
const ruleTriple = source => triple({
  subject: sourceField(source, "subject"),
  predicate: sourceField(source, "predicate"),
  object: sourceField(source, "object"),
});

/** A finite rule antecedent is an inert, dense data array. The outer
 * positional guards run BEFORE invoking any source predicate or Cell encoder.
 */
const ruleConditions = value => {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
    throw new TypeError("signchain rule: antecedent needs a finite plain array");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(descriptors).length !== value.length + 1)
    throw new TypeError("signchain rule: antecedent cannot be sparse or decorated");
  const out = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = descriptors[String(index)];
    if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, "value"))
      throw new TypeError("signchain rule: antecedent entries must be inert data");
    out.push(descriptor.value);
  }
  return out;
};

/** One original source-qualified positive rule. Each condition's cell and
 * reading is captured once, then the immutable SignCell triple is admitted.
 * This does NOT authenticate the provenance or issuer of a rule.
 */
export function rule(name, antecedent, consequent) {
  if (typeof name !== "string" || name === "")
    throw new TypeError("signchain rule: name must be a non-empty string");
  const conditions = ruleConditions(antecedent).map(condition => {
    const atLeast = sourceField(condition, "atLeast");
    const originalCell = sourceField(condition, "cell");
    if (!isReading(atLeast))
      throw new TypeError("signchain rule: condition must have a valid knowledge reading");
    return Object.freeze({cell: ruleTriple(originalCell), atLeast});
  });
  const originalConsequence = sourceField(consequent, "cell");
  const reading = sourceField(consequent, "reading");
  if (!isReading(reading))
    throw new TypeError("signchain rule: consequent must have a valid knowledge reading");
  return Object.freeze({
    kind: "signchain.rule",
    name,
    antecedent: Object.freeze(conditions),
    consequent: Object.freeze({ cell: ruleTriple(originalConsequence), reading }),
  });
}

/** A rule with no antecedent: it always tells its consequent. */
export const always = (at, reading) => {
  const origin = ruleTriple(at);
  return rule(`always:${address(origin)}:${reading}`, [], { cell: origin, reading });
};

/** Shared addressed rule judgment for public arrays and SignCraft Maps. */
const antecedentHoldsIn = (r, valuation) => r.antecedent.every((condition) =>
  knowledgeLeqReading(condition.atLeast, knowledgeReading(indexedCellAtTriple(valuation, condition.cell))));
/** Whether every antecedent holds after repeated source tellings are merged. */
export const antecedentHolds = (r, valuation) => antecedentHoldsIn(r, indexValuation(valuation));

/** A stable witness per rule, including thresholds, conclusion and evidence lane in its identity.
 * Version 1 is retained only to replay historical settlements; it identifies labels and premise
 * addresses, not the complete license. Neither version is a signature or authenticates an issuer. */
export function derivation(r, version = 2) {
  validateDerivationVersion(version);
  return Object.freeze({
    rule: r.name,
    from: Object.freeze(r.antecedent.map((condition) => address(condition.cell))),
    ...(version === 2 ? { ruleId: semanticId(r) } : {}),
  });
}

/** What one rule tells in a valuation: its consequent cell, on the sides its reading tells, witnessed by
 *  its derivation; nothing if its antecedent fails. */
export function fireRule(r, valuation, derivationVersion = 2) {
  return fireRuleIn(r, indexValuation(valuation), derivationVersion);
}

/** Fire against an addressed valuation. Settlement can reuse this index across stages. */
export function fireRuleIn(r, valuation, derivationVersion = 2) {
  validateDerivationVersion(derivationVersion);
  if (!antecedentHoldsIn(r, valuation)) return cellSet();
  const [forTold, againstTold] = sidesOfReading(r.consequent.reading);
  const witness = derivation(r, derivationVersion), at = r.consequent.cell;
  if (!forTold && !againstTold) return cellSet();
  return cellSet([cell(at.subject, at.predicate, at.object, { for: forTold ? [witness] : [], against: againstTold ? [witness] : [] })]);
}

/** Everything the rules tell in a valuation. */
export function fire(rules, valuation) {
  const indexed = indexValuation(valuation);
  const tellings = [];
  for (const r of rules) {
    tellings.push(...fireRuleIn(r, indexed));
  }
  return cellSet(tellings);
}

/** The immediate-consequence step: the valuation joined with what its rules tell. */
export const step = (rules, valuation) => mergeCellSets(valuation, fire(rules, valuation));

/** The names of the rules whose antecedents hold. */
export const firedRuleNames = (rules, valuation) => {
  const indexed = indexValuation(valuation);
  return Object.freeze(rules.filter((r) => antecedentHoldsIn(r, indexed)).map((r) => r.name));
};

import {
  address, admitCell, admitTriple, cell, cellSet, knowledgeReading, merge, mergeCellSets,
} from "@red-cup-engineering/signcell";
import {
  hasFields, readSourceArray, readSourceRecord, semanticId,
} from "@red-cup-engineering/semiotic-content-address-system";
import {
  isReading, knowledgeBottom, knowledgeLeqReading, sidesOfReading,
} from "@red-cup-engineering/metrologic/four";

const validatedRules = new WeakSet();
const kind = "signchain.rule";

function conditionOf(input, position) {
  const record = readSourceRecord(input, "rule clause");
  if (!isReading(record[position])) throw new TypeError("a rule clause requires a valid FOUR reading");
  return Object.freeze({ cell: admitTriple(record.cell), [position]: record[position] });
}

/** Admit a finite family of threshold clauses and one consequence. */
export function rule(name, antecedent, consequent) {
  if (typeof name !== "string" || name === "") throw new TypeError("a SignChain rule needs a nonempty name");
  const at = Object.freeze({
    kind, name,
    antecedent: Object.freeze(readSourceArray(antecedent, "rule antecedent").map(at => conditionOf(at, "atLeast"))),
    consequent: conditionOf(consequent, "reading"),
  });
  validatedRules.add(at);
  return at;
}

export const always = (at, reading) => rule(`always:${address(at)}:${reading}`, [], { cell: at, reading });

/** Receive a stored rule through the same admission used by its constructor. */
export function admitRule(input) {
  if (validatedRules.has(input)) return input;
  const source = readSourceRecord(input, "stored SignChain rule");
  if (!hasFields(source, ["kind", "name", "antecedent", "consequent"]) || source.kind !== kind) {
    throw new TypeError("a SignChain rule requires the exact original rule fields");
  }
  return rule(source.name, source.antecedent, source.consequent);
}

export const admitRules = input => Object.freeze(readSourceArray(input, "rule family").map(admitRule));

function indexValuation(input) {
  const index = new Map();
  const source = input instanceof Map ? Map.prototype.values.call(input) : readSourceArray(input, "rule valuation");
  for (const raw of source) {
    const value = admitCell(raw);
    const key = address(value), previous = index.get(key);
    index.set(key, previous === undefined ? value : merge(previous, value));
  }
  return index;
}

function readingAt(valuation, at) {
  const key = address(at);
  if (!Map.prototype.has.call(valuation, key)) return knowledgeBottom();
  const value = admitCell(Map.prototype.get.call(valuation, key));
  if (address(value) !== key) throw new TypeError("a rule premise differs from its valuation coordinate");
  return knowledgeReading(value);
}

const holds = (rule, valuation) => rule.antecedent.every(({ cell, atLeast }) =>
  knowledgeLeqReading(atLeast, readingAt(valuation, cell)));

export const antecedentHolds = (rule, valuation) => holds(admitRule(rule), indexValuation(valuation));

function requireDerivationVersion(version) {
  if (version !== 1 && version !== 2) throw new TypeError("unsupported SignChain derivation version");
}

function witnessOf(rule, version) {
  return Object.freeze({
    rule: rule.name,
    from: Object.freeze(rule.antecedent.map(condition => address(condition.cell))),
    ...(version === 2 ? { ruleId: semanticId(rule) } : {}),
  });
}

/** Project the original v1 premise trace or v2 full rule commitment. */
export function derivation(input, version = 2) {
  requireDerivationVersion(version);
  return witnessOf(admitRule(input), version);
}

function applyRule(rule, valuation, version) {
  if (!holds(rule, valuation)) return Object.freeze([]);
  const [support, opposition] = sidesOfReading(rule.consequent.reading);
  if (!support && !opposition) return Object.freeze([]);
  const witness = witnessOf(rule, version);
  const { subject, predicate, object } = rule.consequent.cell;
  return Object.freeze([cell(subject, predicate, object, {
    for: support ? [witness] : [], against: opposition ? [witness] : [],
  })]);
}

/** Apply a rule against an addressed valuation, validating each consulted premise. */
export function fireRuleIn(input, valuation, version = 2) {
  requireDerivationVersion(version);
  if (!(valuation instanceof Map)) throw new TypeError("an indexed rule valuation requires a Map");
  return applyRule(admitRule(input), valuation, version);
}

export function fireRule(input, valuation, version = 2) {
  return fireRuleIn(input, indexValuation(valuation), version);
}

const consequences = (rules, index) => cellSet(admitRules(rules).flatMap(rule => applyRule(rule, index, 2)));

export function fire(rules, valuation) {
  return consequences(rules, indexValuation(valuation));
}

/** Join the current valuation with the immediate consequences of all admitted rules. */
export function step(rules, valuation) {
  const index = indexValuation(valuation);
  return mergeCellSets([...index.values()], consequences(rules, index));
}

export function firedRuleNames(rules, valuation) {
  const index = indexValuation(valuation);
  return Object.freeze(admitRules(rules).filter(rule => holds(rule, index)).map(rule => rule.name));
}

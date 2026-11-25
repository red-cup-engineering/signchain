import {
  address, admitCell, admitTriple, cell, cellSet, knowledgeReading, merge, mergeCellSets,
} from "@red-cup-engineering/signcell";
import {
  hasFields, readSourceArray, readSourceRecord, semanticId,
} from "@red-cup-engineering/semiotic-content-address-system";
import {
  isReading, knowledgeBottom, knowledgeLeqReading, sidesOfReading,
} from "@red-cup-engineering/metrologic/four";

const admittedRules = new WeakSet();
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
  admittedRules.add(at);
  return at;
}

export const always = (at, reading) => rule(`always:${address(at)}:${reading}`, [], { cell: at, reading });

/** Receive a stored rule through the same admission used by its constructor. */
export function parseRule(input) {
  if (admittedRules.has(input)) return input;
  const source = readSourceRecord(input, "stored SignChain rule");
  if (!hasFields(source, ["kind", "name", "antecedent", "consequent"]) || source.kind !== kind) {
    throw new TypeError("a SignChain rule requires the exact original rule fields");
  }
  return rule(source.name, source.antecedent, source.consequent);
}

export const parseRules = input => Object.freeze(readSourceArray(input, "rule family").map(parseRule));

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

export const antecedentHolds = (rule, valuation) => holds(parseRule(rule), indexValuation(valuation));

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
  return witnessOf(parseRule(input), version);
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
  return applyRule(parseRule(input), valuation, version);
}

export function fireRule(input, valuation, version = 2) {
  return fireRuleIn(input, indexValuation(valuation), version);
}

const consequences = (rules, index) => cellSet(parseRules(rules).flatMap(rule => applyRule(rule, index, 2)));

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
  return Object.freeze(parseRules(rules).filter(rule => holds(rule, index)).map(rule => rule.name));
}

/**
 * Abduction: the rules whose consequence would satisfy a goal, with what each one still needs.
 * The goal is `{ cell, atLeast }`: the cell and the least reading wanted of it. A rule is a
 * candidate when its consequent is that cell at a reading covering `atLeast`; each of its clauses is
 * reported `present` (the valuation already reads at least the clause's threshold) or `missing`.
 */
export function abduce(rules, valuation, goal) {
  return abduceIn(parseRules(rules), indexValuation(valuation), conditionOf(goal, "atLeast"));
}

function abduceIn(rules, index, goal) {
  const wanted = address(goal.cell);
  return Object.freeze(rules
    .filter(rule => address(rule.consequent.cell) === wanted
      && knowledgeLeqReading(goal.atLeast, rule.consequent.reading))
    .map(rule => {
      const needed = Object.freeze(rule.antecedent.map(({ cell, atLeast }) => Object.freeze({
        cell, atLeast, status: knowledgeLeqReading(atLeast, readingAt(index, cell)) ? "present" : "missing",
      })));
      return Object.freeze({
        rule: rule.name, needed, satisfied: needed.every(clause => clause.status === "present"),
      });
    }));
}

/**
 * Backward chaining: a proof tree for a goal `{ cell, atLeast }` by recursive abduction. The
 * root's `source` is `fact` (the valuation already reads it), `derived` (some candidate rule has
 * every clause proved; its `children` list each candidate with its clause proofs), `cycle`,
 * `depth-limit`, or `failed`.
 */
export function prove(rules, valuation, goal, { maxDepth = 16 } = {}) {
  return proveIn(parseRules(rules), indexValuation(valuation), conditionOf(goal, "atLeast"), new Set(), 0, maxDepth);
}

function proveIn(rules, index, goal, path, depth, maxDepth) {
  const claim = Object.freeze({ cell: goal.cell, atLeast: goal.atLeast });
  const key = `${address(goal.cell)}\u0000${goal.atLeast}`;
  if (knowledgeLeqReading(goal.atLeast, readingAt(index, goal.cell))) return Object.freeze({ source: "fact", claim });
  if (path.has(key)) return Object.freeze({ source: "cycle", claim });
  if (depth >= maxDepth) return Object.freeze({ source: "depth-limit", claim });
  const candidates = abduceIn(rules, index, goal);
  if (candidates.length === 0) return Object.freeze({ source: "failed", claim });
  const inside = new Set(path).add(key);
  const children = candidates.map(candidate => {
    const clauses = candidate.needed.map(clause => proveIn(rules, index, clause, inside, depth + 1, maxDepth));
    return Object.freeze({
      rule: candidate.rule, clauses: Object.freeze(clauses),
      satisfied: clauses.every(clause => clause.source === "fact" || clause.source === "derived"),
    });
  });
  return Object.freeze({
    source: children.some(child => child.satisfied) ? "derived" : "failed", claim, children: Object.freeze(children),
  });
}

// Names exported by previous package releases.
export { parseRule as admitRule, parseRules as admitRules };

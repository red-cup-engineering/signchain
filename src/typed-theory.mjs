/**
 * predicating/typed-theory — consequence over predication base objects.
 *
 * The logic generated inside predicating: inference morphisms (specialization,
 * converse, subject/object projection) over base objects, inference rules and
 * their composition closure, breadth-first derivation search, typing judgments
 * (is the conclusion derivable from the premise?), derivation validity checking,
 * and predicate words (composition of predicates along a path). Self-contained
 * over predication coincidence and the exact `count`/`natZero`.
 */
import * as signCellPredication from "@red-cup-engineering/signcell/predication";
import { readSourceArray, readSourceRecord } from "@red-cup-engineering/signcell/cell";
const { baseObjectCoincides, predicateCoincides, termCoincides, isSpecializationMorphism } = signCellPredication;
// The heterogeneous categorical source-node sort belongs to SignCell. A
// 3-element array can itself be the value of a Mark, so this consumer must
// NEVER independently mint source-node arrays by shape alone.
const nodeOfOriginalCell = (at) => {
    const sourceConstructor = signCellPredication.predicationBaseNodeOf;
    if (typeof sourceConstructor !== "function")
        throw new TypeError("typed theory: pinned SignCell lacks source-owned base-node construction");
    return sourceConstructor(at);
};
import { count, natZero } from "@red-cup-engineering/metrologic/number/exact-number";
/** Build a cell from subject, predicate, object. */
export const cellOf = (subject, predicate, object) => ({ subject, predicate, object });
const inferenceRule = (morphism, domain, codomain, trace = inferenceTrace([morphism])) => Object.freeze({ kind: "typedTheory.inferenceRule", domain, trace, codomain });
/** Frozen specialization inference morphism. */
export const specializationInferenceMorphism = Object.freeze({ kind: "typedTheory.inferenceMorphism.specialization" });
/** Frozen converse inference morphism. */
export const converseInferenceMorphism = Object.freeze({ kind: "typedTheory.inferenceMorphism.converse" });
/** Frozen subject projection inference morphism. */
export const subjectProjectionInferenceMorphism = Object.freeze({ kind: "typedTheory.inferenceMorphism.subjectProjection" });
/** Frozen object projection inference morphism. */
export const objectProjectionInferenceMorphism = Object.freeze({ kind: "typedTheory.inferenceMorphism.objectProjection" });
/** A frozen inference trace from a sequence of morphisms. */
export function inferenceTrace(morphisms) {
    return Object.freeze({ kind: "typedTheory.inferenceTrace", morphisms: Object.freeze([...morphisms]) });
}
/** One bounded, inert source-array admission for the two original
 * theory-producing readers. It does NOT qualify a Cell's witness, actor or
 * predicate; SignCell remains the source owner for those representations.
 * A caller iterator must not manufacture inference-rule positions. */
function finiteSourceArray(items, role) {
    return readSourceArray(items, "typed theory: " + role);
}
/** Derive inference rules from bounded original predication sources.
 * A Cell is first made a SOURCE-ISSUED SignCell node; its two projection
 * endpoints come from THAT immutable node, never a second raw caller read. */
export function inferenceRules(witnesses) {
    const out = [];
    for (const witness of finiteSourceArray(witnesses, "witnesses")) {
        if (isSpecializationMorphism(witness)) {
            // SignCell's original structural guard has already required
            // inert own domain/codomain fields; read their descriptors once.
            const domain = Object.getOwnPropertyDescriptor(witness, "domain").value;
            const codomain = Object.getOwnPropertyDescriptor(witness, "codomain").value;
            out.push(inferenceRule(specializationInferenceMorphism, domain, codomain));
        } else {
            const node = nodeOfOriginalCell(witness);
            const converse = nodeOfOriginalCell({
                subject: node[2], predicate: node[1], object: node[0],
            });
            out.push(inferenceRule(converseInferenceMorphism, node, converse));
            out.push(inferenceRule(subjectProjectionInferenceMorphism, node, node[0]));
            out.push(inferenceRule(objectProjectionInferenceMorphism, node, node[2]));
        }
    }
    return Object.freeze(out);
}
const ruleOfBaseEdge = (morphism) => (edge) => inferenceRule(morphism, edge.domain, edge.codomain);
/** Build a typed theory from a SOURCE-CLOSED predication generator base.
 * One SignCell base generator may not become a derivation morphism if either of
 * its endpoints is absent from the original declared object carrier.
 * Use the canonical SignCell baseObjectCoincides; no Graph-local equality,
 * new hash, silently invented endpoint, or automatic logical completion.
 * The base's entity extraction arrows are distinct from homogeneous cellwise
 * four-generator projections in Obsmetrologia Predicating/Cell.lean.
 */
export function theoryOfBase(base) {
    // Source qualification is an exact in-process producer receipt, not a
    // kind string or mathematical graph-shape test. A JSON replica must be
    // regenerated using the original SignCell constructors first.
    // Older, still-pinned SignCell distributions may lack this newer
    // construction-origin capability. Refuse this operation rather than
    // breaking every other typed-theory import or accepting a forged base.
    const sourceGuard = signCellPredication.isAdmittedPredicationBase;
    if (typeof sourceGuard !== "function")
        throw new TypeError("typed theory: source owner lacks predication-base construction admission");
    if (!sourceGuard(base))
        throw new TypeError("typed theory: source must be an originally constructed SignCell predication.base");
    const own = (record, name) => {
        if (!record || typeof record !== "object" || Array.isArray(record))
            throw new TypeError("typed theory: source base must contain original records");
        const descriptor = Object.getOwnPropertyDescriptor(record, name);
        if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, "value"))
            throw new TypeError("typed theory: source " + name + " must be an own data property");
        return descriptor.value;
    };
    if (own(base, "kind") !== "predication.base")
        throw new TypeError("typed theory: source must be the original SignCell predication.base");
    const objects = finiteSourceArray(own(base, "objects"), "objects");
    const categories = [
        ["specialization", specializationInferenceMorphism],
        ["converse", converseInferenceMorphism],
        ["subjectProjection", subjectProjectionInferenceMorphism],
        ["objectProjection", objectProjectionInferenceMorphism],
    ];
    const rules = [];
    for (const [name, morphism] of categories) {
        for (const edge of finiteSourceArray(own(base, name), name)) {
            const domain = own(edge, "domain"), codomain = own(edge, "codomain");
            for (const endpoint of [domain, codomain]) {
                if (!objects.some(object => baseObjectCoincides(object, endpoint)))
                    throw new TypeError("typed theory: source " + name +
                        " has an undeclared base morphism endpoint");
            }
            rules.push(inferenceRule(morphism, domain, codomain));
        }
    }
    return Object.freeze({
        kind: "typedTheory.carrier", objects,
        rules: Object.freeze(rules),
    });
}
/** Build a typed theory from predication data. */
export function theoryOfData(data) {
    const rules = inferenceRules(data);
    const objects = [];
    for (const rule of rules) {
        if (!objects.some((object) => baseObjectCoincides(object, rule.domain)))
            objects.push(rule.domain);
        if (!objects.some((object) => baseObjectCoincides(object, rule.codomain)))
            objects.push(rule.codomain);
    }
    return Object.freeze({ kind: "typedTheory.carrier", objects: Object.freeze(objects), rules });
}
/** Compare two inference morphisms (by kind). */
export function inferenceMorphismIdentity(left, right) {
    return left.kind === right.kind
        ? Object.freeze({ kind: "typedTheory.inferenceMorphismIdentity:witness", left, right })
        : Object.freeze({ kind: "typedTheory.inferenceMorphismIdentity-obstruction", left, right });
}
const inferenceMorphismsCoincide = (left, right) => inferenceMorphismIdentity(left, right).kind === "typedTheory.inferenceMorphismIdentity:witness";
const sameTrace = (left, right) => left.morphisms.length === right.morphisms.length && left.morphisms.every((morphism, index) => inferenceMorphismsCoincide(morphism, right.morphisms[index]));
function inferenceRulesCoincide(left, right) {
    return baseObjectCoincides(left.domain, right.domain) && baseObjectCoincides(left.codomain, right.codomain) && sameTrace(left.trace, right.trace);
}
/** Compare two inference rules (domain, codomain, trace). */
export function inferenceRuleIdentity(left, right) {
    return inferenceRulesCoincide(left, right)
        ? Object.freeze({ kind: "typedTheory.inferenceRuleIdentity:witness", left, right })
        : Object.freeze({ kind: "typedTheory.inferenceRuleIdentity-obstruction", left, right });
}
const sameGeneratedRule = (left, right) => baseObjectCoincides(left.domain, right.domain) && baseObjectCoincides(left.codomain, right.codomain);
const composeRule = (left, right) => Object.freeze({
    kind: "typedTheory.inferenceRule",
    domain: left.domain,
    trace: inferenceTrace([...left.trace.morphisms, ...right.trace.morphisms]),
    codomain: right.codomain,
});
/** Close a set of inference rules under one round of composition. */
export function composeInferenceRules(rules) {
    const out = [...rules];
    for (const left of rules) {
        for (const right of rules) {
            if (!baseObjectCoincides(left.codomain, right.domain))
                continue;
            const rule = composeRule(left, right);
            if (!out.some((existing) => sameGeneratedRule(existing, rule)))
                out.push(rule);
        }
    }
    return Object.freeze(out);
}
const sameGeneratedRuleSet = (left, right) => left.length === right.length && left.every((rule) => right.some((other) => sameGeneratedRule(rule, other)));
const proofSourceRecord = (value, names) => {
    let source;
    try { source = readSourceRecord(value, "typed theory: proof source"); }
    catch { return null; }
    const keys = Object.keys(source);
    if (keys.length !== names.length ||
        keys.some(key => !names.includes(key)))
        return null;
    return source;
};
/** A single original finite theory check for BFS, proof validation and
 * closure. In a generated category every source/target of each rule must
 * belong to its declared object carrier; a foreign intermediary is not a
 * valid morphism even when its path eventually returns to a known object.
 * SignCell alone owns actual base object equality and issued-node roles.
 */
function admittedTheory(theory) {
    const rejected = reason => Object.freeze({ ok: false, reason });
    const source = proofSourceRecord(theory, ["kind", "objects", "rules"]);
    if (!source || source.kind !== "typedTheory.carrier")
        return rejected("invalid-theory-source");
    let objects, rules;
    try {
        objects = finiteSourceArray(source.objects, "theory objects");
        rules = finiteSourceArray(source.rules, "theory rules");
    } catch { return rejected("invalid-theory-sequence"); }
    const morphismKinds = [
        "typedTheory.inferenceMorphism.specialization",
        "typedTheory.inferenceMorphism.converse",
        "typedTheory.inferenceMorphism.subjectProjection",
        "typedTheory.inferenceMorphism.objectProjection",
    ];
    const contains = value => objects.some(known => baseObjectCoincides(known, value));
    try {
        for (const rule of rules) {
            const sourceRule = proofSourceRecord(rule, ["kind", "domain", "trace", "codomain"]);
            if (!sourceRule || sourceRule.kind !== "typedTheory.inferenceRule")
                return rejected("invalid-theory-rule");
            const trace = proofSourceRecord(sourceRule.trace, ["kind", "morphisms"]);
            if (!trace || trace.kind !== "typedTheory.inferenceTrace")
                return rejected("invalid-theory-trace");
            let morphisms;
            try { morphisms = finiteSourceArray(trace.morphisms, "rule trace"); }
            catch { return rejected("invalid-theory-trace"); }
            if (morphisms.length < 1 || morphisms.some(m => {
                const sourceMorphism = proofSourceRecord(m, ["kind"]);
                return !sourceMorphism || !morphismKinds.includes(sourceMorphism.kind);
            })) return rejected("invalid-theory-morphism");
            if (!contains(sourceRule.domain) || !contains(sourceRule.codomain))
                return rejected("undeclared-rule-endpoint");
        }
    } catch { return rejected("invalid-theory-object"); }
    return Object.freeze({ ok: true, objects, rules });
}

/** The composition closure of a theory's rules (to a fixed point). */
export function derivationClosure(theory) {
    const source = admittedTheory(theory);
    if (!source.ok) throw new TypeError("typed theory: cannot close " + source.reason);
    let rules = source.rules;
    for (;;) {
        const next = composeInferenceRules(rules);
        if (sameGeneratedRuleSet(next, rules)) {
            const closedTheory = Object.freeze({ ...theory, rules });
            const residual = Object.freeze(rules.filter((rule) => !source.rules.some((original) => sameGeneratedRule(original, rule))));
            return Object.freeze({
                kind: "typedTheory.derivationClosure",
                theory: closedTheory,
                generated: rules,
                generatedRank: count(rules),
                residual,
                residualRank: count(residual),
            });
        }
        rules = next;
    }
}
const derivationSearchWitness = (theory, premise, conclusion, derivation) => Object.freeze({ kind: "typedTheory.derivationSearch:witness", theory, premise, conclusion, derivation });
const derivationSearchObstruction = (theory, premise, conclusion, explored) => Object.freeze({ kind: "typedTheory.derivationSearch-obstruction", theory, premise, conclusion, explored: Object.freeze([...explored]), rank: count(explored) });
/** Objects must be admitted to this exact theory before its identity
 * morphisms or proofs can exist. An arbitrary matching pair of JSON values
 * is not an object of an otherwise unrelated finite category. */
const admittedObject = (objects, object) =>
    objects.some(known => baseObjectCoincides(known, object));

/** Breadth-first search for a derivation from premise to conclusion. */
export function derive(theory, premise, conclusion) {
    const source = admittedTheory(theory);
    if (!source.ok || !admittedObject(source.objects, premise) ||
        !admittedObject(source.objects, conclusion))
        return derivationSearchObstruction(theory, premise, conclusion, []);
    if (baseObjectCoincides(premise, conclusion)) {
        const derivation = Object.freeze({ kind: "typedTheory.derivation", theory, premise, conclusion, steps: Object.freeze([]), length: natZero });
        return derivationSearchWitness(theory, premise, conclusion, derivation);
    }
    const queue = [{ object: premise, steps: [] }];
    const seen = [premise];
    for (let index = 0; index < queue.length; index += 1) {
        const current = queue[index];
        for (const rule of source.rules.filter((candidate) => baseObjectCoincides(candidate.domain, current.object))) {
            if (seen.some((object) => baseObjectCoincides(object, rule.codomain)))
                continue;
            const step = Object.freeze({ kind: "typedTheory.derivationStep", premise: current.object, rule, conclusion: rule.codomain });
            const steps = Object.freeze([...current.steps, step]);
            if (baseObjectCoincides(rule.codomain, conclusion)) {
                const derivation = Object.freeze({ kind: "typedTheory.derivation", theory, premise, conclusion, steps, length: count(steps) });
                return derivationSearchWitness(theory, premise, conclusion, derivation);
            }
            seen.push(rule.codomain);
            queue.push({ object: rule.codomain, steps });
        }
    }
    return derivationSearchObstruction(theory, premise, conclusion, seen);
}
/** Search for a derivation in the theory built from a base category. */
export function deriveInBase(base, premise, conclusion) {
    return derive(theoryOfBase(base), premise, conclusion);
}
/** Judge whether a conclusion is derivable from a premise. */
export function typing(theory, premise, conclusion) {
    const search = derive(theory, premise, conclusion);
    return search.kind === "typedTheory.derivationSearch:witness"
        ? Object.freeze({ kind: "typedTheory.typing:witness", theory, premise, conclusion, derivation: search.derivation })
        : Object.freeze({ kind: "typedTheory.typing-obstruction", theory, premise, conclusion, search });
}
/** Validate a derivation as one finite, source-qualified proof carrier.
 * An admitted theory's objects/rules are its original source, not a JSON
 * lookalike or an executable iterator. A proof is a finite path of EXACT
 * source-issued rules in that SAME theory, with a canonical ExactNumber
 * length. This checks mathematical incidence, not witnesses' external truth
 * or an independent scientific theorem.
 */
export function derivationValidity(theory, derivation) {
    const refusal = (reason, evidence = {}) => Object.freeze({
        kind: "typedTheory.derivation-obstruction", theory, reason, derivation,
        ...evidence,
    });
    // Use the SAME category-source gate as derivation search and closure.
    // A zero-step identity cannot conceal a rule with undeclared endpoints.
    const source = admittedTheory(theory);
    if (!source.ok) return refusal(source.reason);
    const original = proofSourceRecord(derivation,
        ["kind", "theory", "premise", "conclusion", "steps", "length"]);
    if (!original || original.kind !== "typedTheory.derivation" ||
        original.theory !== theory)
        return refusal("invalid-proof-source");
    const objects = source.objects, rules = source.rules;
    let steps;
    try { steps = finiteSourceArray(original.steps, "derivation steps"); }
    catch { return refusal("invalid-proof-sequence"); }
    // ExactNumber owns natural-number meaning. Compare the actual issued
    // count's two canonical data coordinates, rather than coercing a
    // caller-provided claimed length to a number.
    const issuedLength = count(steps);
    const length = proofSourceRecord(original.length, ["kind", "value"]);
    if (!length || length.kind !== issuedLength.kind ||
        length.value !== issuedLength.value)
        return refusal("incorrect-proof-length");
    const isObject = (object) => admittedObject(objects, object);
    if (!isObject(original.premise) || !isObject(original.conclusion))
        return refusal("unadmitted-object");
    let current = original.premise;
    const verifiedSteps = [];
    for (const step of steps) {
        const at = proofSourceRecord(step, ["kind", "premise", "rule", "conclusion"]);
        if (!at || at.kind !== "typedTheory.derivationStep")
            return refusal("invalid-proof-step");
        // A lookalike rule with matching words has not been issued by this
        // theory. A step can only cite one of its ACTUAL inference rules.
        const rule = rules.find(candidate => candidate === at.rule);
        if (!rule)
            return refusal("unissued-proof-rule");
        if (!baseObjectCoincides(at.premise, current) ||
            !baseObjectCoincides(rule.domain, current) ||
            !baseObjectCoincides(rule.codomain, at.conclusion))
            return refusal("broken-proof-path", { at: current, step });
        verifiedSteps.push(Object.freeze({
            kind: "typedTheory.derivationStep",
            premise: current, rule, conclusion: rule.codomain,
        }));
        current = rule.codomain;
    }
    if (!baseObjectCoincides(current, original.conclusion))
        return refusal("wrong-proof-conclusion", { at: current, conclusion: original.conclusion });
    // Return a new immutable verified carrier. In particular, a mutable
    // foreign source cannot rewrite the steps of an already issued check.
    const certified = Object.freeze({
        kind: "typedTheory.derivation", theory,
        premise: original.premise, conclusion: original.conclusion,
        steps: Object.freeze(verifiedSteps), length: issuedLength,
    });
    return Object.freeze({ kind: "typedTheory.derivationCheck:witness",
        theory, derivation: certified });
}
/** Compare two derivations. */
export function derivationIdentity(left, right) {
    const same = baseObjectCoincides(left.premise, right.premise)
        && baseObjectCoincides(left.conclusion, right.conclusion)
        && left.steps.length === right.steps.length
        && left.steps.every((step, index) => {
            const other = right.steps[index];
            return inferenceRulesCoincide(step.rule, other.rule) && baseObjectCoincides(step.conclusion, other.conclusion);
        });
    return same
        ? Object.freeze({ kind: "typedTheory.derivationIdentity:witness", left, right })
        : Object.freeze({ kind: "typedTheory.derivationIdentity-obstruction", left, right });
}
/** Build a finite proof carrier from original rule incidence.
 * A positive typing search result is NOT itself a checked proof: the same
 * original derivationValidity must verify its context, exact step count and
 * source-issued rule positions. Keep failures visible as obstructions rather
 * than minting an unconditional proof certificate or a Lean theorem. */
export function typedTheoryProofCarrier(theory) {
    const closure = derivationClosure(theory);
    const judgments = Object.freeze(closure.generated.map((rule) => typing(closure.theory, rule.domain, rule.codomain)));
    const validations = Object.freeze(judgments
        .filter((item) => item.kind === "typedTheory.typing:witness")
        .map((item) => derivationValidity(closure.theory, item.derivation)));
    const obstructions = Object.freeze([
        ...judgments.filter((item) => item.kind === "typedTheory.typing-obstruction"),
        ...validations.filter((item) => item.kind !== "typedTheory.derivationCheck:witness"),
    ]);
    return Object.freeze({ kind: "typedTheory.proof.carrier",
        theory: closure.theory, closure, judgments, validations,
        obstructions, rank: count(judgments) });
}
/** A predicate word arrow with a single-predicate word. */
export function predicateWordArrow(subject, predicate, object) {
    return Object.freeze({ kind: "typedTheory.predicateWordArrow", subject, word: Object.freeze([predicate]), object });
}
const predicateWordCarrier = (arrows) => Object.freeze({ kind: "typedTheory.predicateWord.carrier", arrows: Object.freeze(arrows) });
const samePredicateWord = (left, right) => left.length === right.length && left.every((predicate, index) => predicateCoincides(predicate, right[index]));
const samePredicateWordArrow = (left, right) => termCoincides(left.subject, right.subject) && samePredicateWord(left.word, right.word) && termCoincides(left.object, right.object);
const atomicPredicateWord = (arrow) => arrow.word.length === 1;
/** Perform ONE pairwise composition round over the original carrier.
 * This is not a transitive fixed point: on a cycle there may be arbitrarily
 * long distinct words. Use boundedPredicateWordClosure for an honest closure
 * status, never infer "settled" from one pairwise pass.
 */
export function composePredicateWords(input) {
    const arrows = [...input.arrows];
    for (let leftIndex = 0; leftIndex < input.arrows.length; leftIndex += 1) {
        for (let rightIndex = 0; rightIndex < input.arrows.length; rightIndex += 1) {
            // An endomorphism composes with itself. The same source index
            // does not make the resulting two-letter word an invented edge.
            const left = input.arrows[leftIndex];
            const right = input.arrows[rightIndex];
            if (!termCoincides(left.object, right.subject))
                continue;
            const composite = Object.freeze({ kind: "typedTheory.predicateWordArrow", subject: left.subject, word: Object.freeze([...left.word, ...right.word]), object: right.object });
            if (!arrows.some((arrow) => samePredicateWordArrow(arrow, composite)))
                arrows.push(composite);
        }
    }
    return predicateWordCarrier(arrows);
}
/**
 * Enumerate the finite NONEMPTY path-language generated by supplied
 * predicate arrows, under explicit word-length and arrow-count bounds.
 *
 * Every resulting arrow is a composition of supplied input arrow
 * presentations, never an inferred observed claim. A cyclic path can
 * generate infinitely many distinct words; `complete=false` is an explicit
 * obstruction to claiming global closure, NOT proof the path is false.
 *
 * Source Term/Predicate coincidence remains SignCell's. Neither this
 * purely syntactic reader nor a caller-provided arrow proves a source Actor,
 * authorizes a relation or supplies an independent witness.
 */
export function boundedPredicateWordClosure(input, options = {}) {
    const sourceField = (record, field, label) => {
        if (!record || typeof record !== "object" || Array.isArray(record) ||
            ![Object.prototype, null].includes(Object.getPrototypeOf(record)))
            throw new TypeError("predicateWordClosure: " + label + " must be a plain data record");
        const slot = Object.getOwnPropertyDescriptor(record, field);
        if (!slot || !slot.enumerable || !Object.hasOwn(slot, "value"))
            throw new TypeError("predicateWordClosure: " + label + "." + field + " must be inert own data");
        return slot.value;
    };
    const sourceArray = (value, label) => {
        if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype)
            throw new TypeError("predicateWordClosure: " + label + " must be an ordinary array");
        const fields = Object.getOwnPropertyDescriptors(value);
        if (Reflect.ownKeys(fields).length !== value.length + 1)
            throw new TypeError("predicateWordClosure: " + label + " must be dense undecorated data");
        return Object.freeze(Array.from({ length: value.length }, (_, index) => {
            const slot = fields[String(index)];
            if (!slot || !slot.enumerable || !Object.hasOwn(slot, "value"))
                throw new TypeError("predicateWordClosure: " + label + " contains an executable slot");
            return slot.value;
        }));
    };
    const option = (name, fallback, upper) => {
        if (options === null || typeof options !== "object" || Array.isArray(options) ||
            ![Object.prototype, null].includes(Object.getPrototypeOf(options)))
            throw new TypeError("predicateWordClosure: options must be a plain data record");
        const d = Object.getOwnPropertyDescriptor(options, name);
        if (d && (!d.enumerable || !Object.hasOwn(d, "value")))
            throw new TypeError("predicateWordClosure: options must be inert data");
        const n = d ? d.value : fallback;
        if (!Number.isSafeInteger(n) || n < 1 || n > upper)
            throw new RangeError("predicateWordClosure: " + name + " must be an integer in [1, " + upper + "]");
        return n;
    };
    const maxWordLength = option("maxWordLength", 4, 64);
    const maxArrows = option("maxArrows", 512, 4096);
    const maxPairChecks = option("maxPairChecks", 65536, 1000000);
    const inputs = sourceArray(sourceField(input, "arrows", "input"), "arrows");
    if (inputs.length > maxArrows)
        throw new RangeError("predicateWordClosure: original arrows exceed maxArrows");
    const sources = inputs.map((arrow) => {
        if (sourceField(arrow, "kind", "arrow") !== "typedTheory.predicateWordArrow")
            throw new TypeError("predicateWordClosure: unrecognized arrow kind");
        const subject = sourceField(arrow, "subject", "arrow");
        const object = sourceField(arrow, "object", "arrow");
        const word = sourceArray(sourceField(arrow, "word", "arrow"), "arrow word");
        if (!word.length || word.length > maxWordLength)
            throw new RangeError("predicateWordClosure: source word length outside the declared bound");
        return Object.freeze({ kind: "typedTheory.predicateWordArrow", subject, word, object });
    });
    const arrows = [...sources];
    let truncated = false;
    let pairChecks = 0;
    const extend = (left, right) => {
        // A finite word/arrow bound does not by itself limit repeated
        // compatibility checks across a dense cyclic source category.
        if (++pairChecks > maxPairChecks)
            throw new RangeError("predicateWordClosure: comparison budget exhausted; no closure claim");
        if (!termCoincides(left.object, right.subject)) return;
        const length = left.word.length + right.word.length;
        if (length > maxWordLength) { truncated = true; return; }
        const arrow = Object.freeze({
            kind: "typedTheory.predicateWordArrow",
            subject: left.subject,
            word: Object.freeze([...left.word, ...right.word]),
            object: right.object,
        });
        // The duplicate search is an actual series of source-coincidence
        // comparisons. Charge every one against the SAME effort budget;
        // otherwise a dense language can consume O(arrows²) unreported work.
        for (const existing of arrows) {
            if (++pairChecks > maxPairChecks)
                throw new RangeError("predicateWordClosure: comparison budget exhausted; no closure claim");
            if (samePredicateWordArrow(existing, arrow)) return;
        }
        if (arrows.length >= maxArrows)
            throw new RangeError("predicateWordClosure: arrow budget exhausted; no closure claim");
        arrows.push(arrow);
    };
    // Every nonempty finite path is a sequence of source arrows. Inductively,
    // iterating all discovered paths against the original generators on both
    // sides enumerates every path that fits the two explicit finite budgets.
    for (let index = 0; index < arrows.length; index += 1) {
        const path = arrows[index];
        for (const source of sources) {
            extend(path, source);
            extend(source, path);
        }
    }
    return Object.freeze({
        kind: "typedTheory.predicateWordClosure",
        carrier: predicateWordCarrier(arrows),
        complete: !truncated,
        truncated,
        maxWordLength,
        maxArrows,
        maxPairChecks,
        pairChecks,
    });
}

/** Compose the arrows of a predicate word potential. */
export function composePredicateWordPotential(input) {
    const composed = composePredicateWords(Object.freeze({ kind: "typedTheory.predicateWord.carrier", arrows: input.potential }));
    return Object.freeze({ kind: "typedTheory.predicateWordPotential", potential: composed.arrows });
}
/** Filter a predicate word carrier to its atomic (length-one) arrows. */
export function atomicPredicateWords(input) {
    return predicateWordCarrier(input.arrows.filter(atomicPredicateWord));
}
/** Legacy one-round predicate word residue (the historical `saturated` field
 * is a pairwise projection, NOT a fixed-point certificate). For explicit
 * finite closure use boundedPredicateWordClosure and inspect `complete`. */
export function predicateWordResidue(input) {
    const saturated = composePredicateWords(predicateWordCarrier(input.arrows));
    const atomic = atomicPredicateWords(saturated);
    return Object.freeze({
        kind: "typedTheory.predicateWordResidue",
        saturated,
        atomic,
        composites: Object.freeze(saturated.arrows.filter((arrow) => arrow.word.length > 1).map((arrow) => Object.freeze(arrow.word))),
    });
}

/** An inference morphism specializing a base object along a specialization edge. */
export const specializationInferenceMorphismSchema = {
  $id: "metroplat/calculus/predicating/typed-theory/specialization-inference-morphism",
  type: "object", required: ["kind"],
  properties: { kind: { const: "typedTheory.inferenceMorphism.specialization" } },
  additionalProperties: false,
};

/** An inference morphism swapping subject and object of a cell. */
export const converseInferenceMorphismSchema = {
  $id: "metroplat/calculus/predicating/typed-theory/converse-inference-morphism",
  type: "object", required: ["kind"],
  properties: { kind: { const: "typedTheory.inferenceMorphism.converse" } },
  additionalProperties: false,
};

/** An inference morphism projecting a cell onto its subject. */
export const subjectProjectionInferenceMorphismSchema = {
  $id: "metroplat/calculus/predicating/typed-theory/subject-projection-inference-morphism",
  type: "object", required: ["kind"],
  properties: { kind: { const: "typedTheory.inferenceMorphism.subjectProjection" } },
  additionalProperties: false,
};

/** An inference morphism projecting a cell onto its object. */
export const objectProjectionInferenceMorphismSchema = {
  $id: "metroplat/calculus/predicating/typed-theory/object-projection-inference-morphism",
  type: "object", required: ["kind"],
  properties: { kind: { const: "typedTheory.inferenceMorphism.objectProjection" } },
  additionalProperties: false,
};


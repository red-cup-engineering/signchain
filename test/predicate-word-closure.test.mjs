import test from "node:test";
import assert from "node:assert/strict";
import {
  boundedPredicateWordClosure, composePredicateWords, predicateWordArrow,
  predicateWordResidue,
} from "../src/typed-theory.mjs";

const arrow = (subject, predicate, object) => predicateWordArrow(subject, predicate, object);
const carrier = (arrows) => ({ kind: "typedTheory.predicateWord.carrier", arrows });
const find = (result, subject, object, word) =>
  result.carrier.arrows.find((a) => a.subject === subject && a.object === object &&
    JSON.stringify(a.word) === JSON.stringify(word));

test("a native endomorphism lawfully composes with itself in one pairwise round", () => {
  const loop = arrow("a", "p", "a");
  const round = composePredicateWords(carrier([loop]));
  assert.deepEqual(round.arrows.map((a) => a.word), [["p"], ["p", "p"]]);
  // An older residue is explicitly only a pairwise projection, not a
  // closure witness for a cyclic language.
  assert.equal(predicateWordResidue(carrier([loop])).saturated.arrows.length, 2);
});

test("bounded path algebra includes 3-hop compositions one round cannot derive", () => {
  const source = carrier([
    arrow("a", "p", "b"), arrow("b", "q", "c"), arrow("c", "r", "d"),
  ]);
  const round = composePredicateWords(source);
  assert.equal(round.arrows.some((a) => a.subject === "a" && a.object === "d"), false);
  const closed = boundedPredicateWordClosure(source, { maxWordLength: 3, maxArrows: 16 });
  assert.equal(closed.complete, true);
  assert.equal(closed.truncated, false);
  assert.deepEqual(find(closed, "a", "d", ["p", "q", "r"]).word, ["p", "q", "r"]);
  assert.equal(closed.carrier.arrows.length, 6); // 3 atomic + 2 pairs + 1 triple
});

test("a genuine cycle cannot receive a false finite closure certificate", () => {
  const source = carrier([arrow("a", "p", "a")]);
  const bounded = boundedPredicateWordClosure(source, { maxWordLength: 3, maxArrows: 8 });
  assert.deepEqual(bounded.carrier.arrows.map((a) => a.word),
    [["p"], ["p", "p"], ["p", "p", "p"]]);
  assert.equal(bounded.complete, false);
  assert.equal(bounded.truncated, true);
  const shallow = boundedPredicateWordClosure(source, { maxWordLength: 1, maxArrows: 8 });
  assert.equal(shallow.complete, false);
  assert.equal(shallow.carrier.arrows.length, 1);
});

test("source generation refuses insufficient arrow and word budgets", () => {
  const chain = carrier([arrow("a", "p", "b"), arrow("b", "q", "c")]);
  assert.throws(() => boundedPredicateWordClosure(chain, { maxWordLength: 2, maxArrows: 2 }),
    /arrow budget exhausted/);
  assert.throws(() => boundedPredicateWordClosure(chain, { maxWordLength: 0 }),
    /maxWordLength/);
  assert.throws(() => boundedPredicateWordClosure(chain, { maxArrows: 4097 }),
    /maxArrows/);
  assert.throws(() => boundedPredicateWordClosure(chain, { maxWordLength: 1, maxArrows: 1 }),
    /original arrows exceed maxArrows/);
  assert.throws(() => boundedPredicateWordClosure(chain,
    { maxWordLength: 2, maxArrows: 8, maxPairChecks: 1 }),
    /comparison budget exhausted/);
});

test("foreign or accessor-backed arrow sources refuse without executing getters", () => {
  let invoked = 0;
  const row = arrow("a", "p", "b");
  const getters = [
    (() => { const rows = [row]; Object.defineProperty(rows, "0", {
      enumerable: true, get() { invoked++; return row; },
    }); return carrier(rows); })(),
    (() => { const bad = {...row}; Object.defineProperty(bad, "word", {
      enumerable: true, get() { invoked++; return ["p"]; },
    }); return carrier([bad]); })(),
  ];
  for (const source of getters)
    assert.throws(() => boundedPredicateWordClosure(source), /inert|executable/);
  const opts = {};
  Object.defineProperty(opts, "maxWordLength", {
    enumerable: true, get() { invoked++; return 3; },
  });
  assert.throws(() => boundedPredicateWordClosure(carrier([row]), opts), /inert/);
  assert.equal(invoked, 0);
  assert.throws(() => boundedPredicateWordClosure(carrier([{...row, kind: "impostor"}])),
    /unrecognized arrow kind/);
});

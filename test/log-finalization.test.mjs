import assert from "node:assert/strict";
import test from "node:test";
import { TellingLog, tellSides } from "../src/log.mjs";

const at = { subject: "source", predicate: "says", object: "claim" };
const refusal = { name: "TypeError", message: /sealed history/ };
const observe = log => ({ rows: log.rows, size: log.size, positive: log.where(),
  negative: log.against(), cells: log.cells(), latest: log.latest(),
  reading: log.readingAt(at) });

test("finalization preserves default append behavior and irreversibly retains the same log", () => {
  const log = new TellingLog();
  assert.equal(log.sealed, false);
  assert.equal(log.tell(at), log);
  assert.equal(log.deny(at), log);
  assert.deepEqual(log.rows.map(row => row.witness), [0, 1]);
  const before = observe(log);
  assert.equal(log.seal(), log);
  assert.equal(log.sealed, true);
  assert.equal(Object.isFrozen(log), true);
  assert.equal(log.seal(), log);
  for (const append of [
    () => log.tell(at), () => log.deny(at),
    () => tellSides(log, at, [true, true]),
    () => tellSides(log, at, [false, true]),
    () => TellingLog.prototype.tell.call(log, at),
    () => TellingLog.prototype.deny.call(log, at),
  ]) {
    assert.throws(append, refusal);
    assert.deepEqual(observe(log), before);
  }
  assert.equal(tellSides(log, at, [false, false]), log);
  assert.throws(() => { log.sealed = false; }, TypeError);
  assert.throws(() => Object.defineProperty(log, "sealed", { value: false }), TypeError);
  assert.throws(() => Object.setPrototypeOf(log, {}), TypeError);
  assert.deepEqual(observe(log), before);
});

test("sealed logs refuse before input inspection and recheck after reentrant admission", () => {
  const sealed = new TellingLog().seal();
  const unread = { get subject() { assert.fail("sealed input must not be read"); } };
  assert.throws(() => sealed.tell(unread), refusal);
  assert.throws(() => sealed.deny(unread), refusal);
  assert.throws(() => sealed.tell(null), refusal);
  assert.equal(sealed.size, 0);
  for (const method of ["tell", "deny"]) {
    const log = new TellingLog().tell(at, "original");
    const before = observe(log);
    // A Proxy's descriptor trap is intrinsically executable JavaScript even
    // though ordinary getters are now refused. Recheck sealing after custody.
    const input = new Proxy({ ...at, subject: "new-source" }, {
      getOwnPropertyDescriptor(target, key) {
        if (key === "subject") log.seal();
        return Reflect.getOwnPropertyDescriptor(target, key);
      }
    });
    assert.throws(() => log[method](input, "new-witness"), refusal);
    assert.equal(log.sealed, true);
    assert.deepEqual(observe(log), before);
    assert.deepEqual(log.where({ subject: "new-source" }), []);
  }
});

test("finalized construction owns nested terms and witnesses and never exposes mutable rows", () => {
  const row = { subject: { name: "source" }, predicate: ["says"], object: { value: ["claim"] },
    side: "for", witness: { nested: { sources: ["witness"] } }, observedAt: "2026-10-19T00:00:00Z" };
  const rows = [row];
  const log = new TellingLog(rows).seal();
  const before = log.rows;
  rows.length = 0;
  row.subject.name = "changed";
  row.predicate[0] = "changed";
  row.object.value.push("changed");
  row.witness.nested.sources.push("changed");
  row.observedAt = "later";
  assert.deepEqual(log.rows, before);
  for (const result of [log.rows, log.where(), log.against(), log.cells()]) {
    assert.equal(Object.isFrozen(result), true);
    assert.throws(() => result.push({}), TypeError);
  }
  for (const retained of [log.rows[0], log.where()[0], log.latest()]) {
    assert.throws(() => { retained.subject.name = "changed"; }, TypeError);
    assert.throws(() => retained.witness.nested.sources.push("changed"), TypeError);
  }
  assert.equal(log.where({ subject: { name: "source" } }).length, 1);
  assert.equal(log.where({ subject: { name: "changed" } }).length, 0);
  assert.deepEqual(log.rows, before);
});

test("finalized indexes preserve canonical coincidence, row order, repeated and opposed testimony", () => {
  const decomposed = "ta\u0302che", composed = "tâche";
  const original = { subject: { [decomposed]: decomposed }, predicate: decomposed, object: [decomposed] };
  const equivalent = { subject: { [composed]: composed }, predicate: composed, object: [composed] };
  const rows = [
    { ...original, side: "for", witness: { by: "a" }, observedAt: "2026-10-19T00:00:00.0001Z" },
    { ...original, side: "for", witness: { by: "a" }, observedAt: "2026-10-19T00:00:00.0002Z" },
    { ...equivalent, side: "against", witness: { by: "b" }, observedAt: "2026-10-19T00:00:00.0003Z" },
  ];
  const mutable = new TellingLog(rows), sealed = new TellingLog(rows).seal();
  assert.deepEqual(sealed.rows, mutable.rows);
  assert.equal(sealed.size, 3);
  for (const role of ["subject", "predicate", "object"]) {
    const pattern = { [role]: equivalent[role] };
    assert.deepEqual(sealed.where(pattern), mutable.where(pattern));
    assert.deepEqual(sealed.against(pattern), mutable.against(pattern));
    assert.deepEqual(sealed.cells(pattern), mutable.cells(pattern));
  }
  assert.deepEqual(sealed.latest(equivalent), rows[1]);
  assert.equal(sealed.readingAt(equivalent), "stable");
  assert.throws(() => sealed.readingWhere({ subject: equivalent.subject }), /complete subject/);
  assert.equal(sealed.readingAt(at), "absurd");
  mutable.tell(at);
  assert.equal(mutable.size, 4);
  assert.equal(sealed.size, 3);
});

test("an empty finalized history stays empty while a separate new log can receive evidence", () => {
  const empty = new TellingLog().seal();
  assert.equal(empty.size, 0);
  assert.deepEqual(empty.rows, []);
  assert.deepEqual(empty.cells(), []);
  assert.equal(empty.latest(), undefined);
  assert.equal(empty.readingAt(at), "absurd");
  assert.throws(() => empty.deny(at), refusal);
  const next = new TellingLog(empty.rows).tell(at).seal();
  assert.notEqual(next, empty);
  assert.equal(next.size, 1);
  assert.equal(empty.size, 0);
});

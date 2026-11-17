import assert from "node:assert/strict";
import test from "node:test";
import { knowledgeLeqReading } from "@red-cup-engineering/metrologic/four";
import { semanticId } from "@red-cup-engineering/semiotic-content-address-system";
import { telling } from "@red-cup-engineering/signchain/log";
import { repairTellingEvent, replayTellingEvents, tellingEvent } from "@red-cup-engineering/signchain/replicated-log";

const at = { subject: "task:t1", predicate: "completed-by", object: "worker:w1" };
const unrelated = { ...at, object: "worker:w2" };
const yes = tellingEvent(telling(at, "yes"));
const no = tellingEvent(telling(at, "no", "against"));
const base = [yes, no];

test("concurrent repairs converge and a later repair can supersede both", () => {
  const affirm = repairTellingEvent(base, at, "for", "affirm");
  const deny = repairTellingEvent(base, at, "against", "deny");
  const a = [...base, affirm], b = [...base, deny];
  assert.equal(replayTellingEvents(a).effective.readingAt(at), "potential");
  assert.equal(replayTellingEvents(b).effective.readingAt(at), "active");

  const ab = replayTellingEvents(a, b);
  const ba = replayTellingEvents(b, a);
  assert.deepEqual(ab.events, ba.events);
  assert.deepEqual(ab.effective.cells(), ba.effective.cells());
  assert.equal(ab.effective.readingAt(at), "stable");
  assert.deepEqual(replayTellingEvents(ab.events, ab.events).events, ab.events);

  const settle = repairTellingEvent(ab.events, at, "against", "third repair");
  assert.deepEqual(new Set(settle.over), new Set([affirm.id, deny.id]));
  const resolved = replayTellingEvents(ab.events, [settle]);
  assert.deepEqual(replayTellingEvents(a, replayTellingEvents(b, [settle]).events).events, resolved.events);
  assert.equal(resolved.effective.readingAt(at), "active");
  assert.equal(resolved.original.readingAt(at), "stable");
  assert.equal(resolved.effective.readingAt(unrelated), "absurd");
});

test("an unseen contrary telling stays live and a repair can arrive before its basis", () => {
  const affirm = repairTellingEvent(base, at, "for", "affirm");
  const later = tellingEvent(telling(at, "unseen denial", "against"));
  const pending = replayTellingEvents([affirm], [yes]);
  assert.deepEqual(pending.findings, [{ id: affirm.id, code: "unresolved-repair-basis" }]);
  assert.equal(pending.effective.readingAt(at), "potential");
  const merged = replayTellingEvents(pending.events, [no, later]);
  assert.deepEqual(merged.findings, []);
  assert.equal(merged.effective.readingAt(at), "stable");
  assert.deepEqual(new Set(merged.active.map(event => event.id)), new Set([affirm.id, later.id]));
});

test("replay refuses altered bytes and reports a correctly addressed but invalid repair", () => {
  const input = structuredClone(yes);
  input.row.witness = "altered";
  const other = tellingEvent(telling(unrelated, "another task"));
  const body = {
    kind: "signchain.repair.v1", row: telling(at, "wrong basis"),
    over: [other.id, no.id].sort(),
  };
  const invalid = { ...body, id: semanticId(body) };
  const merged = replayTellingEvents([input, other, no, invalid]);
  assert.deepEqual(merged.findings, [
    { id: yes.id, code: "identity-mismatch" },
    { id: invalid.id, code: "invalid-repair-basis" },
  ]);
  assert.equal(merged.effective.readingAt(at), "active");
  assert.equal(merged.effective.readingAt(unrelated), "potential");
  assert.ok(!merged.events.some(event => event.id === yes.id));
  assert.throws(() => repairTellingEvent([yes], at, "against", "no contest"), /contested/);
  assert.throws(() => repairTellingEvent(base, at, undefined, "no side"), /explicit/);
  assert.notEqual(yes.id, tellingEvent(telling(at, "yes", "for", "now")).id);
});

test("original witness joins are monotone, associative, and independent of receive order", () => {
  const rows = [...base, tellingEvent(telling(at, "third witness"))];
  for (const first of rows) {
    const [second, third] = rows.filter(row => row !== first);
    const single = replayTellingEvents([first]);
    const pair = replayTellingEvents(single.events, [second]);
    const left = replayTellingEvents(pair.events, [third]);
    const right = replayTellingEvents([third, second], single.events);
    assert.deepEqual(left.original.cells(), right.original.cells());
    assert.equal(left.effective.readingAt(at), "stable");
    assert.ok(knowledgeLeqReading(single.original.readingAt(at), pair.original.readingAt(at)));
    assert.ok(knowledgeLeqReading(pair.original.readingAt(at), left.original.readingAt(at)));
    assert.ok(left.active.some(event => event.id === single.active[0].id));
  }
});

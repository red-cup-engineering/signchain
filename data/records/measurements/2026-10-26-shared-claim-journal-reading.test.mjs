/** Reproducible cross-owner SOURCE composition qualification.
 * Supply SIGNCELL_SOURCE, SEAVT_SOURCE and SIGNCHAIN_SOURCE as checkout roots.
 * Each checkout must have its real dependency closure installed. This does not
 * stand in for immutable package receiving or an operating host deployment. */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function source(variable, file) {
  const root = process.env[variable];
  if (!root) throw new TypeError(`Source qualification requires ${variable}`);
  return pathToFileURL(resolve(root, file)).href;
}
const [cells, events, telemetry, store, chains, observations] = await Promise.all([
  import(source("SIGNCELL_SOURCE", "src/cell.mjs")),
  import(source("SIGNCELL_SOURCE", "src/cloud-events.mjs")),
  import(source("SEAVT_SOURCE", "src/telemetry.mjs")),
  import(source("SEAVT_SOURCE", "src/telemetry-store.mjs")),
  import(source("SIGNCHAIN_SOURCE", "src/log.mjs")),
  import(source("SIGNCELL_SOURCE", "src/observability.mjs")),
]);
const { cell, address } = cells;
const { cellToCloudEvent, cellEventOfMessage, cellFromCloudEvent } = events;
const { openTelemetry } = telemetry;
const { readTrace, readMessage, exportTrace } = store;
const { logOfCellEventMessages } = chains;
const { assertOtlpLogRecord } = observations;

const roots = [];
after(() => { for (const root of roots) rmSync(root, { recursive: true, force: true }); });
const instant = ordinal => `2026-10-26T19:00:00.${String(ordinal).padStart(9, "0")}Z`;
function fixture(clock) {
  const root = mkdtempSync(join(tmpdir(), "shared-claim-journal-")); roots.push(root);
  let ordinal = 0, seed = 0;
  const now = clock ?? (() => instant(++ordinal));
  const open = (name, env = {}) => openTelemetry({
    root, service: { name }, ports: {
      now, env,
      entropy: size => { const nonce = ++seed; return Uint8Array.from({ length: size }, (_, index) => (nonce * 31 + index * 17) % 251 + 1); },
    },
  });
  return { root, open };
}
const witnessFor = { source: "urn:sensor:a", revision: "reading-1" };
const witnessAgainst = { source: "urn:sensor:b", revision: "reading-2" };
const proposition = evidence => cell("urn:sample:1", "temperature", { value: 3, unit: "C" }, evidence);
const event = (claim, id) => cellToCloudEvent(claim, {
  id, source: "urn:producer:integration-fixture", time: "2026-01-01T00:00:00Z",
});

test("real journal observations become original witnessed tellings across two channels", () => {
  const { root, open } = fixture();
  const sender = open("claim-sender"), receiver = open("claim-reader", { TRACEPARENT: sender.traceparent });
  const positive = proposition({ for: [witnessFor] }), negative = proposition({ against: [witnessAgainst] });
  const originalEvent = event(positive, "reading-a");
  const receipts = [sender.recordCellEvent({ event: originalEvent }), sender.recordCellEvent({ event: originalEvent }),
    receiver.recordCellEvent({ event: originalEvent }), receiver.recordCellEvent({ event: event(negative, "reading-b") })];
  assert.equal(new Set(receipts.map(receipt => receipt.address)).size, 4);
  assert.notEqual(sender.channel.id, receiver.channel.id);
  assert.equal(sender.traceId, receiver.traceId);

  const reading = readTrace(root, sender.traceId);
  assert.equal(reading.coverage.status, "complete");
  assert.equal(reading.truncated, false);
  assert.deepEqual(reading.coverage.issues, []);
  assert.deepEqual(reading.messages.map(message => message.id), receipts.map(receipt => receipt.address));
  assert.deepEqual(reading.coverage.frontier, [receipts[3].address]);
  for (const receipt of receipts.slice(0, 3))
    assert.deepEqual(cellEventOfMessage(readMessage(root, receipt.address)), originalEvent);

  const log = logOfCellEventMessages(reading.messages);
  assert.equal(log.sealed, true);
  assert.equal(log.size, 2, "retry and forwarding retained four observations but only two original witnesses");
  assert.deepEqual(log.where()[0].witness, witnessFor);
  assert.deepEqual(log.against()[0].witness, witnessAgainst);
  assert.equal(log.readingAt(positive), "stable");
  assert.equal(address(log.cells()[0]), address(positive));
  assert.equal(logOfCellEventMessages(reading.messages, { asOf: instant(3) }).against().length, 0,
    "a past asserted event time cannot backdate the later observed opposing witness");
  assert.equal(logOfCellEventMessages(reading.messages, { asOf: instant(4) }).against().length, 1);

  const exported = exportTrace(root, sender.traceId);
  assert.equal(exported.length, 2);
  const records = exported.flatMap(request => request.resourceLogs.flatMap(resource => resource.scopeLogs.flatMap(scope => scope.logRecords)));
  assert.equal(records.length, 4);
  for (const record of records) assertOtlpLogRecord(record);
});

test("conflicting event identity remains recoverable in custody and refuses a knowledge reading", () => {
  const { root, open } = fixture(), sender = open("conflict-fixture");
  const first = proposition({ for: [witnessFor] }), changed = proposition({ against: [witnessAgainst] });
  sender.recordCellEvent({ event: event(first, "reused") });
  sender.recordCellEvent({ event: event(changed, "reused") });
  const reading = readTrace(root, sender.traceId);
  assert.equal(reading.coverage.status, "complete");
  assert.equal(reading.messages.length, 2);
  assert.deepEqual(reading.messages.map(message => cellFromCloudEvent(cellEventOfMessage(message))), [first, changed]);
  assert.throws(() => logOfCellEventMessages(reading.messages), error => error.code === "event-identity-conflict");
});

test("causal custody survives clock rollback without silently becoming a time-ordered reading", () => {
  let tick = 4;
  const { root, open } = fixture(() => instant(tick--)), sender = open("clock-fixture");
  const original = event(proposition({ for: [witnessFor] }), "clock-reading");
  const first = sender.recordCellEvent({ event: original }), second = sender.recordCellEvent({ event: original });
  const reading = readTrace(root, sender.traceId);
  assert.equal(reading.coverage.status, "complete");
  assert.deepEqual(reading.messages.map(message => message.id), [first.address, second.address]);
  assert.deepEqual(reading.messages[1].causes, [first.address]);
  assert.throws(() => logOfCellEventMessages(reading.messages), RangeError);
});

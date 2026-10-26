/** Actual issued-package cross-owner receiving.
 * Derived from the three original shared-claim-journal source cases, preserved
 * separately at 2026-10-26-shared-claim-journal-reading.test.mjs.
 * Supply SEAVT_PACKAGE, SIGNCHAIN_PACKAGE and CAIRN_PACKAGE as verified extracted
 * archive roots with their declared dependencies installed. SignCell is resolved
 * through each owner. Only original events/messages cross owner boundaries.
 * No source/provider override, runtime implementation, or transport codec here. */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

function packageAt(root, name, version, gitHead) {
  const directory = realpathSync(resolve(root));
  const manifest = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
  assert.equal(manifest.name, name);
  assert.equal(manifest.version, version);
  assert.equal(manifest.gitHead, gitHead);
  return { directory, manifest, require: createRequire(join(directory, "package.json")) };
}
function supplied(variable, name, version, gitHead) {
  if (!process.env[variable]) throw new TypeError("Issued-package receiving requires " + variable);
  return packageAt(process.env[variable], name, version, gitHead);
}
const seavt = supplied("SEAVT_PACKAGE", "@red-cup-engineering/semiotic-eavt-services-section",
  "0.3.3-dev.200", "389951f15e0ffb57ee29f8d71ef1a16a4904ce3d");
const signchain = supplied("SIGNCHAIN_PACKAGE", "@red-cup-engineering/signchain",
  "0.4.2-dev.68", "d7609603e35ebad3a265b3177c2b6314fcf2666d");
const cairn = supplied("CAIRN_PACKAGE", "@red-cup-engineering/knowledge-system-server",
  "0.2.5-dev.356", "4504657f251ca5692348aee5066bad53137b803c");
function signcellOf(owner) {
  return packageAt(dirname(owner.require.resolve("@red-cup-engineering/signcell/package.json")),
    "@red-cup-engineering/signcell", "0.13.1-dev.198", "1abcd4a218618408284014af35169459c8170a02");
}
const producerCellOwner = signcellOf(seavt);
const chainCellOwner = signcellOf(signchain);
const cairnCellOwner = signcellOf(cairn);
const from = (owner, specifier) => import(pathToFileURL(owner.require.resolve(specifier)).href);
const [cells, events, telemetry, store, chains, observations, journal, chainCells,
  chainEvents, cairnCells, cairnEvents] = await Promise.all([
  from(producerCellOwner, "@red-cup-engineering/signcell/cell"),
  from(producerCellOwner, "@red-cup-engineering/signcell/cloud-events"),
  from(seavt, "@red-cup-engineering/semiotic-eavt-services-section/telemetry"),
  from(seavt, "@red-cup-engineering/semiotic-eavt-services-section/telemetry-store"),
  from(signchain, "@red-cup-engineering/signchain/log"),
  from(producerCellOwner, "@red-cup-engineering/signcell/observability"),
  from(cairn, "@red-cup-engineering/knowledge-system-server/journal-knowledge"),
  from(chainCellOwner, "@red-cup-engineering/signcell/cell"),
  from(chainCellOwner, "@red-cup-engineering/signcell/cloud-events"),
  from(cairnCellOwner, "@red-cup-engineering/signcell/cell"),
  from(cairnCellOwner, "@red-cup-engineering/signcell/cloud-events"),
]);
const { cell, address } = cells;
const { cellToCloudEvent, cellEventOfMessage, cellFromCloudEvent } = events;
const { openTelemetry } = telemetry;
const { readTrace, readMessage, exportTrace } = store;
const { logOfCellEventMessages } = chains;
const { assertOtlpLogRecord } = observations;
const { bindJournalKnowledgeSource } = journal;

// A host fixture fixes source authority independently from the query payload.
// The acquired cut is always read from the real SEAVT journal, never a mock cut.
const ACTOR = "urn:actor:issued-claim-reader";
const SOURCE = "urn:journal:issued-cross-owner-fixture";
function boundReader(root, traceId) {
  const state = { reads: 0, context: { actor: ACTOR, allowed: true } };
  const reader = bindJournalKnowledgeSource({
    name: "issued-journal", source: SOURCE,
    principalOf: context => context.actor,
    authorizeRead: ({ actor, source }, context) =>
      actor === ACTOR && source === SOURCE && context.allowed === true,
    readTrace: ({ limit }) => { state.reads++; return readTrace(root, traceId, { limit }); },
  });
  return { reader, state };
}
function assertOriginalEntry(entry, message, expectedEvent) {
  assert.deepEqual(entry.message, {
    id: message.id, channel: message.channel, causes: message.causes, observedAt: message.observedAt,
    traceId: message.body.traceId ?? null, spanId: message.body.spanId ?? null,
    traceFlags: message.body.flags ?? null,
  });
  assert.deepEqual(entry.event, expectedEvent);
  assert.equal(entry.event.data_base64, expectedEvent.data_base64);
  const recovered = cairnEvents.cellFromCloudEvent(entry.event);
  assert.equal(entry.cellAddress, cairnCells.address(recovered));
  assert.equal(entry.reading, cairnCells.knowledgeReading(recovered));
  return recovered;
}

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

test("issued journal observations retain original witnesses and authorized CAIRN occurrences across two channels", async () => {
  const { root, open } = fixture();
  const sender = open("claim-sender"), receiver = open("claim-reader", { TRACEPARENT: sender.traceparent });
  const positive = proposition({ for: [witnessFor] }), negative = proposition({ against: [witnessAgainst] });
  const originalEvent = event(positive, "reading-a"), opposingEvent = event(negative, "reading-b");
  const receipts = [sender.recordCellEvent({ event: originalEvent }), sender.recordCellEvent({ event: originalEvent }),
    receiver.recordCellEvent({ event: originalEvent }), receiver.recordCellEvent({ event: opposingEvent })];
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
  assert.equal(log.readingAt(chainEvents.cellFromCloudEvent(originalEvent)), "stable");
  assert.equal(chainCells.address(log.cells()[0]), address(positive));
  assert.equal(logOfCellEventMessages(reading.messages, { asOf: instant(3) }).against().length, 0,
    "a past asserted event time cannot backdate the later observed opposing witness");
  assert.equal(logOfCellEventMessages(reading.messages, { asOf: instant(4) }).against().length, 1);

  const exported = exportTrace(root, sender.traceId);
  assert.equal(exported.length, 2);
  const records = exported.flatMap(request => request.resourceLogs.flatMap(resource => resource.scopeLogs.flatMap(scope => scope.logRecords)));
  assert.equal(records.length, 4);
  for (const record of records) assertOtlpLogRecord(record);

  const { reader, state } = boundReader(root, sender.traceId);
  const input = { selection: { predicate: "temperature" }, page: { limit: 2 } };
  const page = await reader.queryCellEvents(input, state.context);
  assert.equal(page.kind, "cairn.journal-cell-events/v1");
  assert.equal(page.actor, ACTOR); assert.equal(page.source, SOURCE);
  assert.equal(page.knowledgeTruthEstablished, false);
  assert.equal(page.semantics, "source-carried-cell-events-not-established-world-fact");
  assert.equal(page.messageCount, 4); assert.equal(page.total, 4);
  assert.equal(page.offset, 0); assert.equal(page.limit, 2); assert.equal(page.next, 2);
  assert.deepEqual(page.coverage, reading.coverage);
  const rest = await reader.queryCellEvents({
    ...input, page: { offset: page.next, limit: 2 }, expectedRevision: page.revision,
  }, state.context);
  assert.equal(rest.revision, page.revision);
  assert.equal(rest.next, null);
  const entries = [...page.entries, ...rest.entries];
  assert.deepEqual(entries.map(entry => entry.message.id), receipts.map(receipt => receipt.address));
  assert.equal(new Set(entries.map(entry => entry.message.id)).size, 4);
  assert.notEqual(entries[0].message.channel, entries[2].message.channel);
  for (let index = 0; index < entries.length; index++) {
    const expected = index === 3 ? opposingEvent : originalEvent;
    const recovered = assertOriginalEntry(entries[index], reading.messages[index], expected);
    assert.equal(entries[index].cellAddress, address(positive));
    assert.deepEqual(recovered.object, { value: 3, unit: "C" });
    assert.deepEqual(recovered.for, index === 3 ? [] : [witnessFor]);
    assert.deepEqual(recovered.against, index === 3 ? [witnessAgainst] : []);
  }
  assert.deepEqual((await reader.queryCellEvents(input, state.context)).entries, page.entries);
  assert.equal((await reader.queryCellEvents(input, state.context)).revision, page.revision);

  // An actual appended observation changes the cut; old pagination cannot read
  // across that revision. Repeated receipt still creates no additional witness.
  const fifth = receiver.recordCellEvent({ event: originalEvent });
  await assert.rejects(() => reader.queryCellEvents({
    ...input, page: { offset: page.next, limit: 2 }, expectedRevision: page.revision,
  }, state.context), /source revision changed/);
  const latest = await reader.queryCellEvents({ selection: input.selection }, state.context);
  assert.equal(latest.messageCount, 5); assert.equal(latest.total, 5);
  assert.notEqual(latest.revision, page.revision);
  assert.equal(latest.entries.at(-1).message.id, fifth.address);
  assert.deepEqual(latest.coverage.frontier, [fifth.address]);
  const laterLog = logOfCellEventMessages(readTrace(root, sender.traceId).messages);
  assert.equal(laterLog.sealed, true); assert.equal(laterLog.size, 2);
  assert.deepEqual(laterLog.where().map(row => row.witness), [witnessFor]);
  assert.deepEqual(laterLog.against().map(row => row.witness), [witnessAgainst]);

  state.context.allowed = false;
  const beforeDenied = state.reads;
  await assert.rejects(() => reader.queryCellEvents(input, state.context), /unavailable to the current Actor/);
  assert.equal(state.reads, beforeDenied, "revoked authority refuses before source acquisition");
  state.context.allowed = true;
  await assert.rejects(() => reader.queryCellEvents(input, { actor: "urn:actor:other", allowed: true }),
    /unavailable to the current Actor/);
  assert.equal(state.reads, beforeDenied, "another actor cannot inherit the source binding");
});

test("issued custody and CAIRN retain conflicting events while SignChain refuses knowledge projection", async () => {
  const { root, open } = fixture(), sender = open("conflict-fixture");
  const first = proposition({ for: [witnessFor] }), changed = proposition({ against: [witnessAgainst] });
  sender.recordCellEvent({ event: event(first, "reused") });
  sender.recordCellEvent({ event: event(changed, "reused") });
  const reading = readTrace(root, sender.traceId);
  assert.equal(reading.coverage.status, "complete");
  assert.equal(reading.messages.length, 2);
  assert.deepEqual(reading.messages.map(message => cellFromCloudEvent(cellEventOfMessage(message))), [first, changed]);
  assert.throws(() => logOfCellEventMessages(reading.messages), error => error.code === "event-identity-conflict");

  const { reader, state } = boundReader(root, sender.traceId);
  const page = await reader.queryCellEvents({}, state.context);
  assert.equal(page.total, 2); assert.equal(page.messageCount, 2);
  assert.equal(page.knowledgeTruthEstablished, false);
  assert.deepEqual(page.coverage, reading.coverage);
  for (let index = 0; index < 2; index++)
    assertOriginalEntry(page.entries[index], reading.messages[index], cellEventOfMessage(reading.messages[index]));
  assert.equal(page.entries[0].event.id, page.entries[1].event.id);
  assert.equal(page.entries[0].event.source, page.entries[1].event.source);
  assert.notEqual(page.entries[0].event.data_base64, page.entries[1].event.data_base64);
  assert.deepEqual(cairnEvents.cellFromCloudEvent(page.entries[0].event).for, [witnessFor]);
  assert.deepEqual(cairnEvents.cellFromCloudEvent(page.entries[1].event).against, [witnessAgainst]);
});

test("issued custody and CAIRN preserve causal order across clock rollback while ordered SignChain refuses", async () => {
  let tick = 4;
  const { root, open } = fixture(() => instant(tick--)), sender = open("clock-fixture");
  const original = event(proposition({ for: [witnessFor] }), "clock-reading");
  const first = sender.recordCellEvent({ event: original }), second = sender.recordCellEvent({ event: original });
  const reading = readTrace(root, sender.traceId);
  assert.equal(reading.coverage.status, "complete");
  assert.deepEqual(reading.messages.map(message => message.id), [first.address, second.address]);
  assert.deepEqual(reading.messages[1].causes, [first.address]);
  assert.throws(() => logOfCellEventMessages(reading.messages), RangeError);

  const { reader, state } = boundReader(root, sender.traceId);
  const page = await reader.queryCellEvents({}, state.context);
  assert.equal(page.total, 2); assert.equal(page.knowledgeTruthEstablished, false);
  assert.deepEqual(page.coverage, reading.coverage);
  assert.deepEqual(page.entries.map(entry => entry.message.id), [first.address, second.address]);
  assert.deepEqual(page.entries.map(entry => entry.message.observedAt), [instant(4), instant(3)]);
  assert.deepEqual(page.entries[1].message.causes, [first.address]);
  for (let index = 0; index < 2; index++)
    assertOriginalEntry(page.entries[index], reading.messages[index], original);
});

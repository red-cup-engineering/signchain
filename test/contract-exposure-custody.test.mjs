import assert from "node:assert/strict";
import test from "node:test";

const { relationalContract, contractCoordinates, contractExposure, contractExposureReport } =
  await import("../src/contracts/contract.mjs");
const { semanticJudgmentWitnessed } = await import("../src/contracts/judgment.mjs");
const { semanticId } = await import("@red-cup-engineering/signcell/cell");

const fixture = () => relationalContract({
  id: "contract:retained-source",
  material: { id: "material:one", loci: ["schema:one"], incidence: [], fibers: [],
    valueAlgebra: "FOUR", constraints: [], closure: [], boundary: [] },
  precondition: { id: "predicate:one" }, postcondition: { id: "predicate:one" },
  move: { id: "move:one", domain: "schema:one", codomain: "schema:one", effects: [] },
  phase: { id: "phase:one", closure: {} },
  lens: { id: "lens:one", domain: "schema:one", boundary: "schema:one", preserves: [], hides: [] },
  evidencePolicy: { id: "policy:one", required: true, records: ["time", "caller", "boundary"],
    time: "required", caller: "required", boundaryObject: "full" },
  energetics: [], refinements: [],
});
const observation = () => ({
  at: { source: "clock:one", event: { sequence: 1, time: "2026-10-27T12:00:00Z" } },
  caller: { actor: "actor:one", authority: { permits: ["read"] } },
  boundary: { source: "sensor:one", observed: { count: 3, labels: ["original"] } },
});

test("EX3: constructed coordinates own the complete original observations", () => {
  const contract = fixture(), source = observation();
  const coordinates = contractCoordinates(contract, source);
  const expected = JSON.parse(JSON.stringify(coordinates));
  const id = semanticId(coordinates);
  source.at.event.sequence = 9;
  source.caller.authority.permits.push("write");
  source.boundary.observed.count = 9;
  source.boundary.observed.labels[0] = "rewritten";
  assert.deepEqual(coordinates, expected);
  assert.equal(semanticId(coordinates), id);
});

test("EX3: an exposure snapshot cannot be rewritten through provider-owned observations", () => {
  const contract = fixture(), source = observation();
  const exposure = contractExposure(contract, source);
  const expected = JSON.parse(JSON.stringify(exposure));
  const id = semanticId(exposure);
  source.at.event.sequence = 9;
  source.caller.authority.permits.push("write");
  source.boundary.observed.count = 9;
  assert.deepEqual(exposure, expected);
  assert.equal(semanticId(exposure), id);
  assert.equal(semanticJudgmentWitnessed(contractExposureReport(contract, exposure).judgment), true);
});

test("EX3: exposure reports refuse input accessors without executing them", () => {
  const contract = fixture(), good = contractExposure(contract, observation());
  let reads = 0;
  for (const [level, property] of [["outer", "boundary"], ["coordinates", "boundary"], ["outer", "coordinates"]]) {
    const exposure = { ...good, coordinates: { ...good.coordinates } };
    const object = level === "outer" ? exposure : exposure.coordinates;
    Object.defineProperty(object, property, { enumerable: true, get() {
      reads += 1;
      throw new TypeError("provider accessor executed");
    } });
    try {
      const report = contractExposureReport(contract, exposure);
      assert.equal(semanticJudgmentWitnessed(report.judgment), false);
    } catch (error) {
      assert.ok(error instanceof TypeError || error instanceof RangeError);
    }
  }
  assert.equal(reads, 0, "inert admission must precede any reads of received properties");
});

test("EX3: exposure construction does not execute nested observation accessors", () => {
  let reads = 0;
  for (const constructor of [contractCoordinates, contractExposure]) {
    const source = observation();
    Object.defineProperty(source.boundary.observed, "count", { enumerable: true, get() {
      reads += 1;
      throw new TypeError("provider nested accessor executed");
    } });
    assert.throws(() => constructor(fixture(), source), TypeError);
  }
  assert.equal(reads, 0);
});

test("EX3: native byte observations are snapshotted by the Cell carrier owner", () => {
  const contract = fixture(), bytes = new Uint8Array([1, 3, 5]);
  const source = { ...observation(), boundary: { source: "sensor:bytes", value: bytes } };
  const exposure = contractExposure(contract, source);
  const id = semanticId(exposure);
  bytes[0] = 8;
  assert.equal(semanticId(exposure), id);
  assert.equal(semanticJudgmentWitnessed(contractExposureReport(contract, exposure).judgment), true);
});

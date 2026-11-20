import {
  retainedCarrier, coincidenceKey, readSourceArray,
} from "@red-cup-engineering/semiotic-content-address-system";
import {
  createGraph, shortestPathWithSourceEdges,
} from "@red-cup-engineering/metrologic/models/graphs/directed-multigraph";
import {
  finitePreorder, relates, topDownset, admitDownset, upward, principalDownset, joinDownsets,
  bottomDownset, downsetWithin, meetDownsets, impliesDownsets,
} from "@red-cup-engineering/metrologic/models/order/finite-preorder";
import {
  cellSet,
} from "@red-cup-engineering/signcell";
import {
  readingOfSides,
} from "@red-cup-engineering/metrologic/four";

/** Witnessed token order. */

const SPECIALIZES = "specializes";
const FRAME = "signcell.token-frame";
const frames = new WeakMap();
const reconstructions = new WeakMap();

function field(value, name, inherited = false) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new TypeError("Token frame input must be a data record");
  for (let owner = value; owner && owner !== Object.prototype; owner = inherited ? Object.getPrototypeOf(owner) : null) {
    const descriptor = Object.getOwnPropertyDescriptor(owner, name);
    if (!descriptor) continue;
    if (!Object.hasOwn(descriptor, "value")) throw new TypeError(`Token frame ${name} must be a data property`);
    return descriptor.value;
  }
  return undefined;
}

function deeplyFrozen(value, seen = new WeakSet()) {
  if (typeof value === "function") return false;
  if (!value || typeof value !== "object" || seen.has(value)) return true;
  const prototype = Object.getPrototypeOf(value);
  if (!Object.isFrozen(value) ||
      (Array.isArray(value) ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null))
    return false;
  seen.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Array.isArray(value)) {
    if (Object.keys(descriptors).length < value.length + 1) return false;
    for (let index = 0; index < value.length; index++) {
      if (!Object.hasOwn(descriptors, index)) return false;
    }
  }
  return Reflect.ownKeys(descriptors).every(key =>
    Object.hasOwn(descriptors[key], "value") && deeplyFrozen(descriptors[key].value, seen));
}

function cacheableTokenFrame(frame) {
  if (frames.has(frame) || reconstructions.has(frame)) return true;
  try {
    return field(frame, "kind") === FRAME && Array.isArray(field(frame, "cells")) &&
      Object.hasOwn(frame, "predicate") && deeplyFrozen(frame);
  } catch { return false; }
}

function admitTokenFrame(frame) {
  if (frames.has(frame)) return frame;
  const previous = reconstructions.get(frame);
  if (previous) return previous;
  const cells = field(frame, "cells");
  if (field(frame, "kind") !== FRAME || cells === undefined) throw new TypeError("Invalid token frame");
  const admitted = tokenFrame(cells, { predicate: field(frame, "predicate", true) });
  if (cacheableTokenFrame(frame)) reconstructions.set(frame, admitted);
  return admitted;
}

/** Derive the order from supporting witnesses and retain direct denials separately. */
function tokenFrame(cells = [], options = {}) {
  const supplied = field(options, "predicate", true);
  const predicate = retainedCarrier(supplied === undefined ? SPECIALIZES : supplied);
  const body = cellSet(readSourceArray(cells, "Token frame cells"));
  const terms = new Map(), supports = [], denials = new Map();
  const selected = coincidenceKey(predicate);
  const addToken = value => {
    const key = coincidenceKey(value);
    if (!terms.has(key)) terms.set(key, value);
    return key;
  };
  for (const cell of body) {
    const from = addToken(cell.subject);
    if (coincidenceKey(cell.predicate) !== selected) continue;
    const to = addToken(cell.object);
    if (cell.for.length) supports.push({ from, to, cell });
    if (cell.against.length) {
      if (!denials.has(from)) denials.set(from, new Map());
      denials.get(from).set(to, cell);
    }
  }

  const keys = [...terms.keys()].sort();
  const positions = new Map(keys.map((key, index) => [key, index]));
  const order = finitePreorder(keys.length, supports.map(({ from, to }) => [positions.get(from), positions.get(to)]));
  const tokens = indices => retainedCarrier(Array.from(indices, index => terms.get(keys[index])));
  let graph;
  const contested = [];
  const deniedEdges = [...denials].flatMap(([from, edges]) =>
    [...edges].map(([to, denial]) => ({ from, to, denial })));
  for (const { from, to, denial } of deniedEdges) {
    if (!relates(order, positions.get(from), positions.get(to))) continue;
    graph ??= createGraph({
      nodes: keys.map(id => ({ id })),
      edges: supports.map(({ from, to }) => ({ from, to })),
    });
    const witness = shortestPathWithSourceEdges(graph, from, to);
    if (!witness) throw new Error("A supported specialization must have a source path");
    contested.push({
      special: terms.get(from), general: terms.get(to), denial,
      path: witness.sourceEdgeIndices.map(index => supports[index].cell),
    });
  }

  const allTokens = tokens(topDownset(order));
  const frame = retainedCarrier({
    kind: FRAME, predicate, cells: body, tokens: allTokens, identified: order.identified.map(tokens), contested,
  });
  frames.set(frame, { order, positions, denials, tokens, allTokens });
  return frame;
}

const state = frame => frames.get(admitTokenFrame(frame));
function position(frame, token) {
  const index = frame.positions.get(coincidenceKey(token));
  if (index === undefined) throw new TypeError("Token does not occur in this frame");
  return index;
}
const downset = (frame, open) => admitDownset(frame.order, open.map(token => position(frame, token)));

function specializes(frame, special, general) {
  const current = state(frame);
  return relates(current.order, position(current, special), position(current, general));
}

function specialization(frame, special, general) {
  const current = state(frame);
  return readingOfSides(
    "knowledge", relates(current.order, position(current, special), position(current, general)),
    current.denials.get(coincidenceKey(special))?.has(coincidenceKey(general)) ?? false,
  );
}

function generalizations(frame, token) {
  const current = state(frame);
  return current.tokens(upward(current.order, position(current, token)));
}

function extent(frame, ...given) {
  const current = state(frame);
  return current.tokens(joinDownsets(current.order, ...given.map(token => principalDownset(current.order, position(current, token)))));
}

const top = frame => state(frame).allTokens;
const bottom = () => Object.freeze([...bottomDownset()]);
function within(frame, left, right) {
  const current = state(frame);
  return downsetWithin(current.order, downset(current, left), downset(current, right));
}
function combine(frame, operation, opens) {
  const current = state(frame);
  return current.tokens(operation(current.order, ...opens.map(open => downset(current, open))));
}
const meet = (frame, ...opens) => combine(frame, meetDownsets, opens);
const join = (frame, ...opens) => combine(frame, joinDownsets, opens);
const implies = (frame, antecedent, consequent) => combine(frame, impliesDownsets, [antecedent, consequent]);
const negation = (frame, open) => implies(frame, open, bottom());

export {
  SPECIALIZES, admitTokenFrame, bottom, cacheableTokenFrame, extent, generalizations, implies, join,
  meet, negation, specialization, specializes, tokenFrame, top, within,
};

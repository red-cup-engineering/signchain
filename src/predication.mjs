import {
  admitToken, kindOf, admitClaim, predicateMark, admitTriple,
  sameCell, cellSet, admitPredication, admitArticulationCell, predicateOfClaim, predicationCell,
  predicatingCell, traceOfArticulating, incidence, converse, predicationSeed, subjectProjection,
  objectProjection, specialize, cellModel,
} from "@red-cup-engineering/signcell";
import { CellSchema, TokenSchema } from "@red-cup-engineering/typed-content";

import {
  assertInertCarrierSource, coincidenceKey, readSourceArray, canonicalCarrier, hasFields,
  readSourceRecord,
} from "@red-cup-engineering/semiotic-content-address-system";
import {
  createGraph, reachable,
} from "@red-cup-engineering/metrologic/models/graphs/directed-multigraph";

const { PREDICATE } = cellModel;
const SPECIALIZATION = "predication.specialization";
const SITE = "predication.site";
const specializationFields = Object.freeze(["kind", "domain", "codomain"]);
const specializationSchema = {
  type: "object", required: specializationFields, additionalProperties: false,
  properties: { kind: { const: SPECIALIZATION }, domain: TokenSchema, codomain: TokenSchema },
};
const predicationGeneratorsShape = {
  cells: { type: "array", items: CellSchema },
  specializations: { type: "array", items: specializationSchema },
};
const predicationSiteGeneratorsSchema = {
  $id: "metroplat/calculus/predicating/predication-site-generators",
  type: "object", required: ["kind", "cells", "specializations"], additionalProperties: false,
  properties: { kind: { const: SITE }, ...predicationGeneratorsShape },
  title: "PredicationSiteGenerators",
  description: "The witnessed cells and specializations a predication site is freely constructed from.",
};

const termDatum = value => kindOf(value) === "utterance.token"
  ? admitToken(value).mark.value : assertInertCarrierSource(value);
function predicateDatum(value) {
  switch (kindOf(value)) {
    case PREDICATE: return predicateMark(value).value;
    case "utterance.claim": return admitClaim(value).mark.value;
    default: return assertInertCarrierSource(value);
  }
}

const predicationTermKey = value => coincidenceKey(termDatum(value));
const predicateKey = value => coincidenceKey(predicateDatum(value));
const termCoincides = (left, right) => predicationTermKey(left) === predicationTermKey(right);
const predicateCoincides = (left, right) => predicateKey(left) === predicateKey(right);

function nodeCoordinates(input) {
  const parts = readSourceArray(input, "Predication node", 3);
  if (parts.length !== 3) throw new TypeError("Predication nodes have three positions");
  return [predicationTermKey(parts[0]), predicateKey(parts[1]), predicationTermKey(parts[2])];
}

const baseNodes = new WeakSet();
const bases = new WeakSet();
function makeNode(subject, predicate, object) {
  const node = Object.freeze([subject, predicate, object]);
  baseNodes.add(node);
  return node;
}
function predicationBaseNodeOf(cell) {
  const { subject, predicate, object } = admitTriple(cell);
  return makeNode(subject, predicate, object);
}
const isAdmittedPredicationBase = value => bases.has(value);

function objectKey(value) {
  if (baseNodes.has(value)) return JSON.stringify(["node", ...nodeCoordinates(value)]);
  if (kindOf(value) === PREDICATE) return JSON.stringify(["predicate", predicateKey(value)]);
  return JSON.stringify(["term", predicationTermKey(value)]);
}
const nodeCoincides = (left, right) => JSON.stringify(nodeCoordinates(left)) === JSON.stringify(nodeCoordinates(right));
const baseObjectCoincides = (left, right) => objectKey(left) === objectKey(right);

function predicationIdentity(holds, left, right) {
  return Object.freeze({ kind: holds ? "predication.identity:witness" : "predication.identity-obstruction", left, right });
}
const predicationTermIdentity = (left, right) => predicationIdentity(termCoincides(left, right), left, right);
const predicationPredicateIdentity = (left, right) => predicationIdentity(predicateCoincides(left, right), left, right);
const cellIdentity = (left, right) => predicationIdentity(sameCell(left, right), left, right);
const predicationNodeIdentity = (left, right) => predicationIdentity(nodeCoincides(left, right), left, right);

function uniqueByKey(values, keyOf) {
  const found = new Map();
  for (const value of values) {
    const key = keyOf(value);
    if (!found.has(key)) found.set(key, value);
  }
  return [...found.values()];
}
function uniqueBy(values, same) {
  const result = [];
  for (const value of values) if (!result.some(other => same(other, value))) result.push(value);
  return result;
}
const entitySetOf = entities => canonicalCarrier({ kind: "predication.entitySet", entities });
const predicateSetOf = predicates => canonicalCarrier({ kind: "predication.predicateSet", predicates });
const entitySet = (entities, same) => entitySetOf(uniqueBy(entities, same));
const predicateSet = (predicates, same) => predicateSetOf(uniqueBy(predicates, same));
const generatedPredicationCellSet = (entities, predicates) =>
  canonicalCarrier({ kind: "predication.generatedCellSet", entities, predicates });

function predicationCellSet(cells) {
  const body = cellSet(cells);
  return Object.freeze({
    kind: "predication.cellSet", cells: body,
    entities: entitySetOf(uniqueByKey(body.flatMap(({ subject, object }) => [subject, object]), predicationTermKey)),
    predicates: predicateSetOf(uniqueByKey(body.map(({ predicate }) => predicate), predicateKey)),
  });
}

const specializationMorphism = (specialized, general) => Object.freeze({
  kind: SPECIALIZATION, domain: canonicalCarrier(general), codomain: canonicalCarrier(specialized),
});
const hasSpecializationShape = source =>
  source.kind === SPECIALIZATION && hasFields(source, specializationFields);
function isSpecializationMorphism(value) {
  try { return hasSpecializationShape(readSourceRecord(value, "Specialization")); }
  catch { return false; }
}

const edge = (domain, codomain) => Object.freeze({ domain, codomain });
function projectBase({ cells = [], entities, predicates }, specialization = []) {
  const objects = [...entities.entities, ...predicates.predicates];
  const converse = [], subjectProjection = [], objectProjection = [];
  for (const { subject, predicate, object } of cells) {
    const original = makeNode(subject, predicate, object);
    const reversed = makeNode(object, predicate, subject);
    objects.push(original, reversed);
    converse.push(edge(original, reversed));
    subjectProjection.push(edge(original, subject));
    objectProjection.push(edge(original, object));
  }
  for (const { domain, codomain } of specialization) objects.push(domain, codomain);
  const base = Object.freeze({
    kind: "predication.base", objects: Object.freeze(uniqueByKey(objects, objectKey)),
    specialization: Object.freeze(specialization), converse: Object.freeze(converse),
    subjectProjection: Object.freeze(subjectProjection), objectProjection: Object.freeze(objectProjection),
  });
  bases.add(base);
  return base;
}

function predicationSite(witnesses) {
  const source = readSourceArray(witnesses, "Predication generators");
  const cells = [], specializations = [];
  for (const value of source) {
    const record = readSourceRecord(value, "Predication generator");
    if (hasSpecializationShape(record)) specializations.push(specializationMorphism(record.codomain, record.domain));
    else cells.push(admitPredication(value, record));
  }
  return makeSite(cells, specializations);
}

function makeSite(cells, specializations = []) {
  const body = predicationCellSet(cells);
  const base = projectBase(body, specializations);
  return Object.freeze({ kind: SITE, cells: body, specializations: base.specialization, base });
}

const presentPredicationSite = site => Object.freeze({
  kind: SITE, cells: site.cells.cells, specializations: site.specializations,
});
const freePredicationSite = ({ cells, specializations }) => predicationSite([...cells, ...specializations]);

function transfinitePredicationCategory(cellSet) {
  return Object.freeze({
    kind: "predication.transfiniteCategory", predicationCellSet: cellSet,
    predicationFiberFunctor: Object.freeze({
      kind: "predication.fiberFunctor", cellSet,
      base: projectBase({ ...cellSet, cells: cellSet.cells?.map(value => admitTriple(value)) }),
      entities: cellSet.entities,
    }),
  });
}

function generatePredicationCategory(articulation) {
  const [source, [[token]]] = admitArticulationCell(articulation).potentialAperiodicArticulationCell;
  return transfinitePredicationCategory(generatedPredicationCellSet(
    entitySetOf([token]), predicateSetOf([predicateOfClaim(source.claim)]),
  ));
}

function materializePredicationCategory({ predicationCellSet: { entities, predicates } }) {
  return predicationSite(entities.entities.flatMap(subject =>
    predicates.predicates.flatMap(predicate => entities.entities.map(object => predicationCell(subject, predicate, object)))));
}
const predicate = articulation => makeSite([predicatingCell(articulation)]);

function closeSpecialization(base) {
  const graph = createGraph(), terms = new Map(), specialization = [];
  const nodeId = value => {
    const id = coincidenceKey(value);
    if (!terms.has(id)) terms.set(id, value);
    return id;
  };
  for (const { domain, codomain } of base.specialization) {
    graph.addEdge({ from: nodeId(domain), to: nodeId(codomain) });
    specialization.push(edge(domain, codomain));
  }
  for (const [id, domain] of terms) {
    const direct = new Set(graph.outgoing(id).map(({ to }) => to));
    for (const target of reachable(graph, id)) if (!direct.has(target)) specialization.push(edge(domain, terms.get(target)));
  }
  const closed = Object.freeze({ ...base, specialization: Object.freeze(specialization) });
  if (bases.has(base)) bases.add(closed);
  return closed;
}

const cohere = (site) => Object.freeze({
  kind: "predication.coherence", saturated: site.cells,
  residue: Object.freeze({
    kind: SITE, cells: site.cells, specializations: site.specializations, base: closeSpecialization(site.base),
  }),
});

function unrelatedPairs(site) {
  const entities = site.cells.entities.entities;
  const key = (domain, codomain) => JSON.stringify([predicationTermKey(domain), predicationTermKey(codomain)]);
  const related = new Set(closeSpecialization(site.base).specialization.map(({ domain, codomain }) => key(domain, codomain)));
  const edges = entities.flatMap(domain => entities.filter(codomain => !related.has(key(domain, codomain)))
    .map(codomain => edge(domain, codomain)));
  return Object.freeze({ kind: "predication.unrelatedPairs", edges: Object.freeze(edges) });
}

function articulatedPredications(source, options = {}) {
  const { source: carrier, sourceOrdinal, entries } = incidence(traceOfArticulating(source, options), 0, Infinity);
  return Object.freeze({
    kind: "signcell.articulated-source-incidence.v1", source: carrier, sourceOrdinal, entries,
    site: makeSite(entries.map(({ cell }) => cell)),
  });
}

const converseCellInvolution = value => sameCell(converse(converse(value)), value);
const converseSeed = value => {
  const cell = predicationSeed(value);
  return sameCell(converse(cell), cell);
};
const converseCellDistinctWhenOriented = value => termCoincides(value.subject, value.object) || !sameCell(converse(value), value);
const subjectProjectionCellIdempotent = value => sameCell(subjectProjection(subjectProjection(value)), value);
const objectProjectionCellIdempotent = value => sameCell(objectProjection(objectProjection(value)), value);
const specializePredicateCellIdentity = value => sameCell(specialize(predicate => predicate, value), value);

export {
  articulatedPredications, baseObjectCoincides, cellIdentity, predicationCellSet, closeSpecialization,
  cohere, converseCellDistinctWhenOriented, converseCellInvolution, converseSeed, entitySet,
  freePredicationSite, generatePredicationCategory, generatedPredicationCellSet,
  isAdmittedPredicationBase, isSpecializationMorphism, materializePredicationCategory, nodeCoincides,
  objectProjectionCellIdempotent, predicate, predicateCoincides, predicateSet, predicationBaseNodeOf,
  predicationGeneratorsShape, predicationNodeIdentity, predicationPredicateIdentity, predicationSite,
  predicationSiteGeneratorsSchema, predicationTermIdentity, presentPredicationSite,
  specializationMorphism, specializationSchema, specializePredicateCellIdentity,
  subjectProjectionCellIdempotent, termCoincides, transfinitePredicationCategory, unrelatedPairs,
};

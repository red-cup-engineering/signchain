# SignChain

An evidence-ordering library: it assembles the two orderings over cells (the
truth order and the knowledge order) so that evidence composes -- knowledge
join, truth meet, negation, the fiber over a predicate -- and the typed
consequence built from them. That is its most boring reading, and it is the
brand name it uses.

Assembling orderings is composition of typed claims, which the
Curry-Howard-Lambek reading says is what code is. Pure.

## What lives here

- `log` — ordered, witnessed tellings and their canonical SignCell indexes.
  `new TellingLog(rows)` owns the supplied rows and remains appendable by
  default. After construction, `log.seal()` irreversibly finalizes that same
  log as a fixed history; `log.sealed` reports the state. No second storage,
  index or query engine is created. Every private append checks the sealed
  state before changing rows or indexes, including a second check after input
  admission in case an executable Proxy trap seals the log. Ordinary getter
  properties in the original source positions, polarity, witness and timestamp
  are refused WITHOUT invocation. Public `tell` and `deny` also reject a
  sealed receiver before inspecting new input. Repeated sealing
  returns the same history. Existing unsealed consumers retain their append
  behavior. Sealing does not authenticate witnesses or imply source authority.
- `typed-theory` — consequence over SignCell's predication base objects:
  inference morphisms (specialization, converse, subject/object
  projection), inference rules and their composition closure,
  breadth-first derivation search, typing judgments, derivation validity
  checking, and predicate words.
- `token-fiber` — the fiber algebra over SignCell's token frame: a claim
  read at every token in FOUR (FOUR^T, each order's meet residuated by its
  implication), and possibilizing and necessitating along the order, ◇ ⊣ □.
  It sits between the frame (SignCell's Heyting algebra of tokens) and the
  token sheaf SignGraph glues from it.

## Depends on

`@red-cup-engineering/metrologic` for its metrology and `@red-cup-engineering/signcell`
for the predication cell it assembles orderings over. Canonical content and
witness identities use SignCell's re-exported SCA operations, from the same
owner that retained those cells. The telling log, rule identity and fiber
program must not re-admit Cell-owned byte snapshots through an independently
resolved SCA instance: its private retained-carrier custody is different even
when the wire content is equivalent. Arbitrary source accessors still refuse;
this binding does not grant them admission. The explicit SCA dependency remains
for the packaged historical carrier-encoding comparisons.
Nothing here imports
SignGraph or SignCraft; SignCraft imports this.

## Inert outer telling-source admission (2026-10-27)

The original `./log` reader now imports a tiny descriptor guard from
`src/telling-source.mjs`. This guard inspects only the ordinary outer row
fields before constructing the existing SignCell `retainedCarrier`; its
nesting, typed bytes, canonical CBOR, provenance and evidence identities
still belong to SignCell, not another SignChain codec. Source-row getters,
including the observation clock consulted for time cuts, cannot execute merely
because a log is being read or appended. Invalid/missing persisted polarity
still refuses rather than defaulting to positive. Indexed appends calculate
all canonical source keys before changing row or index state. A sealed log
refuses before inspection and remains unchanged after reentrant Proxy
descriptor traps. Arbitrary in-process Proxy traps are executable and cannot
be made intrinsically safe without an external sandbox/capability boundary.

Conformance includes source-only descriptor tests and the original native
`test/log.test.mjs`, `test/log-finalization.test.mjs`, and
`test/claim-event-log.test.mjs`. No extra ledger, wire format, source
authentication, durability, delivery, or authority is claimed.

## Single-snapshot native telling queries

All original `TellingLog` read operations (`where`, `against`, `latest`,
`cells`, `readingWhere`, `readingAt`) use the same small descriptor
source guard as append admission. Only own enumerable data coordinates may
select an indexed query, and the snapshot is retained through the original
SignCell/SCA carrier before accessing the existing canonical indices. FOUR
readings inspect both polarity lanes in one selected proposition cut rather
than evaluating the caller's potentially changing object twice. Additional
unrecognized query properties do not silently become authority or evidence.
Canonical byte coincidence and repeated/contradictory source tellings keep
their original semantics; there is no second index or truth evaluator.
JavaScript Proxy traps still require host sandbox/capability protection.

## Native CloudEvents JSON structural equality

The original `logOfCellEventMessages` source/id collision guard now compares
nested JSON **object members** independent of transport enumeration order,
while preserving ordered arrays, exact source URIs, witness content and
literal Unicode spelling. This does not convert SignCell evidence into another
codec, SCA content identity, signed authority or durable event ledger:
`cellEventOfMessage` first admits the existing SignCell CloudEvent, and
the comparison merely detects reuse of its declared source/id with a
different structured JSON body.

## Rules are source-admitted before generating inference evidence

The original SignChain `./rules` now admits an inert, dense, undecorated
antecedent array, each threshold and original Cell coordinate as own data,
and one similarly guarded consequent. It then delegates actual triple
retention and semantic addressing to SignCell. Plain getters cannot execute
to select a premise or generate a rule witness; a malformed index cannot
silently omit a needed antecedent. An always-firing rule also guards its
source Cell *before* obtaining a content address. This is not a private rule
hash, a new scripting language, or authority to perform an effect.

The original `test/rule-index-consistency.test.mjs` now covers malicious
rules and the four-stage cascading positive implication model from
[Obsmetrologia #106](https://github.com/lenticule-science/obsmetrologia-science-services-section/issues/106).
As proved there, a charge fiber's finite height does not bound the number
of **global** synchronous Tstep rounds. Only an actually reached and
checked fixed point is closed; SignCraft's original `closureOrbit` remains
the owner of complete settlement and its evidence receipts.

## Public rule receiving must never bypass constructor admission

The original `rule()` now qualifies its exact immutable in-process result.
All public `derivation`, `fireRule`, `fireRuleIn`, `antecedentHolds`,
`fire`, `step` and `firedRuleNames` operations use that qualified
instance or re-admit a strict four-field transported rule through the
same source constructor. Legacy JSON settlement records may be received
only after reconstructing their original rule under SignCell's canonical
triple semantics. Re-read rather than cache mutable external records:
a changed rule means a changed provenance identity. Executable getter
traps and unauthorized extra fields refuse without invoking source code;
a matching `kind` string alone never confers producer admission.

Original SignCraft settlement replay still owns source-site validation,
the derivation-version choice and effects. In-memory rule admission
does not verify external authority, signatures, provenance chains,
chronological facts, or that a closure fixed point was reached.

## Finite truth nuclei, downstream of Obsmetrologia

The existing `./token-fiber` now provides `truthPoleClosure` and
`truthNuclearQuartet` as **bounded readouts over original SignCell token
frames**, not a rival algebra, certificate of authentic witnessing, execution
system or independently generated settlement. Their implementation reuses
Computer Data's original `truthJoinReading` pointwise. Poles must be total
admitted FOUR assignments over the complete original frame, so absent
testimony never quietly becomes a mathematically selected truth pole.

The four one-input projections are `source`, `first`, `second`, and
`both`; the last lies in the intersection of the two fixed-point layers
because truth-pole nuclei commute. Original `test/token-fiber.test.mjs` now
checks exhaustive charge-level truth nucleus laws and 4096 two-token
commutation/fixed-layer combinations, as well as the *counterexample*
where truth closure is not knowledge inflationary. This corresponds to the
truth-grade nuclei in Obsmetrologia `Language/Positing/FiberAlgebra.lean`.
It is not the source-generated `sigma/Delta` action on a performed
Mark→Articulating→Predicating→Positing→Settling trace; those proofs and
effects remain Science/SignCraft responsibilities.

## Inert finite valuations — same boundary as truth poles

All `./token-fiber` valuation readers now admit only dense, undecorated,
plain finite data arrays with own enumerable `token` and `reading` data
descriptors before any reading or truth-pole projection. That rule applies
to knowledge/truth ordering, both modal adjoints, `pointwise`,
`truthPoleClosure`, and `truthNuclearQuartet`. Getter-backed, sparse,
decorated, or fabricated prototype-backed values refuse rather than
invoking foreign code to produce a false witness. Same-token contradictory
FOUR values still knowledge-join in their original order-independent
lattice. Token coincidence and reading admission still come from the
original SignCell and Computer Data owners; the descriptor guard is not
another hash, schema/ledger, or authentication certificate. Executable
Proxy traps still require the host's separate capability boundary.

## Witnessed predication-base endpoint receiving

`theoryOfBase` now requires the original SignCell `predication.base`
carrier to contain every endpoint of every declared specialization, converse
and heterogeneous subject/object extraction generator. All four families
are read and validated before constructing their typed inference rules.
If even one source endpoint is absent, the original theory refuses
instead of manufacturing an object or laundering an incomplete site into
a well-typed derivation. SignCell's `baseObjectCoincides` is the sole
semantic comparison. The returned object's wrapper is immutable and
getter/sparse-array source controls reject executable inputs without
evaluating foreign accessors.

This is a **receiving gate for** [SignCell predication-base correction
#35](https://github.com/red-cup-engineering/signcell/pull/35). The current
published SignCell supplier may still emit an incomplete historical base;
do not merge or claim installed product readiness until the corrected source
is published at an immutable version and the original `predicationSite →
theoryOfBase` path is executed with that exact dependency. The heterogeneous
term-extraction morphisms are NOT the diagonal cellwise projection generators;
those retain their original SignCell/Obsmetrologia semantics. No new graph
runtime, theorem, source authority or ledger is introduced.

## Producer origin is required, not just categorical source shape

The consumer `theoryOfBase` now calls the original exported SignCell
`isAdmittedPredicationBase` before inspecting any purported source object
carrier, generator endpoint, or `kind`. A same-shaped JSON copy or a
hand-constructed base cannot become a proof theory merely by reproducing
fields or hashes. Legitimate `predicationSite` and its source-generated
`closeSpecialization` qualify through the **same installed SignCell module
instance**. This is local construction custody, not authentication of an
external observation, principal, ledger transfer, or signed proof.

The receiving test now uses actual SignCell `predicationSite` carriers,
rather than the former handwritten fake `predication.base` fixture.
The correction requires an immutable SignCell release containing its
new producer guard; it will not run against the historical package until
that dependency is pinned, installed, and independently tested.

### Receiving an older installed SignCell supplier

The original typed-theory module now imports the SignCell predication
*namespace*, rather than statically importing a symbol that might be absent
from the current pinned version. Other previously supported typed-theory
operations therefore remain importable. `theoryOfBase` fails **closed**
with a specific missing-source-owner error until its installed SignCell
instance actually exports `isAdmittedPredicationBase`; there is no
schema-shape fallback or newly fabricated producer registry. Once a
qualified supplier is installed, genuine producer-carrier admission is
unchanged. The native producer-to-consumer conformance suite remains a
release gate, not an excuse to skip tests.

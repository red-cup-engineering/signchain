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
  admission in case an input getter finalizes the log. Public `tell` and `deny`
  also reject a sealed receiver before inspecting new input. Repeated sealing
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

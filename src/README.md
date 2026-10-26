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

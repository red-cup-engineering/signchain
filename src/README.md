# SignChain

An evidence-ordering library: it assembles the two orderings over cells (the
truth order and the knowledge order) so that evidence composes -- knowledge
join, truth meet, negation, the fiber over a predicate -- and the typed
consequence built from them. That is its most boring reading, and it is the
brand name it uses.

Assembling orderings is composition of typed claims, which the
Curry-Howard-Lambek reading says is what code is. Pure.

## What lives here

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
for the predication cell it assembles orderings over. Nothing here imports
SignGraph or SignCraft; SignCraft imports this.

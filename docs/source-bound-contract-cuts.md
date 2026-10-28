# Source-bound contract cuts

## Receiving scenario and allocation

The Leader's 2026-10-26 requirement is to make source-bearing SignCells govern
the actual construction and iterative settlement of software. A workflow builder
must not connect two moves merely because their predicates share a consequence,
or accept an observation whose duplicated provenance disagrees. It must retain
the original contract declarations and the particular computation licensing a cut.

SignCell owns carrier retention, coincidence, Cells and their evidence. SignChain
owns declared implication, rules and conditional contract composition. Existing
SignGraph support/overlap and sheaf readers retain their separate geometric
obligations. No new logic, graph, hash, solver or journal is introduced here.

## Guarantees

| Clause | Required behavior | Distinguishing acceptance |
| --- | --- | --- |
| PC1 | A predicate has an own nonblank string id; a supplied entails is an inert, finite array of nonblank string ids. Malformed declarations never establish a cut. | Empty/missing/inherited ids, strings masquerading as arrays, sparse arrays and accessors refuse. |
| PC2 | The cut Q => P is established only by equal admitted ids or an explicit Q.entails entry equal to P.id. | Shared consequence and reverse-edge cases refuse; direct edges and identity pass. |
| BC1 | Contract and instrument schema boundaries reuse schemaOperationsCompose. | Equal null, blank or object coordinates do not establish a typed boundary. |
| EX1 | Repeated at, caller and boundary coordinates must coincide under SignCell's native relation. An outer observation cannot be matched merely by a different nested observation being present. | Changed time, observer, candidate or boundary data refuse; key reordering and the native admitted canonical relation pass. |
| EX2 | Existing contract fingerprint and evidence-policy checks remain binding. | Changed source contract and missing required observations still refuse. |
| EX3 | Coordinate/exposure constructors own the complete native carrier, and report admission snapshots before inspection. | Later nested or byte-array mutation cannot rewrite an earlier observation; caller accessors refuse without execution. |
| CE1 | Every ordinary composition report carries original retained contracts and native Cells for its schema cut, declared predicate cut and conditional conclusion. | Source mutation does not rewrite a receipt; changing source content changes the cut's subject and requires new evidence. |
| CE2 | The conclusion is produced by the existing SignChain rule owner from both positive premises. | Exact rule identity and both original Cell addresses are present in the derived witness; an absent premise leaves the conclusion untold. |
| CE3 | Missing declarations are missing evidence, not negative testimony about logical implication. | Unestablished cuts have neither evidence lane; a separate positive diagnostic records why the local admission failed. |
| CE4 | Readmission replays the original operation and compares the complete canonical result. | Changed sources, rule, witnesses, missing cells and forged positive conclusions refuse; native JSON round-trip passes. |
| CE5 | Cell identity retains every distinction used by the literal identifier comparison. | Canonically equivalent NFC/NFD schema or predicate spellings that produce different literal cuts have different premise and conclusion addresses; merging cannot transfer a license between them. |

Predicate ids designate the declarations supplied by the caller. An explicit
entails entry is a declaration, not a theorem prover or authenticated proof.
A matching lens id in `contractsCompose` or `contractExposureReport` establishes
coordinate compatibility, not a performed observational projection. The existing
`observationalLens` retains declared `preserves`/`hides` lists without testing
their preservation laws; the exposure report checks identities and required
record presence. The conditional cut establishes no source authentication,
execution authority, runtime result, customer acceptance or global safety.

## Representation and refinement

`contractCompositionEvidence(left, right)` retains complete source contracts,
assigns their native SignCell content identities, and builds two premises whose
subject/object are those identities. A positive witness records its source ids,
the exact inspected source paths and the selected identity/direct-declaration
law. A fixed versioned SignChain rule requires both premises at `potential` in
knowledge order and tells the conditional composition Cell at `potential`.
The rule's native derivation preserves its whole content identity and premise
addresses. Diagnostics have a separate predicate and never deny an unknown cut.
Their object is `{right: rightSourceId, reason, cut: conclusionAddress}`, so one
left contract's unestablished cuts remain bound to their particular right source
and inspected coordinates.

The existing schema/predicate policy compares identifiers literally. SignCell's
canonical content quotient can identify different Unicode presentations, so
source content ids alone are too coarse for this particular computation. Each
premise object therefore also carries the exact inspected identifiers as the
native owner's hexadecimal projection of the UTF-8 bytes of their standard JSON
string representation (`utf8-json-string-hex`). ASCII hexadecimal survives
text normalization. The current native carrier rejects unpaired Unicode surrogates
before comparison; this projection does not widen its admitted text domain.
Non-string coordinates have no admitted identifier. No hash or general codec is
reimplemented. The conclusion names both premise addresses, making this actual
comparison basis part of its Cell identity. The original source representatives
remain retained alongside that explicitly selected observation relation.

`contractsCompose` carries this evidence as `cellEvidence` alongside the existing
report. `composeRelationalContracts` consumes that report through its original
gate; `instrumentsCompose` forwards the same source evidence and still enforces
its additional presentation, phase, lens and evidence-policy conditions.
Both report readers snapshot their supplied sources before inspecting any fields.
Its source contracts are the original `instrumentContract` projections, including
their generated contract ids and refinement obligations. They intentionally have
different identities from unprojected instrument records.

`admitContractCompositionEvidence(left, right, received)` reconstructs through
the same source owners and compares the complete native canonical carrier.
`contractCompositionEvidenceSchema` describes the JSON wire shape, while replay
establishes the stronger source/derivation relationship. Shape validation alone
does not establish that relationship. Retained byte carriers and exact integers
remain native carriers; plain JSON only transports the JSON-compatible subset.

Source content identity is not occurrence identity. The originals are retained
with their lexical representatives; equality uses the owner's declared canonical
relation. This does not authenticate a source or reconstruct an unrecorded event.
Additional opposing testimony can be joined by normal SignCell operations, but
such an enriched result is not the unchanged producer receipt and must not pass
its exact replay admission.

Exposure comparison uses that same native coincidence operation and does not
rewrite either source observation. A legacy coordinates-only observation keeps
its existing evidence-policy interpretation. No comparison turns a missing
observation into a witness. Constructors retain source-owned native snapshots,
including byte-valued boundaries, and readers refuse inert-carrier violations
before field inspection. Historical contract fingerprint encoding is unchanged.

## Scientific and standards basis

- Obsmetrologia `Language/Spine.lean` and `Language/Predicating/Cell.lean` at
  `a8515044eb632f4fc3b639e3b3d8d106e64b90ff`: source-forgetting projections cannot
  recover the original performed source; the four predication generators do not
  create arbitrary entities from one reflexive seed.
- The same source's `Language/Positing/FiberAlgebra.lean`: knowledge and truth
  orders have different closure obligations. This rule uses knowledge thresholds.
- `Closure/ProjectionHiddenObstruction.lean`: successful thin projections do not
  establish rich gluing. This finite cut does not claim global composition proof.
- JSON Schema Draft 2020-12 describes structural validation. Replay and the
  actual consumer remain separate checks: https://json-schema.org/draft/2020-12/.

Native positive/refusal tests, independent adversarial cases and actual
instrument/composite calls qualify this change. Publication, installed platform
uptake and external receiving are separate stages recorded with the release.

# Reading channel observations as witnessed knowledge

The shared logging requirement needs an existing retained message to be usable
by the same SignChain readers as a retained SignCell. The source event is already
admitted by SignCell's CloudEvents claim profile. SEAVT continues to own custody
and complete causal cuts; this change adds a pure read projection to the existing
`./log` module and `TellingLog`, with no second ledger or envelope.

`logOfCellEventMessages(messages, {asOf?})` reads native messages carrying that
profile. The caller selects the source stream; observations must be ordered by
their exact observed instant. A supplied `asOf` cut uses that same receiver clock,
not an event's asserted occurrence time. The resulting sealed log contains only
the original claim's for/against witnesses. Receipt, severity, trace context and
event metadata cannot manufacture an affirmative telling.

| Clause | Required result |
| --- | --- |
| CL1 | Admit the original native message and claim envelope through SignCell before reading their content. Forged messages or non-claim payloads refuse. |
| CL2 | Preserve the original proposition, witness and evidence side, including opposing evidence. A cell with an explicit valuation different from its evidence-derived value refuses because a telling-only projection cannot retain that extra assertion. |
| CL3 | Repeated delivery of a claim, and cumulative reports of the same witness, do not create additional witnesses. Deduplicate by the existing `(cell address, side, witness)` identity used by `logOfSeavtRows`. |
| CL4 | CloudEvents identity is the exact `(source,id)` pair. The same pair carrying different envelope content within the selected cut refuses atomically. Distinct sources with the same id remain distinct occurrences. Field order has no meaning, but original string spelling does. |
| CL5 | Nanosecond observation cuts and nondecreasing input order are checked exactly. An earlier asserted event time cannot move later-received evidence behind the cut. |
| CL6 | The returned existing `TellingLog` is sealed. Its rows keep the first observation of each original witness; unasserted claims contribute no rows. The retained messages remain the source for event identity, occurrence history, trace context and original payload. |

This projection does not establish source authenticity, historical event
uniqueness outside the supplied cut, physical durability, delivery completeness,
authorization or settled truth. Conflicting event identities remain recoverable
in the custody owner's source messages and cannot silently overwrite a result.
Contradictory claims with distinct event identities remain ordinary opposed
evidence, not transport conflicts.

The scientific meaning and coincidence relation are the same as `telling`,
`logOfSeavtRows` and SignCell. The protocol identity comes from
[CloudEvents 1.0.2](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md).
Native observation and claim interchange follow the existing SignCell
`2026-10-26-cell-cloud-events.md` specification. Tests in
`test/claim-event-log.test.mjs` derive admission, replay, conflict, exact-cut,
opposing-evidence and source-retention cases from CL1–CL6.

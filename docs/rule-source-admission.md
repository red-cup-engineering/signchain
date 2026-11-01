# Rule source admission

SignChain owns the positive-threshold rule language, its source admission and
its witnessed immediate-consequence operator. SignCraft owns composition of
that operator into a cellular closure engine. A downstream dependency index
must not read a caller's rule fields before the rule's original owner admits
them.

`admitRule(source)` exposes the existing original admission operation. It
returns the same object for a native rule, or reconstructs an exact inert wire
rule through `rule`. `admitRules(source)` captures a dense inert array and
admits each position through that operation, returning a frozen ordered
family. Repeated occurrences remain repeated. Caller mutations cannot change
an admitted rule, its thresholds, conclusion or complete derivation identity.

Both public firing and downstream closure use this one boundary. Getters,
holes, overridden array methods, foreign dialects and decorated rule records
are refused before their executable positions are read. Admission establishes
the rule's structural contract; it does not authenticate its issuer or grant
permission for an external action.

The existing `rule-index-consistency` receiving suite checks native identity,
wire mutation, repeated positions, complete derivation witnesses and inert
source refusals. SignCraft's consumer must additionally verify the entire
closure orbit and history append through these admitted rules.

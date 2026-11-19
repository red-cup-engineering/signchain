# SignChain

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

SignChain composes ordered tellings, predication sites, rules, and contract cuts over SignCell evidence. Metrologic supplies the mathematics. The Group's data libraries supply exact and semantic addressing and typed source admission.

## Evidence and rules

Use [the receiving example](test/receiving.test.mjs) to construct an ordered telling history, read both witness lanes, and fire an admitted rule. When a physical or organizational observation supplies an occurrence, pass its `{source, id}` to `tellingEvent` separately from its witness.

Keep the `events` returned by `replayTellingEvents` as the mergeable state. The `original` log retains the verified original tellings in event-address order. The `effective` log reads the evidence that survives causally scoped repairs. An ordered `TellingLog` retains the sequence supplied by its caller. External producer order, source authority, and effects belong to the host.

A repair supersedes the live opposed evidence it cites. Previously unseen evidence survives. Competing concurrent repairs remain contested until a later repair sees both. Replay reports an address mismatch, conflicting source occurrence, missing basis or invalid basis.

## Install and test

Use Node.js 24.2 or later. Install the candidate archive in a consumer directory.

```sh
npm install ./red-cup-engineering-signchain-0.7.0-dev.0.tgz --registry=https://registry.561.group/
node --test "$PWD/node_modules/@red-cup-engineering/signchain/test/receiving.test.mjs"
```

Run `pnpm test` from a source checkout after installing the selected suppliers. Refer to [implementation and receiving](content/implementation.md) for the selected obligations and [requirements](requirements/) for peer comparison.

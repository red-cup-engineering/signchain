# SignChain

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

Orderings, tellings, rules and contracts over SignCell cells.

## Quickstart

Create a rule over SignCell cells and apply it to a valuation that meets its precondition. The [runnable example](examples/quickstart.test.mjs)
uses the same public imports as an installed application.

```sh
npm run test:consumer
```

Run the source suite with `npm test`.

## Place in the family

Metrologic → SignCell → SignChain → SignGraph → SignCraft. Each library may import
only those before it. SignChain imports: Metrologic and SignCell.

Metrologic holds pure mathematics; the Sign libraries hold the semiotic
implementation (cells, ports, channels, messages); specific formats and protocols
are codecs downstream of the family.

## Install

Packages are published to the 561 Group registry, which serves them without
authentication. Node.js 24.2 or later is required.

```sh
npm install @red-cup-engineering/signchain --registry=https://registry.561.group/
```

## Status

The family is being rebuilt to that order. See
[the plan](https://github.com/red-cup-engineering/computer-engineering-services-section/blob/main/content/text/documents/specifications/2026-11-07-rebuilding-the-sign-family-from-its-theory.md).

## Requirements

The peers this library must meet, then beat, are recorded in [requirements/](requirements/).

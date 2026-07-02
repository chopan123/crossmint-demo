# Mission

**crossmint-demo** is a minimal, reference-quality web app that shows how to build
a non-custodial **Crossmint** wallet on **Stellar** and act on it — starting with
sending tokens, and growing toward DeFi.

## Why this exists

Developers evaluating Crossmint want a small, readable example that goes from
"user signs in" to "on-chain action" without ceremony. This repo is that example:
opinionated, single-purpose screens, no seed phrases, email-based recovery.

## Product principles

- **Smallest thing that works.** Each feature is intentionally narrow and
  independently shippable. No kitchen-sink dashboards.
- **Non-custodial by default.** Wallets are created on login (`createOnLogin`)
  with email recovery; users never manage keys.
- **Readable over clever.** Code reads like documentation. Types stay loose where
  that keeps the flow legible.
- **Docs-as-artifact.** Where an integration is non-obvious, the repo ships a
  self-contained guide alongside the code so others can reproduce it.

## Audience

Developers integrating Crossmint wallets, and teams exploring Stellar-based DeFi
(e.g. DeFindex vaults) on top of a Crossmint wallet.

## Success looks like

A developer can clone the repo, add an API key, and within minutes sign in, send
tokens, and follow a written guide to deposit into a yield vault — all from a
non-custodial wallet.

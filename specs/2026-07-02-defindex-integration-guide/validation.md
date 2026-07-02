# Validation — DeFindex Integration Guide

## Automated

Docs-only phase; the guide adds no code, but the repo must stay green:

- [ ] `npx tsc --noEmit` passes (no accidental source changes).
- [ ] `npm run lint` passes.
- [ ] `npm run build` succeeds.
- [ ] If any TS snippet is extracted into the repo, it typechecks; otherwise
      snippets are Markdown-only and this does not apply.

## Content assertions

- [ ] `docs/guides/defindex-integration.md` exists.
- [ ] Covers, in order: APY → balance → deposit → sign → send → withdraw.
- [ ] Lists a DeFindex API key as a **prerequisite** (with a one-line pointer to
      the auth flow) and does NOT walk through register/login/key generation.
- [ ] Uses the fixed mainnet vault
      `CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK` throughout — no
      `/vault/discover` or `/strategies` discovery step.
- [ ] All network query params are `network=mainnet`.
- [ ] Every code block is copy-pasteable TypeScript using `fetch` (no
      pseudo-code, no unexplained placeholders beyond `DEFINDEX_API_KEY` and the
      user address).
- [ ] Deposit/withdraw snippets pass `amounts` as `number[]` in stroops
      (`[Number(amountStroops)]`), never strings.
- [ ] The `POST /send` snippet reads `json.txHash ?? json.hash ?? json.id`.
- [ ] Includes the security callout distinguishing the secret `sk_…` DeFindex
      key (server-side only) from the browser-safe `ck_…` Crossmint key.
- [ ] The Crossmint signing step names a concrete, verified SDK method (from
      `@crossmint/client-sdk-react-ui@^4.2.8`); if no raw-XDR signing method
      exists, the guide documents the supported path and flags the gap rather
      than inventing an API.
- [ ] Includes the 429 `retryAfter` back-off snippet and an error-status table.

## Manual walkthrough

1. Starting with a prerequisite `sk_…` key already in `DEFINDEX_API_KEY`,
   confirm the `defindexFetch` helper authenticates successfully.
2. With a logged-in crossmint-demo wallet address, run the APY and balance
   snippets; confirm they return the documented shapes.
3. Trace the deposit→sign→send flow end-to-end on paper (or with a small real
   deposit if funds are available) and confirm the signing bridge step actually
   produces a signed XDR that `POST /send` accepts.
4. Confirm the guide is reachable from the repo (README link and/or docs index).

## Tone check

- [ ] Matches README voice: concise, second-person, docs-as-artifact.
- [ ] Intros are short; flow is numbered; footguns are called out explicitly.

## Definition of done

The guide lets a developer, starting from a Crossmint Stellar wallet in this
repo, authenticate to DeFindex, read APY/balance, and deposit into and withdraw
from the fixed mainnet USDC vault — reproducibly, from the Markdown alone — and
the repo's typecheck/lint/build remain green.

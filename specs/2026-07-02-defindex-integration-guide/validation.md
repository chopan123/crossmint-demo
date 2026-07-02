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
- [ ] Covers, in order: APY → balance → deposit → wrap/sign → submit → withdraw.
- [ ] States that the caller is a Crossmint **smart wallet** with a `C…` contract
      address (not a `G…` account), and that this is the only caller path shown.
- [ ] Deposit/withdraw sections show the smart-wallet response
      `{ xdr: null, operationXDR, isSmartWallet: true }` and explain why `xdr` is
      null (a `C…` address can't be a Stellar transaction source).
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
- [ ] The guide states `POST /send` is NOT used on the smart-wallet path (it's
      for pre-signed `G…`-source XDRs); submission goes through the wallet.
- [ ] Includes the security callout distinguishing the secret `sk_…` DeFindex
      key (server-side only) from the browser-safe `ck_…` Crossmint key.
- [ ] The signing step uses `StellarWallet.from(wallet).sendTransaction({
      transaction: operationXDR, contractId: VAULT })` — the verified method in
      `@crossmint/wallets-sdk@1.5.0` (re-exported by react-ui `^4.2.8`) — and
      reads the resulting hash for an explorer link.
- [ ] The smart-wallet branch was verified against the live API (not just the
      skill docs, which omit it).
- [ ] Includes the 429 `retryAfter` back-off snippet and an error-status table.

## Manual walkthrough

1. Starting with a prerequisite `sk_…` key already in `DEFINDEX_API_KEY`,
   confirm the `defindexFetch` helper authenticates successfully.
2. With a logged-in crossmint-demo wallet address, run the APY and balance
   snippets; confirm they return the documented shapes.
3. Trace the deposit→sendTransaction flow end-to-end on paper (or with a small
   real deposit if funds are available): confirm a `C…` caller returns
   `operationXDR` with `xdr: null`, and that
   `StellarWallet.from(wallet).sendTransaction({ transaction: operationXDR,
   contractId: VAULT })` submits the op on-chain and returns a usable hash.
4. Confirm the guide is reachable from the repo (README link and/or docs index).

## Tone check

- [ ] Matches README voice: concise, second-person, docs-as-artifact.
- [ ] Intros are short; flow is numbered; footguns are called out explicitly.

## Definition of done

The guide lets a developer, starting from a Crossmint Stellar **smart wallet**
(`C…`) in this repo and a pre-obtained DeFindex API key, read APY/balance and
deposit into / withdraw from the fixed mainnet USDC vault via the smart-wallet
`operationXDR` path — reproducibly, from the Markdown alone — and the repo's
typecheck/lint/build remain green.

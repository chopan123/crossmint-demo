# Plan — DeFindex Integration Guide

Deliverable: `docs/guides/defindex-integration.md`. Docs-only phase; no runtime
code or dependencies. Task groups are independently draftable.

## 1. Verify facts before writing

1.1 Confirm base URL, auth flow, and endpoint shapes against the `defindex-api`
    skill (`auth.md`, `endpoints.md`) — treat the skill as source of truth.
1.2 Confirm the fixed worked-example constants: vault
    `CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK`, USDC SAC
    `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75`, 7 decimals.
1.3 Determine the exact Crossmint Stellar XDR-signing method available in
    `@crossmint/client-sdk-react-ui@^4.2.8` (inspect the installed package
    and/or Crossmint wallets docs). Record the concrete method used in the guide;
    if none exists for raw XDR, document the supported path and flag it.

## 2. Guide scaffold

2.1 Create `docs/guides/defindex-integration.md` with a title, one-paragraph
    intro (what DeFindex vaults are, what this guide builds), and a
    "Prerequisites" list: a running crossmint-demo wallet, and a DeFindex API
    key (`sk_…`) already generated — with a one-line pointer to the DeFindex auth
    flow (register → login → `POST /api-keys/generate`) and `auth.md`, without
    walking through it.
2.2 Add a "Worked example parameters" table (network, vault, asset, decimals).
2.3 Add a table of contents / numbered section list matching the flow below.

## 3. Setup section (key + helper)

3.1 Add the security callout: the prerequisite `sk_…` key is secret and
    server-side only; contrast with the browser-safe `ck_…` Crossmint client key.
    Reference storing it as `DEFINDEX_API_KEY` (no generation steps).
3.2 Show a reusable `defindexFetch` helper (base URL + Bearer header) used by all
    later snippets.

## 4. Read endpoints section

4.1 APY: `GET /vault/{VAULT}/apy?network=mainnet` snippet + sample response.
4.2 Balance: `GET /vault/{VAULT}/balance?from={address}&network=mainnet` snippet;
    explain `dfTokens` vs `underlyingBalance` and stroop→USDC conversion.

## 5. Deposit → sign → send section

5.1 Deposit: `POST /vault/{VAULT}/deposit` snippet returning unsigned `xdr`;
    stress `amounts: [Number(amountStroops)]` (integer stroops, not strings) and
    `invest` / `slippageBps` fields.
5.2 Signing bridge: show how the Crossmint Stellar wallet from `useWallet()`
    signs the unsigned XDR (using the method confirmed in 1.3), returning a
    signed base64 XDR envelope.
5.3 Submit: `POST /send?network=mainnet` snippet; read
    `json.txHash ?? json.hash ?? json.id`; build a Stellar explorer link like
    `components/SendForm.tsx` does.
5.4 Provide the end-to-end deposit→sign→send snippet as one copy-paste block.

## 6. Withdraw section

6.1 `POST /vault/{VAULT}/withdraw` (by asset amount) → sign → send snippet.
6.2 Note on `POST /vault/{VAULT}/withdraw-shares` (burn dfTokens) with its body
    shape; same sign→send path.

## 7. Reference & wrap-up

7.1 Error table (400/401/403/429/500) and the 429 `retryAfter` back-off snippet.
7.2 One-line note that swapping `network=testnet` targets Stellar testnet.
7.3 "Next steps" pointer to Phase 2 (in-app deposit UI).

## 8. Wire-up

8.1 Verify all internal links and that the guide is discoverable (link it from
    `README.md` and/or a `docs/guides/README.md` index if present).
8.2 Run typecheck/lint/build to confirm the docs-only change breaks nothing.

# Requirements — DeFindex Integration Guide

**Phase:** 1 — DeFindex integration guide (see `specs/roadmap.md`)
**Deliverable:** A self-contained Markdown guide in `docs/guides/` that teaches a
developer to integrate the DeFindex REST API against a **fixed mainnet USDC
vault**, and to sign the resulting transactions with a **Crossmint Stellar
wallet** from this repo.

## Scope

### In scope

The guide walks the reader through, in order:

1. **Vault context** — the guide targets ONE hard-coded vault; no discovery step.
2. **Caller is a Crossmint smart wallet** — this repo creates a Stellar smart
   wallet on login (`createOnLogin`, see `README.md`), so `wallet.address` is a
   **contract address that starts with `C…`**, not an ed25519 `G…` account. This
   is the ONLY caller path the guide documents.
3. **APY** — `GET /vault/{addr}/apy?network=mainnet`.
4. **Balance** — `GET /vault/{addr}/balance?from={C-address}&network=mainnet`
   (dfTokens + underlying).
5. **Deposit (smart-wallet path)** — `POST /vault/{addr}/deposit` with
   `caller: <C-address>`. Because a `C…` address can't be a Stellar transaction
   source (only `G…` accounts sign/pay fees), the API builds the transaction
   against its own helper source and therefore returns **`xdr: null`**, plus
   **`operationXDR`** (the bare contract operation) and **`isSmartWallet: true`**.
6. **Wrap & submit via Crossmint** — the integrator wraps `operationXDR` into a
   transaction sourced by the Crossmint smart wallet and signs/submits it through
   the wallet from `useWallet()` (see Decisions / signing below). Read
   `txHash ?? hash ?? id`; link to the Stellar explorer.
7. **Withdraw** — `POST /vault/{addr}/withdraw` (by asset amount) and a note on
   `POST /vault/{addr}/withdraw-shares` (by dfTokens); each follows the same
   smart-wallet wrap-&-submit path (also returns `operationXDR` + `xdr: null`).

### Prerequisites (not covered in the guide body)

The guide assumes the reader already holds a DeFindex API key. It lists this as
a prerequisite with a one-line pointer to the DeFindex auth flow (register →
login → `POST /api-keys/generate`) and to the `defindex-api` skill's `auth.md`,
but does **not** walk through registration/login. The reader is expected to
arrive with `DEFINDEX_API_KEY` (an `sk_…` key) already set.

### Fixed parameters (worked example)

| Parameter | Value |
|-----------|-------|
| Network | `mainnet` (Stellar Public Network) |
| Vault | `CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK` (Soroswap EARN USDC) |
| Underlying asset | USDC SAC `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| USDC decimals | 7 → `1 USDC = 10_000_000` stroops |

### Out of scope

- **DeFindex authentication flow** (register → login → API key generation). This
  is a prerequisite, not part of the guide body — the reader arrives with
  `DEFINDEX_API_KEY` already set.
- `GET /vault/discover` and `GET /strategies` (no discovery — vault is fixed).
- Vault administration (roles, rebalance, fees, rescue, pause, upgrade).
- Factory / `create-vault` endpoints.
- Testnet walkthrough (mainnet only; a one-line note that `network=testnet`
  swaps the network is enough).
- Any in-app UI. This phase is **docs only** — Phase 2 builds the deposit UI.
- New runtime dependencies or code modules.

## Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| No discovery step | Hard-code the vault address | User specified a fixed USDC mainnet vault; keeps the guide short and reproducible |
| Format | Markdown with copy-pasteable **TypeScript `fetch` snippets** | Matches user answer; no new code files to maintain |
| Network/token | **Mainnet + USDC** | User answer; real vault, real yield |
| Caller type | Crossmint **smart wallet** — `C…` contract address only | This repo's wallets are `createOnLogin` smart wallets; the standard `G…` xdr-signing path never applies here |
| Signing path | `StellarWallet.from(wallet).sendTransaction({ transaction: operationXDR, contractId: VAULT })` | For a `C…` caller the API returns `xdr: null` (see scope); `sendTransaction`'s `{ transaction, contractId }` variant wraps, signs and submits the op from the smart wallet. `POST /send` is not used on this path. Verified present in `@crossmint/wallets-sdk@1.5.0` (re-exported by react-ui `^4.2.8`) |
| Amount units | Always stroops as `number[]` (`[Number(amountStroops)]`) | API requires integer stroops, not strings; a common footgun worth calling out |
| API key location | `DEFINDEX_API_KEY` server-side env var | The `sk_…` key is secret and must never ship to the browser (unlike the `ck_…` Crossmint client key) |

## Context

### Tone & style

- Match the README voice: concise, second-person, docs-as-artifact. Short intros,
  then a numbered flow, then runnable snippets.
- Every snippet must be copy-pasteable TypeScript using `fetch`; no pseudo-code.
- Call out the three footguns explicitly: (1) `amounts` must be `number[]` in
  stroops, not strings; (2) the `sk_…` DeFindex key is a **secret** and must not
  be exposed client-side like the `ck_…` Crossmint key; (3) because the caller is
  a `C…` smart wallet, deposit/withdraw return `xdr: null` + `operationXDR` +
  `isSmartWallet: true` — do NOT try to sign the null `xdr`; wrap `operationXDR`
  and submit via the Crossmint wallet.

### Security note (must appear in the guide)

The DeFindex API key (`sk_…`) grants account-level access and must stay
server-side. In this Next.js app that means a Route Handler / server action, not
a `NEXT_PUBLIC_*` var. The Crossmint client key (`ck_…`) is safe in the browser;
the DeFindex key is not.

### Signing — smart-wallet path (`C…` caller)

**Reference facts (verify against the live API during implementation — the
`defindex-api` skill docs only show the `G…` happy path and do NOT document this
branch):**

- `useWallet()` returns a `wallet` with `.address` = a **`C…` contract address**
  (Stellar smart wallet). Phase 0's `SendForm` treats the wallet loosely (see the
  `Wallet` type in `components/SendForm.tsx`) and calls `wallet.send(...)`,
  reading `{ explorerLink, hash }` back.
- Because a `C…` address cannot be a Stellar transaction source (only ed25519
  `G…` accounts sign and pay fees), DeFindex builds the deposit/withdraw
  transaction against its own helper source. Consequently, when `caller` starts
  with `C`, the write endpoints return:
  - `xdr: null` — no ready-to-sign envelope,
  - `operationXDR` — the bare vault contract operation,
  - `isSmartWallet: true`.
- The integrator is expected to **wrap `operationXDR` in a transaction sourced by
  their own smart wallet** and sign/submit it. The guide shows this through the
  Crossmint wallet from `useWallet()`, keeping the same interaction shape as
  `SendForm` (loose wallet typing, `{ hash, explorerLink }` result).

**Resolved — the SDK supports this (verified against installed packages).**
`@crossmint/client-sdk-react-ui` `^4.2.8` re-exports `StellarWallet` from
`@crossmint/wallets-sdk@1.5.0`, whose `sendTransaction` accepts "a serialized
transaction or contract call". Its `StellarTransactionInput` type includes the
variant `{ transaction: string; contractId: string }` — exactly the DeFindex
`operationXDR` (serialized op) + vault address. The guide uses:

```ts
import { useWallet, StellarWallet } from "@crossmint/client-sdk-react-ui";

const { wallet } = useWallet();               // wallet.address is a C… smart wallet
const stellar = StellarWallet.from(wallet);
const tx = await stellar.sendTransaction({
  transaction: operationXDR,                  // from the deposit/withdraw response
  contractId: VAULT,                          // the vault C… address
});
```

`sendTransaction` wraps, signs, and submits via the smart wallet, so **`POST /send`
is NOT used on this path** (that endpoint is for pre-signed `G…`-source XDRs).
Note the method is `sendTransaction` (raw op), distinct from the loose
`wallet.send(recipient, token, amount)` token-transfer convenience used in
`components/SendForm.tsx`.

### Existing patterns to follow

- Env conventions in `README.md` / `.env.example` (`NEXT_PUBLIC_CROSSMINT_*`).
- Explorer-link pattern already used in `components/SendForm.tsx`.
- The full deposit→send TypeScript pattern in the `defindex-api` skill
  (`endpoints.md`, "Full Deposit → Send Pattern").

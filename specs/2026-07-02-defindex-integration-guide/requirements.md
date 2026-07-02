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
2. **APY** — `GET /vault/{addr}/apy?network=mainnet`.
3. **Balance** — `GET /vault/{addr}/balance?from={address}&network=mainnet`
   (dfTokens + underlying).
4. **Deposit** — `POST /vault/{addr}/deposit` → unsigned XDR.
5. **Sign with Crossmint** — how the Crossmint Stellar wallet (`useWallet()`)
   signs the unsigned Soroban XDR returned by DeFindex.
6. **Submit** — `POST /send?network=mainnet` with the signed XDR; read
   `txHash ?? hash ?? id`; link to the Stellar explorer.
7. **Withdraw** — `POST /vault/{addr}/withdraw` (by asset amount) and a note on
   `POST /vault/{addr}/withdraw-shares` (by dfTokens), each → sign → send.

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
| Signing path | Crossmint `useWallet()` on Stellar | This repo already creates a Crossmint Stellar wallet; the guide bridges DeFindex's unsigned XDR to it |
| Amount units | Always stroops as `number[]` (`[Number(amountStroops)]`) | API requires integer stroops, not strings; a common footgun worth calling out |
| API key location | `DEFINDEX_API_KEY` server-side env var | The `sk_…` key is secret and must never ship to the browser (unlike the `ck_…` Crossmint client key) |

## Context

### Tone & style

- Match the README voice: concise, second-person, docs-as-artifact. Short intros,
  then a numbered flow, then runnable snippets.
- Every snippet must be copy-pasteable TypeScript using `fetch`; no pseudo-code.
- Call out the two footguns explicitly: (1) `amounts` must be `number[]` in
  stroops, not strings; (2) the `sk_…` DeFindex key is a **secret** and must not
  be exposed client-side like the `ck_…` Crossmint key.

### Security note (must appear in the guide)

The DeFindex API key (`sk_…`) grants account-level access and must stay
server-side. In this Next.js app that means a Route Handler / server action, not
a `NEXT_PUBLIC_*` var. The Crossmint client key (`ck_…`) is safe in the browser;
the DeFindex key is not.

### Signing bridge — reference facts

- `useWallet()` returns a `wallet` with `.address` (a Stellar `G…` address) and
  Crossmint's signing/transaction APIs (this repo currently uses `wallet.send`
  for plain transfers).
- DeFindex write endpoints return `{ xdr, simulationResponse, functionName }`
  where `xdr` is an **unsigned Soroban transaction envelope**.
- The guide must show how to get that unsigned XDR signed by the Crossmint
  wallet and returned as a signed base64 XDR envelope suitable for `POST /send`.
  During implementation, verify the exact Crossmint SDK method for signing a raw
  Stellar XDR against `@crossmint/client-sdk-react-ui` `^4.2.8` and the Crossmint
  wallets docs; if a direct XDR-signing method is not exposed in this SDK
  version, document the supported path and flag the gap clearly rather than
  inventing an API.

### Existing patterns to follow

- Env conventions in `README.md` / `.env.example` (`NEXT_PUBLIC_CROSSMINT_*`).
- Explorer-link pattern already used in `components/SendForm.tsx`.
- The full deposit→send TypeScript pattern in the `defindex-api` skill
  (`endpoints.md`, "Full Deposit → Send Pattern").

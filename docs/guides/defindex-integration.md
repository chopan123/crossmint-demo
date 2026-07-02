# Integrating DeFindex vaults with a Crossmint Stellar wallet

This guide shows how to read a [DeFindex](https://defindex.io) vault's yield and
move funds in and out of it — **APY → balance → deposit → withdraw** — using the
non-custodial Crossmint Stellar wallet this app already creates on login.

The important twist: Crossmint wallets on Stellar are **smart wallets** (their
address starts with `C…`, a contract address). That changes how vault
transactions get signed and submitted, and most DeFindex examples you'll find
assume a plain `G…` account. This guide covers the smart-wallet path end to end.

You can follow it top to bottom and reproduce every call.

## Before you start

You need two things this guide treats as **given**:

1. **A DeFindex API key** (`sk_…`). Generating one is a one-time
   register → login → create-key flow that is out of scope here — see the
   `defindex-api` skill's `auth.md`. Arrive with the key already in hand.
2. **A target vault address**. Discovery (`GET /vault/discover`) is also out of
   scope — this guide uses one fixed mainnet USDC vault. Swap in your own address
   the same way.

You also need this app running with a logged-in wallet (see the root
[`README.md`](../../README.md)); `useWallet()` gives you the `C…` smart wallet
used below.

### Worked-example parameters

| Parameter | Value |
|-----------|-------|
| Network | `mainnet` |
| Vault | `CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK` (Soroswap EARN USDC) |
| Underlying asset | USDC SAC `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| Decimals | USDC has **7 decimals** → `1 USDC = 10_000_000` stroops |

> Testnet: append `?network=testnet` instead of `mainnet` and use a testnet vault
> (e.g. the XLM vault `CCLV4H7WTLJQ7ATLHBBQV2WW3OINF3FOY5XZ7VPHZO7NH3D2ZS4GFSF6`).
> Everything else is identical.

## Two footguns worth reading first

1. **`amounts` are integer stroops, in a `number[]` — never strings.**
   `1 USDC` is `[10000000]`, not `["1"]`. Convert bigints with
   `[Number(amountStroops)]`.
2. **The `sk_…` DeFindex key is a secret — keep it server-side.** Unlike the
   browser-safe `ck_…` Crossmint client key, the DeFindex key grants
   account-level access and must never ship to the client. In this Next.js app
   that means Route Handlers, not a `NEXT_PUBLIC_*` var.

## Architecture

Two halves, split by the secret-key rule:

- **Server (Route Handlers)** hold the `sk_…` key and call `api.defindex.io` —
  reads (APY, balance) and building unsigned operations (deposit, withdraw).
- **Client** takes the operation the server built and submits it through the
  Crossmint smart wallet. The wallet signs; the secret key never leaves the
  server.

```
browser (Crossmint wallet)  ──►  /api/defindex/* (Next.js, holds sk_…)  ──►  api.defindex.io
        ▲                                                                        │
        └────────────  operationXDR to sign & submit  ◄──────────────────────────┘
```

## 1. Configure the key

Add the secret key to your local env (it is **not** `NEXT_PUBLIC_*`):

```bash
# .env.local
DEFINDEX_API_KEY=sk_...
```

A tiny server-only helper wraps the base URL and auth header. Every Route
Handler below uses it:

```ts
// lib/defindex.ts  — server-only; imports nothing client-side
const BASE = "https://api.defindex.io";
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "mainnet";

export async function defindexFetch(path: string, init?: RequestInit) {
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}network=${NETWORK}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEFINDEX_API_KEY!}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    // 429 → back off using retryAfter; see "Errors" below.
    const body = await res.json().catch(() => ({}));
    throw new Error(`DeFindex ${res.status}: ${JSON.stringify(body)}`);
  }
  return res.json();
}

export const VAULT = "CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK";
```

## 2. Read APY

APY is public-ish read data; still route it through the server so the key stays
put.

```ts
// app/api/defindex/apy/route.ts
import { defindexFetch, VAULT } from "@/lib/defindex";

export async function GET() {
  const data = await defindexFetch(`/vault/${VAULT}/apy`); // { apy: 19.4 }
  return Response.json(data);
}
```

```jsonc
// GET /api/defindex/apy
{ "apy": 19.4 }
```

## 3. Read a wallet's balance

The balance endpoint takes the caller's address as `from`. Pass the smart
wallet's `C…` address straight through — reads work fine for contract addresses.

```ts
// app/api/defindex/balance/route.ts
import { defindexFetch, VAULT } from "@/lib/defindex";

export async function GET(req: Request) {
  const from = new URL(req.url).searchParams.get("from"); // the C… wallet address
  const data = await defindexFetch(`/vault/${VAULT}/balance?from=${from}`);
  return Response.json(data);
}
```

```jsonc
// GET /api/defindex/balance?from=C...
{
  "dfTokens": "1000000",           // vault shares you own
  "underlyingBalance": ["750000"]  // current value per underlying asset, in stroops
}
```

`dfTokens` are your vault shares; `underlyingBalance` is what they're worth right
now in the underlying asset (stroops → divide by `10_000_000` for USDC). Note both
are **strings** — `underlyingBalance` is a `string[]`, not a `number[]` — so
convert with `Number(...)` before dividing.

## 4. Deposit — the smart-wallet path

This is where the `C…` address matters.

### 4a. Server asks DeFindex to build the call

A `C…` address can't be a Stellar transaction *source* (only ed25519 `G…`
accounts sign and pay fees). So when you POST a deposit with a smart-wallet
`caller`, DeFindex **cannot** return a ready-to-sign transaction. Instead it
returns `xdr: null`, flags the response `isSmartWallet: true`, and describes the
underlying contract call for you to reconstruct: `functionName` (the vault
method) plus `params` (its arguments). It also echoes back the raw
`operationXDR` and a `simulationResponse`.

Rather than submit the opaque `operationXDR`, we forward the **call
description** to the client and rebuild the invocation there — the Crossmint
wallet re-simulates and wraps it in its own smart-wallet transaction, so the
`C…` account never needs to be a source. Return the fields the client needs:

```ts
// app/api/defindex/deposit/route.ts
import { defindexFetch, VAULT } from "@/lib/defindex";

export async function POST(req: Request) {
  const { caller, amountStroops } = await req.json();
  const data = await defindexFetch(`/vault/${VAULT}/deposit`, {
    method: "POST",
    body: JSON.stringify({
      amounts: [Number(amountStroops)], // integer stroops, number[]
      caller,                           // the C… smart wallet address
      // invest (default true) and slippageBps (default 0) omitted — API defaults them.
    }),
  });
  // Smart-wallet response:
  // { xdr: null, operationXDR, isSmartWallet: true, functionName, params, simulationResponse }
  const { functionName, params } = data;
  return Response.json({ functionName, params });
}
```

> Do **not** try to sign the `null` `xdr`. You'll reconstruct the call from
> `functionName` + `params` on the client.

### 4b. Client reconstructs the call and submits it

`@crossmint/client-sdk-react-ui` re-exports `StellarWallet`, whose
`sendTransaction` accepts a contract call **by its parts** via the
`{ contractId, method, args }` variant — not just a pre-serialized envelope. We
take `functionName` → `method`, and build `args` to match the vault's
`deposit(amounts_desired, amounts_min, from, invest)` signature. Crossmint
encodes `args` against the on-chain contract spec, so **the keys must be the
contract's parameter names** — this is the one part reconstruction gets wrong if
you blindly spread DeFindex's `params` (they aren't keyed that way). The wallet
simulates the call, wraps it in a smart-wallet transaction, signs, and submits —
so you do **not** call DeFindex's `POST /send` on this path (that endpoint is for
pre-signed `G…`-source XDRs).

```tsx
"use client";
import { useWallet, StellarWallet } from "@crossmint/client-sdk-react-ui";

const VAULT = "CA2FIPJ7U6BG3N7EOZFI74XPJZOEOD4TYWXFVCIO5VDCHTVAGS6F4UKK";

export function useVaultDeposit() {
  const { wallet } = useWallet();

  return async function deposit(amountStroops: string) {
    if (!wallet) throw new Error("Wallet not ready");

    // 1. Ask the server for the contract-call description for our C… address.
    const res = await fetch("/api/defindex/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caller: wallet.address, amountStroops }),
    });
    const { functionName } = await res.json();

    // 2. Reconstruct the call with args keyed by the contract's parameter names.
    //    amounts_min, from and invest are all required contract args (Soroban has
    //    no optional params) — set amounts_min = amounts_desired for 0 slippage.
    const desired = Number(amountStroops);
    const stellar = StellarWallet.from(wallet);
    const tx = await stellar.sendTransaction({
      contractId: VAULT,
      method: functionName,       // "deposit"
      args: {
        amounts_desired: [desired],
        amounts_min: [desired],   // 0 slippage — matches the API default
        from: wallet.address,     // the C… caller
        invest: true,
      },
    });

    return tx; // contains the on-chain hash — build an explorer link like SendForm does
  };
}
```

This mirrors the `wallet.send(...)` flow in
[`components/SendForm.tsx`](../../components/SendForm.tsx): loosely-typed wallet,
one `await`, a transaction result you can turn into an explorer link. The
difference is we hand `sendTransaction` a reconstructed contract call
(`method` + `args`) instead of a token transfer.

> **Don't spread DeFindex's `params` into `args`.** The wallet keys `args` by
> the contract's parameter names (`amounts_desired`, `amounts_min`, `from`,
> `invest`); DeFindex's `params` aren't keyed that way, so passing them through
> yields `Argument 'amounts_desired' is required for function 'deposit'`. Build
> `args` explicitly against the signature, as above. The server call still
> matters — it runs DeFindex's simulation (balance, invest routing) before you
> submit. As a fallback, the `{ transaction: operationXDR, contractId }` variant
> submits the server's XDR verbatim if you'd rather not rebuild the args.

## 5. Withdraw

Withdraw is symmetric. Withdraw **by asset amount**:

```ts
// app/api/defindex/withdraw/route.ts
import { defindexFetch, VAULT } from "@/lib/defindex";

export async function POST(req: Request) {
  const { caller, amountStroops } = await req.json();
  const data = await defindexFetch(`/vault/${VAULT}/withdraw`, {
    method: "POST",
    body: JSON.stringify({
      amounts: [Number(amountStroops)],
      caller,
      slippageBps: 50,
    }),
  });
  // Same smart-wallet shape: { xdr: null, functionName, params, isSmartWallet: true, ... }
  const { functionName, params } = data;
  return Response.json({ functionName, params });
}
```

Reconstruct and submit it with the same client step as the deposit —
`StellarWallet.from(wallet).sendTransaction({ contractId: VAULT, method: functionName, args })`
— but build `args` against `withdraw`'s signature (`amounts_desired`,
`amounts_min`, `from`) instead of `deposit`'s.

**Withdraw by shares instead of amount** — use `POST /vault/{VAULT}/withdraw-shares`
with a `shares` count (the `dfTokens` from step 3) rather than `amounts`:

```jsonc
// body for /vault/{VAULT}/withdraw-shares
{ "shares": 1000000, "caller": "C...", "slippageBps": 50 }
```

Everything after (returned `operationXDR`, client `sendTransaction`) is identical.

## Errors

`defindexFetch` throws on non-2xx. Common statuses:

| Status | Meaning | Common cause |
|--------|---------|--------------|
| `400` | Bad request | Missing field, bad address, `amounts` as strings, wrong network |
| `401` | Unauthorized | Missing/invalid `sk_…` Bearer key |
| `403` | Forbidden | Caller lacks a required vault role (admin ops) |
| `429` | Rate limited | Exceeded your tier's bucket — back off using `retryAfter` |
| `500` | Server error | Contract-call failure or infra issue |

For `429`, read `retryAfter` (seconds) from the body and retry:

```ts
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const m = /DeFindex 429/.exec(String(err));
    if (!m) throw err;
    const retryAfter = Number(/"retryAfter":(\d+)/.exec(String(err))?.[1] ?? 1);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fn();
  }
}
```

## Verify before shipping

Two things this guide asserts from the DeFindex API skill docs and the installed
SDK — confirm both against your live setup, since the skill docs only show the
`G…` happy path:

1. A deposit/withdraw POST with a `C…` `caller` really returns
   `{ xdr: null, isSmartWallet: true, functionName, params, ... }`, and that your
   explicit `args` keys match the vault's method signature — a mismatch surfaces
   as `Argument '<name>' is required for function '<method>'` at submit time.
2. `StellarWallet.from(wallet).sendTransaction({ contractId, method, args })`
   exists in your installed `@crossmint/wallets-sdk` (verified here against
   `1.5.0`, re-exported by `@crossmint/client-sdk-react-ui@^4.2.8`) — the
   `StellarTransactionInput` type accepts this `{ contractId, method, args }`
   variant alongside `{ transaction, contractId }`.

## Next steps

This guide is prose + snippets. Wiring it into the UI — a deposit form, live
position + APY display, and a withdraw flow — is **Phase 2** (see
[`specs/roadmap.md`](../../specs/roadmap.md)).

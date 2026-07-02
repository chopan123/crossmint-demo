# crossmint-demo

**Stellar Wallet — Send.** A minimal web app that creates a non-custodial
**Crossmint** wallet on **Stellar** and exposes a single feature: **sending
tokens**. Built with Next.js (App Router) and the Crossmint React SDK.

Based on the [Crossmint Wallets docs](https://docs.crossmint.com/wallets/overview).

## How it works

1. User signs in with email/Google (Crossmint Auth).
2. A Stellar smart wallet is created automatically on login (`createOnLogin`),
   with email-based recovery — no seed phrase.
3. The send form calls `wallet.send(recipient, token, amount)` and links to the
   transaction on the explorer.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a **client-side** API key in the
   [Crossmint Console](https://www.crossmint.com/console) (key starts with `ck_`).
   Enable the wallet scopes. Use a **staging** key for Stellar testnet or a
   **production** key for mainnet.
3. Copy the env file and fill in your key:
   ```bash
   cp .env.example .env.local
   ```
   ```
   NEXT_PUBLIC_CROSSMINT_API_KEY=ck_staging_xxx
   NEXT_PUBLIC_CROSSMINT_CHAIN=stellar
   ```
4. Run it:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Notes

- On Stellar, Crossmint focuses on **USDC**; **XLM** is the native asset. The send
  form offers both — adjust `TOKENS` in `components/SendForm.tsx` as needed.
- Recipients can be a Stellar address (`G…`) or a Crossmint locator like
  `email:user@example.com`.
- This is intentionally send-only. Receiving/funding is handled outside the app
  (or via the Crossmint Console / balances API).

## Project structure

```
app/
  providers.tsx   # Crossmint providers (auth + wallet, Stellar)
  layout.tsx      # wraps the app in providers
  page.tsx        # login → wallet → send
components/
  SendForm.tsx    # the send function UI + wallet.send() call
```

## Guides

- [DeFindex vault integration](docs/guides/defindex-integration.md) — read APY /
  balance and deposit into / withdraw from a DeFindex yield vault using the
  Crossmint Stellar smart wallet.

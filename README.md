# crossmint-demo

**Stellar Wallet + DeFindex yield.** A minimal web app that creates a
non-custodial **Crossmint** wallet on **Stellar**, lets you **send tokens**, and
**earns yield** by depositing USDC into a [DeFindex](https://defindex.io) vault.
Built with Next.js (App Router) and the Crossmint React SDK, themed in the
DeFindex brand palette.

Based on the [Crossmint Wallets docs](https://docs.crossmint.com/wallets/overview).

## How it works

1. User signs in with email/Google (Crossmint Auth).
2. A Stellar smart wallet is created automatically on login (`createOnLogin`),
   with email-based recovery — no seed phrase.
3. The send form calls `wallet.send(recipient, token, amount)` and links to the
   transaction on the explorer.
4. The DeFindex panels show the vault **APY** and the wallet's **position**, and
   let you **deposit** and **withdraw** USDC. Because Crossmint wallets are
   smart wallets (`C…`), deposits/withdrawals are reconstructed as contract calls
   and submitted via `StellarWallet.sendTransaction` — see the guide below.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a **client-side** API key in the
   [Crossmint Console](https://www.crossmint.com/console) (key starts with `ck_`).
   Enable the wallet scopes. Use a **staging** key for Stellar testnet or a
   **production** key for mainnet.
3. (Optional, for the DeFindex panels) Create a **DeFindex API key** (`sk_…`) —
   see the `defindex-api` skill's `auth.md`. It's a **server-side** secret; keep
   it out of `NEXT_PUBLIC_*`.
4. Copy the env file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   ```
   NEXT_PUBLIC_CROSSMINT_API_KEY=ck_staging_xxx
   NEXT_PUBLIC_CROSSMINT_CHAIN=stellar
   NEXT_PUBLIC_STELLAR_NETWORK=mainnet   # or testnet
   DEFINDEX_API_KEY=sk_...               # server-only; enables the vault panels
   ```
5. Run it:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Notes

- On Stellar, Crossmint focuses on **USDC**; **XLM** is the native asset. The send
  form offers both — adjust `TOKENS` in `components/SendForm.tsx` as needed.
- Recipients can be a Stellar address (`G…`) or a Crossmint locator like
  `email:user@example.com`.
- The vault panels target one fixed mainnet USDC vault (`lib/vault.ts`). Withdraw
  is denominated in USDC and converted to shares by DeFindex's simulation.
- Without a `DEFINDEX_API_KEY`, the send flow still works; the vault panels will
  error on load.

## Project structure

```
app/
  providers.tsx        # Crossmint providers (auth + wallet, Stellar)
  layout.tsx           # wraps the app in providers
  page.tsx             # login → wallet → send + vault panels
  globals.css          # DeFindex brand theme
  api/defindex/        # server Route Handlers (hold the sk_ key)
    apy/ balance/ deposit/ withdraw/
components/
  SendForm.tsx         # send UI + wallet.send()
  Balance.tsx          # wallet token balance
  VaultApy.tsx         # vault APY
  VaultPosition.tsx    # wallet's vault position (shares + underlying value)
  VaultDeposit.tsx     # deposit USDC into the vault
  VaultWithdraw.tsx    # withdraw USDC from the vault
lib/
  defindex.ts          # server-only DeFindex fetch helper
  vault.ts             # client-safe vault address constant
```

## Guides

- [DeFindex vault integration](docs/guides/defindex-integration.mdx) — read APY /
  balance and deposit into / withdraw from a DeFindex yield vault using the
  Crossmint Stellar smart wallet. (A plain-Markdown copy lives alongside as
  `.md`.)

# Roadmap

Phases are worked top to bottom. The **next phase** is the first section whose
items are all unchecked `[ ]`.

## Phase 0 — Wallet & Send (shipped)

- [x] Crossmint auth with email/Google sign-in
- [x] Stellar smart wallet created on login (`createOnLogin`)
- [x] Send form calling `wallet.send(recipient, token, amount)`
- [x] Balance display
- [x] Explorer links for sent transactions

## Phase 1 — DeFindex integration guide

- [ ] Self-contained written guide to integrate the DeFindex REST API
- [ ] Assume API key and vault address as given (auth flow + discovery out of scope; link out)
- [ ] Cover core vault flow: deposit, balance, APY, withdraw
- [ ] Show how a Crossmint Stellar **smart wallet** (`C…` caller) submits vault txns: API returns `xdr: null` + `operationXDR`; submit via `StellarWallet.sendTransaction({ transaction, contractId })` (no `POST /send`)
- [ ] Runnable code snippets and env/config notes
- [ ] Guide lives in `docs/guides/` and is reproducible end-to-end

## Phase 2 — DeFindex in-app deposit (future)

- [ ] UI to deposit wallet USDC into a DeFindex vault
- [ ] Show vault position and live APY
- [ ] Withdraw flow

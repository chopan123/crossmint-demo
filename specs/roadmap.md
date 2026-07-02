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
- [ ] Cover auth flow (register → login → API key)
- [ ] Cover core vault flow: discover, deposit, balance, APY, withdraw
- [ ] Show how a Crossmint Stellar wallet signs/submits the vault transactions
- [ ] Runnable code snippets and env/config notes
- [ ] Guide lives in `docs/guides/` and is reproducible end-to-end

## Phase 2 — DeFindex in-app deposit (future)

- [ ] UI to deposit wallet USDC into a DeFindex vault
- [ ] Show vault position and live APY
- [ ] Withdraw flow

# Tech Stack

The constraints below are binding for all specs. No new dependencies without
explicit user approval.

## Core

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 14** (App Router) | `app/` directory, React Server + Client Components |
| Language | **TypeScript 5.5** | `strict` per `tsconfig.json` |
| UI | **React 18** | Function components + hooks |
| Wallet / Auth | **@crossmint/client-sdk-react-ui** `^4.2.8` | `CrossmintProvider`, `useAuth`, `useWallet` |
| Chain | **Stellar** | USDC (focus) + XLM (native) |
| Styling | Plain CSS (`app/globals.css`) | No CSS framework; keep it minimal |

## Conventions

- **Client components** declare `"use client"` and live in `components/`.
- **Providers** are centralized in `app/providers.tsx` and wrap the tree in
  `app/layout.tsx`.
- Wallet types are intentionally **loosely typed** at call sites (see
  `components/SendForm.tsx`) to keep flows readable.
- Config comes from `NEXT_PUBLIC_*` env vars; client-side Crossmint keys start
  with `ck_` (staging for testnet, production for mainnet).

## External services

- **Crossmint Console** — API keys and wallet scopes.
- **DeFindex REST API** (`api.defindex.io`) — vault deposit/withdraw/balance/APY.
  Auth flow: register → login → API key. See the `defindex-api` skill.
- **Stellar explorer** — transaction links surfaced in the UI.

## Testing & quality

- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Build: `npm run build`

There is no automated test runner configured yet; specs that need one must
propose it for approval before adding.

## Out of scope (for now)

- Backend/server database, custodial key storage, multi-chain support,
  CSS frameworks, and state-management libraries.

// lib/defindex.ts — server-only; imports nothing client-side
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
    // 429 → back off using retryAfter; see "Errors" in the guide.
    const body = await res.json().catch(() => ({}));
    throw new Error(`DeFindex ${res.status}: ${JSON.stringify(body)}`);
  }
  return res.json();
}

export { VAULT_ADDRESS as VAULT } from "./vault";

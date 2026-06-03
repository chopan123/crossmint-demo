"use client";

import { useCallback, useEffect, useState } from "react";

type TokenBalance = { symbol: string; name: string; amount: string };
type Balances = {
  nativeToken: TokenBalance;
  usdc: TokenBalance;
  tokens: TokenBalance[];
};

// Wallet shape used here — only the `balances()` method is needed.
type Wallet = {
  balances: (tokens?: string[]) => Promise<Balances>;
};

// On Stellar these are the relevant assets: USDC and native XLM.
const TOKENS = ["usdc", "xlm"];

export function Balance({
  wallet,
  refreshNonce = 0,
}: {
  wallet: Wallet;
  refreshNonce?: number;
}) {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBalances(await wallet.balances(TOKENS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load balance.");
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    load();
  }, [load, refreshNonce]);

  return (
    <div className="card">
      <div className="row">
        <span className="muted">Balance</span>
        <button
          className="secondary"
          onClick={load}
          disabled={loading}
          style={{ padding: "6px 10px" }}
        >
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="notice error">{error}</p>
      ) : balances ? (
        <>
          <div className="balance">
            {balances.usdc.amount}{" "}
            <span className="muted" style={{ fontSize: 16 }}>
              USDC
            </span>
          </div>
          <span className="muted">
            {balances.nativeToken.amount}{" "}
            {balances.nativeToken.symbol.toUpperCase()}
          </span>
        </>
      ) : (
        <span className="muted">Loading…</span>
      )}
    </div>
  );
}

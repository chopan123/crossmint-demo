"use client";

import { useCallback, useEffect, useState } from "react";

type VaultBalance = {
  dfTokens: string; // vault shares you own
  underlyingBalance: string[]; // current value per underlying asset, in stroops
};

// Only the address is needed to query the vault position.
type Wallet = { address: string };

// USDC has 7 decimals → 1 USDC = 10_000_000 stroops.
const USDC_DECIMALS = 10_000_000;

export function VaultPosition({
  wallet,
  refreshNonce = 0,
  onBalance,
}: {
  wallet: Wallet;
  refreshNonce?: number;
  onBalance?: (dfTokens: string) => void;
}) {
  const [balance, setBalance] = useState<VaultBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/defindex/balance?from=${encodeURIComponent(wallet.address)}`
      );
      if (!res.ok) throw new Error("Couldn't load vault position.");
      const data: VaultBalance = await res.json();
      setBalance(data);
      onBalance?.(data.dfTokens);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't load vault position."
      );
    } finally {
      setLoading(false);
    }
  }, [wallet.address, onBalance]);

  useEffect(() => {
    load();
  }, [load, refreshNonce]);

  const underlyingUsdc =
    balance && balance.underlyingBalance.length > 0
      ? Number(balance.underlyingBalance[0]) / USDC_DECIMALS
      : 0;

  return (
    <div className="card">
      <div className="row">
        <span className="muted">Vault position</span>
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
      ) : balance ? (
        <>
          <div className="balance">
            {underlyingUsdc.toFixed(4)}{" "}
            <span className="muted" style={{ fontSize: 16 }}>
              USDC
            </span>
          </div>
          <span className="muted">{balance.dfTokens} shares</span>
        </>
      ) : (
        <span className="muted">Loading…</span>
      )}
    </div>
  );
}

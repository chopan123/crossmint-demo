"use client";

import { useCallback, useEffect, useState } from "react";

export function VaultApy() {
  const [apy, setApy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/defindex/apy");
      if (!res.ok) throw new Error("Couldn't load APY.");
      const { apy } = await res.json();
      setApy(apy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load APY.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="card">
      <div className="row">
        <span className="muted">Vault APY</span>
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
      ) : apy !== null ? (
        <div className="balance">
          {apy.toFixed(2)}
          <span className="muted" style={{ fontSize: 16 }}>
            {" "}
            % APY
          </span>
        </div>
      ) : (
        <span className="muted">Loading…</span>
      )}
    </div>
  );
}

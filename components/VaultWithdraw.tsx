"use client";

import { useState, type FormEvent } from "react";
import { StellarWallet } from "@crossmint/client-sdk-react-ui";
import { VAULT_ADDRESS } from "@/lib/vault";

// StellarWallet.from() adapts the useWallet() wallet to the smart-wallet API.
type Wallet = Parameters<typeof StellarWallet.from>[0];

type WithdrawState =
  | { kind: "idle" }
  | { kind: "withdrawing" }
  | { kind: "success"; explorerLink?: string }
  | { kind: "error"; message: string };

export function VaultWithdraw({
  wallet,
  shares,
  onWithdrawn,
}: {
  wallet: Wallet;
  shares: string; // current dfToken balance, from VaultPosition
  onWithdrawn?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<WithdrawState>({ kind: "idle" });

  const owned = Number(shares) || 0;
  const requested = Number(amount) || 0;
  const canSubmit =
    requested > 0 && requested <= owned && state.kind !== "withdrawing";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setState({ kind: "withdrawing" });
    try {
      const sharesToBurn = Math.round(requested);

      // 1. Run DeFindex's simulation for our C… address (validates the burn).
      const res = await fetch("/api/defindex/withdraw-shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caller: wallet.address, shares: sharesToBurn }),
      });
      if (!res.ok) throw new Error("Couldn't build the withdrawal.");
      const { functionName } = await res.json();

      // 2. Reconstruct the call. Args match the vault's
      //    withdraw(withdraw_shares, min_amounts_out, from) signature.
      //    withdraw_shares is a single i128; min_amounts_out is a per-asset Vec.
      //    [0] = no minimum (0 slippage floor) — matches the API default.
      const stellar = StellarWallet.from(wallet);
      const tx = await stellar.sendTransaction({
        contractId: VAULT_ADDRESS,
        method: functionName, // "withdraw"
        args: {
          withdraw_shares: sharesToBurn,
          min_amounts_out: [0],
          from: wallet.address,
        },
      });

      setState({ kind: "success", explorerLink: tx.explorerLink });
      setAmount("");
      onWithdrawn?.();
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Withdrawal failed.",
      });
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1 style={{ fontSize: 18 }}>Withdraw from vault</h1>

      <label>
        Shares
        <input
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span className="muted" style={{ fontSize: 13 }}>
          You own {owned} shares
        </span>
      </label>

      <button
        type="button"
        className="secondary"
        onClick={() => setAmount(String(owned))}
        disabled={owned <= 0 || state.kind === "withdrawing"}
        style={{ padding: "6px 10px", alignSelf: "flex-start" }}
      >
        Max
      </button>

      <button type="submit" disabled={!canSubmit}>
        {state.kind === "withdrawing" ? "Withdrawing…" : "Withdraw"}
      </button>

      {state.kind === "error" && (
        <p className="notice error">{state.message}</p>
      )}
      {state.kind === "success" && (
        <p className="notice success">
          Withdrawn!{" "}
          {state.explorerLink && (
            <a href={state.explorerLink} target="_blank" rel="noreferrer">
              View on explorer
            </a>
          )}
        </p>
      )}
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { StellarWallet } from "@crossmint/client-sdk-react-ui";
import { VAULT_ADDRESS } from "@/lib/vault";
import type { VaultBalance } from "@/components/VaultPosition";

// StellarWallet.from() adapts the useWallet() wallet to the smart-wallet API.
type Wallet = Parameters<typeof StellarWallet.from>[0];

type WithdrawState =
  | { kind: "idle" }
  | { kind: "withdrawing" }
  | { kind: "success"; explorerLink?: string }
  | { kind: "error"; message: string };

// USDC has 7 decimals → 1 USDC = 10_000_000 stroops.
const USDC_DECIMALS = 10_000_000;

export function VaultWithdraw({
  wallet,
  balance,
  onWithdrawn,
}: {
  wallet: Wallet;
  balance: VaultBalance | null; // current position, from VaultPosition
  onWithdrawn?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<WithdrawState>({ kind: "idle" });

  // The USDC value of the position right now (underlyingBalance is per-asset).
  const owned = balance ? Number(balance.dfTokens) : 0;
  const worthStroops =
    balance && balance.underlyingBalance.length > 0
      ? Number(balance.underlyingBalance[0])
      : 0;
  const maxUsdc = worthStroops / USDC_DECIMALS;

  const requested = Number(amount) || 0;
  const canSubmit =
    requested > 0 && requested <= maxUsdc && state.kind !== "withdrawing";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || owned <= 0 || worthStroops <= 0) return;

    setState({ kind: "withdrawing" });
    try {
      const amountStroops = Math.round(requested * USDC_DECIMALS);

      // 1. DeFindex simulates the underlying amount → shares conversion (and the
      //    strategy unwind) for our C… address, and returns the exact shares to burn.
      const res = await fetch("/api/defindex/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller: wallet.address,
          amountStroops: String(amountStroops),
        }),
      });
      if (!res.ok) throw new Error("Couldn't build the withdrawal.");
      // DeFindex's simulation returns the positional withdraw args it computed.
      const { functionName, withdrawShares, minAmountsOut } = await res.json();

      // 2. Reconstruct the call against the vault's
      //    withdraw(withdraw_shares, min_amounts_out, from) signature, using the
      //    shares and minimums DeFindex computed rather than recomputing them.
      const stellar = StellarWallet.from(wallet);
      const tx = await stellar.sendTransaction({
        contractId: VAULT_ADDRESS,
        method: functionName, // "withdraw"
        args: {
          withdraw_shares: Number(withdrawShares),
          min_amounts_out: (minAmountsOut as string[]).map(Number),
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
        Amount
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span className="muted" style={{ fontSize: 13 }}>
          USDC — up to {maxUsdc.toFixed(4)} available
        </span>
      </label>

      <button
        type="button"
        className="secondary"
        onClick={() => setAmount(String(maxUsdc))}
        disabled={maxUsdc <= 0 || state.kind === "withdrawing"}
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

"use client";

import { useState, type FormEvent } from "react";
import { StellarWallet } from "@crossmint/client-sdk-react-ui";
import { VAULT_ADDRESS } from "@/lib/vault";

// The wallet from Crossmint's useWallet(); StellarWallet.from() adapts it to the
// smart-wallet sendTransaction API. Typed as its expected input so the cast is real.
type Wallet = Parameters<typeof StellarWallet.from>[0];

type DepositState =
  | { kind: "idle" }
  | { kind: "depositing" }
  | { kind: "success"; explorerLink?: string }
  | { kind: "error"; message: string };

// USDC has 7 decimals → 1 USDC = 10_000_000 stroops.
const USDC_DECIMALS = 10_000_000;

export function VaultDeposit({
  wallet,
  onDeposited,
}: {
  wallet: Wallet;
  onDeposited?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<DepositState>({ kind: "idle" });

  const canSubmit = Number(amount) > 0 && state.kind !== "depositing";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setState({ kind: "depositing" });
    try {
      const amountStroops = Math.round(Number(amount) * USDC_DECIMALS);

      // 1. Ask the server to run DeFindex's simulation for our C… address. This
      //    validates the deposit (balance, invest routing) before we submit.
      const res = await fetch("/api/defindex/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller: wallet.address,
          amountStroops: String(amountStroops),
        }),
      });
      if (!res.ok) throw new Error("Couldn't build the deposit.");
      const { functionName } = await res.json();

      // 2. Reconstruct the call for the smart wallet. Crossmint encodes `args`
      //    against the on-chain contract spec, so keys must match the vault's
      //    deposit(amounts_desired, amounts_min, from, invest) signature.
      const stellar = StellarWallet.from(wallet);
      const tx = await stellar.sendTransaction({
        contractId: VAULT_ADDRESS,
        method: functionName, // "deposit"
        args: {
          amounts_desired: [amountStroops],
          amounts_min: [amountStroops], // 0 slippage — matches the API default
          from: wallet.address,
          invest: true,
        },
      });

      setState({ kind: "success", explorerLink: tx.explorerLink });
      setAmount("");
      onDeposited?.();
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Deposit failed.",
      });
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1 style={{ fontSize: 18 }}>Deposit into vault</h1>

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
          USDC — earns yield in the Soroswap EARN vault
        </span>
      </label>

      <button type="submit" disabled={!canSubmit}>
        {state.kind === "depositing" ? "Depositing…" : "Deposit"}
      </button>

      {state.kind === "error" && (
        <p className="notice error">{state.message}</p>
      )}
      {state.kind === "success" && (
        <p className="notice success">
          Deposited!{" "}
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

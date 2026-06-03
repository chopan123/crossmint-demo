"use client";

import { useState, type FormEvent } from "react";

// The wallet instance returned by Crossmint's `useWallet()` hook.
// Typed loosely here so the form stays focused on the send flow.
type Wallet = {
  address: string;
  send: (
    recipient: string,
    token: string,
    amount: string
  ) => Promise<{ explorerLink?: string; hash?: string }>;
};

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; explorerLink?: string }
  | { kind: "error"; message: string };

// On Stellar, Crossmint focuses on USDC; XLM is the native asset.
const TOKENS = ["usdc", "xlm"] as const;

export function SendForm({ wallet }: { wallet: Wallet }) {
  const [recipient, setRecipient] = useState("");
  const [token, setToken] = useState<string>(TOKENS[0]);
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<SendState>({ kind: "idle" });

  const canSubmit =
    recipient.trim().length > 0 &&
    Number(amount) > 0 &&
    state.kind !== "sending";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setState({ kind: "sending" });
    try {
      const { explorerLink } = await wallet.send(
        recipient.trim(),
        token,
        amount.trim()
      );
      setState({ kind: "success", explorerLink });
      setRecipient("");
      setAmount("");
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Transfer failed.",
      });
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1 style={{ fontSize: 18 }}>Send</h1>

      <label>
        Recipient (Stellar address)
        <input
          type="text"
          placeholder="G… or email:user@example.com"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <div className="row" style={{ alignItems: "flex-end", gap: 12 }}>
        <label style={{ flex: 1 }}>
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
        </label>
        <label style={{ width: 110 }}>
          Token
          <select value={token} onChange={(e) => setToken(e.target.value)}>
            {TOKENS.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="submit" disabled={!canSubmit}>
        {state.kind === "sending" ? "Sending…" : "Send"}
      </button>

      {state.kind === "error" && (
        <p className="notice error">{state.message}</p>
      )}
      {state.kind === "success" && (
        <p className="notice success">
          Sent!{" "}
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

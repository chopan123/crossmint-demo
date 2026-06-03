"use client";

import { useCrossmintAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { SendForm } from "@/components/SendForm";

export default function Home() {
  const { status: authStatus, login, logout, jwt } = useCrossmintAuth();
  const { wallet, status: walletStatus } = useWallet();

  const isLoggedIn = !!jwt || authStatus === "logged-in";

  return (
    <main>
      <header>
        <h1>Stellar Wallet</h1>
        <p className="subtitle">Send tokens on Stellar, powered by Crossmint.</p>
      </header>

      {!isLoggedIn ? (
        <div className="card">
          <p className="muted">
            Sign in to create your non-custodial Stellar wallet. No seed phrase —
            recovery is tied to your email.
          </p>
          <button onClick={login}>Sign in</button>
        </div>
      ) : walletStatus === "in-progress" || walletStatus === "not-loaded" ? (
        <div className="card">
          <p className="muted">Creating your Stellar wallet…</p>
        </div>
      ) : walletStatus === "error" || !wallet ? (
        <div className="card">
          <p className="notice error">
            Couldn&apos;t load your wallet. Check your API key and chain config.
          </p>
          <button className="secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="row">
              <span className="muted">Your wallet</span>
              <button className="secondary" onClick={logout} style={{ padding: "6px 10px" }}>
                Sign out
              </button>
            </div>
            <span className="address">{wallet.address}</span>
          </div>

          <SendForm wallet={wallet} />
        </>
      )}
    </main>
  );
}

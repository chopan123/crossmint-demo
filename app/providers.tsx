"use client";

import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";

const CHAIN = (process.env.NEXT_PUBLIC_CROSSMINT_CHAIN ?? "stellar") as "stellar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CrossmintProvider apiKey={process.env.NEXT_PUBLIC_CROSSMINT_API_KEY!}>
      <CrossmintAuthProvider loginMethods={["email", "google"]}>
        <CrossmintWalletProvider
          createOnLogin={{
            chain: CHAIN,
            recovery: { type: "email" },
          }}
        >
          {children}
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}

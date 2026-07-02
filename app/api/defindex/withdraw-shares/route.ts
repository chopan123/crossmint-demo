import { defindexFetch, VAULT } from "@/lib/defindex";

// Builds the withdraw contract call for a Crossmint smart wallet (C… caller).
// The vault contract withdraws by *shares* (dfTokens), not asset amount, so we
// use /withdraw-shares. As with deposit, a C… caller gets `xdr: null` and a call
// description (functionName + params); the client reconstructs and submits it.
export async function POST(req: Request) {
  const { caller, shares } = await req.json();

  const data = await defindexFetch(`/vault/${VAULT}/withdraw-shares`, {
    method: "POST",
    body: JSON.stringify({
      shares: Number(shares), // vault shares (dfTokens) to burn — positive integer
      caller, // the C… smart wallet address
      // slippageBps (default 0) omitted — API defaults it.
    }),
  });

  // Smart-wallet response:
  // { xdr: null, operationXDR, isSmartWallet: true, functionName, params, simulationResponse }
  const { functionName, params, operationXDR } = data;
  return Response.json({ functionName, params, operationXDR });
}

import { defindexFetch, VAULT } from "@/lib/defindex";

// Builds the deposit contract call for a Crossmint smart wallet (C… caller).
// A C… address can't be a Stellar transaction source, so DeFindex returns
// `xdr: null` and describes the call instead: `functionName` + `params`.
// We forward that description; the client reconstructs and submits it.
export async function POST(req: Request) {
  const { caller, amountStroops } = await req.json();

  const data = await defindexFetch(`/vault/${VAULT}/deposit`, {
    method: "POST",
    body: JSON.stringify({
      amounts: [Number(amountStroops)], // integer stroops, number[]
      caller, // the C… smart wallet address
      // invest (default true) and slippageBps (default 0) omitted — API defaults them.
    }),
  });

  // Smart-wallet response:
  // { xdr: null, operationXDR, isSmartWallet: true, functionName, params, simulationResponse }
  const { functionName, params, operationXDR } = data;

  // `functionName` + `params` drive the client-side reconstruction; `operationXDR`
  // is returned as a fallback for the { transaction, contractId } submit variant.
  return Response.json({ functionName, params, operationXDR });
}

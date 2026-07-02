import { defindexFetch, VAULT } from "@/lib/defindex";

// Builds the withdraw contract call for a Crossmint smart wallet (C… caller),
// denominated in the underlying asset. DeFindex's /withdraw takes an underlying
// `amounts` array and converts it to shares via simulation. As with deposit, a
// C… caller gets `xdr: null` and a call description (functionName + params);
// the client reconstructs and submits it.
export async function POST(req: Request) {
  const { caller, amountStroops } = await req.json();

  const data = await defindexFetch(`/vault/${VAULT}/withdraw`, {
    method: "POST",
    body: JSON.stringify({
      amounts: [Number(amountStroops)], // underlying amount to withdraw, in stroops
      caller, // the C… smart wallet address
      // slippageBps (default 0) omitted — API defaults it.
    }),
  });

  // Smart-wallet response. `params` is the positional argument list for the
  // withdraw contract call: [withdraw_shares, min_amounts_out, from].
  // e.g. { functionName: "withdraw", params: ["107884", ["100000"], "C…"], ... }
  const { functionName, params } = data;
  const [withdrawShares, minAmountsOut] = params as [string, string[], string];
  return Response.json({ functionName, withdrawShares, minAmountsOut });
}

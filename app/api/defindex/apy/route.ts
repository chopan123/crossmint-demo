import { defindexFetch, VAULT } from "@/lib/defindex";

export async function GET() {
  const data = await defindexFetch(`/vault/${VAULT}/apy`); // { apy: 19.4 }
  return Response.json(data);
}

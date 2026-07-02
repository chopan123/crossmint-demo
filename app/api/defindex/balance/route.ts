import { defindexFetch, VAULT } from "@/lib/defindex";

export async function GET(req: Request) {
  const from = new URL(req.url).searchParams.get("from"); // the C… wallet address
  const data = await defindexFetch(`/vault/${VAULT}/balance?from=${from}`);
  return Response.json(data);
}

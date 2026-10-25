import { fetchLinkPreview } from "@/lib/linkPreview";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return Response.json({ error: "Provide a link." }, { status: 400 });
  try {
    return Response.json(await fetchLinkPreview(url), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && /public|address|preview|redirect|large|timed out/i.test(error.message) ? error.message : "Couldn't load this preview. The link still works; try refreshing later.";
    return Response.json({ error: message }, { status: 422 });
  }
}

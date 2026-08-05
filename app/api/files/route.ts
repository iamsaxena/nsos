import { env } from "cloudflare:workers";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key.startsWith("event-images/") && !key.startsWith("speaker-photos/")) return new Response("Not found", { status: 404 });
  const object = await env.FILES.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("cache-control", "public, max-age=86400"); headers.set("x-content-type-options", "nosniff"); headers.set("content-security-policy", "default-src 'none'; sandbox");
  return new Response(object.body, { headers });
}

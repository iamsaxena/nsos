import { env } from "cloudflare:workers";

function cookie(name: string, value: string, maxAge: number) { return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`; }

export async function GET(request: Request) {
  const clientId = (env as unknown as Record<string, string | undefined>).GOOGLE_CLIENT_ID;
  if (!clientId) return new Response("Google authentication is not configured", { status: 503 });
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") === "/adminpanel" ? "/adminpanel" : "/adminpanel";
  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.searchParams.set("client_id", clientId); google.searchParams.set("redirect_uri", redirectUri); google.searchParams.set("response_type", "code"); google.searchParams.set("scope", "openid email profile"); google.searchParams.set("state", state); google.searchParams.set("prompt", "select_account");
  const headers = new Headers({ location: google.toString() }); headers.append("set-cookie", cookie("nsos_google_state", state, 600)); headers.append("set-cookie", cookie("nsos_google_return_to", returnTo, 600));
  return new Response(null, { status: 302, headers });
}

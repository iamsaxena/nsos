import { env } from "cloudflare:workers";
import { createGoogleSession } from "../../../../security";

function getCookie(request: Request, name: string) { return request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || ""; }
function clearCookie(name: string) { return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`; }

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get("code"); const state = url.searchParams.get("state");
  const client = env as unknown as Record<string, string | undefined>; const expectedState = getCookie(request, "nsos_google_state");
  if (!code || !state || !expectedState || state !== expectedState || !client.GOOGLE_CLIENT_ID || !client.GOOGLE_CLIENT_SECRET) return new Response("Invalid Google sign-in request", { status: 400 });
  const redirectUri = new URL("/api/auth/google/callback", request.url).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: client.GOOGLE_CLIENT_ID, client_secret: client.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
  if (!tokenResponse.ok) return new Response("Google sign-in could not be completed", { status: 502 });
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) return new Response("Google sign-in did not return an access token", { status: 502 });
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: `Bearer ${token.access_token}` } });
  const profile = await profileResponse.json() as { email?: string; email_verified?: boolean };
  const email = profile.email?.toLowerCase();
  if (!profileResponse.ok || !profile.email_verified || email !== "whoshobhitsaxena@gmail.com") return new Response("This Google account is not authorized for NSOS administration", { status: 403 });
  const session = await createGoogleSession(email); if (!session) return new Response("Google session is not configured", { status: 503 });
  const returnTo = getCookie(request, "nsos_google_return_to") === "/adminpanel" ? "/adminpanel" : "/adminpanel";
  const headers = new Headers({ location: returnTo }); headers.append("set-cookie", `nsos_google_admin=${session}; Max-Age=28800; Path=/; HttpOnly; Secure; SameSite=Lax`); headers.append("set-cookie", clearCookie("nsos_google_state")); headers.append("set-cookie", clearCookie("nsos_google_return_to"));
  return new Response(null, { status: 302, headers });
}

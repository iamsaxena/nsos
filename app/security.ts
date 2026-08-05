import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { getChatGPTUser } from "./chatgpt-auth";

export const ADMIN_EMAILS = new Set(["sss@namahmilabs.com", "sandeep@nsos.live", "whoshobhitsaxena@gmail.com"]);

export async function getAdmin() {
  const user = await getChatGPTUser();
  if (user && ADMIN_EMAILS.has(user.email.toLowerCase())) return user;
  const session = (await cookies()).get("nsos_google_admin")?.value;
  const email = session ? await verifyGoogleSession(session) : null;
  return email ? { userId: `google:${email}`, displayName: email, email, fullName: null } : null;
}

function b64(value: ArrayBuffer | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64(value: string) { return value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4); }

async function sessionSignature(value: string) {
  const secret = (env as unknown as Record<string, string | undefined>).GOOGLE_SESSION_SECRET;
  if (!secret) return null;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

export async function createGoogleSession(email: string) {
  const payload = `${email.toLowerCase()}.${Math.floor(Date.now() / 1000) + 28800}`;
  const signature = await sessionSignature(payload);
  return signature ? `${b64(payload)}.${signature}` : null;
}

async function verifyGoogleSession(value: string) {
  const [encoded, supplied] = value.split(".");
  if (!encoded || !supplied) return null;
  let payload = ""; try { payload = atob(unb64(encoded)); } catch { return null; }
  const [email, expiry] = payload.split(".");
  if (!email || !/^\S+@\S+\.\S+$/.test(email) || !ADMIN_EMAILS.has(email.toLowerCase()) || Number(expiry) < Math.floor(Date.now() / 1000)) return null;
  const expected = await sessionSignature(payload);
  if (!expected || expected.length !== supplied.length) return null;
  let mismatch = 0; for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return mismatch === 0 ? email.toLowerCase() : null;
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return Boolean(origin && origin === new URL(request.url).origin && fetchSite !== "cross-site");
}

export async function readJson(request: Request, maxBytes = 16_384): Promise<Record<string, unknown> | null> {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) return null;
  const raw = await request.text();
  if (!raw || new TextEncoder().encode(raw).byteLength > maxBytes) return null;
  try { const value = JSON.parse(raw); return value && typeof value === "object" && !Array.isArray(value) ? value : null; }
  catch { return null; }
}

export function validEmail(value: unknown) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function boundedText(value: unknown, min: number, max: number) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

export function validPhone(value: unknown) {
  return typeof value === "string" && /^\d{7,15}$/.test(value);
}

export function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

async function digest(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function rateLimit(request: Request, bucket: string, limit: number, windowSeconds: number) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${bucket}:${await digest(ip)}`;
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - windowSeconds;
  const row = await env.DB.prepare(`INSERT INTO rate_limits (key, window_start, hits) VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      hits = CASE WHEN window_start < ? THEN 1 ELSE hits + 1 END,
      window_start = CASE WHEN window_start < ? THEN excluded.window_start ELSE window_start END
    RETURNING hits`).bind(key, now, cutoff, cutoff).first<{ hits: number }>();
  if ((row?.hits ?? 1) <= limit) return null;
  return Response.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: { "retry-after": String(windowSeconds) } });
}

export function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers); headers.set("cache-control", "no-store");
  return Response.json(body, { ...init, headers });
}

import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enrollments } from "../../../../db/schema";

function hex(bytes: ArrayBuffer) { return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function timingSafeEqual(left: string, right: string) { if (left.length !== right.length) return false; let result = 0; for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i); return result === 0; }

export async function POST(request: Request) {
  const secret = (env as unknown as Record<string, string | undefined>).RAZORPAY_WEBHOOK_SECRET;
  const supplied = request.headers.get("x-razorpay-signature") || "";
  const declared = Number(request.headers.get("content-length") || 0);
  if (!secret || !supplied || declared > 256_000) return Response.json({ accepted: false }, { status: secret ? 400 : 503 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 256_000) return Response.json({ accepted: false }, { status: 413 });
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  if (!timingSafeEqual(expected, supplied)) return Response.json({ accepted: false }, { status: 403 });
  const payload = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: { enrollment_id?: string } } } } };
  if (payload.event !== "payment.captured") return Response.json({ accepted: true });
  const payment = payload.payload?.payment?.entity;
  const enrollmentId = Number(payment?.notes?.enrollment_id);
  if (!Number.isSafeInteger(enrollmentId) || !payment?.id || !payment.order_id) return Response.json({ accepted: false }, { status: 400 });
  await getDb().update(enrollments).set({ paymentStatus: "paid", razorpayPaymentId: payment.id }).where(and(eq(enrollments.id, enrollmentId), eq(enrollments.razorpayOrderId, payment.order_id)));
  return Response.json({ accepted: true });
}

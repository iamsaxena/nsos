import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enrollments } from "../../../../db/schema";
import { rateLimit, readJson, requireSameOrigin } from "../../../security";

function hex(bytes: ArrayBuffer) { return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
function timingSafeEqual(left: string, right: string) { if (left.length !== right.length) return false; let result = 0; for (let i = 0; i < left.length; i++) result |= left.charCodeAt(i) ^ right.charCodeAt(i); return result === 0; }

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ verified: false }, { status: 403 });
  const limited = await rateLimit(request, "payment-verify", 10, 300); if (limited) return limited;
  const body = await readJson(request) as { enrollmentId?: number; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string } | null;
  if (!body) return Response.json({ verified: false }, { status: 400 });
  if (!body.enrollmentId || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) return Response.json({ verified: false }, { status: 400 });
  const secret = (env as unknown as Record<string, string | undefined>).RAZORPAY_KEY_SECRET;
  if (!secret) return Response.json({ verified: false }, { status: 503 });
  const db = getDb();
  const enrollment = (await db.select().from(enrollments).where(eq(enrollments.id, body.enrollmentId)).limit(1))[0];
  if (!enrollment || enrollment.razorpayOrderId !== body.razorpay_order_id) return Response.json({ verified: false }, { status: 403 });
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${enrollment.razorpayOrderId}|${body.razorpay_payment_id}`)));
  if (!timingSafeEqual(signature, body.razorpay_signature)) return Response.json({ verified: false }, { status: 403 });
  await db.update(enrollments).set({ paymentStatus: "paid", razorpayPaymentId: body.razorpay_payment_id }).where(eq(enrollments.id, enrollment.id));
  return Response.json({ verified: true, enrollmentId: enrollment.id });
}

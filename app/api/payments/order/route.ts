import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enrollments, events } from "../../../../db/schema";
import { boundedText, rateLimit, readJson, requireSameOrigin, validDate, validEmail, validPhone } from "../../../security";

function credentials() {
  const runtime = env as unknown as Record<string, string | undefined>;
  return { keyId: runtime.RAZORPAY_KEY_ID, keySecret: runtime.RAZORPAY_KEY_SECRET };
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const limited = await rateLimit(request, "payment-order", 5, 300); if (limited) return limited;
  const body = await readJson(request);
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });
  const eventId = Number(body.eventId);
  if (!Number.isSafeInteger(eventId) || eventId < 1 || !boundedText(body.legalName, 2, 120) || !validEmail(body.email) || !validPhone(body.whatsapp) || !validDate(body.dob) || !boundedText(body.occupation, 2, 80) || !/^\+\d{1,4}$/.test(String(body.countryCode ?? ""))) return Response.json({ error: "Registration details are invalid" }, { status: 400 });
  const { keyId, keySecret } = credentials();
  if (!keyId || !keySecret) return Response.json({ error: "Test payment service is not configured" }, { status: 503 });
  const db = getDb();
  const event = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0];
  if (!event || event.status !== "published" || event.offerPrice < 0 || event.offerPrice > 10_000_000) return Response.json({ error: "Event is unavailable" }, { status: 404 });
  const enrollment = (await db.insert(enrollments).values({ eventId, name: String(body.legalName), email: String(body.email).toLowerCase(), phone: `${String(body.countryCode ?? "")}${String(body.whatsapp)}`, dateOfBirth: String(body.dob ?? ""), occupation: String(body.occupation ?? ""), amount: event.offerPrice, currency: "INR", paymentStatus: "created" }).returning())[0];
  const receipt = `nsos-${enrollment.id}-${Date.now()}`.slice(0, 40);
  const razorpay = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`, "content-type": "application/json" }, body: JSON.stringify({ amount: event.offerPrice * 100, currency: "INR", receipt, notes: { enrollment_id: String(enrollment.id), event_id: String(event.id) } }) });
  if (!razorpay.ok) {
    await db.update(enrollments).set({ paymentStatus: "failed" }).where(eq(enrollments.id, enrollment.id));
    return Response.json({ error: "Razorpay could not create the test order" }, { status: 502 });
  }
  const order = await razorpay.json() as { id: string; amount: number; currency: string };
  await db.update(enrollments).set({ razorpayOrderId: order.id }).where(eq(enrollments.id, enrollment.id));
  return Response.json({ keyId, enrollmentId: enrollment.id, orderId: order.id, amount: order.amount, currency: order.currency, eventTitle: event.title }, { headers: { "cache-control": "no-store" } });
}

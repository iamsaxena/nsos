import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { enrollments, events } from "../../../../db/schema";
import { boundedText, noStoreJson, rateLimit, readJson, requireSameOrigin, validDate, validEmail, validPhone } from "../../../security";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return noStoreJson({ eligible: false }, { status: 403 });
  const limited = await rateLimit(request, "certificate-verify", 5, 900); if (limited) return limited;
  const body = await readJson(request);
  if (!body) return noStoreJson({ eligible: false }, { status: 400 });
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const dob = String(body.dob ?? "");
  const phone = String(body.whatsapp ?? "").replace(/\D/g, "");
  if (!boundedText(name, 2, 120) || !validEmail(email) || !validDate(dob) || !validPhone(phone)) return noStoreJson({ eligible: false }, { status: 400 });
  const rows = await getDb().select({ enrollment: enrollments, event: events }).from(enrollments).innerJoin(events, eq(enrollments.eventId, events.id)).where(and(eq(enrollments.email, email), eq(enrollments.dateOfBirth, dob)));
  const match = rows.find(({ enrollment }) => enrollment.name.trim().toLowerCase() === name.toLowerCase() && enrollment.phone.replace(/\D/g, "").endsWith(phone));
  const eligible = Boolean(match && match.enrollment.paymentStatus === "paid" && match.enrollment.attendanceStatus === "attended" && match.enrollment.certificateEligibleAt && new Date(match.enrollment.certificateEligibleAt).getTime() <= Date.now());
  if (!eligible || !match) return noStoreJson({ eligible: false });
  return noStoreJson({ eligible: true, name: match.enrollment.name, event: match.event.title, date: match.event.eventDate, certificateId: `NSOS-${match.event.id}-${match.enrollment.id}` });
}

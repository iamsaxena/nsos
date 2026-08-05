import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { events } from "../../../db/schema";
import { boundedText, getAdmin, noStoreJson, rateLimit, readJson, requireSameOrigin, validDate } from "../../security";
const storedKey = (value: unknown) => { const text = value ? String(value) : ""; return text.startsWith("/api/files?key=") ? decodeURIComponent(text.slice(text.indexOf("=") + 1)) : text || null; };

function toClient(event: typeof events.$inferSelect) {
  return {
    id: event.id,
    eyebrow: "Live workshop",
    title: event.title,
    description: event.description,
    date: event.eventDate,
    time: event.eventTime,
    duration: event.duration,
    format: event.format,
    level: "All levels",
    mrp: event.mrp,
    price: event.offerPrice,
    seats: event.capacity,
    status: event.status === "published" ? "Published" : "Draft",
    theme: "blue",
    image: event.imageKey ? `/api/files?key=${encodeURIComponent(event.imageKey)}` : undefined,
    speakerName: event.speakerName ?? undefined,
    speakerTitle: event.speakerTitle ?? undefined,
    speakerExperience: event.speakerExperience ?? undefined,
    speakerBio: event.speakerBio ?? undefined,
    speakerPhoto: event.speakerPhotoKey ? `/api/files?key=${encodeURIComponent(event.speakerPhotoKey)}` : undefined,
    ppt: event.presentationKey ?? undefined,
    recording: event.recordingKey ?? undefined,
  };
}

export async function GET() {
  const db = getDb();
  const admin = await getAdmin();
  let rows = admin ? await db.select().from(events).orderBy(desc(events.eventDate)) : await db.select().from(events).where(eq(events.status, "published")).orderBy(desc(events.eventDate));
  if (!rows.length) {
    await db.insert(events).values([
      { title: "Build AI Products People Trust", description: "Move from an ambiguous AI idea to a testable product direction. Learn discovery, evaluation design, responsible launch decisions, and the judgment that separates a demo from a dependable product.", eventDate: "2026-08-24", eventTime: "18:30", duration: "120 minutes", format: "Live on Zoom", mrp: 2499, offerPrice: 1499, capacity: 18, status: "published", speakerName: "Sandeep Saxena", speakerTitle: "AI Product & Program Leader", speakerExperience: "15+ years building and leading technology products", speakerBio: "A practitioner focused on turning emerging technology into dependable products, capable teams and measurable outcomes.", createdBy: "system@nsos.live" },
      { title: "Validate Before You Build", description: "Pressure-test the problem, run customer interviews, design fast experiments, and identify genuine signal before committing months of product effort.", eventDate: "2026-09-06", eventTime: "11:00", duration: "90 minutes", format: "Live on Zoom", mrp: 1999, offerPrice: 999, capacity: 31, status: "published", speakerName: "Sandeep Saxena", speakerTitle: "Founder & Product Mentor", speakerExperience: "15+ years across product, programs and entrepreneurship", speakerBio: "Works with founders and teams to validate real demand before committing expensive product effort.", createdBy: "system@nsos.live" },
    ]);
    rows = await db.select().from(events).orderBy(desc(events.eventDate));
  }
  return noStoreJson(rows.map(toClient));
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const limited = await rateLimit(request, "admin-events", 30, 60); if (limited) return limited;
  const admin = await getAdmin();
  if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
  const body = await readJson(request);
  if (!body || !boundedText(body.title, 3, 160) || !boundedText(body.description, 10, 5000) || !validDate(body.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.time ?? "")) || !Number.isSafeInteger(Number(body.mrp)) || !Number.isSafeInteger(Number(body.price)) || Number(body.mrp) < 0 || Number(body.price) < 0 || Number(body.price) > Number(body.mrp) || !Number.isSafeInteger(Number(body.seats)) || Number(body.seats) < 1 || Number(body.seats) > 10000) return Response.json({ error: "Invalid event details" }, { status: 400 });
  const inserted = await getDb().insert(events).values({
    title: String(body.title ?? ""), description: String(body.description ?? ""), eventDate: String(body.date ?? ""), eventTime: String(body.time ?? ""), duration: String(body.duration ?? "90 minutes"), format: String(body.format ?? "Live on Zoom"), mrp: Number(body.mrp ?? 0), offerPrice: Number(body.price ?? 0), capacity: Number(body.seats ?? 30), status: body.status === "Published" ? "published" : "draft", imageKey: storedKey(body.image), presentationKey: storedKey(body.ppt), recordingKey: storedKey(body.recording), speakerName: body.speakerName ? String(body.speakerName) : null, speakerTitle: body.speakerTitle ? String(body.speakerTitle) : null, speakerExperience: body.speakerExperience ? String(body.speakerExperience) : null, speakerBio: body.speakerBio ? String(body.speakerBio) : null, speakerPhotoKey: storedKey(body.speakerPhoto), createdBy: admin.email,
  }).returning();
  return Response.json(toClient(inserted[0]), { status: 201 });
}

export async function PATCH(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const limited = await rateLimit(request, "admin-events", 30, 60); if (limited) return limited;
  const admin = await getAdmin();
  if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
  const body = await readJson(request) as (Record<string, unknown> & { id?: number; status?: string }) | null;
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (!Number.isSafeInteger(Number(body.id)) || Number(body.id) < 1) return Response.json({ error: "Event ID is required" }, { status: 400 });
  if (body.title && (!boundedText(body.title, 3, 160) || !boundedText(body.description, 10, 5000) || !validDate(body.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.time ?? "")) || !Number.isSafeInteger(Number(body.mrp)) || !Number.isSafeInteger(Number(body.price)) || Number(body.mrp) < 0 || Number(body.price) < 0 || Number(body.price) > Number(body.mrp) || !Number.isSafeInteger(Number(body.seats)) || Number(body.seats) < 1 || Number(body.seats) > 10000)) return Response.json({ error: "Invalid event details" }, { status: 400 });
  const fullUpdate = body.title ? { title: String(body.title), description: String(body.description ?? ""), eventDate: String(body.date ?? ""), eventTime: String(body.time ?? ""), duration: String(body.duration ?? "90 minutes"), format: String(body.format ?? "Live on Zoom"), mrp: Number(body.mrp ?? 0), offerPrice: Number(body.price ?? 0), capacity: Number(body.seats ?? 30), imageKey: storedKey(body.image), presentationKey: storedKey(body.ppt), recordingKey: storedKey(body.recording), speakerName: body.speakerName ? String(body.speakerName) : null, speakerTitle: body.speakerTitle ? String(body.speakerTitle) : null, speakerExperience: body.speakerExperience ? String(body.speakerExperience) : null, speakerBio: body.speakerBio ? String(body.speakerBio) : null, speakerPhotoKey: storedKey(body.speakerPhoto) } : {};
  const updated = await getDb().update(events).set({ ...fullUpdate, status: body.status === "Published" ? "published" : "draft", updatedAt: new Date().toISOString() }).where(eq(events.id, body.id)).returning();
  return Response.json(updated[0] ? toClient(updated[0]) : null);
}

export async function DELETE(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const limited = await rateLimit(request, "admin-events", 30, 60); if (limited) return limited;
  const admin = await getAdmin();
  if (!admin) return Response.json({ error: "Admin access required" }, { status: 403 });
  const body = await readJson(request) as { id?: number } | null;
  if (!body) return Response.json({ error: "Invalid request" }, { status: 400 });
  if (!Number.isSafeInteger(Number(body.id)) || Number(body.id) < 1) return Response.json({ error: "Event ID is required" }, { status: 400 });
  await getDb().delete(events).where(eq(events.id, Number(body.id)));
  return noStoreJson({ deleted: true });
}

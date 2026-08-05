import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { enrollments } from "../../../db/schema";
import { getAdmin, noStoreJson, rateLimit } from "../../security";

export async function GET(request: Request) {
  const limited = await rateLimit(request, "admin-enrollments", 60, 60); if (limited) return limited;
  const user = await getAdmin();
  if (!user) return noStoreJson({ error: "Admin access required" }, { status: 403 });
  return noStoreJson(await getDb().select().from(enrollments).orderBy(desc(enrollments.createdAt)));
}

export async function POST() {
  return noStoreJson({ error: "Enrollments must be created through the verified payment flow" }, { status: 405, headers: { allow: "GET" } });
}

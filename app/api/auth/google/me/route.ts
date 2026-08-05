import { getAdmin, noStoreJson } from "../../../../security";

export async function GET() { const admin = await getAdmin(); return admin ? noStoreJson({ email: admin.email }) : noStoreJson({ error: "Not signed in" }, { status: 401 }); }

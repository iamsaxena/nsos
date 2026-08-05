import { env } from "cloudflare:workers";
import { getAdmin, rateLimit, requireSameOrigin } from "../../security";

const rules: Record<string, { max: number; types: string[]; extensions: string[] }> = {
  "event-images": { max: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"], extensions: ["jpg", "jpeg", "png", "webp"] },
  "speaker-photos": { max: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"], extensions: ["jpg", "jpeg", "png", "webp"] },
  presentations: { max: 25 * 1024 * 1024, types: ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"], extensions: ["pdf", "ppt", "pptx"] },
  recordings: { max: 100 * 1024 * 1024, types: ["video/mp4", "video/webm"], extensions: ["mp4", "webm"] },
  "certificate-templates": { max: 10 * 1024 * 1024, types: ["application/pdf"], extensions: ["pdf"] },
};

function validSignature(bytes: Uint8Array, extension: string) {
  const ascii = String.fromCharCode(...bytes);
  if (["jpg", "jpeg"].includes(extension)) return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (extension === "png") return bytes[0] === 0x89 && ascii.slice(1, 4) === "PNG";
  if (extension === "webp") return ascii.slice(0, 4) === "RIFF" && ascii.slice(8, 12) === "WEBP";
  if (extension === "pdf") return ascii.startsWith("%PDF");
  if (extension === "pptx") return ascii.startsWith("PK");
  if (extension === "ppt") return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (extension === "mp4") return ascii.slice(4, 8) === "ftyp";
  if (extension === "webm") return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  return false;
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const limited = await rateLimit(request, "admin-uploads", 12, 300); if (limited) return limited;
  const user = await getAdmin();
  if (!user) return Response.json({ error: "Admin access required" }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  const purpose = String(form.get("purpose") || "file").replace(/[^a-z0-9-]/gi, "");
  if (!(file instanceof File) || !file.size) return Response.json({ error: "File required" }, { status: 400 });
  const rule = rules[purpose];
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!rule || !rule.types.includes(file.type) || !rule.extensions.includes(extension)) return Response.json({ error: "File type is not allowed" }, { status: 415 });
  if (file.size > rule.max) return Response.json({ error: "File exceeds the allowed size" }, { status: 413 });
  if (!validSignature(new Uint8Array(await file.slice(0, 12).arrayBuffer()), extension)) return Response.json({ error: "File content does not match its declared type" }, { status: 415 });
  const key = `${purpose}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  await env.FILES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" }, customMetadata: { uploadedBy: user.email, originalName: file.name } });
  return Response.json({ key, name: file.name });
}

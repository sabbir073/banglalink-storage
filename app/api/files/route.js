import { listFiles, createFile, uid } from "@/lib/db";
import { getStorage } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const files = await listFiles(folderId || undefined);
  return Response.json({ files });
}

export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");
  const folderId = form.get("folderId") || "root";
  if (!file || typeof file === "string") return Response.json({ error: "file required" }, { status: 400 });
  const buffer = Buffer.from(await file.arrayBuffer());
  const id = uid("file");
  const key = "uploads/" + id + "/" + file.name;
  await getStorage().put(key, buffer, file.type);
  const meta = { id, name: file.name, size: buffer.length, type: file.type || "application/octet-stream", folderId, key, createdAt: Date.now(), starred: false, trashed: false };
  await createFile(meta);
  return Response.json(meta);
}

import { createFile } from "@/lib/db";
import { getStorage, storageMode } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (storageMode() !== "s3") return Response.json({ error: "multipart not available" }, { status: 400 });
  const { fileId, key, uploadId, parts, name, size, type, folderId = "root" } = await req.json();
  if (!fileId || !key || !uploadId || !Array.isArray(parts)) return Response.json({ error: "invalid payload" }, { status: 400 });
  await getStorage().completeMultipart(key, uploadId, parts);
  const meta = { id: fileId, name, size: size || 0, type: type || "application/octet-stream", folderId, key, createdAt: Date.now(), starred: false, trashed: false };
  await createFile(meta);
  return Response.json(meta);
}

import { uid } from "@/lib/db";
import { getStorage, storageMode } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { name, type, folderId = "root" } = await req.json();
  if (!name) return Response.json({ error: "name required" }, { status: 400 });

  const id = uid("file");
  const key = "uploads/" + id + "/" + name;
  const partSize = Number(process.env.PART_SIZE_BYTES || 10485760);

  if (storageMode() !== "s3") {
    return Response.json({ strategy: "proxy", mode: "mock" });
  }
  const uploadId = await getStorage().createMultipart(key, type, { folderid: folderId });
  return Response.json({ strategy: "multipart", mode: "s3", fileId: id, key, uploadId, partSize });
}

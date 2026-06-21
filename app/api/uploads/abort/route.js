import { getStorage, storageMode } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (storageMode() !== "s3") return Response.json({ ok: true });
  const { key, uploadId } = await req.json();
  if (key && uploadId) await getStorage().abortMultipart(key, uploadId);
  return Response.json({ ok: true });
}

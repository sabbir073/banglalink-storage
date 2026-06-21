import { getStorage, storageMode } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (storageMode() !== "s3") return Response.json({ error: "multipart not available" }, { status: 400 });
  const { key, uploadId, partNumber } = await req.json();
  if (!key || !uploadId || !partNumber) return Response.json({ error: "key, uploadId, partNumber required" }, { status: 400 });
  const ttl = Number(process.env.SIGNED_URL_TTL_SECONDS || 3600);
  const url = await getStorage().signPart(key, uploadId, partNumber, ttl);
  return Response.json({ url });
}

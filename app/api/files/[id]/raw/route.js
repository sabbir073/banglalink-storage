import { getFile } from "@/lib/db";
import { getStorage, storageMode } from "@/lib/storage";
import { signedViewUrl } from "@/lib/cdn";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url);
  const download = !!searchParams.get("download");
  const f = await getFile(params.id);
  if (!f) return new Response("Not found", { status: 404 });

  if (storageMode() === "s3") {
    const url = await signedViewUrl(f.key, { download, filename: f.name, contentType: f.type });
    return Response.redirect(url, 302);
  }
  const { buffer, contentType } = await getStorage().get(f.key);
  const headers = { "Content-Type": contentType || f.type, "Content-Length": String(buffer.length) };
  if (download) headers["Content-Disposition"] = 'attachment; filename="' + f.name + '"';
  return new Response(buffer, { headers });
}

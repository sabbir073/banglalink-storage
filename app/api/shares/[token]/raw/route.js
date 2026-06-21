import { getShare, getFile } from "@/lib/db";
import { getStorage, storageMode } from "@/lib/storage";
import { signedViewUrl } from "@/lib/cdn";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { searchParams } = new URL(req.url);
  const wantsDownload = !!searchParams.get("download");
  const s = await getShare(params.token);
  if (!s || s.revoked) return new Response("Forbidden", { status: 403 });
  if (s.expiresAt && Date.now() > s.expiresAt) return new Response("Link expired", { status: 410 });
  const f = await getFile(s.fileId);
  if (!f) return new Response("Not found", { status: 404 });
  if (wantsDownload && s.permission !== "download") return new Response("Download not permitted for this link", { status: 403 });

  if (storageMode() === "s3") {
    const remaining = s.expiresAt ? Math.max(60, Math.floor((s.expiresAt - Date.now()) / 1000)) : undefined;
    const url = await signedViewUrl(f.key, { download: wantsDownload, filename: f.name, contentType: f.type, ttl: remaining });
    return Response.redirect(url, 302);
  }
  const { buffer, contentType } = await getStorage().get(f.key);
  const headers = { "Content-Type": contentType || f.type, "Content-Length": String(buffer.length) };
  if (wantsDownload) headers["Content-Disposition"] = 'attachment; filename="' + f.name + '"';
  return new Response(buffer, { headers });
}

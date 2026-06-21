import { listChildren } from "@/lib/db";
import { storageMode } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") || "root";
  const { folders, files, breadcrumb } = await listChildren(folderId);
  return Response.json({ folderId, folders, files, breadcrumb, mode: storageMode() });
}

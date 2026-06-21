import { renameFolder, deleteFolderTree } from "@/lib/db";
import { getStorage } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { name } = await req.json();
  await renameFolder(params.id, name);
  return Response.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const { keys } = await deleteFolderTree(params.id);
  const store = getStorage();
  for (const key of keys) { try { await store.delete(key); } catch {} }
  return Response.json({ ok: true });
}

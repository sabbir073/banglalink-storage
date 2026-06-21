import { updateFile, deleteFile } from "@/lib/db";
import { getStorage } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const body = await req.json();
  await updateFile(params.id, body);
  return Response.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  const res = await deleteFile(params.id);
  if (res?.key) { try { await getStorage().delete(res.key); } catch {} }
  return Response.json({ ok: true });
}

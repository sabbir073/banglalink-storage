import { getShare, getFile, revokeShare } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const s = await getShare(params.token);
  if (!s) return Response.json({ error: "Link not found" }, { status: 404 });
  if (s.revoked) return Response.json({ error: "This link has been revoked" }, { status: 403 });
  if (s.expiresAt && Date.now() > s.expiresAt) return Response.json({ error: "This link has expired" }, { status: 410 });
  const f = await getFile(s.fileId);
  if (!f) return Response.json({ error: "File no longer exists" }, { status: 404 });
  return Response.json({
    file: { id: f.id, name: f.name, size: f.size, type: f.type },
    permission: s.permission, expiresAt: s.expiresAt,
  });
}

export async function DELETE(_req, { params }) {
  await revokeShare(params.token);
  return Response.json({ ok: true });
}

import { getFile, createShare, uid } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { fileId, permission = "view", expiresInHours = 168 } = await req.json();
  const f = await getFile(fileId);
  if (!f) return Response.json({ error: "file not found" }, { status: 404 });
  const share = {
    token: uid("shr"), fileId, permission,
    createdAt: Date.now(),
    expiresAt: expiresInHours ? Date.now() + expiresInHours * 3600 * 1000 : null,
    revoked: false,
  };
  await createShare(share);
  return Response.json(share);
}

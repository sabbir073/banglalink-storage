import { createFolder } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { name, parentId } = await req.json();
  if (!name) return Response.json({ error: "name required" }, { status: 400 });
  const folder = await createFolder(name, parentId || "root");
  return Response.json(folder);
}

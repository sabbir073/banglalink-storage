import { quota } from "@/lib/db";
import { storageMode } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const q = await quota();
  const total = Number(process.env.DEMO_QUOTA_BYTES || 107374182400);
  return Response.json({ used: q.used, total, fileCount: q.fileCount, mode: storageMode() });
}

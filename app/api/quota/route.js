import { quota } from "@/lib/db";
import { storageMode } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const total = Number(process.env.DEMO_QUOTA_BYTES || 107374182400);
  try {
    const q = await quota();
    return Response.json({ used: q.used, total, fileCount: q.fileCount, mode: storageMode() });
  } catch (e) {
    return Response.json({ used: 0, total, fileCount: 0, mode: storageMode(), error: e.message }, { status: 200 });
  }
}

// Mock storage: keeps object bytes on the local temp dir so the demo works without S3.
// (On Vercel, only /tmp is writable — but in production you should use S3, not this.)
import fs from "fs";
import path from "path";
import os from "os";

const DIR = path.join(os.tmpdir(), "bl-cloud-blobs");
function ensure() { fs.mkdirSync(DIR, { recursive: true }); }
function safe(key) { return key.replace(/[^a-zA-Z0-9._-]/g, "_"); }

export class MockAdapter {
  async put(key, buffer, contentType) {
    ensure();
    fs.writeFileSync(path.join(DIR, safe(key)), buffer);
    fs.writeFileSync(path.join(DIR, safe(key) + ".meta"), contentType || "application/octet-stream");
  }
  async get(key) {
    const buffer = fs.readFileSync(path.join(DIR, safe(key)));
    let contentType = "application/octet-stream";
    try { contentType = fs.readFileSync(path.join(DIR, safe(key) + ".meta"), "utf8"); } catch {}
    return { buffer, contentType };
  }
  async delete(key) {
    try { fs.unlinkSync(path.join(DIR, safe(key))); } catch {}
    try { fs.unlinkSync(path.join(DIR, safe(key) + ".meta")); } catch {}
  }
}

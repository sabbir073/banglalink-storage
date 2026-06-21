// Storage adapter layer.
// Swap implementations here later (S3 -> custom storage) without touching the app.
import { S3Adapter } from "./s3";
import { MockAdapter } from "./mock";

let _adapter = null;

export function getStorage() {
  if (_adapter) return _adapter;
  const hasS3 = process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  _adapter = hasS3 ? new S3Adapter() : new MockAdapter();
  return _adapter;
}

export function storageMode() {
  const hasS3 = process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
  return hasS3 ? "s3" : "mock";
}

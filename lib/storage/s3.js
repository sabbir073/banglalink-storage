import {
  S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand,
  CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let _client = null;
export function getS3Client() {
  if (_client) return _client;
  _client = new S3Client({
    region: process.env.S3_REGION || "ap-southeast-1",
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return _client;
}
export function getBucket() { return process.env.S3_BUCKET; }

const CACHE = "private, max-age=31536000, immutable";

export class S3Adapter {
  constructor() { this.bucket = getBucket(); this.client = getS3Client(); }

  // ---- server-side object IO (used for delete, and mock-compat) ----
  async put(key, buffer, contentType) {
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType || "application/octet-stream", CacheControl: CACHE }));
  }
  async get(key) {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const chunks = []; for await (const c of res.Body) chunks.push(c);
    return { buffer: Buffer.concat(chunks), contentType: res.ContentType };
  }
  async delete(key) { await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })); }

  // ---- multipart upload (browser uploads parts directly via presigned URLs) ----
  async createMultipart(key, contentType, metadata = {}) {
    const res = await this.client.send(new CreateMultipartUploadCommand({
      Bucket: this.bucket, Key: key, ContentType: contentType || "application/octet-stream", CacheControl: CACHE, Metadata: metadata,
    }));
    return res.UploadId;
  }
  async signPart(key, uploadId, partNumber, ttl = 3600) {
    const cmd = new UploadPartCommand({ Bucket: this.bucket, Key: key, UploadId: uploadId, PartNumber: partNumber });
    return getSignedUrl(this.client, cmd, { expiresIn: ttl });
  }
  async completeMultipart(key, uploadId, parts) {
    const Parts = parts.slice().sort((a, b) => a.PartNumber - b.PartNumber);
    await this.client.send(new CompleteMultipartUploadCommand({
      Bucket: this.bucket, Key: key, UploadId: uploadId, MultipartUpload: { Parts },
    }));
  }
  async abortMultipart(key, uploadId) {
    try { await this.client.send(new AbortMultipartUploadCommand({ Bucket: this.bucket, Key: key, UploadId: uploadId })); } catch {}
  }
}

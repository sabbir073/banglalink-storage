// Produces a time-limited URL to VIEW or DOWNLOAD an object.
// Uses CloudFront (AWS CDN) signed URLs when configured, otherwise falls back to an S3 presigned GET.
import { getSignedUrl as cfSign } from "@aws-sdk/cloudfront-signer";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as s3Sign } from "@aws-sdk/s3-request-presigner";
import { getS3Client, getBucket } from "@/lib/storage/s3";

export function cloudfrontEnabled() {
  return !!(process.env.CLOUDFRONT_DOMAIN && process.env.CF_KEY_PAIR_ID && process.env.CF_PRIVATE_KEY);
}

// Accept either "dxxxx.cloudfront.net" or a full "https://dxxxx.cloudfront.net/" URL in the env var.
function cfBase() {
  return String(process.env.CLOUDFRONT_DOMAIN || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export async function signedViewUrl(key, { download = false, filename = "file", contentType, ttl } = {}) {
  const seconds = ttl || Number(process.env.SIGNED_URL_TTL_SECONDS || 3600);
  const disposition = download ? `attachment; filename="${String(filename).replace(/"/g, "")}"` : undefined;

  if (cloudfrontEnabled()) {
    let url = `https://${cfBase()}/${encodeURI(key)}`;
    const qs = [];
    if (disposition) qs.push(`response-content-disposition=${encodeURIComponent(disposition)}`);
    if (contentType) qs.push(`response-content-type=${encodeURIComponent(contentType)}`);
    if (qs.length) url += `?${qs.join("&")}`;
    return cfSign({
      url,
      keyPairId: process.env.CF_KEY_PAIR_ID,
      privateKey: (process.env.CF_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      dateLessThan: new Date(Date.now() + seconds * 1000).toISOString(),
    });
  }

  // fallback: S3 presigned GET
  const cmd = new GetObjectCommand({
    Bucket: getBucket(), Key: key,
    ResponseContentDisposition: disposition,
    ResponseContentType: contentType,
  });
  return s3Sign(getS3Client(), cmd, { expiresIn: seconds });
}

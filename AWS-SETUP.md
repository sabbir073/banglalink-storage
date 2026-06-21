# AWS Setup — S3 Multipart Upload + CloudFront CDN

Target architecture:

```
                 upload (large files)                    view / download
  Browser  ──────────────────────────►  S3 bucket  ◄──────────────────────  Browser
     │      presigned multipart PUTs        ▲                                   ▲
     │                                      │ OAC (read)                        │
     └────────► Next.js API ────────────────┘                                   │
          (creates upload, presigns parts,         CloudFront distribution ─────┘
           completes, signs CloudFront URLs)        (CDN cache + signed URLs)
```

- **Uploads** go **browser → S3 directly** as a multipart upload (no 4 MB API-route limit, supports resume, files up to 5 TB). The API only *signs* each part.
- **Views/downloads** go **through CloudFront** (CDN edge cache) using **signed URLs** with an expiry — also perfect for share links.
- S3 bucket stays **fully private** (Block Public Access ON). CloudFront reads via **Origin Access Control (OAC)**.

---

## 1. IAM permission policy (for the backend credentials in `.env.local`)

Least-privilege policy for the IAM user/role your Next.js server uses. Replace `YOUR_BUCKET`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ObjectLevel",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET/*"
    },
    {
      "Sid": "BucketLevel",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET"
    }
  ]
}
```

Notes:
- `CreateMultipartUpload` and `CompleteMultipartUpload` are authorized by `s3:PutObject` — no extra action needed.
- `s3:AbortMultipartUpload` + `s3:ListBucketMultipartUploads` let you clean up abandoned uploads (also automate this with a lifecycle rule — see §6).
- **CloudFront signing does NOT use IAM.** It uses a CloudFront key pair (see §4). Keep IAM keys server-side only.

---

## 2. S3 bucket configuration

### a) Block Public Access — keep ALL four settings **ON**
The bucket is private; only CloudFront reads it.

### b) CORS (required for direct browser multipart upload)
S3 → bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain"
    ],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3000
  }
]
```
> **`ExposeHeaders: ["ETag"]` is mandatory.** Multipart completion needs the ETag returned by each part PUT; without exposing it, the browser can't read it and uploads can't be completed.

### c) Bucket policy — allow CloudFront OAC to read
After creating the distribution (§3), attach this. Replace `YOUR_BUCKET`, `ACCOUNT_ID`, `DIST_ID`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DIST_ID"
        }
      }
    }
  ]
}
```

---

## 3. CloudFront distribution

- **Origin:** your S3 bucket (use the bucket REST endpoint, not the website endpoint).
- **Origin access:** **Origin Access Control (OAC)**, signing behavior = "Sign requests". (OAC replaces the older OAI.)
- **Viewer protocol policy:** Redirect HTTP → HTTPS.
- **Allowed methods:** GET, HEAD (uploads bypass CloudFront and go straight to S3).
- **Restrict viewer access:** **Yes → Trusted key groups** (see §4) so only your signed URLs work.
- **Cache policy:** `CachingOptimized` for static media. If you use `response-content-disposition` to force downloads (§5), use a cache/origin-request policy that **forwards that query string**.

---

## 4. CloudFront signed URLs (private viewing + share links)

1. Generate an RSA key pair:
   ```bash
   openssl genrsa -out cf-private.pem 2048
   openssl rsa -pubout -in cf-private.pem -out cf-public.pem
   ```
2. CloudFront → **Public keys** → upload `cf-public.pem` → note the **Key ID**.
3. CloudFront → **Key groups** → create a group containing that public key.
4. Attach the key group to the distribution behavior ("Restrict viewer access").
5. Sign URLs server-side with the **private** key:

```js
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

export function cdnUrl(key, { seconds = 3600, download, filename } = {}) {
  let url = `https://${process.env.CLOUDFRONT_DOMAIN}/${encodeURI(key)}`;
  if (download) url += `?response-content-disposition=${encodeURIComponent(`attachment; filename="${filename}"`)}`;
  return getSignedUrl({
    url,
    keyPairId: process.env.CF_KEY_PAIR_ID,
    privateKey: process.env.CF_PRIVATE_KEY,        // PEM string
    dateLessThan: new Date(Date.now() + seconds * 1000).toISOString(),
  });
}
```
- This is what powers **share links with expiry** — set `seconds` to the share's TTL.
- For "view only" vs "download", issue a signed URL with or without `response-content-disposition=attachment`.

---

## 5. Multipart upload flow (browser → S3 direct)

Threshold guidance: single `PutObject` is fine up to ~100 MB; use multipart above that (and to enable resume). Part size **≥ 5 MB** (except the last part), max **10,000 parts**, object max **5 TB**.

**API endpoints to add** (server uses `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`):

1. `POST /api/uploads/create` → `CreateMultipartUploadCommand` (set `ContentType`, custom `Metadata`) → returns `{ uploadId, key }`.
2. `POST /api/uploads/sign-part` → presign `UploadPartCommand` for `{ key, uploadId, partNumber }` → returns a short-lived PUT URL.
3. Browser slices the file (`file.slice(start, end)`) and **PUTs each part** to its presigned URL; reads the **`ETag`** response header per part.
4. `POST /api/uploads/complete` → `CompleteMultipartUploadCommand` with `[{ PartNumber, ETag }, ...]`.
5. On error/cancel → `POST /api/uploads/abort` → `AbortMultipartUploadCommand`.

Parts can be uploaded in parallel (e.g. 3–4 at a time) and retried individually → that's your resume-on-unstable-network behavior from the RFP.

---

## 6. Object metadata to set at upload time

Set these in `CreateMultipartUpload` (or `PutObject`):

| Field | Value | Why |
|---|---|---|
| `ContentType` | e.g. `image/jpeg`, `application/pdf` | Inline preview via CloudFront; correct browser handling |
| `CacheControl` | `private, max-age=31536000, immutable` | CDN + browser caching for immutable keyed objects |
| `Metadata` (`x-amz-meta-*`) | `ownerId`, `originalName`, `folderId` | Your app-level attributes travel with the object |
| `ContentDisposition` | *(omit)* | Prefer per-request `response-content-disposition` on the signed URL so the same object serves both inline + as download |

Recommended key layout: `users/{userId}/{fileId}/{originalName}` — gives natural per-tenant prefixes for IAM scoping and lifecycle rules.

**Lifecycle rule:** add `AbortIncompleteMultipartUpload: { DaysAfterInitiation: 1 }` so failed uploads don't accrue storage cost.

**Encryption:** enable default bucket encryption (SSE-S3, or **SSE-KMS** for the RFP's "no plaintext key storage" requirement). With KMS, add `kms:Decrypt` + `kms:GenerateDataKey` to the IAM policy and `kms:Decrypt` for the CloudFront OAC via a key policy.

---

## 7. Environment variables (`.env.local`)

```
# S3
S3_BUCKET=banglalink-cloud
S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# CloudFront
CLOUDFRONT_DOMAIN=dxxxxxxxxxxxx.cloudfront.net
CF_KEY_PAIR_ID=K1XXXXXXXXXXXX
CF_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# Upload tuning
MULTIPART_THRESHOLD_BYTES=104857600   # 100 MB
PART_SIZE_BYTES=10485760              # 10 MB
SIGNED_URL_TTL_SECONDS=3600
```

> Data-residency note (RFP): pick a region/edge setup consistent with "data must not leave Bangladesh without written approval." CloudFront is global by design — restrict with **geo-restriction** and confirm the residency stance with Banglalink, or front the storage with an in-country CDN/origin if required.

# Banglalink Cloud — Interactive Demo

A clickable, Banglalink-branded demo of the consumer cloud-storage platform from the RFP.
Built with **Next.js 14 (App Router) + React + Tailwind CSS**.

- **Files & sharing are real** — uploads use **direct browser→S3 multipart upload** (no size limit, per-part retry/resume); downloads & previews are served via **CloudFront (AWS CDN) signed URLs** (or S3 presigned GET if CloudFront isn't set up). Share links are server-enforced with access control + expiry. Falls back to local disk if no S3 keys.
- **Login/SSO, billing, B2B provisioning and analytics are simulated** — every button works for the demo, but no real backend/charging is involved.

---

## 1. Prerequisites
- Node.js 18.18+ (20+ recommended) and npm.

## 2. Install
```bash
npm install
```

## 3. Configure storage (optional but recommended)
Copy the example env file and fill in your S3 details:
```bash
cp .env.local.example .env.local
```
Edit `.env.local`:
```
S3_BUCKET=your-bucket-name
S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
# DEMO_QUOTA_BYTES=107374182400   # 100 GB shown as the user's quota
```
> No CORS setup needed — files are proxied through the app's own API, so the browser never talks to S3 directly.
>
> **No S3 keys?** Leave them blank. The app falls back to **local demo storage** (files saved under `.data/blobs`) so everything still works on your machine.

## 4. Run
```bash
npm run dev        # http://localhost:3000
# or
npm run build && npm start
```

---

## Demo walkthrough (suggested order)
1. **Home (`/`)** — overview and module launcher.
2. **Login (`/login`)** — "Continue with MyBL SSO" or mobile-number + OTP (type anything).
3. **Web Drive (`/drive`)** — the core experience:
   - Drag-and-drop or click **New upload** → real upload with progress.
   - Double-click a folder to open; breadcrumb to go back.
   - Click a file to **preview** (images, PDF, video, audio, text).
   - Right-click (or ⋮) → **Share link** → choose view/download + expiry → copy the link.
   - Open the share link in a new tab — it's served with real access control (`/share/...`).
   - Star, rename, move to trash, restore, delete forever. Storage bar updates live.
   - **Photos & Backup** view shows the auto-backup banner.
4. **Subscription (`/subscription`)** — plans, bundle vs add-on, billing cycle, family pack, **Simulate next state** to show grace → freeze → expiry, payment sheet.
5. **B2B Admin (`/enterprise`)** — bulk onboarding, RBAC roles, per-employee quota, department usage chart.
6. **Analytics (`/analytics`)** — subscriber, channel, tier, revenue and sync dashboards.
7. **MyBL App (`/mobile`)** — phone mockup: SSO, storage ring, in-app purchase, push notifications, "Manage Cloud" deep-link.

The top black bar on the simulated modules lets you jump between sections during a presentation.

---

## How uploads & serving work
- **Upload:** `POST /api/uploads/create` starts an S3 multipart upload → client requests a presigned URL per part (`/api/uploads/sign-part`) and `PUT`s each part straight to S3 → `/api/uploads/complete` finalizes and records metadata. Failures call `/api/uploads/abort`. In mock mode (no S3) it falls back to a single proxy upload.
- **View/download:** `/api/files/[id]/raw` 302-redirects to a signed **CloudFront** URL (or S3 presigned GET). Same for share links (`/api/shares/[token]/raw`), with the link lifetime capped to the share's remaining expiry.
- See **AWS-SETUP.md** for the exact IAM policy, S3 CORS/bucket policy, CloudFront + key-group setup, and env vars.

## Swapping storage later (S3 → custom)
All object I/O goes through one small interface in `lib/storage/`:
- `lib/storage/s3.js` — current S3 implementation
- `lib/storage/mock.js` — local-disk fallback
- `lib/storage/index.js` — picks the adapter

To use your own storage, add a new adapter with `put(key, buffer, type)`, `get(key)`, `delete(key)` and return it from `getStorage()`. Nothing else in the app changes.

## Project structure
```
app/
  page.js                 # home / launcher
  login/                  # simulated SSO + OTP
  drive/                  # consumer web drive (REAL files)
  subscription/ enterprise/ analytics/ mobile/   # simulated modules
  share/[token]/          # public secure share page (REAL)
  api/                    # files, folders, shares, quota (REAL, server-side)
components/                # Brand, UI primitives, drive parts, nav
lib/                       # storage adapters, json metadata db, mock data, helpers
```

## Notes
- This is a **demo build, not production**. Auth, billing, multi-tenant isolation and durability guarantees from the RFP are represented, not fully implemented.
- Metadata (folders/files/shares) is stored in `.data/db.json`; object bytes live in S3 or `.data/blobs`. Delete the `.data` folder to reset the demo.

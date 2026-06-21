# Deploying to Vercel

The app is now Vercel-ready. Object bytes live in **S3**, files are served via **CloudFront**, and all metadata (folders / files / share links) lives in **Supabase** — so nothing depends on the local filesystem.

## 1. Set up the Supabase tables (one time)
1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the contents of **`supabase-schema.sql`** (in this folder) and click **Run**.
   - This creates `folders`, `files`, `shares`, seeds the default folders, and enables RLS with no public policies (only your server's service-role key can read/write them).

## 2. Get the Supabase keys
- **Project URL** — already filled in `.env.local` (`https://vhmatyuwxyetrghvcrwd.supabase.co`).
- **Service role key** — Supabase dashboard → **Project Settings → API → `service_role`** (the secret one). Put it in `SUPABASE_SERVICE_ROLE_KEY`. It is used **server-side only** and never reaches the browser.

## 3. Push the code to GitHub
From the project folder:
```bash
git init
git add .
git commit -m "Banglalink Cloud demo"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
(`.env.local`, `node_modules`, `.next`, `.data` are gitignored — secrets are NOT pushed.)

## 4. Import into Vercel
1. vercel.com → **Add New → Project** → import your repo. Framework is auto-detected as **Next.js** (no config needed).
2. Add **Environment Variables** (Project → Settings → Environment Variables) — copy every key from your `.env.local`:

| Variable | Value |
|---|---|
| `S3_BUCKET` | banglalink-demo-storage |
| `S3_REGION` | us-east-1 |
| `AWS_ACCESS_KEY_ID` | your key |
| `AWS_SECRET_ACCESS_KEY` | your secret |
| `CLOUDFRONT_DOMAIN` | d2etgke53p6nmu.cloudfront.net |
| `CF_KEY_PAIR_ID` | your CloudFront public key ID |
| `CF_PRIVATE_KEY` | the single-line `\n`-escaped PEM |
| `SUPABASE_URL` | https://vhmatyuwxyetrghvcrwd.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | your service_role secret |
| `PART_SIZE_BYTES` | 10485760 |
| `SIGNED_URL_TTL_SECONDS` | 3600 |
| `DEMO_QUOTA_BYTES` | 107374182400 |

3. **Deploy.**

## 5. After the first deploy
- Add your Vercel URL to the **S3 CORS** `AllowedOrigins` (or keep `"*"` for the demo).
- That's it — uploads (multipart → S3), CloudFront viewing, and Supabase-backed folders/files/shares all work in production.

## Notes
- **Local dev still works unchanged.** If `SUPABASE_*` is unset locally, metadata falls back to `.data/db.json`; if `S3_*` is unset, files fall back to local disk. On Vercel you set both, so neither fallback is used.
- **Security (for the real proposal, not the demo):** the service-role key bypasses RLS — fine for a single trusted server, but a production build should use proper per-user auth + RLS policies, scoped IAM, and tightened CORS/CloudFront geo-restriction (data-residency).

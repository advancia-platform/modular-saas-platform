# Cloudflare R2 Integration

## Goals

Store user uploads and backups in R2 replacing S3; keep seeds/keys secret.

## Bucket Setup

1. Cloudflare Dashboard → R2 → Create bucket `advancia-prod-assets` (private).
2. Optionally create `advancia-backups` for database dumps.

## Credentials (Environment Variables)

```bash
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=AKIA...
R2_SECRET_ACCESS_KEY=********
R2_BUCKET_NAME=advancia-prod-assets
R2_ENDPOINT=https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
STORAGE_PROVIDER=r2
```

## Node.js Client Service

Create `backend/src/services/r2StorageService.ts` (added).

### Functions

-   `uploadBuffer(key, buffer, contentType?)`
-   `uploadStream(key, stream, contentType?)`
-   `getObject(key)` returns readable stream.
-   `generatePublicUrl(key)` uses `R2_PUBLIC_BASE_URL` if set.

## Migration From S3 (Optional One-Off)

If old S3 bucket `advancia-legacy`:

```bash
aws s3 sync s3://advancia-legacy r2://advancia-prod-assets --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com
```

Test with a small prefix first.

## CORS (If Direct Browser Uploads)

Allowed Origins: <https://www.advanciapayledger.com>
Methods: GET, PUT, POST
Headers: Content-Type, Authorization
Expose: ETag

## Backups Flow

Daily: dump Postgres → gzip → `uploadBuffer("db-backups/DATE/ts.sql.gz", file)`.
Retention script: remove >30 day objects.

## Security

-   Never expose access keys client-side.
-   Rotate keys every 180 days; dual-key window 24h.
-   Scan frontend build: `grep -R R2_ACCESS_KEY_ID frontend/.next || echo "OK"`.

## Rollback

Keep S3 for 7 days post-migration.
Feature flag: `STORAGE_PROVIDER=s3` to switch back.

## Monitoring

Log: key, size, duration, success/fail.
Alert if 3 consecutive upload failures.

---

Last updated: initial version.

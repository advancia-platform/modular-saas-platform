# Render Log Triage Checklist (404s / Timeouts)

Use this fast checklist to resolve backend 404s/timeouts on Render.

## 1) Startup and Port Binding

- Confirm the app starts and binds to Render's provided PORT:
  - Expected log: `Server is running on port <PORT>` where PORT matches Render's PORT (usually 10000–19999).
  - In code, we use: `const PORT = config.port || process.env.PORT || 5000;` and `config.port` resolves to `parseInt(process.env.PORT || '4000', 10)` so it will honor Render's PORT.
- If you see it trying to bind 4000/5000 on Render, an env override is forcing a static port. Remove any hard-coded port env and redeploy.

## 2) Prisma migrations + DB connectivity

- Build logs should show Prisma migrations (via `prisma migrate deploy`) before start.
- Common failures:
  - `P3009` or migration drift → Fix by running migrations locally and committing, or set up a `migrate resolve` step, then redeploy.
  - `DATABASE_URL is required` → Ensure the environment variable is set on the service.
  - Cold-start timeouts to Postgres → Add a retry or ensure the DB is healthy before app boot.

## 3) Health endpoint wiring

- Health path is `/api/health`. In `src/index.ts` it’s registered after middleware and before routes. Expected response: HTTP 200 JSON `{ status: 'healthy', ... }`.
- 404 on health implies:
  - The app did not boot (crashed early) → see logs before the 404 (could be from Render’s router responding 404 instead).
  - You’re hitting the wrong service/URL. Verify the custom domain points to the backend service (or use the onrender.com URL directly).

## 4) Middleware ordering (Stripe webhook)

- Stripe webhook uses raw body and is mounted before `express.json()`:
  - Code registers `POST /api/payments/webhook` with `express.raw(...)` before `app.use(express.json())`.
  - Do not reorder; otherwise Express will throw on webhook requests.

## 5) CORS and allowed origins

- CORS allows origins from `config.allowedOrigins`:
  - Set `FRONTEND_URL` env var to your frontend domain.
  - For multiple domains, set `ALLOWED_ORIGINS` as comma-separated list.
  - Note: Render’s health check is server-side (no CORS); but your browser requests will fail if origins are missing.

## 6) JWT secret resolution

- The app can load JWT secrets via `JWT_SECRET`, `JWT_SECRET_BASE64`, or the encrypted trio `JWT_SECRET_ENCRYPTED/JWT_ENCRYPTION_KEY/JWT_ENCRYPTION_IV`.
- Missing or misconfigured secrets can crash boot; check logs for `Failed to decrypt` or `No JWT secret found`.

## 7) Quick shell probes (Render dashboard → Shell)

- From the backend service shell:
  - `echo $PORT` → confirm port value
  - `curl -sS http://localhost:$PORT/api/health` → expect 200 JSON
  - `env | sort | grep -E 'DATABASE_URL|FRONTEND_URL|ALLOWED_ORIGINS|JWT'` → sanity check critical envs

## 8) DNS/Domain

- If on custom domain (via Cloudflare), verify CNAME points to the correct Render service, no proxying conflicts, and SSL is valid.
- Test both the onrender.com URL and the custom domain; if onrender works but custom fails, it’s DNS/Cloudflare.

## 9) Typical log patterns and fixes

- `Error: DATABASE_URL is required` → set `DATABASE_URL` and redeploy.
- `Invalid token` spam on Socket.IO → harmless unless clients are misconfigured; ensure guest sessions or tokens are set correctly.
- `Origin <X> not allowed by CORS` → add to `ALLOWED_ORIGINS` or set `FRONTEND_URL` appropriately.
- `StripeSignatureVerificationError` → ensure webhook secret and raw-body order.

## 10) If stuck

- Scale to a bigger instance temporarily to get more boot time/memory.
- Enable “Auto Deploy” and re-deploy after environment changes.
- Compare working local container logs (Dev Containers) to Render’s logs to spot config differences.

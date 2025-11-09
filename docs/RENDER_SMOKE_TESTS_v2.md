# Render Smoke Tests

Minimal checks to confirm the backend is healthy after a deploy. Replace `<BASE_URL>` with your backend URL (onrender.com or custom domain).

## 1) Health

- URL: `<BASE_URL>/api/health`
- Method: GET
- Expected: HTTP 200

Body (example):

```json
{
  "status": "healthy",
  "timestamp": "<ISO>",
  "environment": "production",
  "version": "1.0.0"
}
```

## 2) CORS sanity (from browser console)

- Fetch from frontend origin to API (simple GET):

```js
fetch("<BASE_URL>/api/health", { credentials: "include" })
  .then((r) => [r.status, r.headers.get("access-control-allow-origin")])
  .then(console.log);
```

- Expected: status 200, ACAO header present and matching your origin.
- If missing, set `FRONTEND_URL` or include the origin in `ALLOWED_ORIGINS`.

## 3) Socket.IO handshake (optional)

- Client connects with `auth.token` or `auth.guestSessionId` set.
- Expected: no connection error; joining rooms works (e.g., `join-room` with your userId).

## 4) Stripe webhook endpoint (optional)

- URL: `<BASE_URL>/api/payments/webhook`
- Expected: only Stripe will hit this with a valid signature; ensure logs don’t show JSON parser errors at startup (raw-body ordering is correct in code).

## 5) Fast script runner (PowerShell)

- Use `scripts/render-smoke.ps1`:

```powershell
pwsh -File .\scripts\render-smoke.ps1 -BaseUrl https://api.advanciapayledger.com
```

- Output: status code and JSON content or failure details.

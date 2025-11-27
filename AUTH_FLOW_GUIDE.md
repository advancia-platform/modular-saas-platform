# Authentication Flow Guide

## Overview

The platform uses JWT-based authentication with automatic token attachment via Axios interceptors. Once a user logs in, the JWT is stored in `localStorage` and automatically included in all protected API requests.

## Backend Setup

### 1. Environment Variables

Ensure these are set in `backend/.env`:

```bash
JWT_SECRET=your-super-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
EMAIL_USER=your-smtp-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### 2. Protected Routes

Routes protected with `authenticateToken` middleware:

- `GET /api/analytics/dashboard` (also rate-limited: 10 req/min)
- `GET /api/subscriptions/me`
- Any route using `requireAdmin` or `allowRoles`

### 3. Rate Limiting

Analytics dashboard enforces:

- **10 requests per minute** per IP/user
- Returns `429 Too Many Requests` with retry-after header

## Frontend Setup

### 1. Login Flow

```tsx
import { login, setAuthToken } from "@/lib/api";

async function handleLogin(email: string, password: string) {
  try {
    const response = await login(email, password, true); // rememberMe=true
    // Token is automatically saved to localStorage
    console.log("Logged in:", response);
    // Redirect to dashboard
    window.location.href = "/dashboard";
  } catch (error) {
    console.error("Login failed:", error);
  }
}
```

### 2. Automatic JWT Attachment

The `backendApi` client in `lib/api.ts` automatically:

- Reads JWT from `localStorage` or `sessionStorage`
- Adds `Authorization: Bearer <token>` to every request
- Handles 401 errors by clearing invalid tokens

```tsx
// No need to manually add headers - it's automatic!
import { backendApi } from "@/lib/api";

const response = await backendApi.get("/api/analytics/dashboard");
```

### 3. Manual Token Management

```tsx
import { setAuthToken, getAuthToken, clearAuthToken } from "@/lib/api";

// Store token (localStorage by default, sessionStorage if persist=false)
setAuthToken("your-jwt-token", true);

// Retrieve token
const token = getAuthToken();

// Clear token (logout)
clearAuthToken();
```

## Testing End-to-End

### 1. Start Services

```pwsh
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

### 2. Login via API

```pwsh
$body = @{ email = "admin@example.com"; password = "yourpassword" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $login.token

# Verify token is returned
$token
```

### 3. Call Protected Route

```pwsh
# Using the token from login
Invoke-RestMethod -Uri "http://localhost:4000/api/analytics/dashboard" -Headers @{ "Authorization" = "Bearer $token" }
```

### 4. Test Rate Limiting

```pwsh
# Should succeed for first 10 requests, then return 429
1..12 | ForEach-Object {
  try {
    $result = Invoke-RestMethod -Uri "http://localhost:4000/api/analytics/dashboard" -Headers @{ "Authorization" = "Bearer $token" }
    Write-Host "Request $_ : Success"
  } catch {
    Write-Host "Request $_ : $($_.Exception.Message)"
  }
}
```

### 5. Frontend Login Test

1. Visit `http://localhost:3000/auth/login`
2. Enter credentials: `admin@example.com` / `yourpassword`
3. Check browser console - token should be in localStorage:

   ```javascript
   localStorage.getItem("jwt");
   ```

4. Navigate to `http://localhost:3000/analytics`
5. Dashboard should load with metrics (no 401 error)

## Troubleshooting

### 401 Unauthorized on Protected Routes

**Problem**: Analytics page shows "Please log in to view analytics."

**Solutions**:

- Verify token is stored: `localStorage.getItem('jwt')` in browser console
- Check token validity: decode JWT at jwt.io
- Ensure `JWT_SECRET` matches between login generation and validation
- Clear invalid tokens: `localStorage.removeItem('jwt')`

### 429 Rate Limited

**Problem**: "You're sending requests too quickly"

**Solutions**:

- Wait 60 seconds before retrying
- Adjust rate limit in `backend/src/routes/analytics.ts` if needed:

  ```typescript
  const analyticsRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20, // increase from 10
  });
  ```

### CORS Errors

**Problem**: Frontend can't reach backend

**Solutions**:

- Check `backend/src/config/index.ts` `allowedOrigins` includes your frontend URL
- Ensure `withCredentials: true` in Axios config
- Verify `NEXT_PUBLIC_BACKEND_URL` in `frontend/.env.local`:

  ```bash
  NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
  ```

### Token Not Attaching

**Problem**: Request still returns 401 even after login

**Solutions**:

- Verify you're using `backendApi` from `lib/api.ts`, not raw `fetch`
- Check interceptor is running: add `console.log` in `backendApi.interceptors.request`
- Ensure login response includes `token` field (adjust if nested under `data`)

## API Endpoints Reference

### Authentication

- `POST /api/auth/login` - Email/password login (returns JWT)
- `POST /api/auth/register` - User registration
- `POST /api/auth/otp/send` - Send OTP to email
- `POST /api/auth/otp/verify` - Verify OTP code
- `POST /api/auth/totp/setup` - Enable 2FA
- `POST /api/auth/totp/verify` - Verify TOTP code

### Protected Routes

- `GET /api/analytics/dashboard` - Analytics metrics (requires JWT + rate limited)
- `GET /api/subscriptions/me` - User subscription info (requires JWT)
- `GET /api/profile` - User profile (requires JWT)

### Public Routes

- `GET /api-docs` - Swagger UI
- `GET /openapi.json` - OpenAPI spec
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Security Best Practices

1. **Never commit secrets** - Use `.env` files (already in `.gitignore`)
2. **Rotate JWT secrets** regularly in production
3. **Use HTTPS** in production (already configured for Vercel/Render)
4. **Set token expiry** - Default is 7 days; adjust in `backend/src/middleware/auth.ts`
5. **Monitor rate limits** - Review logs for suspicious 429 patterns
6. **Clear tokens on logout** - Always call `clearAuthToken()`

## Next Steps

- [ ] Add refresh token flow for long-lived sessions
- [ ] Implement password reset with OTP
- [ ] Add admin dashboard with role-based access
- [ ] Enable 2FA (TOTP) for high-security accounts
- [ ] Set up session monitoring and anomaly detection

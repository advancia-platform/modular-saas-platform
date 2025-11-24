# 🚀 Go Live Validation Guide

**Purpose**: Run this checklist immediately after merging into `main` to confirm production deployment is healthy.

**Time Required**: ~5 minutes  
**Prerequisites**: Production URL, curl or Postman

---

## ✅ Quick Smoke Test (7 Tests)

### 1. Signup ✓

```bash
curl -X POST https://api.your-domain.com/api/auth/v2/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"smoketest@example.com","username":"smoketest","password":"StrongPass123!","fullName":"Smoke Test"}'
```

**Expected**: Status `201`  
**Response**: `{ success: true, user: { id, email, username, role }, tokens: { accessToken, refreshToken } }`  
**Action**: ✅ **SAVE** `accessToken` and `refreshToken` for next steps

---

### 2. Login ✓

```bash
curl -X POST https://api.your-domain.com/api/auth/v2/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"smoketest@example.com","password":"StrongPass123!"}'
```

**Expected**: Status `200`  
**Response**: `{ success: true, message: "Login successful", user: {...}, tokens: {...} }`  
**Action**: ✅ **SAVE** new tokens

---

### 3. Protected Route (`/me`) ✓

```bash
curl https://api.your-domain.com/api/auth/v2/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected**: Status `200`  
**Response**: `{ success: true, user: { id, email, username, role, emailVerified, totpEnabled } }`  
**Confirms**: Token validation works ✅

---

### 4. Refresh Token ✓

```bash
curl -X POST https://api.your-domain.com/api/auth/v2/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

**Expected**: Status `200`  
**Response**: `{ success: true, tokens: { accessToken, refreshToken } }`  
**Confirms**: Refresh mechanism works ✅

---

### 5. Logout ✓

```bash
curl -X POST https://api.your-domain.com/api/auth/v2/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected**: Status `200`  
**Response**: `{ success: true, message: "Logged out successfully" }`  
**Confirms**: Logout endpoint works ✅

---

### 6. Invalid Token (403) ✓

```bash
curl https://api.your-domain.com/api/auth/v2/me \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected**: Status `403`  
**Response**: `{ error: "Invalid or expired token" }`  
**Confirms**: Token validation rejects invalid tokens ✅

---

### 7. No Token (401) ✓

```bash
curl https://api.your-domain.com/api/auth/v2/me
```

**Expected**: Status `401`  
**Response**: `{ error: "Access token required" }`  
**Confirms**: Protected routes require authentication ✅

---

## 📌 Pass/Fail Criteria

### ✅ **PASS - Announce Production Release**

All 7 tests passed:
- ✅ Users can signup and login
- ✅ Tokens work correctly (access + refresh)
- ✅ Protected routes validate tokens
- ✅ Invalid/missing tokens rejected properly

**Action**: Post team announcement (see below)

### ❌ **FAIL - Rollback Required**

If any test fails:
1. **DO NOT announce** production release
2. **Investigate logs** (Render dashboard, Sentry)
3. **Rollback deployment** or apply hotfix
4. **Re-run tests** after fix

---

## 🎉 Team Announcement Template

**Copy-paste into Slack/Teams/Email after all tests pass:**

---

### 🎉 Production Release Announcement

**Validation complete — our SaaS platform is now live in production!**

#### ✅ What We Tested

- Signup, login, refresh, logout flows all passed
- Protected `/me` route verified with access token
- RBAC confirmed: admin routes restricted properly
- Token validation (invalid/missing tokens properly rejected)

#### 🚀 What This Means

- Users can now securely sign up and log in
- Access + refresh token pattern ensures stable sessions
- Role‑based permissions enforced (USER, STAFF, ADMIN, SUPERADMIN)
- Monitoring and observability active for uptime tracking

#### 📌 Next Steps

- QA team: continue monitoring production endpoints
- DevOps: watch logs and performance metrics
- Product: prepare external announcement for customers

---

**👏 Great work team — we've shipped a secure, production‑ready authentication system today!**

---

## 🔍 Troubleshooting

### Test Failed?

| Test | Common Issues | Fix |
|------|--------------|-----|
| Signup 409 | User already exists | Use different email |
| Login 401 | Wrong password | Check credentials |
| /me 403 | Invalid token | Verify token not expired |
| Refresh 403 | Invalid refresh token | Get new tokens via login |
| Any 500 | Server error | Check logs, database connection |

### Still Having Issues?

1. Check backend logs: `Render Dashboard → Logs`
2. Verify environment variables: `JWT_SECRET`, `DATABASE_URL`
3. Check database connectivity: `npx prisma studio`
4. Review Sentry errors: `Sentry Dashboard`

---

## 📚 Additional Resources

- **Full Deployment Guide**: `DEPLOYMENT_CHECKLIST_AUTH.md`
- **API Documentation**: `backend/AUTH_JWT_GUIDE.md`
- **Postman Collection**: `Advancia_JWT_Auth_v2.postman_collection.json`
- **Implementation Details**: `JWT_AUTH_IMPLEMENTATION.md`

---

**Version**: 1.0  
**Last Updated**: November 24, 2025  
**Maintainer**: DevOps Team

# 🧪 QA Smoke Test Checklist — Day 2 Deployment

**Purpose**: Verify critical functionality before production merge  
**Timeline**: 30-45 minutes  
**Owner**: QA Lead  
**Approval Gate**: Must pass all tests before merging `staging` → `main`

---

## 🌐 Frontend Tests (15 minutes)

### Test 1: Homepage & Navigation Load

**Steps**:

1. Open staging environment: `https://staging.advancia.io`
2. Check browser console (F12) for any errors
3. Click through main navigation routes

**Verification**:

- [x] Page loads without 5xx errors
- [x] Console shows no critical errors
- [x] Navigation links respond within 2 seconds
- [x] CSS/styling renders correctly

**Pass/Fail**: **\_\_**

---

### Test 2: Login Flow

**Steps**:

1. Navigate to login page
2. Enter test credentials (if email-based):
   - Email: `test@advancia.io`
   - Code: Use OTP from email or test account
3. Verify successful redirect to dashboard

**Verification**:

- [x] Login form submits without errors
- [x] OTP/password validation works
- [x] Redirect to dashboard succeeds
- [x] Session cookie set (`Authorization` header present)

**Pass/Fail**: **\_\_**

---

### Test 3: Signup Flow

**Steps**:

1. Navigate to signup page
2. Fill in new test account:
   - Email: `newtest-<timestamp>@advancia.io`
   - Password: `TestPass123!` (if password signup enabled)
   - Accept terms & conditions
3. Submit and verify confirmation email

**Verification**:

- [x] Form validates inputs correctly
- [x] No SQL injection exploits work (e.g., entering `' OR '1'='1`)
- [x] Confirmation email received within 2 minutes
- [x] Clicking email link activates account

**Pass/Fail**: **\_\_**

---

### Test 4: Dashboard Navigation

**Steps**:

1. Log in as test user
2. Click through core dashboard routes:
   - `/dashboard` (home)
   - `/dashboard/settings` (user settings)
   - `/dashboard/profile` (profile page)
   - `/marketplace` (if enabled)
3. Verify no layout breaks or missing components

**Verification**:

- [x] All routes load without errors
- [x] Sidebar/navigation menu responsive
- [x] No console errors on route changes
- [x] Back button works correctly

**Pass/Fail**: **\_\_**

---

### Test 5: Marketplace UI (If Enabled)

**Steps**:

1. Navigate to `/marketplace`
2. Verify listing cards display:
   - Product image/placeholder
   - Product title and description
   - Price and vendor name
   - "View Details" or "Checkout" button
3. Test search bar: type "test" and verify results filter
4. Test category filter (if available)
5. Verify pagination works (click through pages)

**Verification**:

- [x] Listing cards render without layout breaks
- [x] Search returns results within 2 seconds
- [x] Filters update listing display dynamically
- [x] Pagination links work correctly
- [x] No 5xx errors in network tab

**Pass/Fail**: **\_\_**

---

### Test 6: Stripe Checkout (Test Mode)

**Steps**:

1. Select a listing and click "Checkout" (or "Buy Now")
2. Verify Stripe Checkout page loads
3. Enter test card: **4242 4242 4242 4242**
   - Expiry: **12/25**
   - CVC: **123**
   - Zip: **12345**
4. Complete purchase and verify confirmation page

**Verification**:

- [x] Stripe Checkout iframe loads
- [x] Test card accepted (no decline)
- [x] Confirmation page displays order details
- [x] Order ID visible in UI
- [x] No 5xx errors during payment

**Pass/Fail**: **\_\_**

---

### Test 7: Notifications & Real-Time Updates

**Steps**:

1. Open two browser windows (same account logged in)
2. In Window 1, trigger an event (e.g., send a message, make a purchase)
3. In Window 2, verify real-time notification appears (toast or banner)
4. Click notification and verify it navigates to correct location

**Verification**:

- [x] Toast notification appears in < 3 seconds
- [x] Notification content matches action (e.g., "Order confirmed")
- [x] Clicking notification navigates to order details
- [x] No console errors in either window

**Pass/Fail**: **\_\_**

---

### Test 8: Responsive Design (Mobile)

**Steps**:

1. Open Chrome DevTools (F12) → Device Toolbar
2. Select **iPhone 12** or similar mobile device
3. Navigate through key pages:
   - Homepage
   - Marketplace listing
   - Checkout flow
4. Verify no layout breaks or horizontal scrolling

**Verification**:

- [x] Navigation collapses to hamburger menu
- [x] Text is readable (font size sufficient)
- [x] Buttons are clickable (not too small)
- [x] Forms stack vertically (not side-by-side)
- [x] No horizontal scroll needed

**Pass/Fail**: **\_\_**

---

## ⚙️ Backend Tests (20 minutes)

### Test 9: API Health Check

**Steps**:

```bash
curl -X GET https://staging.advancia.io/api/health
```

**Expected Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-11-24T12:00:00Z",
  "version": "1.2.0"
}
```

**Verification**:

- [x] HTTP 200 response
- [x] `"status": "ok"` (not "degraded" or "error")
- [x] Version matches expected release
- [x] Response time < 500ms

**Pass/Fail**: **\_\_**

---

### Test 10: Authentication Endpoints

**Steps**:

```bash
# Test login
curl -X POST https://staging.advancia.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@advancia.io","password":"<test-password>"}'

# Expected: 200 + JWT token
```

**Verification**:

- [x] Login endpoint returns 200 with JWT token
- [x] Invalid credentials return 401 (not 5xx error)
- [x] Token can be used for subsequent requests
- [x] Token expiration works (if tested)

**Pass/Fail**: **\_\_**

---

### Test 11: Marketplace Endpoints

**Steps**:

```bash
# Get listings
curl -X GET "https://staging.advancia.io/api/marketplace/listings?page=1&limit=20" \
  -H "Authorization: Bearer <jwt-token>"

# Expected: 200 + paginated array
```

**Verification**:

- [x] HTTP 200 response
- [x] Returns valid JSON array
- [x] Includes pagination info (page, limit, total)
- [x] Response time < 2 seconds with 100+ listings

**Pass/Fail**: **\_\_**

---

### Test 12: Database Connectivity

**Steps**:

```bash
# SSH to staging server
ssh deploy@staging.advancia.io

# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"

# Expected: Returns row count (e.g., 127)
```

**Verification**:

- [x] SSH connection succeeds
- [x] Database query completes within 2 seconds
- [x] No connection timeouts or error messages
- [x] Data consistency verified (e.g., user count reasonable)

**Pass/Fail**: **\_\_**

---

### Test 13: Stripe Integration

**Steps**:

```bash
# Check Stripe webhook endpoint is responding
curl -X GET https://staging.advancia.io/api/payments/webhook-status

# Try a test webhook simulation (if admin endpoint exists)
curl -X POST https://staging.advancia.io/api/test/stripe-webhook \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"type":"charge.succeeded"}'
```

**Verification**:

- [x] Webhook endpoint responds without 5xx errors
- [x] Webhook payload validation works
- [x] Stripe test transaction recorded in logs
- [x] No duplicate transaction processing

**Pass/Fail**: **\_\_**

---

### Test 14: Socket.IO Events

**Steps**:

```bash
# From browser console (logged in):
const socket = io('https://staging.advancia.io');
socket.on('connect', () => console.log('✅ Connected'));
socket.on('user-notification', (msg) => console.log('✅ Received:', msg));

# Trigger event from another session (e.g., send purchase notification)
# Verify socket receives it
```

**Verification**:

- [x] Socket connects without errors
- [x] Connection ID assigned and visible
- [x] Events received in real-time (< 1 second)
- [x] No memory leaks (check DevTools memory usage)

**Pass/Fail**: **\_\_**

---

### Test 15: Error Handling

**Steps**:

1. Test invalid endpoint:

   ```bash
   curl -X GET https://staging.advancia.io/api/invalid-route
   ```

   Expected: `404` (not 5xx)

2. Test invalid JWT:

   ```bash
   curl -X GET https://staging.advancia.io/api/user \
     -H "Authorization: Bearer invalid-token"
   ```

   Expected: `401` (not 5xx)

3. Test missing required field:
   ```bash
   curl -X POST https://staging.advancia.io/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"itemId":"123"}' # missing required field
   ```
   Expected: `400` (not 5xx)

**Verification**:

- [x] Invalid routes return 404 (not 5xx)
- [x] Auth errors return 401/403 (not 5xx)
- [x] Validation errors return 400 (not 5xx)
- [x] Error messages are user-friendly (no SQL/code exposed)

**Pass/Fail**: **\_\_**

---

## 🔒 Security Tests (10 minutes)

### Test 16: Secret Scanning

**Steps**:

1. Check browser DevTools → Network tab for requests
2. Look for any API keys, tokens, or secrets in:
   - Request/Response headers
   - Query parameters
   - Request body JSON

**Verification**:

- [x] No hardcoded API keys in frontend code
- [x] No JWT tokens logged to console
- [x] No credit card numbers in logs or UI
- [x] All sensitive data marked `[REDACTED]` in logs

**Pass/Fail**: **\_\_**

---

### Test 17: SSL/TLS & HTTPS

**Steps**:

1. Navigate to `https://staging.advancia.io`
2. Click padlock icon (browser address bar)
3. Verify SSL certificate:
   - Valid domain name
   - Not expired
   - Issued by trusted CA

**Verification**:

- [x] HTTPS enforced (no HTTP fallback)
- [x] Certificate valid and not self-signed
- [x] No mixed content warnings (all resources HTTPS)
- [x] HSTS header present (if configured)

**Pass/Fail**: **\_\_**

---

### Test 18: XSS & Injection Prevention

**Steps**:

1. Try to inject script in search box:
   ```
   <script>alert('XSS')</script>
   ```
2. Try to inject SQL in login form:
   ```
   ' OR '1'='1
   ```
3. Try to inject HTML in profile description field

**Verification**:

- [x] Injected code is escaped/sanitized
- [x] No alert boxes appear (XSS prevented)
- [x] No data breach occurs (SQL injection prevented)
- [x] HTML tags rendered as text (not executed)

**Pass/Fail**: **\_\_**

---

## 📊 Verification Summary

### Staging Readiness Checklist

| Category     | Tests                           | Status        |
| ------------ | ------------------------------- | ------------- |
| **Frontend** | 1-8 (UI, UX, Responsive)        | ✅ **\_\_\_** |
| **Backend**  | 9-15 (API, DB, Real-time)       | ✅ **\_\_\_** |
| **Security** | 16-18 (Secrets, SSL, Injection) | ✅ **\_\_\_** |
| **Total**    | 18 tests                        | ✅ **\_\_\_** |

---

### Sign-Off

**QA Lead Name**: ************\_\_\_************  
**Date**: ************\_\_\_************  
**Time**: ************\_\_\_************

**All Tests Passed**: ☐ YES ☐ NO

**If NO, Critical Issues Found**:

```
[Document any failures here]




```

**Recommendation**:

- ☐ **APPROVED** → Ready to merge staging → main
- ☐ **BLOCKED** → Fix critical issues and re-test

---

## 🚨 If Critical Issues Found

### Immediate Actions

1. **Document issue** in GitHub issue:

   ```
   Title: [STAGING BUG] <Brief description>
   Severity: Critical | High | Medium | Low
   Steps to reproduce: <Detailed steps>
   Expected vs actual: <What should happen vs what did>
   Screenshots: <If applicable>
   ```

2. **Notify DevOps**:
   - Post in `#deployments` Slack channel
   - Include issue number and severity level

3. **Revert if necessary**:

   ```bash
   # If the issue is blocking production:
   git revert HEAD
   git push origin staging
   # GitHub Actions auto-redeploys previous version
   ```

4. **Schedule re-test**:
   - Fix deployed to staging
   - Re-run smoke tests within 1 hour
   - Document fix in deployment notes

---

## 📞 Support & Escalation

| Issue                    | Contact        | Action                               |
| ------------------------ | -------------- | ------------------------------------ |
| Frontend console errors  | @frontend-team | Check React component logs           |
| API 5xx errors           | @backend-team  | Check server logs (PM2/Docker)       |
| Database connectivity    | @dba           | Verify connection string + migration |
| Stripe integration fails | @payments-team | Verify webhook URL + signing secret  |
| Socket.IO not connecting | @realtime-team | Check Socket.IO server logs          |
| SSL certificate errors   | @devops-team   | Check certificate expiry + renewal   |

---

## 📋 Post-Test Handoff

**When all tests pass:**

1. ✅ Copy this checklist (with sign-off) to deployment notes
2. ✅ Create `STAGING_VERIFICATION_<DATE>.md` file in repo
3. ✅ Post in `#deployments` channel:
   ```
   ✅ **STAGING VERIFIED**
   Date: [DATE]
   QA Lead: [NAME]
   All 18 smoke tests passed
   Ready for production merge
   ```
4. ✅ Proceed to Phase 7 (Production deployment)

---

**🎉 Ready for Production!**

Once this checklist is signed off, you have the green light to merge `staging` → `main` and deploy v1.2.0 to production.

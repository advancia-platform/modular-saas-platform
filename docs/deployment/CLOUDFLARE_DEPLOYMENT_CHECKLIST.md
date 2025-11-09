# Cloudflare Security & Performance Deployment Checklist

**Project**: Advancia Pay Ledger  
**Date**: October 21, 2025  
**Domain**: advanciapayledger.com, api.advanciapayledger.com

---

## Phase 1: Security Hardening (Do This First)

### ✅ Step 1: Enable HTTP DDoS Protection

- [ ] Dashboard → Security → DDoS → HTTP DDoS Attack Protection
- [ ] Set Sensitivity: **High**
- [ ] Deploy

### ✅ Step 2: Create WAF Bypass Rules (9 Rules)

Reference: `CLOUDFLARE_ACCESS_BYPASS_RULES.md`

- [ ] **Rule 1**: Bypass CORS Preflight (OPTIONS)
  - Expression: `(http.request.method eq "OPTIONS" and http.host eq "admin.advanciapayledger.com")`
  - Action: Skip → Access

- [ ] **Rule 2**: Bypass Health Checks
  - Expression: `(http.request.uri.path eq "/health" or http.request.uri.path eq "/api/health")`
  - Action: Skip → Access

- [ ] **Rule 3**: Bypass WebSocket Upgrade
  - Expression: `(http.request.headers["upgrade"][0] eq "websocket")`
  - Action: Skip → Access

- [ ] **Rule 4**: Bypass Webhooks
  - Expression: `(http.request.uri.path in {"/api/payments/webhook" "/api/twilio/sms-callback"})`
  - Action: Skip → Access

- [ ] **Rule 5**: Bypass Next.js Static Assets
  - Expression: `(http.request.uri.path contains "/_next/static/")`
  - Action: Skip → Access

- [ ] **Rule 6**: Block SQL Injection
  - Expression: Use Cloudflare Managed Ruleset → OWASP Core Ruleset
  - Action: Block

- [ ] **Rule 7**: Block XSS Attacks
  - Expression: Use Cloudflare Managed Ruleset → OWASP Core Ruleset
  - Action: Block

- [ ] **Rule 8**: Challenge High Threat Score
  - Expression: `(cf.threat_score > 20 and http.host eq "api.advanciapayledger.com")`
  - Action: Managed Challenge

- [ ] **Rule 9**: High Threat Score Challenge on Frontend (Free Plan Compatible)
  - Expression: `(cf.threat_score > 30 and http.host eq "advanciapayledger.com")`
  - Action: Managed Challenge
  - **Note**: Bot Management (cf.bot_management) requires Enterprise plan. Use cf.threat_score instead.

### ✅ Step 3: Enable OWASP Managed Ruleset

- [ ] Dashboard → Security → WAF → Managed rules
- [ ] Enable: **Cloudflare OWASP Core Ruleset**
- [ ] Sensitivity: Paranoia Level 2 (Medium)
- [ ] Deploy

### ✅ Step 4: Configure Rate Limiting (3 Rules)

#### Rule A: Auth Endpoint Protection

- [ ] Dashboard → Security → WAF → Rate limiting rules → Create
- [ ] **Name**: Protect Auth Endpoints
- [ ] **Match**:
  - Hostname: `api.advanciapayledger.com`
  - Path: `/api/auth/*`
  - Method: POST
- [ ] **Rate**: 10 requests per 60 seconds
- [ ] **Characteristic**: IP Address
- [ ] **Action**: Managed Challenge
- [ ] Deploy

#### Rule B: API Write Protection

- [ ] **Name**: API Write Rate Limit
- [ ] **Match**:
  - Hostname: `api.advanciapayledger.com`
  - Method: POST, PUT, DELETE
- [ ] **Rate**: 120 requests per 60 seconds
- [ ] **Characteristic**: IP Address
- [ ] **Action**: Block
- [ ] Deploy

#### Rule C: API Read Flood Protection

- [ ] **Name**: API Read Rate Limit
- [ ] **Match**:
  - Hostname: `api.advanciapayledger.com`
  - Method: GET
- [ ] **Rate**: 600 requests per 300 seconds
- [ ] **Characteristic**: IP Address
- [ ] **Action**: Managed Challenge
- [ ] Deploy

### ✅ Step 5: Configure Bot Management (Free Plan)

- [ ] Dashboard → Security → Bots → Configure Super Bot Fight Mode
- [ ] **Definitely automated**: Block
- [ ] **Likely automated**: Managed Challenge
- [ ] **Verified bots**: Allow
- [ ] **Static resource protection**: OFF (important for /\_next/static/)
- [ ] **Note**: Advanced Bot Management (cf.bot_management.score) requires Enterprise plan
- [ ] Deploy

---

## Phase 2: Performance Optimization

### ✅ Step 6: Enable URL Normalization

- [ ] Dashboard → Rules → Settings → Normalization
- [ ] **Normalize incoming URLs**: ON
- [ ] **Normalize URLs to origin**: ON
- [ ] Save

### ✅ Step 7: Create Cache Rules (3 Rules)

#### Rule 1: Cache Static Assets

- [ ] Dashboard → Rules → Cache Rules → Create
- [ ] **Name**: Cache Next.js Static Assets
- [ ] **Match**: `http.request.uri.path contains "/_next/static/"`
- [ ] **Action**: Cache Everything
- [ ] **Edge Cache TTL**: 1 year (31536000 seconds)
- [ ] **Browser Cache TTL**: 1 year
- [ ] Deploy

#### Rule 2: Bypass Cache for API

- [ ] **Name**: Bypass API Cache
- [ ] **Match**: `http.host eq "api.advanciapayledger.com"`
- [ ] **Action**: Bypass Cache
- [ ] Deploy

#### Rule 3: Cache Public Assets

- [ ] **Name**: Cache Public Assets
- [ ] **Match**: `http.request.uri.path contains "/public/"`
- [ ] **Action**: Cache Everything
- [ ] **Edge Cache TTL**: 1 month (2592000 seconds)
- [ ] **Browser Cache TTL**: 1 week
- [ ] Deploy

### ✅ Step 8: Enable Compression

- [ ] Dashboard → Rules → Compression Rules → Create
- [ ] **Name**: Brotli Compression
- [ ] **Match**: All traffic
- [ ] **Action**: Compress response
- [ ] **Algorithm**: Brotli (preferred), fallback Gzip
- [ ] Deploy

### ✅ Step 9: Add Security Response Headers

- [ ] Dashboard → Rules → Transform Rules → Modify Response Header → Create
- [ ] **Name**: Security Headers
- [ ] **Match**: All traffic
- [ ] **Headers to set**:
  - `X-Frame-Options`: `DENY`
  - `X-Content-Type-Options`: `nosniff`
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `Permissions-Policy`: `geolocation=(), microphone=(), camera=()`
- [ ] Deploy

---

## Phase 3: Zero Trust Access (Optional Admin Protection)

Reference: `ZERO_TRUST_ACCESS_GUIDE.md`

### ✅ Step 10: Create Admin Subdomain

- [ ] Dashboard → DNS → Add record
- [ ] **Type**: CNAME
- [ ] **Name**: admin
- [ ] **Target**: advancia-frontend.onrender.com
- [ ] **Proxy status**: Proxied (orange cloud)
- [ ] Save

### ✅ Step 11: Configure Zero Trust Access

- [ ] Dashboard → Zero Trust → Access → Applications → Add
- [ ] **Name**: Advancia Admin UI
- [ ] **Domain**: admin.advanciapayledger.com
- [ ] **Session Duration**: 12 hours
- [ ] Add identity provider (Google/Azure/GitHub)
- [ ] Create policy: Allow emails ending in @advanciapayledger.com
- [ ] Add bypass policies (OPTIONS, health, WebSocket)
- [ ] Deploy

### ✅ Step 12: Add Backend JWT Validation

- [ ] Verify `backend/src/middleware/accessJWT.ts` exists
- [ ] Add to Render backend environment:
  - `CLOUDFLARE_ACCESS_TEAM_DOMAIN=<your-team>.cloudflareaccess.com`
  - `CLOUDFLARE_ACCESS_AUD=<your-app-audience-tag>`
- [ ] Update admin routes:
  ```typescript
  import { validateAccessJWT } from "../middleware/accessJWT";
  router.get("/admin/*", validateAccessJWT, allowRoles(["ADMIN"]), handler);
  ```
- [ ] Redeploy backend

---

## Phase 4: Monitoring & Validation

### ✅ Step 13: Test Security Rules

#### A) Test CORS Bypass

```bash
curl -X OPTIONS https://api.advanciapayledger.com/api/users \
     -H "Origin: https://advanciapayledger.com" -v
# Expected: 204/200 without challenge
```

#### B) Test Health Endpoint

```bash
curl https://api.advanciapayledger.com/health -v
# Expected: 200 {"status":"healthy"}
```

#### C) Test Rate Limiting

```bash
for i in {1..15}; do
  curl -X POST https://api.advanciapayledger.com/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}' &
done
# Expected: 11th+ requests get challenged/blocked
```

#### D) Test Bot Protection

- [ ] Visit https://advanciapayledger.com with Chrome DevTools open
- [ ] Check Network tab for cf-bot-score header
- [ ] Verify no CAPTCHA challenge for normal browsing

#### E) Test WebSocket

- [ ] Visit https://advanciapayledger.com
- [ ] Open DevTools → Network → WS
- [ ] Verify Socket.IO connects without 403/401

### ✅ Step 14: Monitor Cloudflare Analytics

- [ ] Dashboard → Analytics → Security → View threats blocked
- [ ] Check rate limit hits
- [ ] Review bot traffic
- [ ] Validate cache hit ratio (target: >80% for static assets)

### ✅ Step 15: Enable Page Shield (Script Monitor)

- [ ] Dashboard → Security → Page Shield → Configure
- [ ] **Script Monitor**: ON (monitor-only mode)
- [ ] Add allowed sources:
  - `advanciapayledger.com/_next/static/*`
  - `js.stripe.com`
  - `fonts.googleapis.com`
  - `cdn.socket.io`
- [ ] Monitor for 1 week before enabling enforcement

---

## Phase 5: Optional Enhancements

### ⚠️ Step 16: Redirect www to Apex (If Desired)

- [ ] Dashboard → Rules → Redirect Rules → Create
- [ ] **Name**: www to apex
- [ ] **Match**: `http.host eq "www.advanciapayledger.com"`
- [ ] **Action**: Dynamic redirect
- [ ] **URL**: `concat("https://advanciapayledger.com", http.request.uri.path)`
- [ ] **Status**: 301 (Permanent)
- [ ] Deploy

### ⚠️ Step 17: Country-Based Access Control (If Needed)

- [ ] Dashboard → Security → WAF → Tools → IP Access Rules
- [ ] **Rule**: Allow only specific countries
- [ ] **Countries**: US, NG, UK (adjust to your team)
- [ ] **Action**: Block others (or Challenge)
- [ ] Save

**Alternative**: Use Zero Trust Access with country requirement in policy (more flexible)

---

## Rollback Plan

If any rule causes issues:

1. **Identify the problem rule**:
   - Check Cloudflare Firewall Events: Dashboard → Security → Events
   - Look for blocked/challenged requests that should pass

2. **Disable the rule**:
   - Dashboard → Security → WAF → [Find rule] → Disable

3. **Test without rule**:
   - Verify app works correctly

4. **Adjust rule expression**:
   - Refine match conditions
   - Add exceptions
   - Re-enable and monitor

---

## Success Metrics

After deployment, you should see:

- ✅ **Security Events**: 50-200 threats blocked per day
- ✅ **Rate Limit Hits**: 10-50 per day (indicates protection working)
- ✅ **Bot Traffic**: 5-15% of total traffic (normal web crawlers)
- ✅ **Cache Hit Ratio**: >80% for static assets
- ✅ **Page Load Time**: <2s (TTI improvement from caching)
- ✅ **Zero False Positives**: No legitimate users blocked

---

## Support & Documentation

- **Internal Docs**: This file + `ZERO_TRUST_ACCESS_GUIDE.md` + `CLOUDFLARE_ACCESS_BYPASS_RULES.md`
- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Team Contact**: DevOps (security@advanciapayledger.com)
- **Cloudflare Support**: Dashboard → Support → Contact

---

**Last Updated**: October 21, 2025  
**Next Review**: November 21, 2025 (monthly security audit)

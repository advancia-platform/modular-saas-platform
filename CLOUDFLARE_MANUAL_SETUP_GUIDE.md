# Cloudflare Security Configuration - Manual Setup Guide

**Issue**: Your API token has read-only permissions. Advanced security features must be configured manually in the Cloudflare dashboard.

**Date**: November 9, 2025  
**Domain**: advanciapayledger.com  
**Zone ID**: 0bff66558872c58ed5b8b7942acc34d9

---

## 🔐 Why Manual Configuration?

Your current API token (`Workers Builds - 2025-10-21 20:16`) has limited permissions:

- ✅ Can read zone information
- ✅ Can verify token status
- ✅ Can list DNS records
- ❌ **Cannot** modify SSL/TLS settings
- ❌ **Cannot** create/update WAF rules
- ❌ **Cannot** configure rate limiting
- ❌ **Cannot** modify security settings

**Solution**: Configure these features through the Cloudflare dashboard.

---

## 📋 Step-by-Step Configuration

### Step 1: SSL/TLS Settings (5 minutes)

**URL**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/ssl-tls

#### 1.1 Overview Tab

1. Click **SSL/TLS** in left menu
2. Click **Overview**
3. Set **SSL/TLS encryption mode** to: **Full (strict)**
   - ⚠️ Important: "Full (strict)" not "Full"
   - This validates your backend SSL certificate
4. Scroll down, enable:
   - ✅ **Always Use HTTPS**

#### 1.2 Edge Certificates Tab

1. Click **Edge Certificates**
2. Enable these options:
   - ✅ **Always Use HTTPS** (if not already enabled)
   - ✅ **Automatic HTTPS Rewrites**
   - ✅ **Certificate Transparency Monitoring**
3. Set **Minimum TLS Version**: **TLS 1.2** (or higher)

**Expected Result**: All traffic uses HTTPS with valid certificates

---

### Step 2: WAF Custom Rules (10 minutes)

**URL**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/waf/custom-rules

#### Rule 1: Bypass Health Checks

```
Name: Bypass Health Checks
Expression: (http.request.uri.path eq "/health" or http.request.uri.path eq "/api/health") and http.host eq "api.advanciapayledger.com"
Action: Skip
  → Skip: All remaining custom rules
  → Skip: All rate limiting rules
```

**How to create**:

1. Click **Create rule**
2. Enter rule name
3. Click **Edit expression**
4. Paste expression above
5. Select **Skip** action
6. Check boxes for rules to skip
7. Click **Deploy**

#### Rule 2: Bypass CORS Preflight

```
Name: Bypass CORS Preflight
Expression: http.request.method eq "OPTIONS" and http.host eq "api.advanciapayledger.com"
Action: Skip
  → Skip: All remaining custom rules
  → Skip: All rate limiting rules
```

#### Rule 3: Challenge High Threat Score

```
Name: Challenge High Threat Score
Expression: cf.threat_score > 30 and http.host eq "api.advanciapayledger.com"
Action: Managed Challenge
```

**Note**: This uses `cf.threat_score` (free plan compatible) instead of `cf.bot_management.score`

#### Rule 4: Block SQL Injection & XSS

```
Name: Block SQL Injection and XSS
Expression: ((http.request.uri.path contains "union" and http.request.uri.path contains "select") or http.request.uri.path contains "<script") and http.host eq "api.advanciapayledger.com"
Action: Block
```

**Order matters!** Arrange rules in this order:

1. Bypass Health Checks (first)
2. Bypass CORS Preflight
3. Challenge High Threat Score
4. Block SQL Injection & XSS (last)

---

### Step 3: Rate Limiting (10 minutes)

**URL**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/waf/rate-limiting-rules

#### Rate Limit 1: Auth Endpoints

```
Name: Rate Limit Auth Endpoints
If incoming requests match:
  http.host eq "api.advanciapayledger.com" and http.request.uri.path contains "/api/auth"

Characteristics: IP Address

When rate exceeds:
  10 requests per 1 minute

Then:
  Action: Block
  Duration: 10 minutes (600 seconds)
  Response: 429 Too Many Requests
  Custom JSON: {"error": "Too many authentication attempts. Please try again later."}
```

**How to create**:

1. Click **Create rule**
2. Enter rule name
3. Build expression (or use "Edit expression" and paste)
4. Set characteristics: **IP Address**
5. Set rate: **10** per **1 minute**
6. Action: **Block**
7. With duration: **10 minutes**
8. Click **Deploy**

#### Rate Limit 2: API Write Operations

```
Name: Rate Limit API Writes
If incoming requests match:
  http.host eq "api.advanciapayledger.com" and http.request.method in {"POST" "PUT" "DELETE"}

Characteristics: IP Address

When rate exceeds:
  120 requests per 1 minute

Then:
  Action: Block
  Duration: 5 minutes (300 seconds)
  Response: 429 Too Many Requests
```

#### Rate Limit 3: General API Flood Protection

```
Name: API Flood Protection
If incoming requests match:
  http.host eq "api.advanciapayledger.com"

Characteristics: IP Address

When rate exceeds:
  600 requests per 5 minutes

Then:
  Action: Managed Challenge
  Duration: 1 minute
```

---

### Step 4: Bot Protection (5 minutes)

**URL**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/bots

#### Super Bot Fight Mode (Free Plan)

1. Toggle **Super Bot Fight Mode** to **ON**
2. Configure settings:
   - **Definitely automated**: **Block**
   - **Likely automated**: **Managed Challenge**
   - **Verified bots**: **Allow**
   - **Static resource protection**: **OFF** ⚠️ Important!
3. Click **Save**

**Why turn off static resources?**

- Prevents blocking CDN/asset requests
- Frontend assets should load without challenges
- Only protects dynamic API endpoints

---

### Step 5: Additional Security Settings (5 minutes)

**URL**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/settings

#### 5.1 Security Level

Set to: **Medium**

- Low = least restrictive
- **Medium** = recommended for most sites
- High = very restrictive (may block legitimate users)

#### 5.2 Challenge Passage

Set to: **30 minutes**

- How long users can browse after passing a challenge

#### 5.3 Browser Integrity Check

Enable: **ON**

- Blocks common threats from suspicious browsers

#### 5.4 Privacy Pass Support

Enable: **ON**

- Allows Privacy Pass tokens to bypass challenges

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] SSL/TLS mode is "Full (strict)"
- [ ] Always Use HTTPS is enabled
- [ ] 4 WAF custom rules created and ordered correctly
- [ ] 3 rate limiting rules configured
- [ ] Super Bot Fight Mode enabled
- [ ] Security level set to Medium
- [ ] Browser Integrity Check enabled

---

## 🧪 Testing Your Configuration

### Test 1: Health Check Bypass

```bash
curl -I https://api.advanciapayledger.com/health
# Should return 200 without challenge
```

### Test 2: CORS Preflight

```bash
curl -X OPTIONS https://api.advanciapayledger.com/api/test \
  -H "Origin: https://advanciapayledger.com" \
  -H "Access-Control-Request-Method: POST"
# Should return 200 without challenge
```

### Test 3: Rate Limiting (Auth)

```bash
# Run this 11 times quickly:
for i in {1..11}; do
  curl https://api.advanciapayledger.com/api/auth/login \
    -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Request $i"
done
# 11th request should return 429 Too Many Requests
```

### Test 4: SQL Injection Block

```bash
curl "https://api.advanciapayledger.com/api/test?id=1%20union%20select%20*%20from%20users"
# Should be blocked (403 or similar)
```

### Test 5: SSL/TLS

```bash
curl -I https://advanciapayledger.com
curl -I https://api.advanciapayledger.com
# Both should return HTTPS with valid certificates
```

---

## 📊 Monitoring & Analytics

### View Security Events

**URL**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/events

Here you can see:

- Blocked requests
- Challenged requests
- WAF rule matches
- Rate limiting triggers
- Bot detections

### View Analytics

**URL**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/analytics

Monitor:

- Total requests
- Bandwidth usage
- Threats blocked
- SSL/TLS traffic
- Cache performance

---

## 🔧 Troubleshooting

### Issue: Legitimate traffic blocked

**Solution**: Check Security Events to identify the rule, then:

- Adjust rule expression to be more specific
- Lower security level from High to Medium
- Add IP to allowlist

### Issue: Rate limiting too strict

**Solution**: Increase limits:

- Auth: 10 → 20 requests per minute
- API writes: 120 → 200 requests per minute

### Issue: SSL errors on frontend

**Check**:

1. Vercel SSL certificate is valid
2. Cloudflare SSL mode is "Full (strict)" not "Flexible"
3. DNS records for @ and www are **NOT** proxied (gray cloud)

### Issue: CORS errors

**Verify**:

1. OPTIONS requests bypass WAF rules
2. Backend sends correct CORS headers
3. Allowed origins include frontend domain

---

## 🎯 Expected Results After Configuration

### Security Posture

| Feature          | Before  | After   | Method    |
| ---------------- | ------- | ------- | --------- |
| SSL/TLS          | ⚠️      | ✅ Full | Dashboard |
| WAF Rules        | ❌      | ✅ 4    | Dashboard |
| Rate Limiting    | ❌      | ✅ 3    | Dashboard |
| Bot Protection   | ❌      | ✅ Yes  | Dashboard |
| Security Level   | Default | ✅ Med  | Dashboard |
| Browser Check    | ❌      | ✅ Yes  | Dashboard |
| Health Bypass    | ❌      | ✅ Yes  | WAF Rule  |
| CORS Bypass      | ❌      | ✅ Yes  | WAF Rule  |
| Threat Challenge | ❌      | ✅ Yes  | WAF Rule  |
| SQL/XSS Block    | ❌      | ✅ Yes  | WAF Rule  |

### Protection Coverage

- ✅ **Frontend (Vercel)**: SSL, CDN, basic DDoS
- ✅ **API (Cloudflare)**: WAF, rate limiting, bot protection, advanced DDoS
- ✅ **Email**: MX, SPF, DKIM, DMARC
- ✅ **DNS**: Cloudflare nameservers active

---

## 📝 Optional: Create API Token with Full Permissions

If you want to automate this in the future:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use template: **Edit zone security settings** or **Custom token**
4. Set permissions:
   - Zone | SSL and Certificates | Edit
   - Zone | Firewall Services | Edit
   - Zone | Zone Settings | Edit
   - Zone | Zone | Read
5. Set Zone Resources:
   - Include | Specific zone | advanciapayledger.com
6. Click **Continue to summary** → **Create Token**
7. Save the new token securely
8. Update `.env`:
   ```bash
   CLOUDFLARE_API_TOKEN=new-token-with-full-permissions
   ```

---

## 🚀 Quick Links

- **Dashboard**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9
- **SSL/TLS**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/ssl-tls
- **WAF Custom**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/waf/custom-rules
- **Rate Limiting**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/waf/rate-limiting-rules
- **Bots**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/bots
- **Events**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/security/events
- **Analytics**: https://dash.cloudflare.com/0bff66558872c58ed5b8b7942acc34d9/analytics

---

**Estimated Time**: 35-40 minutes total
**Difficulty**: Medium
**Cost**: $0 (all Free plan features)

**Questions?** Check Security Events dashboard for real-time feedback on rule effectiveness.

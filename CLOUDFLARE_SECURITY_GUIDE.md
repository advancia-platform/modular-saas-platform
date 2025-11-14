# 🔒 Cloudflare Security Configuration Guide

Complete security hardening guide for Advancia Pay Ledger using Cloudflare WAF, Rate Limiting, and Zero Trust.

---

## 📋 Overview

This guide configures **enterprise-grade security** for your fintech SaaS platform using Cloudflare's security features:

- 🛡️ **WAF Managed Rules** - Block common exploits (SQLi, XSS, path traversal)
- ⏱️ **Rate Limiting** - Prevent brute force and API abuse
- 🤖 **Bot Protection** - Block malicious bots and scrapers
- 🔐 **Zero Trust Access** - Secure admin routes with SSO/MFA
- 📊 **Security Analytics** - Monitor and audit all security events

**Compliance Coverage**: PCI DSS, SOC2, GDPR, HIPAA-ready

---

## ✅ Prerequisites

- [ ] Cloudflare account (Free or Pro plan minimum)
- [ ] Domain added to Cloudflare
- [ ] DNS records pointing to your DigitalOcean droplet
- [ ] Cloudflare proxy enabled (orange cloud icon)

---

## 🛡️ Phase 1: WAF Managed Rules (15 minutes)

### 1.1 Enable OWASP Core Ruleset

**Protects against:** SQL injection, XSS, path traversal, command injection, local file inclusion

**Steps:**

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain
3. Go to **Security → WAF**
4. Click **Managed Rules** tab
5. Enable **Cloudflare OWASP Core Ruleset**
   - Toggle to **ON**
   - Set mode to **Block** (not just Log)
   - Review and enable all rule groups

**Recommended Rule Groups:**

- ✅ SQL Injection
- ✅ Cross-site Scripting (XSS)
- ✅ Local File Inclusion (LFI)
- ✅ Remote File Inclusion (RFI)
- ✅ Remote Code Execution (RCE)
- ✅ PHP Injection
- ✅ Session Fixation
- ✅ Scanner Detection
- ✅ Protocol Attack
- ✅ Generic Attack

### 1.2 Enable Cloudflare Managed Ruleset

**Protects against:** Known CVEs, zero-day exploits, malicious payloads

**Steps:**

1. In **WAF → Managed Rules**
2. Enable **Cloudflare Managed Ruleset**
   - Toggle to **ON**
   - Set action to **Block**
3. Review anomaly score settings
   - Set threshold to **Medium** (score: 40)
   - Increase to **Low** (score: 20) for sensitive endpoints

### 1.3 Create Custom WAF Rules

#### Rule 1: Protect Login Endpoint

```
Name: Block Suspicious Login Attempts
Expression:
(http.request.uri.path eq "/api/auth/login" or http.request.uri.path eq "/api/login") and
(
  http.user_agent contains "sqlmap" or
  http.user_agent contains "nikto" or
  http.user_agent contains "nmap" or
  http.request.uri.query contains "'" or
  http.request.uri.query contains "<script" or
  http.request.uri.query contains "union" or
  http.request.uri.query contains "select"
)

Action: Block
```

**To add:**

1. Go to **Security → WAF → Custom Rules**
2. Click **Create Rule**
3. Name: `Block Suspicious Login Attempts`
4. Paste expression above
5. Action: **Block**
6. Save

#### Rule 2: Protect Admin Routes

```
Name: Restrict Admin Access
Expression:
(http.request.uri.path contains "/admin" or
 http.request.uri.path contains "/api/admin") and
not ip.geoip.country in {"US" "CA" "GB"}  # Add your allowed countries

Action: Block
```

#### Rule 3: Block Known Attack Patterns

```
Name: Block Common Exploits
Expression:
http.request.uri.query contains "../" or
http.request.uri.query contains "etc/passwd" or
http.request.uri.query contains "cmd=" or
http.request.uri.query contains "exec(" or
http.request.body contains "<?php" or
http.request.body contains "base64_decode"

Action: Block
```

#### Rule 4: Protect Payment Endpoints

```
Name: Secure Payment Processing
Expression:
(http.request.uri.path eq "/api/payments/webhook" or
 http.request.uri.path contains "/api/stripe") and
not http.request.headers["stripe-signature"][0] matches "^t=.*,v1=.*"

Action: Block
```

### 1.4 Configure Sensitivity Levels

**For Fintech SaaS, use these settings:**

| Endpoint Pattern      | Sensitivity | Action            |
| --------------------- | ----------- | ----------------- |
| `/api/auth/*`         | High        | Block at score 20 |
| `/api/payments/*`     | High        | Block at score 20 |
| `/api/transactions/*` | High        | Block at score 20 |
| `/api/users/*`        | Medium      | Block at score 40 |
| `/api/*`              | Medium      | Block at score 40 |
| `/*`                  | Low         | Block at score 60 |

---

## ⏱️ Phase 2: Rate Limiting (20 minutes)

### 2.1 Login Endpoint Protection

**Prevents:** Brute force attacks, credential stuffing

**Configuration:**

```
Name: Rate Limit Login Attempts
Expression:
http.request.uri.path eq "/api/auth/login" or
http.request.uri.path eq "/api/login"

Rate Limit:
- Requests: 10 per minute per IP
- Duration: 1 minute
- Action: Block for 15 minutes
```

**Steps:**

1. Go to **Security → WAF → Rate Limiting Rules**
2. Click **Create Rate Limiting Rule**
3. Name: `Rate Limit Login Attempts`
4. Choose characteristic: **IP Address**
5. Set expression (above)
6. Requests: **10**
7. Period: **1 minute**
8. Action: **Block**
9. Duration: **15 minutes**
10. Save

### 2.2 Registration Endpoint Protection

```
Name: Rate Limit Registrations
Expression:
http.request.uri.path eq "/api/auth/register" or
http.request.uri.path eq "/api/register" or
http.request.uri.path eq "/api/users"

Rate Limit:
- Requests: 5 per hour per IP
- Duration: 1 hour
- Action: Block for 1 hour
```

### 2.3 API Transaction Endpoint Protection

```
Name: Rate Limit Transactions
Expression:
http.request.uri.path contains "/api/transactions" or
http.request.uri.path contains "/api/transaction"

Rate Limit:
- Requests: 100 per minute per IP
- Duration: 1 minute
- Action: Challenge (CAPTCHA) for 5 minutes
```

### 2.4 Password Reset Protection

```
Name: Rate Limit Password Reset
Expression:
http.request.uri.path contains "/api/forgot-password" or
http.request.uri.path contains "/api/reset-password"

Rate Limit:
- Requests: 3 per hour per IP
- Duration: 1 hour
- Action: Block for 6 hours
```

### 2.5 General API Protection

```
Name: Global API Rate Limit
Expression:
http.request.uri.path starts_with "/api/"

Rate Limit:
- Requests: 1000 per hour per IP
- Duration: 1 hour
- Action: Challenge (JS Challenge) for 30 minutes
```

### 2.6 Payment Webhook Protection

```
Name: Protect Payment Webhooks
Expression:
http.request.uri.path eq "/api/payments/webhook"

Rate Limit:
- Requests: 100 per minute per IP
- Duration: 1 minute
- Action: Block for 1 hour
- Bypass: Only if Stripe signature valid
```

---

## 🤖 Phase 3: Bot Protection (10 minutes)

### 3.1 Enable Bot Fight Mode (Free Plan)

**Steps:**

1. Go to **Security → Bots**
2. Toggle **Bot Fight Mode** to **ON**
3. Configure settings:
   - ✅ **Definitely Automated**: Block
   - ✅ **Likely Automated**: Challenge
   - ✅ **Verified Bots**: Allow (Google, Bing, etc.)

**What it blocks:**

- Known bad bots and scrapers
- Headless browsers (Puppeteer, Selenium)
- Automated tools (curl, wget without proper headers)

### 3.2 Super Bot Fight Mode (Pro/Business Plans)

**Advanced features:**

- Machine learning bot detection
- JavaScript fingerprinting
- Anomaly detection
- Static resource protection

**Configuration:**

1. Go to **Security → Bots**
2. Upgrade to **Super Bot Fight Mode**
3. Configure actions:
   - **Definitely Automated**: Block
   - **Likely Automated**: Managed Challenge
   - **Verified Bots**: Allow
   - **Static Resources**: Allow

### 3.3 Challenge Configuration

**Recommended Settings:**

| Traffic Type   | Challenge Type                  | Reason                |
| -------------- | ------------------------------- | --------------------- |
| Login attempts | Interactive Challenge (CAPTCHA) | High-value endpoint   |
| API requests   | JS Challenge                    | Balance security & UX |
| Static assets  | Allow                           | Performance           |
| Verified bots  | Allow                           | SEO & monitoring      |
| Suspicious IPs | Managed Challenge               | Adaptive security     |

### 3.4 Bot Score Thresholds

**Configure bot score actions:**

```
Score 1-29 (Definitely Bot): Block
Score 30-55 (Likely Bot): Challenge
Score 56-99 (Likely Human): Allow
```

**Custom rule for sensitive endpoints:**

```
Name: Block Bots on Sensitive Endpoints
Expression:
cf.bot_management.score lt 30 and
(http.request.uri.path contains "/api/auth" or
 http.request.uri.path contains "/api/payments")

Action: Block
```

---

## 🔐 Phase 4: Zero Trust Access (30 minutes)

### 4.1 Enable Cloudflare Access

**Protects:** Admin dashboard, internal tools, staff-only routes

**Prerequisites:**

- Cloudflare Zero Trust account (formerly Cloudflare for Teams)
- Domain configured in Cloudflare

### 4.2 Create Access Application

**Steps:**

1. Go to [Zero Trust Dashboard](https://one.dash.cloudflare.com)
2. Navigate to **Access → Applications**
3. Click **Add an Application**
4. Choose **Self-hosted**

**Configuration:**

```
Application Name: Advancia Admin Dashboard
Subdomain: admin
Domain: yourdomain.com
Full URL: https://admin.yourdomain.com

Session Duration: 8 hours
```

### 4.3 Configure Access Policies

#### Policy 1: Admin Dashboard Access

```
Policy Name: Allow Admin Team
Action: Allow

Include Rules:
- Email ends with: @yourdomain.com
- Country: United States, Canada, United Kingdom
- Device Posture: Requires company device

Require Rules:
- One-time PIN (via email)
- Or: Google Workspace SSO
- Or: Microsoft Azure AD SSO

Purpose: Protects /admin routes
```

#### Policy 2: Finance Team Access

```
Policy Name: Finance Team Only
Action: Allow

Include Rules:
- Email: finance@yourdomain.com, cfo@yourdomain.com
- Group: Finance (from Identity Provider)

Require Rules:
- Google Workspace SSO
- Hardware key (YubiKey)

Purpose: Access to /admin/finance routes
```

#### Policy 3: Developer Access

```
Policy Name: Development Team
Action: Allow

Include Rules:
- Email ends with: @yourdomain.com
- IP Range: Office IP / VPN IP range

Require Rules:
- GitHub SSO
- Time-based: Monday-Friday, 9 AM - 6 PM

Purpose: Access to internal tools
```

### 4.4 Protect Specific Routes

**Route Protection Rules:**

| Route Pattern     | Protection        | SSO Required | MFA Required |
| ----------------- | ----------------- | ------------ | ------------ |
| `/admin/*`        | Cloudflare Access | ✅ Yes       | ✅ Yes       |
| `/api/admin/*`    | Cloudflare Access | ✅ Yes       | ✅ Yes       |
| `/analytics/*`    | Cloudflare Access | ✅ Yes       | ❌ No        |
| `/internal/*`     | Cloudflare Access | ✅ Yes       | ✅ Yes       |
| `/api/internal/*` | Cloudflare Access | ✅ Yes       | ✅ Yes       |

### 4.5 Integrate Identity Providers

**Supported SSO Providers:**

- Google Workspace
- Microsoft Azure AD
- Okta
- GitHub
- LinkedIn

**Setup (Google Workspace example):**

1. Go to **Zero Trust → Settings → Authentication**
2. Click **Add new** under Login Methods
3. Select **Google Workspace**
4. Enter OAuth credentials
5. Configure allowed domains
6. Test authentication

### 4.6 Device Posture Checks (Enterprise)

**Require secure devices:**

- ✅ Disk encryption enabled
- ✅ Firewall enabled
- ✅ OS up to date
- ✅ Antivirus running
- ✅ Company MDM enrolled

---

## 📊 Phase 5: Security Analytics & Monitoring (15 minutes)

### 5.1 Enable Security Analytics

**Steps:**

1. Go to **Security → Analytics**
2. Enable **Firewall Events** logging
3. Enable **Rate Limiting Events** logging
4. Enable **Bot Detection Events** logging

### 5.2 Configure Log Retention

**Recommended Settings:**

| Log Type        | Retention | Use Case                |
| --------------- | --------- | ----------------------- |
| Firewall Events | 30 days   | Compliance audits       |
| Rate Limiting   | 14 days   | Attack pattern analysis |
| Bot Events      | 7 days    | Bot trend monitoring    |
| Access Logs     | 90 days   | PCI DSS compliance      |

### 5.3 Set Up Alerts

**Critical Alerts:**

```
Alert 1: High Volume of Blocked Requests
Trigger: >100 blocked requests in 5 minutes
Action: Email + Slack notification
Recipients: security@yourdomain.com
```

```
Alert 2: Admin Route Access Attempts
Trigger: >10 failed authentication attempts
Action: Email + SMS notification
Recipients: admin@yourdomain.com, cto@yourdomain.com
```

```
Alert 3: Rate Limit Threshold Exceeded
Trigger: Rate limit triggered >50 times in 1 hour
Action: Email notification
Recipients: devops@yourdomain.com
```

### 5.4 Export Logs for Compliance

**For PCI DSS, SOC2, HIPAA compliance:**

```bash
# Using Cloudflare API to export logs
curl -X GET "https://api.cloudflare.com/client/v4/zones/{zone_id}/logs/received" \
  -H "X-Auth-Email: your-email@yourdomain.com" \
  -H "X-Auth-Key: your-api-key" \
  -H "Content-Type: application/json" \
  --data '{"start":"2025-01-01T00:00:00Z","end":"2025-01-31T23:59:59Z","fields":"ClientIP,ClientRequestHost,ClientRequestMethod,ClientRequestURI,EdgeResponseStatus,OriginResponseStatus,RayID"}'
```

**Store logs in:**

- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- Elasticsearch

### 5.5 Security Dashboard

**Key Metrics to Monitor:**

| Metric                 | Threshold  | Action                      |
| ---------------------- | ---------- | --------------------------- |
| Blocked requests/hour  | >1000      | Investigate attack pattern  |
| Bot traffic percentage | >30%       | Review bot rules            |
| Failed login attempts  | >100/hour  | Enable stricter rate limits |
| WAF rule triggers      | >500/hour  | Check for false positives   |
| Average response time  | >2 seconds | Check origin health         |

---

## 🧪 Phase 6: Testing & Validation (15 minutes)

### 6.1 Test WAF Rules

**SQL Injection Test:**

```bash
curl "https://yourdomain.com/api/users?id=1' OR '1'='1"
# Expected: 403 Forbidden (blocked by WAF)
```

**XSS Test:**

```bash
curl "https://yourdomain.com/api/search?q=<script>alert('XSS')</script>"
# Expected: 403 Forbidden (blocked by WAF)
```

**Path Traversal Test:**

```bash
curl "https://yourdomain.com/api/files?path=../../etc/passwd"
# Expected: 403 Forbidden (blocked by WAF)
```

### 6.2 Test Rate Limiting

**Login Rate Limit Test:**

```bash
for i in {1..15}; do
  curl -X POST https://yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Request $i"
done
# Expected: First 10 succeed, next 5 blocked
```

### 6.3 Test Bot Protection

**Automated Bot Test:**

```bash
curl -A "curl/7.68.0" https://yourdomain.com/api/users
# Expected: Challenge or block (depending on settings)
```

**Verified Bot Test:**

```bash
curl -A "Googlebot/2.1 (+http://www.google.com/bot.html)" https://yourdomain.com
# Expected: Allow (verified bot)
```

### 6.4 Test Zero Trust Access

**Without Authentication:**

```bash
curl https://admin.yourdomain.com
# Expected: Redirect to Cloudflare Access login
```

**With Valid Session:**

```bash
curl -H "CF-Access-JWT-Assertion: valid-token" https://admin.yourdomain.com
# Expected: 200 OK
```

---

## ✅ Post-Configuration Checklist

### Security Verification

- [ ] All WAF managed rulesets enabled (OWASP + Cloudflare)
- [ ] Custom WAF rules created for sensitive endpoints
- [ ] Rate limiting active on login, register, password reset
- [ ] Bot Fight Mode or Super Bot Fight Mode enabled
- [ ] Challenge configured appropriately (CAPTCHA vs JS Challenge)
- [ ] Zero Trust Access protecting admin routes
- [ ] SSO integrated for admin authentication
- [ ] MFA required for high-privilege accounts
- [ ] Security analytics and logging enabled
- [ ] Alerts configured for critical security events

### Compliance Verification

- [ ] Firewall events logged for 30+ days (PCI DSS requirement)
- [ ] Access logs exported to secure storage (SOC2 requirement)
- [ ] Audit trail enabled for all admin actions
- [ ] IP geolocation blocking configured if needed (GDPR)
- [ ] Data encryption in transit (SSL/TLS) verified
- [ ] Security policies documented and reviewed

### Performance Verification

- [ ] Page load time < 3 seconds with WAF enabled
- [ ] API response time < 200ms with rate limiting
- [ ] No false positives blocking legitimate users
- [ ] Bot challenge solve rate acceptable (>90% for humans)
- [ ] CDN cache hit ratio > 80% for static assets

---

## 📚 Maintenance & Best Practices

### Weekly Tasks

- [ ] Review firewall event logs for anomalies
- [ ] Check rate limiting effectiveness
- [ ] Monitor bot traffic patterns
- [ ] Review failed authentication attempts

### Monthly Tasks

- [ ] Audit WAF rule effectiveness
- [ ] Update IP allowlists/blocklists
- [ ] Review and tune rate limit thresholds
- [ ] Test disaster recovery procedures
- [ ] Review compliance audit logs

### Quarterly Tasks

- [ ] Security policy review with team
- [ ] Penetration testing (external firm)
- [ ] Update security documentation
- [ ] Review and renew SSL certificates
- [ ] Compliance audit preparation

---

## 🆘 Troubleshooting

### False Positives

**Issue:** Legitimate users blocked by WAF  
**Solution:**

1. Go to **Security → Events**
2. Find blocked request
3. Click **Skip** → **Create Rule**
4. Whitelist specific pattern or IP

**Issue:** API integration blocked  
**Solution:**

```
Create bypass rule:
Expression: http.request.uri.path eq "/api/webhook/stripe" and
            ip.src in {54.187.174.169 54.187.205.235}  # Stripe IPs
Action: Skip WAF
```

### Performance Issues

**Issue:** Slow page loads after enabling WAF  
**Solution:**

- Reduce WAF sensitivity from High to Medium
- Enable Cloudflare caching for static assets
- Use Argo Smart Routing (paid feature)

**Issue:** High bot challenge rate  
**Solution:**

- Lower bot score threshold for challenges
- Use JS Challenge instead of Interactive Challenge
- Whitelist verified bots properly

### Rate Limiting Issues

**Issue:** Legitimate users hit rate limits  
**Solution:**

- Increase rate limit threshold
- Use shorter blocking duration (5 min instead of 15)
- Add IP whitelist for known good IPs

---

## 💰 Cost Estimate

| Plan           | Monthly Cost | Features                                           |
| -------------- | ------------ | -------------------------------------------------- |
| **Free**       | $0           | Basic WAF, DDoS protection, bot fight mode         |
| **Pro**        | $20          | Super Bot Fight Mode, advanced analytics           |
| **Business**   | $200         | Advanced WAF, image optimization, priority support |
| **Enterprise** | Custom       | Zero Trust, custom rules, dedicated support, SLA   |

**Recommended for Fintech SaaS:** Business Plan ($200/month) or higher

---

## 🔗 Additional Resources

- [Cloudflare WAF Documentation](https://developers.cloudflare.com/waf/)
- [Cloudflare Rate Limiting Guide](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Cloudflare Zero Trust Docs](https://developers.cloudflare.com/cloudflare-one/)
- [Bot Management Best Practices](https://developers.cloudflare.com/bots/)
- [PCI DSS Compliance Guide](https://www.cloudflare.com/pci-compliance/)

---

**Security is not a one-time setup — it's an ongoing process.** 🛡️

Keep your rulesets updated, monitor logs regularly, and adapt to new threats!

# 🛡️ Security Hardening - Alert Policy Management System

## Executive Summary

This system has been hardened against penetration and cracking with **defense-in-depth** security controls across:

- Application layer (authentication, authorization, input validation)
- Transport layer (TLS, HSTS, secure cookies)
- Data layer (encryption, audit logging, integrity checks)
- Infrastructure layer (firewall, WAF, network segmentation)
- Operational layer (monitoring, incident response, access reviews)

---

## 🎯 Threat Model

### Assets Protected

- **Alert policies**: Threshold configurations, channel settings, severity levels
- **Admin accounts**: SuperAdmin credentials with edit permissions
- **Audit logs**: Tamper-evident trail of all policy changes
- **Alert channels**: Email, SMS, Slack, Teams webhook URLs
- **Database**: PostgreSQL with PII and policy data
- **Secrets**: API keys, SMTP credentials, webhook URLs

### Threats Mitigated

| Threat                   | Mitigation                      | Control                   |
| ------------------------ | ------------------------------- | ------------------------- |
| **Credential Stuffing**  | Rate limiting + MFA             | `requireMFA` middleware   |
| **SQL Injection**        | Parameterized queries           | Prisma ORM                |
| **XSS**                  | Input sanitization + CSP        | `sanitizeInput` + headers |
| **CSRF**                 | CSRF tokens + SameSite cookies  | `validateCSRF` middleware |
| **SSRF**                 | URL validation + allow-lists    | Webhook URL validation    |
| **Privilege Escalation** | RBAC + audit logging            | `requireSuperAdmin`       |
| **Session Hijacking**    | Secure cookies + timeouts       | `sessionTimeout`          |
| **Brute Force**          | Rate limiting + account lockout | Redis rate limiter        |
| **Key Leakage**          | Secrets manager + rotation      | Environment variables     |
| **Supply Chain**         | Dependency scanning + SCA       | GitHub Dependabot         |

---

## 🔐 Authentication & Authorization

### 1. Multi-Factor Authentication (MFA)

**Requirement**: All admin accounts must enable TOTP 2FA.

**Enforcement**:

```typescript
// Middleware: backend/src/middleware/securityEnhanced.ts
export function requireMFA(req, res, next) {
  if (!user.totpEnabled || !user.totpVerified) {
    return res.status(403).json({ error: "MFA required" });
  }

  // Check MFA recently verified (within 5 minutes)
  if (Date.now() - session.mfaVerifiedAt > 5 * 60 * 1000) {
    return res.status(403).json({ error: "Re-verify MFA" });
  }

  next();
}
```

**Implementation**:

- SuperAdmin policy edits require MFA re-verification
- MFA verification valid for 5 minutes
- Failed MFA attempts logged to Sentry

---

### 2. Role-Based Access Control (RBAC)

**Hierarchy**:

```
SUPERADMIN (level 4)
  ├── Full policy CRUD
  ├── Enable/disable policies
  └── Delete policies (with reason)

ADMIN (level 3)
  ├── View policies (read-only)
  ├── View audit logs
  └── View rate limit stats

STAFF (level 2)
  └── No policy access

USER (level 1)
  └── No policy access
```

**Enforcement**:

```typescript
// Middleware: backend/src/middleware/rbac.ts
export function requireSuperAdmin(req, res, next) {
  if (req.user.role !== "SUPERADMIN") {
    // Log unauthorized attempt
    captureError(new Error("Unauthorized access attempt"), {
      level: "warning",
      extra: { userId, email, role, path, ip },
    });

    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}
```

---

### 3. Session Security

**Configuration**:

```typescript
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevent XSS access
      secure: true, // HTTPS only
      sameSite: "strict", // CSRF protection
      maxAge: 60 * 60 * 1000, // 60 minutes
    },
  })
);
```

**Timeouts**:

- **Idle timeout**: 60 minutes of inactivity
- **Absolute timeout**: 8 hours max session duration
- **Force logout**: On privilege change or MFA re-verification

---

## 🔒 Transport & Data Protection

### 1. HTTPS Enforcement

**Headers**:

```typescript
// Strict Transport Security (HSTS)
res.setHeader(
  "Strict-Transport-Security",
  "max-age=31536000; includeSubDomains; preload"
);

// Prevent downgrade attacks
res.setHeader("Upgrade-Insecure-Requests", "1");
```

**Deployment**:

- All traffic over TLS 1.2+
- Weak ciphers disabled (no RC4, 3DES)
- Certificate pinning for API clients

---

### 2. Content Security Policy (CSP)

```typescript
res.setHeader(
  "Content-Security-Policy",
  "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // TODO: Remove unsafe-*
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://sentry.io"
);
```

**Protects against**:

- XSS (script injection)
- Clickjacking (iframe embedding)
- Data exfiltration (restrict connect-src)

---

### 3. Database Encryption

**At Rest**:

- PostgreSQL transparent data encryption (TDE)
- Disk-level encryption (LUKS or AWS EBS encryption)
- Encrypted backups (AES-256)

**In Transit**:

- PostgreSQL SSL connections (`sslmode=require`)
- Redis TLS connections
- No plaintext database traffic

**Field-Level**:

- Sensitive columns encrypted (e.g., `totpSecret`)
- Audit log `changesBefore`/`changesAfter` JSON encrypted

---

### 4. Secrets Management

**Never in code**:

```typescript
// ❌ BAD
const apiKey = "sk-1234567890";

// ✅ GOOD
const apiKey = process.env.STRIPE_SECRET_KEY;
```

**Best practices**:

- Use AWS Secrets Manager or HashiCorp Vault
- Rotate secrets every 90 days
- Different secrets per environment (dev/staging/prod)
- Secrets encrypted at rest

---

## 🛡️ Input Validation & Output Encoding

### 1. Zod Schema Validation

**All request bodies validated**:

```typescript
const updatePolicySchema = z.object({
  threshold: z.number().int().min(1).max(10000),
  channels: z.array(z.enum(["email", "sms", "slack", "teams"])).min(1),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

// Middleware
router.put("/:group", validateBody(updatePolicySchema), async (req, res) => {
  // req.body is now type-safe and validated
});
```

**Benefits**:

- Prevents SQL injection (type-safe)
- Rejects malformed data early
- Auto-generates TypeScript types

---

### 2. Input Sanitization

```typescript
export function sanitizeInput(req, res, next) {
  // Sanitize query params
  Object.keys(req.query).forEach((key) => {
    if (typeof req.query[key] === "string") {
      req.query[key] = sanitizeString(req.query[key]);
    }
  });

  // Sanitize body
  sanitizeObject(req.body);

  next();
}

function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;") // Prevent XSS
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
```

**Applied globally**:

```typescript
app.use(sanitizeInput);
```

---

### 3. Output Encoding

**React auto-escapes**:

```jsx
// React automatically escapes { } interpolations
<p>Policy: {policy.routeGroup}</p>
```

**Manual encoding for HTML emails**:

```typescript
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
```

---

## 📊 Audit Logging & Monitoring

### 1. Tamper-Evident Audit Trail

**Every policy change logged**:

```typescript
await logPolicyChange({
  policyId: policy.id,
  action: "updated",
  changedBy: user.id,
  userEmail: user.email,
  userRole: user.role,
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
  changesBefore: currentPolicy, // Full snapshot
  changesAfter: updatedPolicy, // Full snapshot
  reason: validated.reason,
});
```

**Integrity checks**:

- Audit logs immutable (no UPDATE/DELETE on `policy_audit_logs`)
- Hash chain linking logs together (optional)
- Daily backup to S3 with versioning

---

### 2. Anomaly Detection

**Automated detection**:

```typescript
const { rapidChanges, unusualTimes, deletions } = await detectAnomalies();

// Rapid changes: >5 edits in 1 hour by same user
if (rapidChanges.length > 0) {
  alertSecurityTeam("Rapid policy changes detected", rapidChanges);
}

// Unusual times: Changes outside 6 AM - 10 PM
if (unusualTimes.length > 0) {
  alertSecurityTeam("After-hours policy changes", unusualTimes);
}

// Deletions: Critical action
if (deletions.length > 0) {
  alertSecurityTeam("Policy deletion detected", deletions);
}
```

**Alerts via**:

- Email (security team)
- Sentry (high severity)
- Slack (security channel)

---

### 3. Sentry Integration

**Error tracking**:

```typescript
captureError(err, {
  level: "error",
  tags: { component: "alert-policies", operation: "update" },
  extra: { userId, policyId, changes },
});
```

**Security events**:

```typescript
captureError(new Error("Unauthorized access attempt"), {
  level: "warning",
  tags: { type: "security", event: "unauthorized_admin_access" },
  extra: { userId, role, path, ip },
});
```

**Alerting rules**:

- Any `level: 'fatal'` → Email security team
- Any `tags.type: 'security'` → Slack #security channel
- Any `event: 'unauthorized_*'` → Sentry issue

---

## 🚨 Rate Limiting & DDoS Protection

### 1. Application-Level Rate Limiting

**Redis-backed**:

```typescript
// Global: 1000 requests/minute per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    keyGenerator: (req) => req.ip,
  })
);

// Admin endpoints: 100 requests/minute per IP
app.use(
  "/api/admin",
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
  })
);
```

**Per-user limits**:

- Auth endpoints: 10 requests/minute
- Admin endpoints: 100 requests/minute
- Policy edits: 10 requests/minute

---

### 2. Infrastructure-Level Protection

**Cloudflare WAF**:

- Challenge bots (Managed Challenge)
- Block known bad IPs (IP Access Rules)
- Rate limit at edge (Rate Limiting Rules)
- DDoS protection (automatic)

**Firewall rules**:

```bash
# Allow only frontend IPs to backend
ufw allow from <frontend-ip> to any port 4000

# Allow only DB access from backend
ufw allow from <backend-ip> to any port 5432

# Block all other traffic
ufw default deny incoming
ufw default allow outgoing
```

---

## 🔍 Monitoring & Alerting

### 1. Health Checks

**Endpoint**: `GET /api/health`

**Response**:

```json
{
  "status": "healthy",
  "timestamp": 1699999999999,
  "services": {
    "database": "connected",
    "redis": "connected",
    "sentry": "configured"
  }
}
```

**Uptime monitoring**:

- UptimeRobot (5-minute checks)
- PagerDuty (on-call alerts)

---

### 2. Log Aggregation

**Winston structured logging**:

```typescript
logger.info("Policy updated", {
  userId: user.id,
  email: user.email,
  policyId: policy.id,
  routeGroup: policy.routeGroup,
  changes: { threshold: [10, 15] },
});
```

**Shipping**:

- Elasticsearch (search + analytics)
- CloudWatch Logs (AWS)
- Splunk (enterprise)

---

### 3. Metrics Dashboard

**Grafana visualizations**:

- Policy edit frequency (edits/hour)
- User activity (by role)
- Failed MFA attempts
- Unauthorized access attempts
- Anomaly detection alerts

**Prometheus metrics**:

```typescript
const policyEdits = new Counter({
  name: "policy_edits_total",
  help: "Total policy edits",
  labelNames: ["user_role", "route_group", "action"],
});

policyEdits.inc({
  user_role: "SUPERADMIN",
  route_group: "auth",
  action: "updated",
});
```

---

## 🔐 Access Control & Secrets

### 1. Principle of Least Privilege

**Database users**:

- `app_read_only`: SELECT only (for reporting)
- `app_read_write`: SELECT, INSERT, UPDATE (no DELETE)
- `app_superadmin`: Full access (only backend service)

**IAM roles**:

- Backend service: Secrets Manager read-only
- CI/CD: ECR push, ECS deploy
- Developers: No production access (staging only)

---

### 2. Secret Rotation

**Automated rotation**:

```bash
# AWS Secrets Manager - rotate every 90 days
aws secretsmanager rotate-secret \
  --secret-id prod/backend/database-password \
  --rotation-lambda-arn arn:aws:lambda:...

# Manual rotation checklist
# 1. Generate new secret
# 2. Update backend .env
# 3. Rolling restart (zero-downtime)
# 4. Revoke old secret (after 24h grace period)
```

---

## 🚨 Incident Response

### 1. Detection

**Triggers**:

- Sentry alert: `Unauthorized access attempt`
- Audit log anomaly: Rapid changes detected
- Failed MFA attempts: >5 in 10 minutes
- After-hours policy change
- Policy deletion

---

### 2. Response Playbook

**Step 1: Contain (< 5 minutes)**

```sql
-- Disable affected user
UPDATE users SET active = false WHERE id = '<user-id>';

-- Revoke sessions
DELETE FROM sessions WHERE user_id = '<user-id>';
```

**Step 2: Investigate (< 30 minutes)**

```sql
-- Check audit logs
SELECT * FROM policy_audit_logs
WHERE changed_by = '<user-id>'
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Check login history
SELECT * FROM audit_logs
WHERE user_id = '<user-id>'
AND action = 'login'
AND timestamp > NOW() - INTERVAL '7 days';
```

**Step 3: Restore (< 1 hour)**

```sql
-- Rollback policy change
UPDATE alert_policies
SET threshold = <old-value>
WHERE route_group = '<group>';

-- Log restoration
INSERT INTO policy_audit_logs (...)
VALUES (..., 'restored after incident', ...);
```

**Step 4: Report (< 24 hours)**

- Document incident timeline
- Root cause analysis
- Lessons learned
- Update runbook

---

### 3. Post-Incident

**Actions**:

- Force password reset for affected users
- Rotate all secrets (API keys, session secrets)
- Review IAM permissions
- Update firewall rules
- Patch vulnerabilities
- Team training on findings

---

## ✅ Security Checklist

### Pre-Production

- [ ] **Authentication**
  - [ ] MFA enforced for all admin accounts
  - [ ] Password complexity policy (12+ chars, uppercase, lowercase, number, symbol)
  - [ ] Account lockout after 5 failed attempts
  - [ ] Session timeouts configured (60 minutes idle)
- [ ] **Authorization**
  - [ ] RBAC middleware on all admin routes
  - [ ] SuperAdmin accounts limited (≤3)
  - [ ] Regular access reviews scheduled (quarterly)
- [ ] **Transport Security**
  - [ ] HTTPS enforced (HSTS header)
  - [ ] TLS 1.2+ only
  - [ ] Certificate valid + not expiring soon
  - [ ] Weak ciphers disabled
- [ ] **Input Validation**
  - [ ] Zod schemas for all request bodies
  - [ ] Sanitization middleware applied globally
  - [ ] SQL injection tests passed
  - [ ] XSS tests passed
- [ ] **Secrets Management**
  - [ ] No hardcoded secrets in code
  - [ ] Secrets in environment variables or secrets manager
  - [ ] Different secrets per environment
  - [ ] Rotation schedule documented
- [ ] **Audit Logging**
  - [ ] All policy changes logged
  - [ ] Logs immutable (no UPDATE/DELETE)
  - [ ] Daily backup to S3
  - [ ] Anomaly detection enabled
- [ ] **Monitoring**
  - [ ] Sentry integration tested
  - [ ] Uptime monitoring configured
  - [ ] Alerting rules defined
  - [ ] Grafana dashboard created
- [ ] **Incident Response**
  - [ ] Playbook documented
  - [ ] Emergency contacts updated
  - [ ] Rollback procedure tested
  - [ ] Team trained

---

### Production Hardening

- [ ] **Rate Limiting**
  - [ ] Redis-backed rate limiter deployed
  - [ ] Per-route limits configured
  - [ ] DDoS protection enabled (Cloudflare WAF)
- [ ] **Firewall**
  - [ ] Only required ports open (443, 4000, 5432, 6379)
  - [ ] IP allow-lists for internal services
  - [ ] Default deny policy
- [ ] **Database**
  - [ ] Read replicas for scaling
  - [ ] Automated backups (daily)
  - [ ] Point-in-time recovery enabled
  - [ ] Encryption at rest
- [ ] **Dependencies**
  - [ ] Automated dependency scanning (Dependabot)
  - [ ] SCA tools configured (Snyk, npm audit)
  - [ ] No critical vulnerabilities
- [ ] **Compliance**
  - [ ] GDPR data retention policy (7 days for logs)
  - [ ] PCI-DSS for payment data (if applicable)
  - [ ] SOC 2 audit preparation (if applicable)

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- [GDPR Compliance Guide](https://gdpr.eu/)

---

## 📞 Security Contacts

- **Security Team**: security@example.com
- **On-Call**: PagerDuty #security-oncall
- **Incident Hotline**: +1-xxx-xxx-xxxx
- **Bug Bounty**: hackerone.com/your-org

---

**Last Updated**: 2025-01-15  
**Next Review**: 2025-04-15 (Quarterly)

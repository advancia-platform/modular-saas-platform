# 🛡️ Secure Alert Policy Management System

## Overview

This system provides enterprise-grade alert policy management with:

- **Database-backed policies** for dynamic configuration
- **RBAC protection** (SuperAdmin-only editing)
- **Tamper-evident audit logging** of all policy changes
- **Multi-channel alerts** (Email, SMS, Slack, Teams, WebSocket, Sentry)
- **Security hardening** against penetration and cracking

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin UI (Next.js)                       │
│  - View policies (ADMIN role)                               │
│  - Edit policies (SUPERADMIN role)                          │
│  - Audit log viewer                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS + RBAC
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Express)                       │
│  ├─ /api/admin/alert-policies (GET/POST/PUT/DELETE/PATCH)  │
│  ├─ /api/admin/policy-audit (GET audit logs)               │
│  └─ Middleware: requireSuperAdmin + MFA + CSRF             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Policy Audit Service                        │
│  - Logs every change with user/timestamp/reason            │
│  - Detects anomalies (rapid changes, unusual times)        │
│  - Sentry integration for critical actions                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Prisma)                    │
│  ├─ alert_policies (route_group, threshold, channels...)    │
│  └─ policy_audit_logs (action, user, before/after, IP)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### `alert_policies` Table

```prisma
model AlertPolicy {
  id                String        @id @default(uuid())
  routeGroup        String        @unique
  threshold         Int           // Request count trigger
  cooldown          Int           @default(300000) // ms
  mode              AlertMode     @default(IMMEDIATE)
  batchIntervalMs   Int?          // For batched mode
  channels          String[]      // ["email", "sms", "slack"...]
  severity          AlertSeverity @default(MEDIUM)
  enabled           Boolean       @default(true)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  createdBy         String        // User ID
  updatedBy         String        // User ID
  auditLogs         PolicyAuditLog[]
}
```

### `policy_audit_logs` Table

```prisma
model PolicyAuditLog {
  id            String      @id @default(uuid())
  policyId      String
  action        String      // "created", "updated", "deleted", "enabled", "disabled"
  changedBy     String      // User ID
  userEmail     String
  userRole      String
  ipAddress     String?
  userAgent     String?
  changesBefore Json?       // Full policy snapshot before change
  changesAfter  Json        // Full policy snapshot after change
  reason        String?     // Mandatory reason for audit trail
  timestamp     DateTime    @default(now())
}
```

---

## 🔐 Security Controls

### 1. Role-Based Access Control (RBAC)

| Role       | View Policies | Edit Policies | Delete Policies |
| ---------- | ------------- | ------------- | --------------- |
| USER       | ❌            | ❌            | ❌              |
| STAFF      | ❌            | ❌            | ❌              |
| ADMIN      | ✅            | ❌            | ❌              |
| SUPERADMIN | ✅            | ✅            | ✅              |

### 2. Authentication & Authorization

```typescript
// RBAC Middleware (backend/src/middleware/rbac.ts)
requireAuth; // Must be logged in
requireAdmin; // Must be ADMIN or SUPERADMIN
requireSuperAdmin; // Must be SUPERADMIN
requireMFA; // Must have MFA enabled + recently verified
```

### 3. Audit Logging

Every policy change is logged with:

- **Who**: User ID + email + role
- **What**: Action (created/updated/deleted/enabled/disabled)
- **When**: Timestamp (UTC)
- **Where**: IP address + user agent
- **Why**: Mandatory reason field
- **Before/After**: Full JSON snapshots

### 4. Transport Security

- **HTTPS only** in production (HSTS header)
- **CSRF tokens** on all state-changing requests
- **Secure cookies**: `HttpOnly`, `Secure`, `SameSite=strict`
- **Security headers**: CSP, X-Frame-Options, X-Content-Type-Options

### 5. Input Validation

- **Zod schemas** for all request bodies
- **Sanitization** against XSS
- **SQL injection** prevention via Prisma parameterized queries
- **Rate limiting** on all admin endpoints

### 6. Anomaly Detection

Automated detection of:

- **Rapid changes**: >5 edits in 1 hour by same user
- **Unusual times**: Changes outside 6 AM - 10 PM
- **Critical actions**: Deletions and disables (Sentry alert)

---

## 🚀 Deployment Guide

### Step 1: Database Migration

```bash
cd backend

# Add new models to schema
npx prisma migrate dev --name add-alert-policies

# Generate Prisma client
npx prisma generate

# Verify migration
npx prisma studio
```

### Step 2: Seed Initial Policies

```typescript
// backend/prisma/seed-policies.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedPolicies() {
  const policies = [
    {
      routeGroup: "auth",
      threshold: 10,
      cooldown: 300000,
      mode: "IMMEDIATE",
      channels: ["email", "sms", "slack", "sentry"],
      severity: "CRITICAL",
      enabled: true,
      createdBy: "system",
      updatedBy: "system",
    },
    {
      routeGroup: "admin",
      threshold: 20,
      cooldown: 300000,
      mode: "IMMEDIATE",
      channels: ["email", "slack", "sentry"],
      severity: "HIGH",
      enabled: true,
      createdBy: "system",
      updatedBy: "system",
    },
    // Add more policies...
  ];

  for (const policy of policies) {
    await prisma.alertPolicy.upsert({
      where: { routeGroup: policy.routeGroup },
      update: policy,
      create: policy,
    });
  }

  console.log("✓ Policies seeded");
}

seedPolicies();
```

Run: `npx ts-node prisma/seed-policies.ts`

### Step 3: Register Routes

```typescript
// backend/src/index.ts
import alertPolicyRoutes from "./routes/alertPolicies.js";
import policyAuditRoutes from "./routes/policyAudit.js";
import { securityHeaders } from "./middleware/securityEnhanced.js";

// Apply security headers globally
app.use(securityHeaders);

// Register routes (AFTER authentication middleware)
app.use("/api/admin/alert-policies", alertPolicyRoutes);
app.use("/api/admin/policy-audit", policyAuditRoutes);
```

### Step 4: Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# SMTP (Email Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=alerts@example.com
EMAIL_PASSWORD=your-app-password
ALERT_EMAIL=admin@example.com

# Twilio (SMS Alerts)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
ALERT_FROM_PHONE=+1234567890
ALERT_TO_PHONE=+1987654321

# Slack (Webhook Alerts)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Teams (Webhook Alerts)
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# Security
NODE_ENV=production
SESSION_SECRET=your-strong-secret-here
CSRF_SECRET=another-strong-secret
```

### Step 5: Frontend Access

Navigate to: `https://your-domain.com/admin/alert-policies`

- **Admins**: Can view policies (read-only)
- **SuperAdmins**: Can view + edit + enable/disable policies

---

## 🧪 Testing

### Test RBAC

```bash
# Test as ADMIN (should see view-only mode)
curl -H "Authorization: Bearer <admin-token>" \
  https://api.example.com/api/admin/alert-policies

# Test as SUPERADMIN (should allow edits)
curl -X PUT \
  -H "Authorization: Bearer <superadmin-token>" \
  -H "Content-Type: application/json" \
  -d '{"threshold": 15, "reason": "Lowering threshold for testing"}' \
  https://api.example.com/api/admin/alert-policies/auth
```

### Test Audit Logging

```bash
# View all audit logs
curl -H "Authorization: Bearer <admin-token>" \
  https://api.example.com/api/admin/policy-audit

# View logs for specific policy
curl -H "Authorization: Bearer <admin-token>" \
  https://api.example.com/api/admin/policy-audit/policy/<policy-id>

# Detect anomalies
curl -H "Authorization: Bearer <admin-token>" \
  https://api.example.com/api/admin/policy-audit/anomalies
```

### Test Alert Flow

```bash
# Trigger rate limit (>10 requests to /api/auth/login in 1 minute)
for i in {1..15}; do
  curl -X POST https://api.example.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Check Redis cooldown keys
redis-cli KEYS "alert:cooldown:*"

# Verify alert sent via email/SMS/Slack
# Check Sentry for alert event
```

---

## 🔧 Maintenance

### Clear Rate Limits (Emergency)

```typescript
// Via API
POST /api/admin/rate-limits/clear
{
  "identifier": "user-123",
  "group": "auth"
}
```

### Rotate Secrets

```bash
# Generate new CSRF secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env and restart services
pm2 restart all
```

### Monitor Audit Logs

```sql
-- Most active admins (last 7 days)
SELECT user_email, COUNT(*) as changes
FROM policy_audit_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY user_email
ORDER BY changes DESC;

-- Deleted policies (critical events)
SELECT * FROM policy_audit_logs
WHERE action = 'deleted'
ORDER BY timestamp DESC;
```

---

## 📋 Checklist for Production

- [ ] **Database**
  - [ ] Migrations applied (`npx prisma migrate deploy`)
  - [ ] Initial policies seeded
  - [ ] Backups configured (daily)
- [ ] **Authentication**
  - [ ] MFA enforced for all admin accounts
  - [ ] Session timeouts configured (60 minutes)
  - [ ] CSRF tokens enabled
- [ ] **Authorization**
  - [ ] RBAC middleware applied to all admin routes
  - [ ] SuperAdmin accounts limited (≤3)
  - [ ] Regular access reviews scheduled (quarterly)
- [ ] **Transport Security**
  - [ ] HTTPS enforced (HSTS header)
  - [ ] TLS 1.2+ only
  - [ ] Security headers configured
- [ ] **Monitoring**
  - [ ] Sentry integration tested
  - [ ] Alert channels verified (email/SMS/Slack/Teams)
  - [ ] Audit log queries scheduled
- [ ] **Incident Response**
  - [ ] Playbook for policy breach documented
  - [ ] Emergency contacts updated
  - [ ] Rollback procedure tested

---

## 🚨 Incident Response

### Scenario 1: Unauthorized Policy Change

**Indicators**:

- Audit log shows unexpected policy edit
- Anomaly detection flags unusual activity
- Sentry alert for critical policy change

**Response**:

1. **Immediate**: Disable affected policy via admin UI
2. **Investigate**: Check audit log for user, IP, timestamp
3. **Rollback**: Restore policy from `changesBefore` JSON snapshot
4. **Secure**: Force logout of affected user, rotate credentials
5. **Report**: Document incident, notify security team

### Scenario 2: Credential Compromise

**Indicators**:

- Multiple failed login attempts
- Login from unusual IP/location
- Rapid policy changes by single user

**Response**:

1. **Lock account**: Disable user via admin panel
2. **Force logout**: Invalidate all sessions
3. **Rotate secrets**: Change CSRF tokens, session secrets
4. **Review logs**: Check for unauthorized access
5. **Notify**: Alert security team and affected user

---

## 📚 API Reference

See full API documentation in [ALERT_POLICY_API.md](./ALERT_POLICY_API.md)

Quick reference:

| Endpoint                                  | Method | Role       | Description         |
| ----------------------------------------- | ------ | ---------- | ------------------- |
| `/api/admin/alert-policies`               | GET    | ADMIN      | List all policies   |
| `/api/admin/alert-policies`               | POST   | SUPERADMIN | Create policy       |
| `/api/admin/alert-policies/:group`        | GET    | ADMIN      | Get specific policy |
| `/api/admin/alert-policies/:group`        | PUT    | SUPERADMIN | Update policy       |
| `/api/admin/alert-policies/:group`        | DELETE | SUPERADMIN | Delete policy       |
| `/api/admin/alert-policies/:group/toggle` | PATCH  | SUPERADMIN | Enable/disable      |
| `/api/admin/policy-audit`                 | GET    | ADMIN      | View audit logs     |
| `/api/admin/policy-audit/anomalies`       | GET    | ADMIN      | Detect anomalies    |

---

## ✅ Outcome

You now have:

- ✅ Database-backed alert policies (no redeploys needed)
- ✅ Visual admin UI for policy management
- ✅ RBAC protection (SuperAdmin-only edits)
- ✅ Tamper-evident audit logging
- ✅ Anomaly detection for suspicious activity
- ✅ Multi-channel alerts (email/SMS/Slack/Teams/WebSocket/Sentry)
- ✅ Security hardening against penetration
- ✅ Production-ready monitoring and incident response

---

## 🤝 Support

- **Documentation**: See `/docs/alert-system`
- **Issues**: Open GitHub issue with `[alert-policy]` tag
- **Security**: Email security@example.com for vulnerabilities

# 📋 Alert Policy Management - Complete Implementation Guide

## 🎯 What You Built

A **production-ready, secure alert policy management system** with:

✅ **Database-backed policies** (no redeploys needed)  
✅ **Visual admin UI** (React/Next.js with Tailwind)  
✅ **RBAC protection** (SuperAdmin-only edits)  
✅ **Tamper-evident audit logging** (every change tracked)  
✅ **Multi-channel alerts** (Email, SMS, Slack, Teams, WebSocket, Sentry)  
✅ **Security hardening** (MFA, CSRF, rate limiting, encryption)  
✅ **Anomaly detection** (suspicious patterns flagged)  
✅ **Incident response** (playbooks + rollback procedures)

---

## 📂 Documentation Index

### 🚀 Getting Started

1. **[ALERT_POLICY_SETUP.md](./ALERT_POLICY_SETUP.md)** - Quick setup guide

   - Database migration steps
   - Seed initial policies
   - Create SuperAdmin user
   - Test end-to-end flow
   - **Start here** if you're new to the system

2. **[ALERT_POLICY_MANAGEMENT.md](./ALERT_POLICY_MANAGEMENT.md)** - Full system documentation

   - Architecture overview
   - Database schema reference
   - API endpoint documentation
   - Frontend component guide
   - Production deployment checklist

3. **[SECURITY_HARDENING.md](./SECURITY_HARDENING.md)** - Security controls
   - Threat model and mitigations
   - Authentication & authorization
   - Transport & data protection
   - Audit logging & monitoring
   - Incident response playbooks

---

## 🗂️ File Structure

### Backend

```
backend/
├── prisma/
│   ├── schema.prisma                  # AlertPolicy + PolicyAuditLog models
│   └── seed-alert-policies.ts         # Initial policy seeding script
├── src/
│   ├── middleware/
│   │   ├── rbac.ts                    # Role-based access control (NEW)
│   │   └── securityEnhanced.ts        # Advanced security middleware (NEW)
│   ├── routes/
│   │   ├── alertPolicies.ts           # CRUD endpoints for policies (NEW)
│   │   └── policyAudit.ts             # Audit log endpoints (NEW)
│   └── services/
│       ├── alertService.ts            # Multi-channel alerts (UPDATED)
│       └── policyAuditService.ts      # Audit logging service (NEW)
```

### Frontend

```
frontend/
└── src/
    └── app/
        └── admin/
            └── alert-policies/
                └── page.tsx           # Admin UI for policy management (NEW)
```

### Documentation

```
root/
├── ALERT_POLICY_SETUP.md              # Quick setup guide
├── ALERT_POLICY_MANAGEMENT.md         # Full documentation
├── SECURITY_HARDENING.md              # Security controls
└── INDEX_ALERT_POLICIES.md            # This file
```

---

## 🔑 Key Features

### 1. Database-Backed Policies

**Before**: Policies hardcoded in `config/alertPolicy.ts`  
**After**: Policies stored in PostgreSQL `alert_policies` table

**Benefits**:

- Edit policies without redeploying
- Audit trail of all changes
- Role-based editing (SuperAdmins only)

**Usage**:

```sql
-- View policies
SELECT * FROM alert_policies;

-- Update threshold
UPDATE alert_policies
SET threshold = 15
WHERE route_group = 'auth';
```

---

### 2. Visual Admin UI

**URL**: `/admin/alert-policies`

**Features**:

- 📊 Table view of all policies
- ✏️ Inline editing (SuperAdmins)
- 🔒 Read-only mode (Admins)
- ⏸ Enable/disable toggles
- 📋 Audit log viewer
- 🎨 Color-coded severity badges

**Screenshots**:

- View-only mode (ADMIN role)
- Edit mode (SUPERADMIN role)
- Audit log timeline

---

### 3. RBAC Protection

**Role Hierarchy**:

```
SUPERADMIN > ADMIN > STAFF > USER
```

**Permissions**:
| Action | SUPERADMIN | ADMIN | STAFF | USER |
|--------|------------|-------|-------|------|
| View policies | ✅ | ✅ | ❌ | ❌ |
| Edit policies | ✅ | ❌ | ❌ | ❌ |
| Delete policies | ✅ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ |

**Enforcement**:

```typescript
// Backend route protection
router.put("/:group", requireSuperAdmin, async (req, res) => {
  // Only SuperAdmins reach this code
});

// Frontend UI control
{
  user.role === "SUPERADMIN" ? (
    <button onClick={startEdit}>✏️ Edit</button>
  ) : (
    <span>🔒 View Only</span>
  );
}
```

---

### 4. Tamper-Evident Audit Logging

**What's logged**:

- ✅ Who: User ID, email, role
- ✅ What: Action (created/updated/deleted/enabled/disabled)
- ✅ When: Timestamp (UTC)
- ✅ Where: IP address, user agent
- ✅ Why: Mandatory reason field
- ✅ Before/After: Full JSON snapshots

**Example**:

```json
{
  "id": "uuid",
  "policyId": "auth-policy-id",
  "action": "updated",
  "changedBy": "user-123",
  "userEmail": "admin@example.com",
  "userRole": "SUPERADMIN",
  "ipAddress": "192.168.1.1",
  "changesBefore": { "threshold": 10 },
  "changesAfter": { "threshold": 15 },
  "reason": "Lowering threshold for testing",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Query audit logs**:

```sql
-- Recent changes
SELECT * FROM policy_audit_logs
ORDER BY timestamp DESC
LIMIT 20;

-- Changes by specific user
SELECT * FROM policy_audit_logs
WHERE user_email = 'admin@example.com';

-- Deletions (critical events)
SELECT * FROM policy_audit_logs
WHERE action = 'deleted';
```

---

### 5. Multi-Channel Alerts

**Channels supported**:

- 📧 **Email** (SMTP/Gmail)
- 📱 **SMS** (Twilio)
- 💬 **Slack** (Webhooks)
- 👥 **Teams** (Webhooks)
- 🔔 **WebSocket** (Real-time dashboard)
- 🐛 **Sentry** (Error tracking)

**Configuration**:

```typescript
// Per-policy channel selection
{
  routeGroup: 'auth',
  channels: ['email', 'sms', 'slack', 'sentry'],
  severity: 'CRITICAL',
}
```

**Environment variables**:

```env
# Email
SMTP_HOST=smtp.gmail.com
EMAIL_USER=alerts@example.com
EMAIL_PASSWORD=your-app-password

# SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Teams
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
```

---

### 6. Security Hardening

**Controls implemented**:

- 🔐 **MFA enforcement** for SuperAdmins
- 🛡️ **CSRF protection** on all state-changing requests
- 🔒 **HTTPS enforced** with HSTS header
- 🚫 **Input sanitization** against XSS
- 📊 **Rate limiting** on admin endpoints
- 🔍 **Anomaly detection** (rapid changes, unusual times)
- 📝 **Audit logging** of all policy changes
- 🔑 **Secrets management** (no hardcoded keys)

**Security headers**:

```typescript
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'; ...
```

---

## 🚀 Quick Start (5 Minutes)

### 1. Database Migration

```bash
cd backend
npx prisma migrate dev --name add-alert-policies
npx prisma generate
```

### 2. Seed Policies

```bash
npx ts-node prisma/seed-alert-policies.ts
```

### 3. Create SuperAdmin

```sql
UPDATE users
SET role = 'SUPERADMIN'
WHERE email = 'your-admin-email@example.com';
```

### 4. Register Routes

**File**: `backend/src/index.ts`

```typescript
import alertPolicyRoutes from "./routes/alertPolicies.js";
import policyAuditRoutes from "./routes/policyAudit.js";

app.use("/api/admin/alert-policies", authenticateToken, alertPolicyRoutes);
app.use("/api/admin/policy-audit", authenticateToken, policyAuditRoutes);
```

### 5. Access Admin UI

```
http://localhost:3000/admin/alert-policies
```

Log in with SuperAdmin account → Edit policies visually!

---

## 🧪 Testing

### Test RBAC

```bash
# As ADMIN (should see view-only mode)
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:4000/api/admin/alert-policies

# As SUPERADMIN (should allow edits)
curl -X PUT \
  -H "Authorization: Bearer <superadmin-token>" \
  -H "Content-Type: application/json" \
  -d '{"threshold": 15, "reason": "Testing"}' \
  http://localhost:4000/api/admin/alert-policies/auth
```

### Test Alert Flow

```bash
# 1. Lower threshold for testing
# (Via admin UI: Set auth threshold to 3)

# 2. Trigger rate limit (4 failed logins)
for i in {1..4}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# 3. Check alerts sent
# - Email inbox
# - Slack channel
# - Sentry events

# 4. Verify cooldown (duplicates suppressed)
redis-cli KEYS "alert:cooldown:*"
```

### Test Audit Logging

```bash
# View audit logs
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:4000/api/admin/policy-audit

# Detect anomalies
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:4000/api/admin/policy-audit/anomalies
```

---

## 📊 API Reference

### Alert Policy Endpoints

| Endpoint                                  | Method | Role       | Description         |
| ----------------------------------------- | ------ | ---------- | ------------------- |
| `/api/admin/alert-policies`               | GET    | ADMIN      | List all policies   |
| `/api/admin/alert-policies`               | POST   | SUPERADMIN | Create policy       |
| `/api/admin/alert-policies/:group`        | GET    | ADMIN      | Get specific policy |
| `/api/admin/alert-policies/:group`        | PUT    | SUPERADMIN | Update policy       |
| `/api/admin/alert-policies/:group`        | DELETE | SUPERADMIN | Delete policy       |
| `/api/admin/alert-policies/:group/toggle` | PATCH  | SUPERADMIN | Enable/disable      |

### Audit Log Endpoints

| Endpoint                             | Method | Role  | Description                |
| ------------------------------------ | ------ | ----- | -------------------------- |
| `/api/admin/policy-audit`            | GET    | ADMIN | View all audit logs        |
| `/api/admin/policy-audit/policy/:id` | GET    | ADMIN | Logs for specific policy   |
| `/api/admin/policy-audit/user/:id`   | GET    | ADMIN | Logs for specific user     |
| `/api/admin/policy-audit/anomalies`  | GET    | ADMIN | Detect suspicious patterns |

**Request examples**: See [ALERT_POLICY_MANAGEMENT.md](./ALERT_POLICY_MANAGEMENT.md#api-reference)

---

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis
REDIS_URL=redis://localhost:6379

# Email Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=alerts@example.com
EMAIL_PASSWORD=your-app-password
ALERT_EMAIL=admin@example.com

# SMS Alerts (optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
ALERT_FROM_PHONE=+1234567890
ALERT_TO_PHONE=+1987654321

# Slack Alerts (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Teams Alerts (optional)
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...

# Sentry
SENTRY_DSN=https://...@sentry.io/...

# Security
NODE_ENV=production
SESSION_SECRET=your-strong-secret
CSRF_SECRET=another-strong-secret
```

---

## 🛡️ Production Checklist

- [ ] **Database**
  - [ ] Migrations applied (`prisma migrate deploy`)
  - [ ] Policies seeded
  - [ ] Backups configured (daily)
- [ ] **Authentication**
  - [ ] MFA enforced for all admin accounts
  - [ ] Session timeouts configured (60 min)
  - [ ] CSRF tokens enabled
- [ ] **Authorization**
  - [ ] RBAC middleware on all admin routes
  - [ ] SuperAdmin accounts limited (≤3)
  - [ ] Access reviews scheduled (quarterly)
- [ ] **Transport Security**
  - [ ] HTTPS enforced (HSTS)
  - [ ] TLS 1.2+ only
  - [ ] Security headers configured
- [ ] **Monitoring**
  - [ ] Sentry integration tested
  - [ ] Alert channels verified
  - [ ] Anomaly detection enabled
  - [ ] Grafana dashboard created
- [ ] **Incident Response**
  - [ ] Playbook documented
  - [ ] Emergency contacts updated
  - [ ] Rollback procedure tested

---

## 🚨 Troubleshooting

### "Policy not found in DB"

**Cause**: Policies not seeded or cache stale.

**Fix**:

```bash
npx ts-node prisma/seed-alert-policies.ts
pm2 restart all
```

---

### "Forbidden: SuperAdmin only"

**Cause**: User role is ADMIN, not SUPERADMIN.

**Fix**:

```sql
UPDATE users SET role = 'SUPERADMIN'
WHERE email = 'your-email@example.com';
```

---

### Alerts not sending

**Cause**: Missing environment variables.

**Fix**: Check `.env` has SMTP credentials, then test:

```bash
node -e "require('./src/services/alertService').sendAlert({identifier:'test',group:'auth',count:100})"
```

---

## 📚 Additional Resources

- **[ALERT_SYSTEM_GUIDE.md](./ALERT_SYSTEM_GUIDE.md)** - Original alert system docs
- **[ADMIN_PERMISSIONS_GUIDE.md](./ADMIN_PERMISSIONS_GUIDE.md)** - RBAC overview
- **[PRISMA_SETUP.md](./backend/PRISMA_SETUP.md)** - Database migration guide
- **[SENTRY_SETUP.md](./backend/SENTRY_SETUP.md)** - Error tracking setup

---

## ✅ Summary

You've built an **enterprise-grade alert policy management system** with:

1. **Visual admin UI** - Edit policies without touching code
2. **RBAC protection** - SuperAdmin-only edits, Admins can view
3. **Audit logging** - Tamper-evident trail of all changes
4. **Multi-channel alerts** - Email, SMS, Slack, Teams, WebSocket, Sentry
5. **Security hardening** - MFA, CSRF, HTTPS, rate limiting, anomaly detection
6. **Production-ready** - Monitoring, incident response, rollback procedures

**Next steps**:

1. Follow [ALERT_POLICY_SETUP.md](./ALERT_POLICY_SETUP.md) to deploy
2. Review [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) for production hardening
3. Test end-to-end flow per [Testing](#testing) section

**Questions?** See [ALERT_POLICY_MANAGEMENT.md](./ALERT_POLICY_MANAGEMENT.md) for comprehensive documentation.

---

**Built by**: GitHub Copilot  
**Date**: 2025-01-15  
**Version**: 1.0.0

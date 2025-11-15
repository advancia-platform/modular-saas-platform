# 🚀 Quick Setup Guide - Alert Policy Management

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Existing Advancia Pay backend + frontend

---

## Step-by-Step Setup

### 1. Update Database Schema

```bash
cd backend

# Run migration
npx prisma migrate dev --name add-alert-policies

# Generate Prisma client
npx prisma generate
```

**Expected output**:

```
✔ Generated Prisma Client (5.x.x) to ./node_modules/@prisma/client
```

---

### 2. Seed Initial Policies

```bash
# From backend/ directory
npx ts-node prisma/seed-alert-policies.ts
```

**Expected output**:

```
🌱 Seeding alert policies...
✓ Created policy for auth
✓ Created policy for admin
✓ Created policy for payments
✓ Created policy for crypto
✓ Created policy for api
✓ Created policy for user
✓ Created policy for public

🎉 Done! 7 policies created, 0 policies updated.
```

---

### 3. Verify Database

```bash
npx prisma studio
```

Navigate to `alert_policies` table → should see 7 rows.

---

### 4. Update Backend Routes

**File**: `backend/src/index.ts`

Add after authentication middleware:

```typescript
import alertPolicyRoutes from "./routes/alertPolicies.js";
import policyAuditRoutes from "./routes/policyAudit.js";
import { securityHeaders } from "./middleware/securityEnhanced.js";

// Apply security headers globally
app.use(securityHeaders);

// Register alert policy routes (after authenticateToken)
app.use("/api/admin/alert-policies", authenticateToken, alertPolicyRoutes);
app.use("/api/admin/policy-audit", authenticateToken, policyAuditRoutes);
```

---

### 5. Create SuperAdmin User

**Option A**: Via SQL (Quick)

```sql
UPDATE users
SET role = 'SUPERADMIN'
WHERE email = 'your-admin-email@example.com';
```

**Option B**: Via Admin Panel (Recommended)

1. Log in as existing ADMIN
2. Navigate to `/admin/users`
3. Find your user
4. Promote to SUPERADMIN

---

### 6. Test Backend API

```bash
# Get auth token (replace with your login endpoint)
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  | jq -r '.token')

# Test: List policies (should work for ADMIN + SUPERADMIN)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/alert-policies

# Test: Update policy (should work for SUPERADMIN only)
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"threshold": 15, "reason": "Testing policy update"}' \
  http://localhost:4000/api/admin/alert-policies/auth
```

**Expected responses**:

- List: `{"success":true,"policies":[...],"canEdit":true}`
- Update: `{"success":true,"policy":{...}}`

---

### 7. Install Frontend Dependencies

```bash
cd frontend

# Already installed (Next.js + React + Tailwind)
# Just verify versions:
npm list react react-hot-toast
```

---

### 8. Access Admin UI

1. **Start backend**:

   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend**:

   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to**: `http://localhost:3000/admin/alert-policies`

4. **Log in** with SUPERADMIN account

5. **You should see**:
   - Table with 7 policies
   - Edit buttons (enabled for SUPERADMIN)
   - Status toggles
   - Audit log button

---

### 9. Test Live Editing

1. Click **✏️ Edit** on any policy
2. Change threshold (e.g., `10` → `15`)
3. Enter reason: `"Testing policy update"`
4. Click **💾 Save**
5. Verify update in table
6. Check audit log: Click **📋 View Audit Log**

---

### 10. Verify Audit Logging

**Via API**:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/policy-audit
```

**Via Database**:

```sql
SELECT * FROM policy_audit_logs
ORDER BY timestamp DESC
LIMIT 10;
```

**Expected columns**:

- `action`: "updated"
- `user_email`: "admin@example.com"
- `changes_before`: JSON snapshot
- `changes_after`: JSON snapshot
- `reason`: "Testing policy update"

---

## 🧪 End-to-End Test

### Trigger Alert Flow

```bash
# 1. Set low threshold for testing
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"threshold": 3, "reason": "Testing alert flow"}' \
  http://localhost:4000/api/admin/alert-policies/auth

# 2. Trigger rate limit (4 failed logins)
for i in {1..4}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
  sleep 1
done

# 3. Check alert was sent
# - Email inbox (check ALERT_EMAIL)
# - Slack channel (if configured)
# - Sentry events (https://sentry.io)
# - Redis: redis-cli KEYS "alert:cooldown:*"

# 4. Verify cooldown (duplicate alert should be suppressed)
for i in {1..4}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
  sleep 1
done

# 5. Check logs (should see "Alert suppressed" message)
docker logs advancia-backend | grep "Alert suppressed"

# 6. Reset threshold
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"threshold": 10, "reason": "Restored production threshold"}' \
  http://localhost:4000/api/admin/alert-policies/auth
```

---

## ✅ Verification Checklist

- [ ] **Database**
  - [ ] `alert_policies` table exists (7 rows)
  - [ ] `policy_audit_logs` table exists (empty initially)
- [ ] **Backend**
  - [ ] Routes registered: `/api/admin/alert-policies`, `/api/admin/policy-audit`
  - [ ] Middleware: `requireSuperAdmin` working
  - [ ] RBAC: ADMIN can view, SUPERADMIN can edit
- [ ] **Frontend**
  - [ ] Page renders: `/admin/alert-policies`
  - [ ] Table shows 7 policies
  - [ ] Edit buttons visible for SUPERADMIN
  - [ ] "View Only" mode for ADMIN
- [ ] **Alerts**
  - [ ] Email alert received (check ALERT_EMAIL inbox)
  - [ ] Cooldown prevents duplicates (check logs)
  - [ ] Alert history stored in Redis
- [ ] **Audit**
  - [ ] Policy changes logged in `policy_audit_logs`
  - [ ] Sentry captures critical events
  - [ ] Anomaly detection works (run `/policy-audit/anomalies`)

---

## 🔧 Troubleshooting

### Issue: "Policy not found in DB"

**Cause**: Policies not seeded or cache stale.

**Fix**:

```bash
# Re-seed policies
npx ts-node prisma/seed-alert-policies.ts

# Restart backend
pm2 restart all
```

---

### Issue: "Forbidden: SuperAdmin only"

**Cause**: User role is ADMIN, not SUPERADMIN.

**Fix**:

```sql
UPDATE users
SET role = 'SUPERADMIN'
WHERE email = 'your-email@example.com';
```

Then log out and log back in.

---

### Issue: Alerts not sending

**Cause**: Missing environment variables.

**Fix**: Check `.env` file has:

```env
SMTP_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ALERT_EMAIL=admin@example.com
```

Test with:

```bash
node -e "require('./src/services/alertService').sendAlert({identifier:'test',group:'auth',count:100})"
```

---

### Issue: Frontend shows "View Only"

**Cause**: User role is ADMIN (correct behavior) or backend not returning `canEdit`.

**Verify**:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/admin/alert-policies \
  | jq '.canEdit'

# Should return: true (for SUPERADMIN) or false (for ADMIN)
```

---

## 📚 Next Steps

1. **Configure Alert Channels**:

   - [Email Setup](./ALERT_SYSTEM_GUIDE.md#email-configuration)
   - [SMS Setup](./ALERT_SYSTEM_GUIDE.md#sms-twilio-configuration)
   - [Slack Setup](./ALERT_SYSTEM_GUIDE.md#slack-webhook-configuration)
   - [Teams Setup](./ALERT_SYSTEM_GUIDE.md#teams-webhook-configuration)

2. **Production Hardening**:

   - Enable MFA for all admin accounts
   - Configure HTTPS with HSTS
   - Set up rate limiting on admin endpoints
   - Review [Security Checklist](./ALERT_POLICY_MANAGEMENT.md#checklist-for-production)

3. **Monitoring**:

   - Set up Sentry alerts for critical policy changes
   - Schedule weekly audit log reviews
   - Configure anomaly detection alerts

4. **Team Training**:
   - Share [Alert Policy Management Guide](./ALERT_POLICY_MANAGEMENT.md)
   - Document your org's policy change procedures
   - Run tabletop exercise for incident response

---

## 🎉 Success!

You now have a production-ready, secure alert policy management system with:

- ✅ Visual admin UI
- ✅ RBAC protection
- ✅ Tamper-evident audit logging
- ✅ Multi-channel alerts
- ✅ Database-backed configuration

**Questions?** See [ALERT_POLICY_MANAGEMENT.md](./ALERT_POLICY_MANAGEMENT.md) for full documentation.

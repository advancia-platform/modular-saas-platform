# OAL (Object-Action-Location) Audit System

## 📋 Overview

The OAL model provides comprehensive audit logging for tracking sensitive operations in Advancia Pay Ledger. It follows an approval workflow pattern where admin actions can be tracked as PENDING, APPROVED, or REJECTED.

## 🗄️ Database Schema

```prisma
model OAL {
  id         String    @id @default(cuid())
  object     String    // e.g., "ledger.balance", "user.role", "system.config"
  action     String    // e.g., "adjust", "create", "delete", "update"
  location   String    // e.g., "admin.panel", "api.endpoint", "cron.job"

  subjectId  String?   // User ID the action concerns
  metadata   Json?     // Additional context (delta, reason, old/new values)
  status     OALStatus @default(PENDING)

  createdById String   // Admin who initiated
  updatedById String?  // Admin who approved/rejected
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([object])
  @@index([action])
  @@index([location])
  @@index([status])
  @@index([createdById])
  @@index([subjectId])
  @@index([createdAt])
  @@map("oal_audit_log")
}

enum OALStatus {
  PENDING   // Awaiting approval
  APPROVED  // Action approved and executed
  REJECTED  // Action rejected
}
```

## 📡 API Endpoints

All endpoints require admin authentication (`authenticateToken` + `requireAdmin`).

### 1. Get Audit Logs

```http
GET /api/oal
```

**Query Parameters:**

- `object` - Filter by object (e.g., "ledger.balance")
- `action` - Filter by action (e.g., "adjust")
- `location` - Filter by location (e.g., "admin.panel")
- `status` - Filter by status (PENDING, APPROVED, REJECTED)
- `createdById` - Filter by creator
- `subjectId` - Filter by subject user
- `limit` - Results limit (default: 100)
- `offset` - Results offset (default: 0)

**Response:**

```json
{
  "success": true,
  "count": 10,
  "logs": [
    {
      "id": "cm...",
      "object": "ledger.balance",
      "action": "adjust",
      "location": "admin.panel",
      "subjectId": "user_123",
      "metadata": { "delta": 50, "currency": "USD", "reason": "bonus" },
      "status": "APPROVED",
      "createdById": "admin_1",
      "updatedById": "admin_2",
      "createdAt": "2025-10-22T...",
      "updatedAt": "2025-10-22T..."
    }
  ]
}
```

### 2. Get Single Log

```http
GET /api/oal/:id
```

**Response:**

```json
{
  "success": true,
  "log": { ... }
}
```

### 3. Create Audit Log

```http
POST /api/oal
```

**Body:**

```json
{
  "object": "ledger.balance",
  "action": "adjust",
  "location": "admin.panel",
  "subjectId": "user_123",
  "metadata": { "delta": 50, "currency": "USD", "reason": "bonus" },
  "status": "PENDING" // Optional, defaults to PENDING
}
```

**Response:**

```json
{
  "success": true,
  "log": { ... }
}
```

### 4. Update Status

```http
PATCH /api/oal/:id/status
```

**Body:**

```json
{
  "status": "APPROVED" // APPROVED, REJECTED, or PENDING
}
```

**Response:**

```json
{
  "success": true,
  "log": { ... }
}
```

### 5. Log Balance Adjustment (Helper)

```http
POST /api/oal/balance-adjustment
```

**Body:**

```json
{
  "userId": "user_123",
  "currency": "USD",
  "delta": 50,
  "reason": "Promotional bonus"
}
```

**Response:**

```json
{
  "success": true,
  "log": { ... }
}
```

## 🔧 Service Layer Usage

### Import

```typescript
import {
  createOALLog,
  updateOALStatus,
  getOALLogs,
  getOALLogById,
  logBalanceAdjustment,
  logRoleChange,
  logConfigChange,
} from "../services/oalService";
```

### Create Custom Log

```typescript
const log = await createOALLog({
  object: "ledger.balance",
  action: "adjust",
  location: "admin.panel",
  subjectId: userId,
  metadata: { delta: 50, currency: "USD", reason: "bonus" },
  createdById: adminId,
});
```

### Log Balance Adjustment

```typescript
const log = await logBalanceAdjustment({
  userId: "user_123",
  adminId: "admin_1",
  currency: "USD",
  delta: 50,
  reason: "Promotional bonus",
  location: "admin.api", // Optional, defaults to 'admin.panel'
});
```

### Log Role Change

```typescript
const log = await logRoleChange({
  userId: "user_456",
  adminId: "admin_1",
  oldRole: "USER",
  newRole: "ADMIN",
  reason: "Promoted for excellent support",
});
```

### Log Config Change

```typescript
const log = await logConfigChange({
  adminId: "admin_1",
  configKey: "max_withdrawal_limit",
  oldValue: 10000,
  newValue: 50000,
});
```

### Approve/Reject Log

```typescript
const log = await updateOALStatus({
  id: "cm...",
  status: "APPROVED",
  updatedById: "admin_2",
});
```

### Query Logs

```typescript
const logs = await getOALLogs({
  object: "ledger.balance",
  status: "PENDING",
  limit: 50,
});
```

## 🎯 Common Use Cases

### 1. Balance Adjustments

Track manual balance modifications by admins:

```typescript
await logBalanceAdjustment({
  userId: user.id,
  adminId: req.user.userId,
  currency: "USD",
  delta: amount,
  reason: "Compensation for failed transaction",
});
```

### 2. Role Changes

Track user role promotions/demotions:

```typescript
await logRoleChange({
  userId: user.id,
  adminId: req.user.userId,
  oldRole: user.role,
  newRole: "ADMIN",
  reason: "Promoted to moderator role",
});
```

### 3. System Configuration

Track critical config changes:

```typescript
await logConfigChange({
  adminId: req.user.userId,
  configKey: "maintenance_mode",
  oldValue: false,
  newValue: true,
});
```

### 4. Approval Workflow

Implement two-step verification for sensitive actions:

```typescript
// Step 1: Create pending log
const log = await createOALLog({
  object: "ledger.balance",
  action: "adjust",
  location: "admin.panel",
  subjectId: userId,
  metadata: { delta: 1000, currency: "USD", reason: "Large adjustment" },
  createdById: adminId,
  status: "PENDING",
});

// Step 2: Senior admin approves
const approved = await updateOALStatus({
  id: log.id,
  status: "APPROVED",
  updatedById: seniorAdminId,
});

// Step 3: Execute the actual action
if (approved.status === "APPROVED") {
  await executeBalanceAdjustment(userId, 1000);
}
```

## 📊 Naming Conventions

### Object Patterns

- `ledger.balance` - Financial ledger operations
- `user.role` - User role changes
- `user.status` - User account status
- `system.config` - System configuration
- `transaction.reversal` - Transaction reversals
- `withdrawal.limit` - Withdrawal limit changes

### Action Patterns

- `create` - Creating new records
- `update` - Updating existing records
- `delete` - Deleting records
- `adjust` - Financial adjustments
- `approve` - Approvals
- `reject` - Rejections
- `suspend` - Suspensions
- `restore` - Restorations

### Location Patterns

- `admin.panel` - Admin dashboard actions
- `admin.api` - Admin API calls
- `cron.job` - Scheduled job actions
- `api.endpoint` - Public API actions
- `support.ticket` - Support-initiated actions

## 🧪 Testing

Run the test script:

```bash
cd backend
npx tsx scripts/test-oal.ts
```

Example test output:

```
🧪 Testing OAL Model...

✅ Created balance adjustment log:
{
  "id": "cm...",
  "object": "ledger.balance",
  "action": "adjust",
  "metadata": { "delta": 50, "currency": "USD", "reason": "bonus" },
  "status": "PENDING",
  ...
}

✅ Created role change log
✅ Found 4 OAL logs in database
✅ Updated log status
🎉 All tests passed!
```

## 🔒 Security Considerations

1. **Admin-Only Access**: All OAL endpoints require admin authentication
2. **Immutable History**: Never delete OAL logs - they're the audit trail
3. **Metadata Validation**: Sanitize metadata before storing
4. **Approval Workflow**: Use PENDING status for actions requiring dual approval
5. **Rate Limiting**: Applied via global middleware on `/api/**`

## 📈 Database Indexes

Optimized for common queries:

- `@@index([object])` - Filter by object type
- `@@index([action])` - Filter by action type
- `@@index([location])` - Filter by location
- `@@index([status])` - Filter by status
- `@@index([createdById])` - Track admin actions
- `@@index([subjectId])` - Find logs for specific users
- `@@index([createdAt])` - Chronological queries

## 🚀 Migration

Migration file: `backend/prisma/migrations/20251022210717_add_oal_model/migration.sql`

Apply with:

```bash
cd backend
npx prisma migrate deploy  # Production
npx prisma migrate dev     # Development
```

## 📝 Example Workflow

```typescript
// In your admin balance adjustment endpoint
router.post(
  "/admin/users/:userId/adjust-balance",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { userId } = req.params;
    const { currency, amount, reason } = req.body;
    const adminId = req.user.userId;

    // 1. Create audit log
    const log = await logBalanceAdjustment({
      userId,
      adminId,
      currency,
      delta: amount,
      reason,
      location: "admin.api",
    });

    // 2. Execute the adjustment
    await adjustUserBalance(userId, currency, amount);

    // 3. Approve the log
    await updateOALStatus({
      id: log.id,
      status: "APPROVED",
      updatedById: adminId,
    });

    res.json({ success: true, log });
  }
);
```

---

**Created:** October 22, 2025  
**Migration:** 20251022210717_add_oal_model  
**Table:** `oal_audit_log`  
**API:** `/api/oal`

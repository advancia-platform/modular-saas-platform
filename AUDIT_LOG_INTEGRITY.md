# 🔐 Tamper-Evident Audit Logs - Implementation Guide

## Overview

The alert policy management system now includes **tamper-evident audit logging** using SHA-256 hash chains. This makes it cryptographically impossible to modify past audit entries without detection.

---

## 🔗 How Hash Chains Work

### Concept

Each audit log entry stores:

1. **entryHash**: SHA-256 hash of its own contents
2. **prevHash**: Hash of the previous entry in the chain

If anyone modifies a past entry, its hash changes, breaking the chain.

### Example

```
Entry 1:
  data: {action: "created", user: "admin@example.com", ...}
  prevHash: "genesis"
  entryHash: sha256(data + "genesis") = "abc123..."

Entry 2:
  data: {action: "updated", user: "superadmin@example.com", ...}
  prevHash: "abc123..."
  entryHash: sha256(data + "abc123...") = "def456..."

Entry 3:
  data: {action: "deleted", user: "superadmin@example.com", ...}
  prevHash: "def456..."
  entryHash: sha256(data + "def456...") = "ghi789..."
```

**If Entry 2 is modified**:

- Its hash changes from `def456...` to something else
- Entry 3's `prevHash` still expects `def456...`
- **Chain broken** ❌ Tampering detected!

---

## 📊 Database Schema

### New Fields in `policy_audit_logs`

```sql
ALTER TABLE policy_audit_logs
ADD COLUMN entry_hash VARCHAR(64),
ADD COLUMN prev_hash VARCHAR(64),
ADD COLUMN signature TEXT;

CREATE INDEX idx_entry_hash ON policy_audit_logs(entry_hash);
```

**Fields**:

- `entry_hash`: SHA-256 hash (64 hex chars) of this entry + prev_hash
- `prev_hash`: Hash of previous entry ("genesis" for first entry)
- `signature`: Digital signature (optional, for enhanced security)

---

## 🔐 Hash Computation

**Input to hash**:

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "action": "updated",
  "changedBy": "user-123",
  "policyId": "policy-456",
  "changesBefore": { "threshold": 10 },
  "changesAfter": { "threshold": 15 },
  "prevHash": "abc123..."
}
```

**Output**:

```
SHA-256(JSON.stringify(input)) = "def456..."
```

---

## 🛠️ Implementation

### 1. Database Migration

```bash
cd backend
npx prisma migrate dev --name add-audit-hash-chain
npx prisma generate
```

### 2. Verify Schema Update

```bash
npx prisma studio
```

Navigate to `policy_audit_logs` table → should see `entryHash`, `prevHash`, `signature` columns.

---

### 3. Automatic Hash Generation

Every policy change now automatically:

1. Gets the last entry's hash
2. Computes new hash (entry + prevHash)
3. Stores entry with hash chain

**Code** (`backend/src/services/policyAuditService.ts`):

```typescript
// Get previous entry hash
const prevHash = await getLastEntryHash(); // "abc123..." or "genesis"

// Create entry data
const entryData = {
  policyId: data.policyId,
  action: data.action,
  changedBy: data.changedBy,
  // ... other fields
  timestamp: new Date(),
};

// Compute hash
const entryHash = computeEntryHash(entryData, prevHash);

// Store with hash chain
await prisma.policyAuditLog.create({
  data: {
    ...entryData,
    entryHash,
    prevHash,
  },
});
```

---

### 4. Integrity Verification

**API Endpoint**: `GET /api/admin/policy-audit/verify-integrity`

**Response**:

```json
{
  "success": true,
  "valid": true,
  "totalEntries": 47,
  "errors": [],
  "message": "Audit log integrity verified"
}
```

**If tampering detected**:

```json
{
  "success": true,
  "valid": false,
  "totalEntries": 47,
  "errors": [
    "Entry abc-123 has invalid prevHash (expected: def456, got: xyz789)",
    "Entry abc-124 has invalid hash (expected: ghi789, got: jkl012)"
  ],
  "message": "⚠️ TAMPERING DETECTED - audit log has been modified"
}
```

---

## 🧪 Testing

### Manual Verification

```bash
# 1. Make a policy change (via admin UI or API)
curl -X PUT http://localhost:4000/api/admin/alert-policies/auth \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"threshold": 15, "reason": "Testing hash chain"}'

# 2. Verify integrity
curl http://localhost:4000/api/admin/policy-audit/verify-integrity \
  -H "Authorization: Bearer <token>"

# Expected: {"valid": true, "totalEntries": 1, "errors": []}
```

---

### Simulate Tampering (Test Environment Only!)

```sql
-- WARNING: This breaks the hash chain (for testing only)
UPDATE policy_audit_logs
SET changes_after = '{"threshold": 999}'
WHERE id = '<some-entry-id>';

-- Now verify integrity
-- Expected: {"valid": false, "errors": ["Entry ... has invalid hash"]}
```

---

### Automated Testing

Run the integration test:

```bash
node backend/test-alert-flow.js
```

Test includes:

- ✅ Rate limit triggering
- ✅ Alert sending
- ✅ Cooldown verification
- ✅ **Audit log integrity check**

---

## 🔒 Security Properties

### What This Prevents

✅ **Modification of past entries**: Hash changes → chain breaks  
✅ **Deletion of entries**: Missing entry → chain breaks  
✅ **Insertion of fake entries**: prevHash mismatch → chain breaks  
✅ **Reordering entries**: Timestamps + hashes don't match → chain breaks

### What This Does NOT Prevent

❌ **Deletion of entire table**: Use database backups + access controls  
❌ **Database admin access**: Use least-privilege IAM + audit DB access  
❌ **Replay attacks**: Use timestamps + rate limiting

---

## 🔐 Enhanced Security (Optional)

### Digital Signatures

For **maximum security**, add digital signatures:

```typescript
import crypto from "crypto";

// Generate key pair (once, store private key securely)
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

// Sign entry hash
const signature = crypto.sign("sha256", Buffer.from(entryHash), {
  key: privateKey,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
});

// Store signature in database
await prisma.policyAuditLog.create({
  data: {
    ...entryData,
    entryHash,
    prevHash,
    signature: signature.toString("base64"),
  },
});

// Verify signature
const isValid = crypto.verify(
  "sha256",
  Buffer.from(entryHash),
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  },
  Buffer.from(signature, "base64")
);
```

**Benefits**:

- Proves authenticity (only private key holder can sign)
- Even DB admin cannot forge entries without private key

**Drawbacks**:

- More complex key management
- Performance overhead (sign/verify operations)

---

## 📋 Operational Procedures

### Daily Integrity Checks

**Cron job** (recommended):

```bash
# /etc/cron.daily/verify-audit-integrity
#!/bin/bash
curl -s http://localhost:4000/api/admin/policy-audit/verify-integrity \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.valid' | grep -q true || {
    echo "⚠️ AUDIT LOG TAMPERING DETECTED" | mail -s "CRITICAL: Audit Log Alert" security@example.com
  }
```

**Kubernetes CronJob**:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: audit-integrity-check
spec:
  schedule: "0 2 * * *" # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: verify-integrity
              image: curlimages/curl:latest
              command:
                - /bin/sh
                - -c
                - |
                  curl -s http://backend:4000/api/admin/policy-audit/verify-integrity \
                    -H "Authorization: Bearer $ADMIN_TOKEN" \
                    | grep -q '"valid":true' || exit 1
          restartPolicy: OnFailure
```

---

### Incident Response

**If tampering detected**:

1. **Immediately**:

   - Lock down database access (revoke credentials)
   - Preserve current database state (snapshot)
   - Alert security team + management

2. **Investigate**:

   - Check database access logs (who modified?)
   - Review application logs (any unauthorized access?)
   - Identify which entries were tampered with

3. **Restore**:

   - Restore from last known-good backup
   - Re-verify integrity after restore
   - Implement additional access controls

4. **Post-Incident**:
   - Rotate database credentials
   - Review IAM permissions (least privilege)
   - Implement digital signatures (if not already)
   - Update runbook with lessons learned

---

## 🎯 Best Practices

### Database Access

- ✅ **Read-only replicas** for reporting
- ✅ **Separate service accounts** (app vs admin)
- ✅ **No direct DB access** for developers (use admin UI)
- ✅ **Audit all DB queries** (PostgreSQL logs)

### Backup Strategy

- ✅ **Daily backups** with retention (30 days)
- ✅ **Encrypted backups** (AES-256)
- ✅ **Offsite storage** (S3 with versioning)
- ✅ **Test restores** monthly

### Monitoring

- ✅ **Daily integrity checks** (cron job)
- ✅ **Alert on failures** (email/Slack/PagerDuty)
- ✅ **Dashboard metrics** (Grafana)
- ✅ **Sentry integration** (for critical events)

---

## 📊 Performance Considerations

### Hash Computation

**Benchmark** (Node.js crypto module):

- SHA-256 hash: ~0.1ms per entry
- Negligible overhead for audit logging

**Optimization**:

- Hash computed once during insert (not on every read)
- Integrity verification runs daily (not on every request)

### Database Impact

**Storage**:

- `entry_hash`: 64 bytes per entry
- `prev_hash`: 64 bytes per entry
- **Total**: 128 bytes overhead (~0.1 KB)

**Queries**:

- Index on `entry_hash` for fast lookups
- Verification queries sequential (acceptable for daily checks)

---

## ✅ Verification Checklist

- [ ] **Schema migrated**: `entry_hash`, `prev_hash`, `signature` columns exist
- [ ] **Automatic hashing**: New entries include hash chain
- [ ] **Integrity endpoint**: `/verify-integrity` returns valid status
- [ ] **Daily checks**: Cron job or CronJob scheduled
- [ ] **Alerting**: Security team notified on tampering
- [ ] **Backups**: Daily encrypted backups with offsite storage
- [ ] **Access controls**: Database access limited to service account
- [ ] **Documentation**: Team trained on audit log procedures

---

## 🤝 Support

- **Questions**: See [ALERT_POLICY_MANAGEMENT.md](./ALERT_POLICY_MANAGEMENT.md)
- **Issues**: Open GitHub issue with `[audit-log]` tag
- **Security**: Email security@example.com for vulnerabilities

---

**Last Updated**: 2025-01-15  
**Next Review**: 2025-04-15 (Quarterly)

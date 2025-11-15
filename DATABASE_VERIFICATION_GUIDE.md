# Database Verification Guide - Lockout Policy & 2FA

This guide provides SQL queries to verify the lockout policy and 2FA behavior at the database level.

---

## 🔌 Connect to Database

### Using Docker (Recommended)

```bash
docker exec -it advancia-postgres psql -U postgres -d advvancia
```

### Using psql Directly

```bash
psql -h localhost -U postgres -d advvancia
```

### Windows PowerShell

```powershell
docker exec -it advancia-postgres psql -U postgres -d advvancia
```

---

## 📊 Verification Queries

### 1. Check Initial State (Before Testing)

```sql
-- View admin user security columns
SELECT
    email,
    failed_attempts,
    locked_until,
    last_login_at,
    totp_enabled,
    totp_verified,
    created_at,
    updated_at
FROM users
WHERE email = 'admin@advvancia.com';
```

**Expected Initial State:**

- `failed_attempts`: `0`
- `locked_until`: `NULL`
- `last_login_at`: `NULL` (or timestamp of last login)
- `totp_enabled`: `true`
- `totp_verified`: `true`

---

### 2. Monitor Failed Login Attempts

Run this query **after each failed login attempt**:

```sql
-- Check failed attempts counter
SELECT
    email,
    failed_attempts,
    locked_until,
    CASE
        WHEN locked_until IS NULL THEN 'Account Active'
        WHEN locked_until > NOW() THEN 'Account Locked'
        ELSE 'Lock Expired'
    END as lock_status,
    locked_until - NOW() as time_remaining
FROM users
WHERE email = 'admin@advvancia.com';
```

**Expected Progression:**

- After attempt 1: `failed_attempts = 1`, `locked_until = NULL`
- After attempt 2: `failed_attempts = 2`, `locked_until = NULL`
- After attempt 3: `failed_attempts = 3`, `locked_until = NULL`
- After attempt 4: `failed_attempts = 4`, `locked_until = NULL`
- After attempt 5: `failed_attempts = 5`, `locked_until = NOW() + 15 minutes`

---

### 3. Verify Lockout Activation

```sql
-- Detailed lockout status
SELECT
    email,
    failed_attempts,
    locked_until,
    locked_until AT TIME ZONE 'UTC' as locked_until_utc,
    NOW() as current_time,
    EXTRACT(EPOCH FROM (locked_until - NOW())) / 60 as minutes_remaining
FROM users
WHERE email = 'admin@advvancia.com';
```

**Expected After 5 Failed Attempts:**

- `failed_attempts`: `5`
- `locked_until`: Timestamp approximately 15 minutes in the future
- `minutes_remaining`: ~15 (gradually decreases)

---

### 4. Verify Successful Login (After Lockout Expires)

Run this query **after successful TOTP login**:

```sql
-- Check reset after successful login
SELECT
    email,
    failed_attempts,
    locked_until,
    last_login_at,
    last_login_at AT TIME ZONE 'UTC' as last_login_utc,
    AGE(NOW(), last_login_at) as time_since_login
FROM users
WHERE email = 'admin@advvancia.com';
```

**Expected After Successful Login:**

- `failed_attempts`: `0` (RESET)
- `locked_until`: `NULL` (CLEARED)
- `last_login_at`: Recent timestamp (just now)

---

### 5. Verify Backup Codes

#### View Backup Codes (Hashed)

```sql
-- Check backup codes array
SELECT
    email,
    jsonb_array_length(backup_codes) as total_backup_codes,
    jsonb_pretty(backup_codes) as backup_codes_hashed
FROM users
WHERE email = 'admin@advvancia.com';
```

**Expected:**

- `total_backup_codes`: `5` (initially)
- Each code is a bcrypt hash starting with `$2b$12$`

#### After Using One Backup Code

```sql
-- Check remaining backup codes
SELECT
    email,
    jsonb_array_length(backup_codes) as remaining_codes,
    backup_codes
FROM users
WHERE email = 'admin@advvancia.com';
```

**Expected:**

- `remaining_codes`: `4` (one less)
- The used code should be removed from the array

---

### 6. Check TOTP Configuration

```sql
-- Verify 2FA setup
SELECT
    email,
    totp_secret,
    totp_enabled,
    totp_verified,
    LENGTH(totp_secret) as secret_length
FROM users
WHERE email = 'admin@advvancia.com';
```

**Expected:**

- `totp_secret`: 32-character base32 string (e.g., `LBBCQ32QOUZEKZSBNFYD6YRMLZMGYPS3`)
- `totp_enabled`: `true`
- `totp_verified`: `true`
- `secret_length`: `32`

---

### 7. View All Security-Related Columns

```sql
-- Complete security audit view
SELECT
    id,
    email,
    role,
    failed_attempts,
    CASE
        WHEN locked_until IS NULL THEN 'No'
        WHEN locked_until > NOW() THEN 'Yes - Active'
        ELSE 'No - Expired'
    END as is_locked,
    locked_until,
    last_login_at,
    totp_enabled,
    totp_verified,
    jsonb_array_length(backup_codes) as backup_codes_count,
    created_at,
    updated_at
FROM users
WHERE email = 'admin@advvancia.com';
```

---

## 🧪 Complete Test Workflow

### Step 1: Record Initial State

```sql
\x on  -- Enable expanded display
SELECT * FROM users WHERE email = 'admin@advvancia.com';
```

### Step 2: Run Failed Login Tests

Execute `test-lockout.ps1` script, then check:

```sql
SELECT email, failed_attempts, locked_until
FROM users
WHERE email = 'admin@advvancia.com';
```

### Step 3: Manually Unlock (Optional for Testing)

```sql
-- Manual unlock for quick testing
UPDATE users
SET failed_attempts = 0, locked_until = NULL
WHERE email = 'admin@advvancia.com';

-- Verify unlock
SELECT email, failed_attempts, locked_until
FROM users
WHERE email = 'admin@advvancia.com';
```

### Step 4: Test Successful Login

After successful TOTP login via API, verify reset:

```sql
SELECT
    email,
    failed_attempts,
    locked_until,
    last_login_at
FROM users
WHERE email = 'admin@advvancia.com';
```

### Step 5: Test Backup Code Usage

After using a backup code, verify removal:

```sql
-- Before using backup code
SELECT email, jsonb_array_length(backup_codes) as count_before
FROM users
WHERE email = 'admin@advvancia.com';

-- [Use backup code via API]

-- After using backup code
SELECT email, jsonb_array_length(backup_codes) as count_after
FROM users
WHERE email = 'admin@advvancia.com';
```

---

## 🔍 Advanced Queries

### Monitor All Users' Lockout Status

```sql
SELECT
    email,
    failed_attempts,
    CASE
        WHEN locked_until IS NULL THEN '✓ Active'
        WHEN locked_until > NOW() THEN '✗ Locked'
        ELSE '⚠ Lock Expired'
    END as status,
    locked_until,
    last_login_at
FROM users
ORDER BY failed_attempts DESC, email;
```

### Find All Locked Accounts

```sql
SELECT
    email,
    failed_attempts,
    locked_until,
    EXTRACT(EPOCH FROM (locked_until - NOW())) / 60 as minutes_remaining
FROM users
WHERE locked_until > NOW()
ORDER BY locked_until DESC;
```

### Audit Trail Query

```sql
SELECT
    email,
    failed_attempts as failed_login_attempts,
    locked_until as locked_until_timestamp,
    last_login_at as last_successful_login,
    totp_enabled as has_2fa,
    jsonb_array_length(backup_codes) as remaining_backup_codes,
    created_at as account_created,
    updated_at as last_modified
FROM users
WHERE role = 'admin'
ORDER BY last_login_at DESC NULLS LAST;
```

---

## 🛠 Troubleshooting Commands

### Reset Lockout for Specific User

```sql
UPDATE users
SET
    failed_attempts = 0,
    locked_until = NULL
WHERE email = 'admin@advvancia.com';
```

### Reset All Lockouts (Emergency)

```sql
UPDATE users
SET
    failed_attempts = 0,
    locked_until = NULL
WHERE locked_until IS NOT NULL;
```

### Regenerate Backup Codes (Example - Manual Process)

```sql
-- Note: This should be done via API with proper bcrypt hashing
-- This is just for demonstration
UPDATE users
SET backup_codes = '[]'::jsonb
WHERE email = 'admin@advvancia.com';

-- Then seed new codes via backend seed script
```

### Disable 2FA (Emergency Admin Access)

```sql
-- ONLY FOR EMERGENCY USE
UPDATE users
SET
    totp_enabled = false,
    totp_verified = false
WHERE email = 'admin@advvancia.com';
```

### Re-enable 2FA

```sql
UPDATE users
SET
    totp_enabled = true,
    totp_verified = true
WHERE email = 'admin@advvancia.com';
```

---

## 📈 Monitoring Queries for Production

### Daily Security Report

```sql
-- Summary of security events
SELECT
    COUNT(*) FILTER (WHERE failed_attempts > 0) as accounts_with_failed_attempts,
    COUNT(*) FILTER (WHERE locked_until > NOW()) as currently_locked_accounts,
    COUNT(*) FILTER (WHERE totp_enabled = true) as accounts_with_2fa,
    MAX(failed_attempts) as max_failed_attempts,
    COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '24 hours') as logins_last_24h
FROM users;
```

### Recent Failed Login Attempts

```sql
SELECT
    email,
    failed_attempts,
    updated_at as last_attempt
FROM users
WHERE failed_attempts > 0
ORDER BY updated_at DESC
LIMIT 10;
```

### Backup Code Usage Tracking

```sql
SELECT
    email,
    jsonb_array_length(backup_codes) as remaining_codes,
    5 - jsonb_array_length(backup_codes) as codes_used,
    last_login_at
FROM users
WHERE totp_enabled = true
  AND jsonb_array_length(backup_codes) < 5
ORDER BY jsonb_array_length(backup_codes) ASC;
```

---

## 🎯 Expected Test Results Summary

| Test Phase        | Failed Attempts | Locked Until | Last Login  | Backup Codes |
| ----------------- | --------------- | ------------ | ----------- | ------------ |
| Initial State     | 0               | NULL         | NULL or old | 5            |
| After 1st fail    | 1               | NULL         | NULL or old | 5            |
| After 2nd fail    | 2               | NULL         | NULL or old | 5            |
| After 3rd fail    | 3               | NULL         | NULL or old | 5            |
| After 4th fail    | 4               | NULL         | NULL or old | 5            |
| After 5th fail    | 5               | NOW + 15min  | NULL or old | 5            |
| After TOTP login  | 0               | NULL         | NOW         | 5            |
| After backup code | 0               | NULL         | NOW         | 4            |

---

## 💡 Tips

1. **Use `\x on`** in psql for expanded display (better for viewing wide rows)
2. **Use `\timing`** in psql to see query execution time
3. **Create a view** for frequently used security queries:

```sql
CREATE OR REPLACE VIEW user_security_status AS
SELECT
    email,
    failed_attempts,
    CASE
        WHEN locked_until IS NULL THEN 'Active'
        WHEN locked_until > NOW() THEN 'Locked'
        ELSE 'Lock Expired'
    END as lock_status,
    locked_until,
    last_login_at,
    totp_enabled,
    jsonb_array_length(backup_codes) as backup_codes_remaining
FROM users;

-- Then use:
SELECT * FROM user_security_status WHERE email = 'admin@advvancia.com';
```

---

**Created:** November 14, 2025  
**Version:** 1.0  
**Backend:** http://localhost:4000  
**Database:** PostgreSQL 15 (advvancia)

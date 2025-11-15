# 🔐 Account Lockout Policy Implementation

## Overview

This document outlines the SQL queries and middleware logic for enforcing the account lockout policy that protects against brute force attacks.

## 📊 Database Schema

The lockout policy uses these columns in the `users` table:

```sql
ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
```

## 🔍 SQL Queries for Lockout Policy

### 1. Check Account Lock Status

```sql
-- Query executed before authentication attempts
SELECT failed_attempts, locked_until, last_login_at
FROM users
WHERE email = $1;
```

### 2. Increment Failed Attempts

```sql
-- Executed when login fails (wrong password/TOTP/backup code)
UPDATE users
SET failed_attempts = failed_attempts + 1,
    locked_until = CASE
        WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
        ELSE NULL
    END
WHERE id = $1;
```

### 3. Lock Account (Manual/Admin)

```sql
-- Admin can manually lock an account
UPDATE users
SET locked_until = NOW() + INTERVAL '1 hour',
    failed_attempts = 5
WHERE id = $1;
```

### 4. Unlock Account (Manual/Admin)

```sql
-- Admin can manually unlock an account
UPDATE users
SET locked_until = NULL,
    failed_attempts = 0
WHERE id = $1;
```

### 5. Reset Failed Attempts (Successful Login)

```sql
-- Executed when login succeeds
UPDATE users
SET failed_attempts = 0,
    locked_until = NULL,
    last_login_at = CURRENT_TIMESTAMP
WHERE id = $1;
```

### 6. Auto-Unlock Expired Locks

```sql
-- Cleanup query (can be run periodically)
UPDATE users
SET locked_until = NULL,
    failed_attempts = 0
WHERE locked_until < CURRENT_TIMESTAMP;
```

### 7. Get Lockout Statistics

```sql
-- For monitoring/auditing
SELECT
    COUNT(*) as total_locked_accounts,
    COUNT(CASE WHEN locked_until > CURRENT_TIMESTAMP THEN 1 END) as currently_locked,
    AVG(failed_attempts) as avg_failed_attempts
FROM users
WHERE failed_attempts > 0;
```

## 🛡️ Middleware Logic

### Lockout Check Middleware

```javascript
const checkAccountLockout = async (req, res, next) => {
  const { email } = req.body;

  try {
    const result = await query(
      "SELECT failed_attempts, locked_until FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return next(); // User doesn't exist, let auth handle it
    }

    const user = result.rows[0];

    // Check if account is currently locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      const remainingTime = Math.ceil(
        (new Date(user.locked_until) - new Date()) / 1000 / 60
      );

      return res.status(423).json({
        error: "Account locked due to too many failed attempts",
        locked_until: user.locked_until,
        remaining_minutes: remainingTime,
        retry_after: new Date(user.locked_until).toISOString(),
      });
    }

    // Attach lockout info to request for later use
    req.lockoutInfo = {
      failedAttempts: user.failed_attempts || 0,
      wasLocked: false,
    };

    next();
  } catch (error) {
    console.error("Lockout check error:", error);
    next(); // Continue with auth if DB error
  }
};
```

### Failed Attempt Handler

```javascript
const handleFailedAttempt = async (userId, currentFailedAttempts = 0) => {
  const newFailedAttempts = currentFailedAttempts + 1;
  let lockedUntil = null;

  // Lock account after 5 failed attempts for 15 minutes
  if (newFailedAttempts >= 5) {
    lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }

  try {
    await query(
      "UPDATE users SET failed_attempts = $1, locked_until = $2 WHERE id = $3",
      [newFailedAttempts, lockedUntil, userId]
    );

    return {
      failedAttempts: newFailedAttempts,
      lockedUntil,
      isLocked: lockedUntil !== null,
    };
  } catch (error) {
    console.error("Failed to update lockout status:", error);
    throw error;
  }
};
```

### Successful Login Handler

```javascript
const handleSuccessfulLogin = async (userId) => {
  try {
    await query(
      "UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
      [userId]
    );

    // Optional: Log successful login for audit
    console.log(
      `Successful login for user ${userId} at ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error("Failed to reset lockout status:", error);
    // Don't throw - login succeeded, just log the error
  }
};
```

## 🔄 Authentication Flow with Lockout

### Regular User Login

```javascript
router.post("/login", checkAccountLockout, async (req, res) => {
  const { email, password } = req.body;

  // 1. Get user
  const result = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];

  // 2. Check password
  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    // 3. Handle failed attempt
    const lockoutResult = await handleFailedAttempt(
      user.id,
      req.lockoutInfo.failedAttempts
    );

    return res.status(401).json({
      error: "Invalid credentials",
      remaining_attempts: Math.max(0, 5 - lockoutResult.failedAttempts),
      locked_until: lockoutResult.lockedUntil,
    });
  }

  // 4. Handle successful login
  await handleSuccessfulLogin(user.id);

  // 5. Generate token and respond
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token });
});
```

### Admin Login with 2FA

```javascript
router.post("/admin-login", checkAccountLockout, async (req, res) => {
  const { email, password, token, backupCode } = req.body;

  // Similar flow but with 2FA checks
  // Each failed 2FA attempt also calls handleFailedAttempt()

  // On success:
  await handleSuccessfulLogin(user.id);
});
```

## ⚙️ Configuration Options

### Lockout Thresholds

```javascript
const LOCKOUT_CONFIG = {
  max_attempts: 5, // Lock after 5 failed attempts
  lock_duration: 15 * 60 * 1000, // 15 minutes in milliseconds
  reset_after_success: true, // Reset counter on successful login
};
```

### Progressive Lockout (Advanced)

```javascript
const getLockoutDuration = (attemptNumber) => {
  if (attemptNumber < 3) return 0; // No lock for first 2 attempts
  if (attemptNumber < 5) return 5 * 60 * 1000; // 5 minutes
  if (attemptNumber < 10) return 15 * 60 * 1000; // 15 minutes
  return 60 * 60 * 1000; // 1 hour for 10+ attempts
};
```

## 📊 Monitoring & Alerts

### Lockout Metrics

```javascript
// Middleware to track lockout events
const lockoutMetrics = (req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode === 423) {
      // Log lockout event
      console.log(`Account lockout: ${req.body.email}`);
      // Send alert, increment metric, etc.
    }
  });
  next();
};
```

### Database Cleanup Job

```javascript
// Run periodically (e.g., daily)
const cleanupExpiredLocks = async () => {
  const result = await query(`
    UPDATE users
    SET locked_until = NULL, failed_attempts = 0
    WHERE locked_until < CURRENT_TIMESTAMP
    AND locked_until IS NOT NULL
  `);

  console.log(`Cleaned up ${result.rowCount} expired locks`);
};
```

## 🧪 Testing the Lockout Policy

### Test Cases

```javascript
// 1. Normal login
// 2. Wrong password (should increment counter)
// 3. Multiple wrong passwords (should lock account)
// 4. Login attempt on locked account (should be rejected)
// 5. Wait for lock expiry, then login (should work)
// 6. Successful login (should reset counter)
```

### Manual Testing Commands

```bash
# Simulate failed logins
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"wrong"}'

# Check user status
psql -c "SELECT email, failed_attempts, locked_until FROM users WHERE email = 'user@example.com';"
```

## 🔒 Security Considerations

1. **Rate Limiting**: Combine with request rate limiting
2. **IP Tracking**: Log failed attempt IPs for analysis
3. **Progressive Delays**: Add delays between failed attempts
4. **Admin Alerts**: Notify admins of lockout events
5. **Audit Logging**: Log all authentication events
6. **Session Management**: Invalidate existing sessions on lockout

## 📈 Benefits

- **Brute Force Protection**: Prevents automated attacks
- **User Experience**: Clear feedback on remaining attempts
- **Admin Control**: Manual lock/unlock capabilities
- **Audit Trail**: Track suspicious activity
- **Scalable**: Works with multiple authentication methods
- **Configurable**: Easy to adjust thresholds and durations</content>
  <parameter name="filePath">c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\-modular-saas-platform\LOCKOUT_POLICY_IMPLEMENTATION.md

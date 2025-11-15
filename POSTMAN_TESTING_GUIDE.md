# Postman Testing Guide - Lockout & Recovery

Complete guide for testing the lockout policy and 2FA recovery using Postman.

---

## 📦 Setup Instructions

### Step 1: Import Collection

1. Open Postman
2. Click "Import" button
3. Select `postman/Advancia_Lockout_Tests.postman_collection.json`
4. Collection appears in left sidebar

### Step 2: Import Environment

1. Click the gear icon (⚙️) in top-right (Manage Environments)
2. Click "Import"
3. Select `postman/Advancia_Lockout_Testing.postman_environment.json`
4. Select the imported environment from dropdown

### Step 3: Configure Environment Variables

Click on the environment and edit these values:

| Variable        | Current Value           | What to Set                                               |
| --------------- | ----------------------- | --------------------------------------------------------- |
| `baseUrl`       | `http://localhost:4000` | ✅ Leave as-is for local testing                          |
| `adminEmail`    | `admin@advvancia.com`   | ✅ Leave as-is                                            |
| `adminPassword` | `admin123`              | ✅ Leave as-is (development only!)                        |
| `validTOTP`     | `000000`                | ⚠️ **UPDATE** with current TOTP from Google Authenticator |
| `backupCode`    | empty                   | ⚠️ Optional: Set one of your backup codes                 |
| `jwtToken`      | empty                   | ✅ Auto-set after successful login                        |

**Important:** The `validTOTP` must be the current 6-digit code from your authenticator app (changes every 30 seconds).

---

## 🚀 Running the Tests

### Option 1: Run Entire Collection

1. Click on the collection name
2. Click "Run" button
3. In Collection Runner:
   - Select your environment
   - Click "Run Advancia Lockout Tests"
4. Watch the results in real-time

### Option 2: Run Individual Requests

Execute requests one-by-one in this order:

1. **Health Check** - Verify backend is running
2. **Admin Login (Valid TOTP)** - Test successful authentication
3. **Failed Login Attempts 1-5** - Simulate lockout trigger
4. **Verify Lockout** - Confirm lockout persists
5. **Admin Login (Backup Code)** - Test recovery (after unlocking)
6. **Get Users** - Test JWT-protected endpoint

---

## 📊 Test Scenarios

### Scenario 1: Successful Login with TOTP

**Request:** `2. Admin Login (Valid TOTP)`

**Prerequisites:**

1. Account must not be locked
2. Get current TOTP code from Google Authenticator
3. Update `validTOTP` environment variable

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@advvancia.com",
    "role": "admin"
  }
}
```

**Status Code:** `200 OK`

**Postman Test Results:**

- ✅ Status code is 200
- ✅ Response has token
- ✅ JWT token saved to environment
- ✅ Response has user data

**Database Verification:**

```powershell
.\quick-db-check.ps1 last-login
```

**Expected DB State:**

```
failed_attempts: 0
last_login_at: [recent timestamp]
locked_until: NULL
```

---

### Scenario 2: Trigger Lockout (5 Failed Attempts)

**Requests:** `3. Failed Login Attempt 1-5`

**Process:**

1. Run "Failed Login Attempt 1" → `401 Unauthorized`
2. Run "Failed Login Attempt 2" → `401 Unauthorized`
3. Run "Failed Login Attempt 3" → `401 Unauthorized`
4. Run "Failed Login Attempt 4" → `401 Unauthorized`
5. Run "Failed Login Attempt 5" → `429 Too Many Requests` or `401 Unauthorized`

**Expected Responses:**

**Attempts 1-4:**

```json
{
  "ok": false,
  "error": "Invalid credentials"
}
```

**Status Code:** `401 Unauthorized`

**Attempt 5 (or 6):**

```json
{
  "ok": false,
  "error": "Too many login attempts, try again later."
}
```

**Status Code:** `429 Too Many Requests`

**Database Verification After Each Attempt:**

```powershell
.\quick-db-check.ps1 attempts
```

**Expected DB Progression:**

- After attempt 1: `failed_attempts = 1`
- After attempt 2: `failed_attempts = 2`
- After attempt 3: `failed_attempts = 3`
- After attempt 4: `failed_attempts = 4`
- After attempt 5: `failed_attempts = 5, locked_until = [15 min future]`

---

### Scenario 3: Verify Lockout Persists

**Request:** `4. Verify Lockout (With Correct Password)`

**Process:**

1. After triggering lockout, run this request
2. Uses CORRECT password and valid TOTP
3. Should still be rejected

**Expected Response:**

```json
{
  "ok": false,
  "error": "Too many login attempts, try again later."
}
```

**Status Code:** `429 Too Many Requests`

**Key Point:** Even with valid credentials, login is blocked during lockout period!

**Database Verification:**

```powershell
.\quick-db-check.ps1 lockout
```

**Expected DB State:**

```
failed_attempts: 5
locked_until: [timestamp in future]
lock_status: LOCKED
minutes_remaining: ~15
```

---

### Scenario 4: Unlock and Test Backup Code

**Prerequisites:**

1. Account must be unlocked (wait 15 min OR run `.\quick-db-check.ps1 reset`)
2. Need a plain-text backup code (not the hashed version in DB)

**Request:** `5. Admin Login (Backup Code)`

**Environment Setup:**
Set `backupCode` variable to one of your backup codes

**Expected Response (Success):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@advvancia.com",
    "role": "admin"
  }
}
```

**Status Code:** `200 OK`

**Expected Response (Still Locked):**

```json
{
  "ok": false,
  "error": "Too many login attempts, try again later."
}
```

**Status Code:** `429 Too Many Requests`

**Database Verification After Successful Backup Code Login:**

```powershell
.\quick-db-check.ps1 backup
```

**Expected DB State:**

```
backup_codes_count: 4 (one less!)
failed_attempts: 0 (reset)
last_login_at: [recent timestamp]
```

**Important:** Backup codes are single-use! Once used, they're removed from the database.

---

### Scenario 5: Test Protected Endpoint

**Request:** `6. Get Users (Protected Endpoint)`

**Prerequisites:**

- Must have valid JWT token from successful login
- Token is automatically set in environment after login

**Expected Response (With Valid Token):**

```json
[
  {
    "id": 1,
    "email": "admin@advvancia.com",
    "role": "admin"
  },
  {
    "id": 2,
    "email": "user@example.com",
    "role": "user"
  }
]
```

**Status Code:** `200 OK`

**Expected Response (Without Token):**

```json
{
  "error": "No token provided"
}
```

**Status Code:** `401 Unauthorized`

---

## 🔄 Complete Test Workflow

### Full Lockout & Recovery Test

```
1. Reset account state
   → .\quick-db-check.ps1 reset

2. Run Health Check (Postman)
   → Verify backend is running

3. Run Admin Login with TOTP (Postman)
   → Successful login, JWT saved
   → Check DB: failed_attempts = 0, last_login_at updated

4. Run Failed Login Attempts 1-5 (Postman)
   → After attempt 5: Account locked
   → Check DB: failed_attempts = 5, locked_until set

5. Run Verify Lockout (Postman)
   → Even correct credentials rejected
   → Check DB: lock_status = LOCKED

6. Wait or Unlock
   Option A: Wait 15 minutes (realistic test)
   Option B: .\quick-db-check.ps1 reset (quick test)

7. Run Admin Login with TOTP (Postman)
   → Successful login after unlock
   → Check DB: failed_attempts = 0, locked_until = NULL

8. Run Get Users (Postman)
   → Protected endpoint accessible with JWT

9. Run monitor_lockout.sql
   → Complete database audit
```

---

## 🧪 Advanced Testing

### Continuous Monitoring During Tests

Open two terminal windows:

**Terminal 1: Run Tests**

```powershell
# In Postman Collection Runner
```

**Terminal 2: Monitor Database**

```powershell
.\run-sql-monitor.ps1 -Continuous -Interval 5
```

Watch database state change in real-time as tests execute!

---

### Automated Test Sequence

Create a PowerShell script to automate the workflow:

```powershell
# test-postman-workflow.ps1

Write-Host "Starting automated test workflow..." -ForegroundColor Cyan

# 1. Reset account
Write-Host "`n1. Resetting account state..." -ForegroundColor Yellow
.\quick-db-check.ps1 reset

# 2. Check initial state
Write-Host "`n2. Checking initial state..." -ForegroundColor Yellow
.\quick-db-check.ps1 all

# 3. Run Postman collection (requires Newman CLI)
Write-Host "`n3. Running Postman tests..." -ForegroundColor Yellow
newman run postman/Advancia_Lockout_Tests.postman_collection.json `
    -e postman/Advancia_Lockout_Testing.postman_environment.json

# 4. Check final state
Write-Host "`n4. Checking final state..." -ForegroundColor Yellow
.\run-sql-monitor.ps1

Write-Host "`nTest workflow complete!" -ForegroundColor Green
```

---

## 📝 Expected Test Results

### Test Summary Table

| Test # | Request            | Expected Status | Expected Behavior                   |
| ------ | ------------------ | --------------- | ----------------------------------- |
| 1      | Health Check       | 200 OK          | Backend responsive                  |
| 2      | Valid TOTP Login   | 200 OK          | JWT issued, last_login_at updated   |
| 3.1    | Failed Attempt 1   | 401             | failed_attempts = 1                 |
| 3.2    | Failed Attempt 2   | 401             | failed_attempts = 2                 |
| 3.3    | Failed Attempt 3   | 401             | failed_attempts = 3                 |
| 3.4    | Failed Attempt 4   | 401             | failed_attempts = 4                 |
| 3.5    | Failed Attempt 5   | 429             | Lockout triggered, locked_until set |
| 4      | Verify Lockout     | 429             | Correct credentials still rejected  |
| 5      | Backup Code Login  | 200             | JWT issued, backup_codes = 4        |
| 6      | Protected Endpoint | 200             | User list returned with JWT         |

---

## 🛠 Troubleshooting

### Issue: validTOTP always fails

**Problem:** TOTP codes expire every 30 seconds

**Solution:**

1. Open Google Authenticator
2. Get fresh 6-digit code
3. Quickly update `validTOTP` in Postman environment
4. Run request immediately

**Alternative:** Use backup code instead of TOTP

---

### Issue: Account stays locked

**Problem:** Lockout period hasn't expired yet

**Solution:**

```powershell
# Check remaining time
.\quick-db-check.ps1 lockout

# Manual unlock for testing
.\quick-db-check.ps1 reset
```

---

### Issue: "No token provided" error

**Problem:** JWT token not set in environment

**Solution:**

1. Run a successful login request first
2. Check environment variables to see if `jwtToken` was set
3. If not set, manually copy token from login response to environment

---

### Issue: Backup code doesn't work

**Problem:** Backup codes in database are bcrypt hashes, not plain text

**Solution:**

1. Backup codes need to be generated and saved during admin user creation
2. Currently, you need the plain-text codes from initial seeding
3. Alternative: Generate new backup codes via admin API endpoint (future enhancement)

---

## 📚 Integration with Other Tools

### Use with Database Monitoring

```powershell
# Before running Postman tests
.\quick-db-check.ps1 reset

# Run Postman Collection

# After tests complete
.\run-sql-monitor.ps1
```

### Use with Lockout Test Script

```powershell
# 1. Run Postman collection for initial tests
# 2. Then run comprehensive lockout test
.\test-lockout.ps1

# 3. Verify results
.\run-sql-monitor.ps1
```

---

## 🎯 Success Criteria

All tests pass when:

- ✅ Health check returns `200 OK`
- ✅ Valid TOTP login succeeds with JWT
- ✅ 5 failed attempts trigger lockout
- ✅ Lockout persists even with correct credentials
- ✅ Account unlocks after 15 minutes (or manual reset)
- ✅ Backup code works and is consumed
- ✅ Protected endpoints accessible with valid JWT
- ✅ Database state matches expected values at each step

---

## 📖 Additional Resources

- **QUICK_TEST_REFERENCE.md** - Command cheatsheet
- **DATABASE_VERIFICATION_GUIDE.md** - SQL queries for verification
- **COMPLETE_TEST_WORKFLOW.md** - Step-by-step testing procedures
- **ADMIN_2FA_SETUP.md** - 2FA configuration guide

---

**Created:** November 14, 2025  
**Version:** 1.0  
**Environment:** Development  
**Postman Required:** v10.0+

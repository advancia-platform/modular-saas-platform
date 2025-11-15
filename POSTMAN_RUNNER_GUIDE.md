# Postman Runner Configuration Guide

## Automated Lockout Testing with Iterations

This guide shows you how to use Postman's Collection Runner to automatically simulate multiple failed login attempts and trigger the lockout policy without manual clicking.

---

## 📦 Collection Files

### 1. **Advancia_Lockout_Runner.postman_collection.json** (NEW!)

- **Purpose:** Automated iteration-based lockout testing
- **Features:**
  - Single request that runs multiple times
  - Automatic attempt counter
  - Smart detection of lockout trigger
  - Comprehensive logging and summary
  - No manual clicking required!

### 2. **Advancia_Lockout_Tests.postman_collection.json** (Original)

- **Purpose:** Manual step-by-step testing with individual requests
- **Use Case:** When you want granular control over each test phase

---

## 🚀 Quick Start: Automated Runner

### Step 1: Import Collection

1. Open Postman
2. Click **Import**
3. Select `postman/Advancia_Lockout_Runner.postman_collection.json`
4. Import `postman/Advancia_Lockout_Testing.postman_environment.json`
5. Select the environment from dropdown

### Step 2: Configure Collection Runner

1. Click on **"Advancia Lockout Runner (Automated)"** collection
2. Click **"Run"** button (top right)
3. In the Runner configuration:

```
┌─────────────────────────────────────────────────┐
│ Postman Collection Runner Settings             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Iterations:  [6]  ← Set to 6 for reliable test │
│                     (triggers lockout at 5th)   │
│                                                 │
│ Delay:       [1000] ms  ← 1 second between     │
│                          attempts               │
│                                                 │
│ Data:        [None] ← Not needed               │
│                                                 │
│ Environment: [Advancia Lockout Testing] ✓      │
│                                                 │
│ [ Run Advancia Lockout Runner (Automated) ]    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Step 3: Run and Watch

Click **"Run Advancia Lockout Runner"** and watch the magic happen! 🎯

---

## 📊 What You'll See

### Console Output (Real-time)

```
============================================================
🔄 ITERATION 1 - Failed Login Attempt (Iterative)
============================================================
📊 Attempt #1 of 6
   Using password: wrongpassword1
📥 Response Status: 401
📥 Response Message: Invalid credentials
✅ Attempt 1: Failed as expected (401 Unauthorized)
✓ Iteration 1 completed

============================================================
🔄 ITERATION 2 - Failed Login Attempt (Iterative)
============================================================
📊 Attempt #2 of 6
   Using password: wrongpassword2
📥 Response Status: 401
📥 Response Message: Invalid credentials
✅ Attempt 2: Failed as expected (401 Unauthorized)
✓ Iteration 2 completed

... (continues) ...

============================================================
🔄 ITERATION 5 - Failed Login Attempt (Iterative)
============================================================
📊 Attempt #5 of 6
   Using password: wrongpassword5
📥 Response Status: 429
📥 Response Message: Too many login attempts, try again later.
🔒 LOCKOUT TRIGGERED at attempt 5!
🔒 locked_until should be set to ~15 minutes from now
✓ Iteration 5 completed

============================================================
🔄 ITERATION 6 - Failed Login Attempt (Iterative)
============================================================
📊 Attempt #6 of 6
   Using password: wrongpassword6
📥 Response Status: 429
📥 Response Message: Too many login attempts, try again later.
🔒 Account still locked (attempt 6)
✓ Iteration 6 completed

============================================================
📊 FINAL SUMMARY
============================================================
Total attempts made: 6
🔒 Account locked at: 2025-11-14T10:30:45.123Z
✅ Lockout policy triggered successfully!

📝 Next Steps:
   1. Run database verification: .\run-sql-monitor.ps1
   2. Check failed_attempts column (should be 5+)
   3. Check locked_until timestamp (should be set)
   4. Wait 15 minutes OR run: .\quick-db-check.ps1 reset
============================================================
```

### Test Results Dashboard

```
✓ Attempt 1: Unauthorized (Expected)
✓ Attempt 2: Unauthorized (Expected)
✓ Attempt 3: Unauthorized (Expected)
✓ Attempt 4: Unauthorized (Expected)
✓ Attempt 5: Lockout Triggered (Expected)
✓ Attempt 6: Lockout Triggered (Expected)

Tests Passed: 6/6
Requests: 6
Duration: ~6 seconds (with 1s delay)
```

---

## ⚙️ Runner Configuration Options

### Iteration Count

| Iterations | Behavior                               | Use Case                |
| ---------- | -------------------------------------- | ----------------------- |
| **6**      | Triggers lockout, confirms persistence | ✅ **Recommended**      |
| 5          | Exactly triggers lockout threshold     | Minimal test            |
| 7-10       | Extra attempts after lockout           | Thorough verification   |
| 3-4        | Partial attempts, no lockout           | Testing attempt counter |

### Delay Between Requests

| Delay (ms) | Behavior                  | Use Case                       |
| ---------- | ------------------------- | ------------------------------ |
| **1000**   | 1 second between attempts | ✅ **Recommended** - realistic |
| 500        | 0.5 seconds               | Faster testing                 |
| 0          | Immediate (no delay)      | Rapid testing                  |
| 2000       | 2 seconds                 | Extra careful                  |

### Data Files (Optional)

You can use a CSV/JSON file to test multiple user accounts:

**lockout-test-data.csv**

```csv
email,password
admin@advvancia.com,wrongpass1
user@test.com,badpassword
another@test.com,incorrect123
```

**Runner Settings:**

- Select Data: `lockout-test-data.csv`
- Iterations: Auto (one per row)
- File Type: CSV

---

## 🎯 Advanced Runner Scenarios

### Scenario 1: Test Multiple Accounts

**Setup:**

1. Create CSV with multiple test accounts
2. Each iteration tests a different account
3. Verify lockout triggers for each

**CSV Example:**

```csv
email,password,totp
admin@advvancia.com,wrongpass,000000
user1@test.com,badpass,000000
user2@test.com,incorrect,000000
```

**Runner Config:**

- Data: Select CSV file
- Iterations: Auto (3 in this case)
- Delay: 1000ms

---

### Scenario 2: Rapid Stress Test

**Goal:** Test system under rapid failed login attempts

**Runner Config:**

- Iterations: 10
- Delay: 0ms (no delay)
- Environment: Production-like

**What to Watch:**

- Rate limiting behavior
- Database performance
- Lock acquisition timing

---

### Scenario 3: Lockout Recovery Test

**Setup:**

1. Run lockout collection (6 iterations)
2. Wait 15 minutes OR reset manually
3. Run successful login collection
4. Verify failed_attempts reset to 0

**Commands:**

```powershell
# 1. Trigger lockout
# (Run Runner with 6 iterations)

# 2. Verify lockout
.\quick-db-check.ps1 lockout

# 3. Reset for testing
.\quick-db-check.ps1 reset

# 4. Test successful login
# (Import and run different collection)
```

---

## 📝 Collection Variables Explained

The automated runner uses collection variables to track state:

| Variable       | Purpose                          | Example Value          |
| -------------- | -------------------------------- | ---------------------- |
| `attemptCount` | Tracks total attempts made       | `5`                    |
| `lockedAt`     | Timestamp when lockout triggered | `2025-11-14T10:30:45Z` |

**Access in Scripts:**

```javascript
// Get value
const count = pm.collectionVariables.get("attemptCount");

// Set value
pm.collectionVariables.set("attemptCount", 5);

// Reset
pm.collectionVariables.set("attemptCount", 0);
```

---

## 🔄 Complete Automated Workflow

### Full End-to-End Test

```powershell
# 1. Reset database state
.\quick-db-check.ps1 reset

# 2. Check initial state
.\quick-db-check.ps1 all

# 3. Open Postman and run automated collection
# - Iterations: 6
# - Delay: 1000ms
# - Click "Run"

# 4. Verify lockout in database (after Runner completes)
.\run-sql-monitor.ps1

# 5. Continuous monitoring (optional)
.\run-sql-monitor.ps1 -Continuous -Interval 5
```

---

## 🧪 Testing with Newman CLI

### Automated Command-Line Testing

```powershell
# Install Newman (if not already)
npm install -g newman

# Run collection with iterations
newman run postman/Advancia_Lockout_Runner.postman_collection.json `
    -e postman/Advancia_Lockout_Testing.postman_environment.json `
    --iteration-count 6 `
    --delay-request 1000 `
    --reporters cli,htmlextra `
    --reporter-htmlextra-export newman-report.html

# View HTML report
start newman-report.html
```

### Newman with Custom Data

```powershell
# Create test data file
@"
email,password,totp
admin@advvancia.com,wrongpass1,000000
admin@advvancia.com,wrongpass2,000000
admin@advvancia.com,wrongpass3,000000
admin@advvancia.com,wrongpass4,000000
admin@advvancia.com,wrongpass5,000000
admin@advvancia.com,wrongpass6,000000
"@ | Out-File -FilePath "lockout-data.csv"

# Run with data file
newman run postman/Advancia_Lockout_Runner.postman_collection.json `
    -e postman/Advancia_Lockout_Testing.postman_environment.json `
    -d lockout-data.csv `
    --delay-request 1000
```

---

## 📊 Expected Database State After Runner

### After 6 Iterations (Lockout Triggered)

```sql
SELECT
    email,
    failed_attempts,
    locked_until,
    CASE
        WHEN locked_until > NOW() THEN '🔒 LOCKED'
        ELSE '✅ UNLOCKED'
    END as status
FROM users
WHERE email = 'admin@advvancia.com';
```

**Expected Result:**

```
email                  | failed_attempts | locked_until              | status
-----------------------|-----------------|---------------------------|----------
admin@advvancia.com    | 5               | 2025-11-14 10:45:30+00   | 🔒 LOCKED
```

### Verify with PowerShell

```powershell
# Quick check
.\quick-db-check.ps1 lockout

# Expected output:
# ╔═══════════════════════════════════════════════════╗
# ║         LOCKOUT STATUS CHECK                      ║
# ╚═══════════════════════════════════════════════════╝
#
# email: admin@advvancia.com
# failed_attempts: 5
# locked_until: 2025-11-14 10:45:30.123
# lock_status: 🔒 LOCKED
# minutes_remaining: 14.8
```

---

## 🛠️ Troubleshooting Runner Issues

### Issue: Iterations don't increment attemptCount

**Problem:** Collection variable not updating

**Solution:**

1. Check collection variables are enabled
2. Verify pre-request script is running
3. Clear collection variables and retry:
   ```javascript
   pm.collectionVariables.clear();
   ```

---

### Issue: Lockout triggers too early (before 5 attempts)

**Problem:** Database has existing failed_attempts

**Solution:**

```powershell
# Reset before running
.\quick-db-check.ps1 reset

# Then run collection
```

---

### Issue: Lockout never triggers

**Problem:**

- Backend not enforcing lockout
- Database not updating
- Route handler logic issue

**Solution:**

```powershell
# Check backend logs
cd backend
node src/index.js

# Verify database updates
.\run-sql-monitor.ps1 -Continuous

# Check route handler
# File: backend/src/routes/auth.js
# Look for lockout logic in /admin-login
```

---

### Issue: Runner shows "429" on first attempt

**Problem:** Account already locked from previous test

**Solution:**

```powershell
# Check if locked
.\quick-db-check.ps1 lockout

# If locked, reset
.\quick-db-check.ps1 reset
```

---

## 🎓 Best Practices

### ✅ DO:

- Always reset account state before running (`.\quick-db-check.ps1 reset`)
- Use 6 iterations to confirm lockout persistence
- Set 1000ms delay for realistic testing
- Verify database state after each run
- Use Newman for CI/CD automation

### ❌ DON'T:

- Run without resetting if testing multiple times
- Use 0ms delay in production-like environments
- Forget to check database after Runner completes
- Test against production database
- Ignore unexpected status codes in console

---

## 📚 Related Documentation

- **POSTMAN_TESTING_GUIDE.md** - Complete Postman testing guide
- **COMPLETE_TEST_WORKFLOW.md** - Step-by-step testing procedures
- **DATABASE_VERIFICATION_GUIDE.md** - SQL verification queries
- **QUICK_TEST_REFERENCE.md** - Quick command reference

---

## 🎯 Success Criteria

Your automated runner test is successful when:

- ✅ All 6 iterations complete without errors
- ✅ First 4 attempts return `401 Unauthorized`
- ✅ 5th attempt returns `429 Too Many Requests`
- ✅ 6th attempt also returns `429` (confirms persistence)
- ✅ Console shows lockout timestamp
- ✅ Database shows `failed_attempts = 5`
- ✅ Database shows `locked_until` set to future timestamp
- ✅ Final summary shows "Lockout policy triggered successfully!"

---

**Version:** 2.0  
**Created:** November 14, 2025  
**Runner Config:** Iterations: 6, Delay: 1000ms  
**Postman Required:** v10.0+  
**Newman Compatible:** Yes ✓

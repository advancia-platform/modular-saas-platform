# 🎯 Postman Runner Quick Reference Card

```
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║         POSTMAN RUNNER - AUTOMATED LOCKOUT TESTING                    ║
║              Quick Setup & Configuration Guide                        ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ Quick Setup (60 seconds)

### 1️⃣ Import Collection

```
Postman → Import → Select:
  📁 postman/Advancia_Lockout_Runner.postman_collection.json
```

### 2️⃣ Import Environment

```
Postman → ⚙️ (Manage Environments) → Import → Select:
  📁 postman/Advancia_Lockout_Testing.postman_environment.json
```

### 3️⃣ Configure Runner

```
Collection → Run → Set:
  ┌─────────────────────────────────┐
  │ Iterations:     [6]             │  ← Must be 6 or higher
  │ Delay:          [1000] ms       │  ← 1 second between attempts
  │ Environment:    [Advancia ...]  │  ← Select from dropdown
  └─────────────────────────────────┘
```

### 4️⃣ Run!

```
Click: [Run Advancia Lockout Runner (Automated)]
```

---

## 📊 Runner Configuration Matrix

| Setting                  | Value            | Purpose                          | Required?   |
| ------------------------ | ---------------- | -------------------------------- | ----------- |
| **Iterations**           | `6`              | Trigger lockout (5) + verify (1) | ✅ Yes      |
| **Delay**                | `1000` ms        | 1 second between attempts        | ✅ Yes      |
| **Data File**            | None             | Not needed (uses variables)      | ❌ No       |
| **Environment**          | Advancia Testing | Contains baseUrl, credentials    | ✅ Yes      |
| **Keep variable values** | ✓                | Persist token between runs       | ⚠️ Optional |
| **Save responses**       | ✓                | Debug failed tests               | ⚠️ Optional |

---

## 🎬 What Happens During Run

```
Iteration 1  →  POST /admin-login (wrong password)  →  401 ✓
Iteration 2  →  POST /admin-login (wrong password)  →  401 ✓
Iteration 3  →  POST /admin-login (wrong password)  →  401 ✓
Iteration 4  →  POST /admin-login (wrong password)  →  401 ✓
Iteration 5  →  POST /admin-login (wrong password)  →  429 🔒 LOCKED!
Iteration 6  →  POST /admin-login (wrong password)  →  429 🔒 Still locked

📊 Final Summary:
   • Total attempts: 6
   • Lockout triggered: ✓ (at attempt 5)
   • Tests passed: 6/6
   • Duration: ~6 seconds
```

---

## 🔍 Expected Console Output

```javascript
============================================================
🔄 ITERATION 1 - Failed Login Attempt (Iterative)
============================================================
📊 Attempt #1 of 6
   Using password: wrongpassword1
📥 Response Status: 401
✅ Attempt 1: Failed as expected (401 Unauthorized)

// ... iterations 2-4 similar ...

============================================================
🔄 ITERATION 5 - Failed Login Attempt (Iterative)
============================================================
📊 Attempt #5 of 6
   Using password: wrongpassword5
📥 Response Status: 429
🔒 LOCKOUT TRIGGERED at attempt 5!

============================================================
📊 FINAL SUMMARY
============================================================
Total attempts made: 6
✅ Lockout policy triggered successfully!

📝 Next Steps:
   1. Run database verification: .\run-sql-monitor.ps1
   2. Check failed_attempts column (should be 5+)
   3. Check locked_until timestamp (should be set)
```

---

## 🗄️ Database Verification (After Run)

```powershell
# Quick check
.\quick-db-check.ps1 lockout

# Expected:
# failed_attempts:     5
# locked_until:        2025-11-14 10:45:30.123
# lock_status:         🔒 LOCKED
# minutes_remaining:   ~15
```

```powershell
# Full monitoring
.\run-sql-monitor.ps1

# Shows: Security state, lockout timing, 2FA status, etc.
```

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  1. Reset Database                                      │
│     .\quick-db-check.ps1 reset                         │
│                                                         │
│  2. Check Initial State                                 │
│     .\quick-db-check.ps1 all                           │
│                                                         │
│  3. Run Postman Collection                              │
│     • Open Postman                                      │
│     • Select collection                                 │
│     • Click "Run"                                       │
│     • Set iterations: 6, delay: 1000ms                  │
│     • Click "Run Advancia..."                           │
│                                                         │
│  4. Verify Results                                      │
│     .\run-sql-monitor.ps1                              │
│                                                         │
│  ✅ DONE! Lockout policy verified                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚨 Common Issues & Fixes

| Issue                         | Cause                      | Fix                              |
| ----------------------------- | -------------------------- | -------------------------------- |
| Lockout triggers at attempt 1 | Account already locked     | `.\quick-db-check.ps1 reset`     |
| Lockout never triggers        | Backend not running        | `cd backend ; node src/index.js` |
| All attempts return 500       | Database connection issue  | Check Docker: `docker ps`        |
| Variables not updating        | Wrong environment selected | Select "Advancia..." environment |

---

## 🤖 Newman CLI Alternative

```powershell
# Install Newman
npm install -g newman

# Run with same config as Postman Runner
newman run postman/Advancia_Lockout_Runner.postman_collection.json `
    -e postman/Advancia_Lockout_Testing.postman_environment.json `
    --iteration-count 6 `
    --delay-request 1000 `
    --reporters cli,htmlextra `
    --reporter-htmlextra-export newman-report.html

# View report
start newman-report.html
```

---

## 📈 Success Criteria Checklist

- [ ] All 6 iterations completed
- [ ] Attempts 1-4 returned `401`
- [ ] Attempt 5 returned `429` (lockout triggered)
- [ ] Attempt 6 returned `429` (lockout persists)
- [ ] Console shows "Lockout triggered successfully"
- [ ] Database shows `failed_attempts = 5`
- [ ] Database shows `locked_until` timestamp set
- [ ] locked_until is ~15 minutes in future

---

## 🎓 Pro Tips

✅ **DO:**

- Reset before each test run
- Use 6 iterations (not 5) to confirm persistence
- Check console output for detailed logs
- Verify database state after run

❌ **DON'T:**

- Run multiple times without resetting
- Use in production environment
- Ignore 500 errors (indicates backend issues)
- Forget to verify database changes

---

## 📚 Full Documentation

- **POSTMAN_RUNNER_GUIDE.md** ← You are here (quick ref)
- **POSTMAN_TESTING_GUIDE.md** - Complete guide
- **COMPLETE_TEST_WORKFLOW.md** - Step-by-step
- **QUICK_TEST_REFERENCE.md** - All commands

---

```
╔═══════════════════════════════════════════════════════════════════════╗
║  ⏱️ TOTAL TIME: ~10 seconds per test run                              ║
║  🎯 TESTS: 6 automated tests                                          ║
║  ✅ EXPECTED: 100% pass rate                                           ║
║  📊 OUTPUT: Console logs + Test results + Database changes            ║
╚═══════════════════════════════════════════════════════════════════════╝
```

**Last Updated:** November 14, 2025  
**Postman Version:** 10.0+  
**Collection Version:** 2.0.0

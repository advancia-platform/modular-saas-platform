# Quick Reference - Testing Tools

## 🚀 One-Command Testing

### Run Everything in Sequence

```powershell
# Complete test cycle
.\quick-db-check.ps1 reset ; .\test-lockout.ps1 ; .\run-sql-monitor.ps1
```

### Automated Postman Runner (NEW! ⭐)

```powershell
# 1. Reset database
.\quick-db-check.ps1 reset

# 2. Open Postman and import:
#    - postman/Advancia_Lockout_Runner.postman_collection.json
#    - postman/Advancia_Lockout_Testing.postman_environment.json

# 3. In Postman Collection Runner:
#    Iterations: 6 | Delay: 1000ms | Click "Run"

# 4. Verify results
.\run-sql-monitor.ps1

# ✅ Tests 5 failed attempts + lockout trigger automatically!
```

**See:** `RUNNER_QUICK_REF.md` for detailed Postman Runner guide

---

## 🧪 Individual Test Commands

### 1. Database Quick Checks

```powershell
# Full status
.\quick-db-check.ps1 all

# Lockout status only
.\quick-db-check.ps1 lockout

# Failed attempts
.\quick-db-check.ps1 attempts

# 2FA configuration
.\quick-db-check.ps1 2fa

# Backup codes
.\quick-db-check.ps1 backup

# Last login time
.\quick-db-check.ps1 last-login

# Reset/unlock account
.\quick-db-check.ps1 reset
```

### 2. Lockout Policy Test

```powershell
# Interactive test with options
.\test-lockout.ps1

# Options during test:
# A - Wait 15 minutes for auto-unlock
# B - Manual unlock via database
# S - Skip successful login test
```

### 3. SQL Monitoring

```powershell
# Single run - complete security audit
.\run-sql-monitor.ps1

# Continuous monitoring (refresh every 5 seconds)
.\run-sql-monitor.ps1 -Continuous

# Custom refresh interval (10 seconds)
.\run-sql-monitor.ps1 -Continuous -Interval 10
```

### 4. Direct SQL Queries

```bash
# Connect to database
docker exec -it advancia-postgres psql -U postgres -d advvancia

# Run monitoring script
docker exec -it advancia-postgres psql -U postgres -d advvancia -f monitor_lockout.sql
```

---

## 📊 What Each Tool Shows

### quick-db-check.ps1

- ✅ Real-time database status
- ✅ Single-purpose queries (fast)
- ✅ Reset functionality
- ✅ Color-coded output

### monitor_lockout.sql

- ✅ Complete security audit
- ✅ 7 different views:
  - Basic security state
  - Lockout timing details
  - 2FA status
  - Backup codes
  - Login history
  - Recovery codes
  - Security metrics
- ✅ Formatted output with borders
- ✅ Timestamp logging

### test-lockout.ps1

- ✅ Simulates failed attempts
- ✅ Triggers lockout
- ✅ Tests TOTP login
- ✅ Interactive prompts
- ✅ Multiple test paths

### run-sql-monitor.ps1

- ✅ Wrapper for SQL script
- ✅ Continuous monitoring mode
- ✅ Configurable refresh
- ✅ Easy to use

---

## 🎯 Common Testing Scenarios

### Scenario 1: Test Lockout Triggers

```powershell
# 1. Reset account
.\quick-db-check.ps1 reset

# 2. Check initial state (should be 0 failed attempts)
.\quick-db-check.ps1 attempts

# 3. Simulate 5 failed attempts
for ($i=1; $i -le 5; $i++) {
    $body = @{email='admin@advvancia.com';password='wrong';token='000000'} | ConvertTo-Json
    try { Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/admin-login' -Method Post -Body $body -ContentType 'application/json' } catch {}
    .\quick-db-check.ps1 attempts
}

# 4. Verify lockout
.\quick-db-check.ps1 lockout
```

### Scenario 2: Test Auto-Unlock

```powershell
# 1. Trigger lockout (from Scenario 1)

# 2. Monitor countdown
.\run-sql-monitor.ps1 -Continuous -Interval 60

# 3. After 15 minutes, verify unlock
.\quick-db-check.ps1 lockout
```

### Scenario 3: Test Successful Login Reset

```powershell
# 1. Have locked account (from Scenario 1)

# 2. Manual unlock for quick test
.\quick-db-check.ps1 reset

# 3. Get TOTP code from Google Authenticator

# 4. Login with valid credentials
$totp = Read-Host "Enter TOTP code"
$body = @{email='admin@advvancia.com';password='admin123';token=$totp} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:4000/api/auth/admin-login' -Method Post -Body $body -ContentType 'application/json'

# 5. Verify reset
.\run-sql-monitor.ps1
# Check: failed_attempts = 0, last_login_at = recent timestamp
```

### Scenario 4: Complete Audit

```powershell
# Run complete security audit
.\run-sql-monitor.ps1

# Look for:
# ✓ failed_attempts counter
# ✓ locked_until timestamp (if locked)
# ✓ last_login_at (after successful login)
# ✓ totp_enabled = true
# ✓ backup_codes count = 5
# ✓ Security metrics summary
```

---

## 🔍 Expected Results

### After 1-4 Failed Attempts

```
failed_attempts: 1-4
locked_until: NULL
lock_status: Active
```

### After 5 Failed Attempts (Lockout)

```
failed_attempts: 5
locked_until: [timestamp ~15 min future]
lock_status: LOCKED
minutes_remaining: ~15
```

### After Successful Login

```
failed_attempts: 0 (RESET)
locked_until: NULL (CLEARED)
last_login_at: [recent timestamp]
lock_status: Active
```

### After Using Backup Code

```
backup_codes_count: 4 (one less)
failed_attempts: 0 (RESET)
last_login_at: [recent timestamp]
```

---

## 🛠 Troubleshooting

### Account Stuck Locked

```powershell
# Manual unlock
.\quick-db-check.ps1 reset

# Or via SQL
docker exec advancia-postgres psql -U postgres -d advvancia -c "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email='admin@advvancia.com';"
```

### Script Not Found

```powershell
# Ensure you're in the project root
cd c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\-modular-saas-platform

# List available scripts
dir *.ps1
```

### Database Connection Error

```powershell
# Check PostgreSQL container
docker ps | Select-String "postgres"

# Start if stopped
docker start advancia-postgres
```

### Backend Not Responding

```powershell
# Check if backend is running
curl http://localhost:4000/api/health

# Start backend
cd backend ; node src/index.js
```

---

## 📝 Admin Credentials (Development)

```
Email: admin@advvancia.com
Password: admin123
TOTP Secret: LBBCQ32QOUZEKZSBNFYD6YRMLZMGYPS3
```

**⚠️ Change these in production!**

---

## 📚 Full Documentation

- **DATABASE_VERIFICATION_GUIDE.md** - All SQL queries explained
- **COMPLETE_TEST_WORKFLOW.md** - Step-by-step testing procedures
- **ADMIN_2FA_SETUP.md** - 2FA setup and usage
- **IMPLEMENTATION_COMPLETE.md** - Complete project summary
- **API_TESTING_GUIDE.md** - API endpoint testing

---

**Created:** November 14, 2025  
**Version:** 1.0  
**Environment:** Development  
**Status:** Production-Ready (after credential rotation)

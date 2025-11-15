# 🧪 API Testing Guide - Advancia PayLedger

## Quick Start

### Using Postman

1. Import `postman/Advancia_PayLedger_API.postman_collection.json` into Postman
2. Set environment variable `base_url` to `http://localhost:4000`
3. Run the requests in order

### Using Curl Commands

## 📋 Test Scenarios

### 1. Health Check

```bash
curl -X GET http://localhost:4000/api/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-14T..."
}
```

---

### 2. User Signup

```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

### 3. User Login (Success)

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user"
  }
}
```

---

### 4. Failed Login Attempt

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "wrong_password"
  }'
```

**Expected Response:**

```json
{
  "error": "Invalid credentials",
  "remaining_attempts": 4
}
```

---

### 5. Account Lockout Test (5 Failed Attempts)

```bash
# Run this command 5 times
for i in {1..5}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "user@example.com",
      "password": "wrong_password"
    }'
  echo ""
done
```

**Expected Response (5th attempt):**

```json
{
  "error": "Invalid credentials",
  "remaining_attempts": 0
}
```

**Next attempt:**

```json
{
  "error": "Account locked due to too many failed attempts",
  "locked_until": "2025-11-14T19:15:00.000Z"
}
```

---

### 6. Admin Login with TOTP

```bash
curl -X POST http://localhost:4000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@advvancia.com",
    "password": "admin123",
    "token": "123456"
  }'
```

**Note:** Replace `123456` with the current TOTP token from Google Authenticator

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@advvancia.com",
    "role": "admin"
  }
}
```

---

### 7. Admin Login with Backup Code

```bash
curl -X POST http://localhost:4000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@advvancia.com",
    "password": "admin123",
    "backupCode": "a1b2c3d4"
  }'
```

**Note:** Replace `a1b2c3d4` with one of your backup codes from seeding

**Expected Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@advvancia.com",
    "role": "admin"
  }
}
```

---

### 8. Test Protected Endpoint

```bash
# First, get a token from login
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:4000/api/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response:**

```json
{
  "service": "advvancia-backend",
  "version": "1.0.0"
}
```

---

## 🔒 Security Testing Scenarios

### Test 1: Invalid TOTP Token

```bash
curl -X POST http://localhost:4000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@advvancia.com",
    "password": "admin123",
    "token": "000000"
  }'
```

**Expected:** Error with remaining attempts counter

---

### Test 2: Invalid Backup Code

```bash
curl -X POST http://localhost:4000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@advvancia.com",
    "password": "admin123",
    "backupCode": "invalid"
  }'
```

**Expected:** Error with remaining attempts counter

---

### Test 3: Account Lockout for Admin

```bash
# Make 5 failed admin login attempts
for i in {1..5}; do
  curl -X POST http://localhost:4000/api/auth/admin-login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@advvancia.com",
      "password": "wrong",
      "token": "000000"
    }'
done
```

**Expected:** Account locked response after 5th attempt

---

## 📊 Database Verification

### Check User Status

```sql
SELECT
  email,
  failed_attempts,
  locked_until,
  last_login_at,
  totp_enabled
FROM users
WHERE email = 'user@example.com';
```

### Check Admin Backup Codes

```sql
SELECT
  email,
  backup_codes,
  totp_secret IS NOT NULL as has_totp
FROM users
WHERE role = 'admin';
```

### View Lockout Statistics

```sql
SELECT
  COUNT(*) FILTER (WHERE failed_attempts > 0) as accounts_with_failures,
  COUNT(*) FILTER (WHERE locked_until > CURRENT_TIMESTAMP) as currently_locked,
  AVG(failed_attempts) as avg_failed_attempts
FROM users;
```

---

## 🚀 Automated Test Script

Run the provided test script:

```bash
chmod +x test-api.sh
./test-api.sh
```

This will automatically test:

- ✅ Health check
- ✅ User signup
- ✅ Successful login
- ✅ Failed login attempts
- ✅ Account lockout
- ✅ Admin 2FA login
- ✅ Protected endpoints

---

## 📝 Testing Checklist

- [ ] Health endpoint returns 200
- [ ] User signup creates account
- [ ] User login with correct credentials succeeds
- [ ] Failed login increments counter
- [ ] 5 failed attempts locks account
- [ ] Locked account rejects login
- [ ] Admin login requires TOTP
- [ ] Valid TOTP grants access
- [ ] Backup codes work (single use)
- [ ] Successful login resets counter
- [ ] JWT tokens work for protected routes
- [ ] Lockout expires after 15 minutes

---

## 🔧 Troubleshooting

### Issue: "Connection refused"

**Solution:** Ensure backend is running:

```bash
cd backend && npm run dev
```

### Issue: "Invalid TOTP token"

**Solution:**

1. Check time sync on your device
2. Use Google Authenticator app
3. Verify secret matches seeded value

### Issue: "Account locked"

**Solution:** Wait 15 minutes or manually unlock:

```sql
UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = 'user@example.com';
```

### Issue: "Backup code doesn't work"

**Solution:**

1. Check console output from seed script
2. Backup codes are single-use only
3. Use a code that hasn't been used yet

---

## 📈 Success Metrics

After testing, verify:

- ✅ All endpoints respond correctly
- ✅ Lockout policy enforces after 5 attempts
- ✅ TOTP validation works
- ✅ Backup codes provide recovery
- ✅ Failed attempts reset on success
- ✅ JWT authentication protects routes
- ✅ Database columns populated correctly

# Email Verification System - Testing Guide

## Quick Test Script

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Email Verification System Test Suite"
echo "========================================"
echo ""

# Set your JWT token here
JWT_TOKEN="your-jwt-token-here"
BASE_URL="http://localhost:4000"

if [ "$JWT_TOKEN" = "your-jwt-token-here" ]; then
    echo -e "${RED}❌ Please set JWT_TOKEN variable first${NC}"
    echo "   Login to get a token:"
    echo "   curl -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\",\"password\":\"password\"}'"
    exit 1
fi

echo -e "${YELLOW}Test 1: Send Verification Email${NC}"
SEND_RESULT=$(curl -s -X POST "$BASE_URL/api/email/send-verification" \
  -H "Authorization: Bearer $JWT_TOKEN")
echo "$SEND_RESULT" | jq .
echo ""

echo -e "${YELLOW}Test 2: Check Verification Status${NC}"
STATUS_RESULT=$(curl -s -X GET "$BASE_URL/api/email/verification-status" \
  -H "Authorization: Bearer $JWT_TOKEN")
echo "$STATUS_RESULT" | jq .
echo ""

echo -e "${YELLOW}Test 3: Resend Verification Email${NC}"
RESEND_RESULT=$(curl -s -X POST "$BASE_URL/api/email/verification/resend" \
  -H "Authorization: Bearer $JWT_TOKEN")
echo "$RESEND_RESULT" | jq .
echo ""

echo -e "${YELLOW}Test 4: Rate Limiting Check (5 rapid requests)${NC}"
for i in {1..6}; do
    echo -n "Request $i: "
    RATE_RESULT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/email/verification/resend" \
      -H "Authorization: Bearer $JWT_TOKEN")
    HTTP_CODE=$(echo "$RATE_RESULT" | tail -n 1)
    BODY=$(echo "$RATE_RESULT" | head -n -1)
    
    if [ "$HTTP_CODE" = "429" ]; then
        echo -e "${RED}❌ Rate limited (expected)${NC}"
    else
        echo -e "${GREEN}✅ Success${NC}"
    fi
done
echo ""

echo -e "${YELLOW}Test 5: Verify Email (need token from logs)${NC}"
echo "Check backend logs for verification link in development mode"
echo "Example: curl \"$BASE_URL/api/email/verify?token=YOUR_TOKEN_HERE\""
echo ""

echo "✅ Test suite complete!"
```

## PowerShell Test Script

```powershell
# test-email-verification.ps1

Write-Host "🧪 Email Verification System Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$JWT_TOKEN = "your-jwt-token-here"
$BASE_URL = "http://localhost:4000"

if ($JWT_TOKEN -eq "your-jwt-token-here") {
    Write-Host "❌ Please set JWT_TOKEN variable first" -ForegroundColor Red
    Write-Host "   Login to get a token:" -ForegroundColor Yellow
    Write-Host "   `$login = Invoke-RestMethod -Uri '$BASE_URL/api/auth/login' -Method Post -ContentType 'application/json' -Body '{\"email\":\"test@example.com\",\"password\":\"password\"}'" -ForegroundColor Gray
    Write-Host "   `$JWT_TOKEN = `$login.token" -ForegroundColor Gray
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $JWT_TOKEN"
    "Content-Type" = "application/json"
}

# Test 1: Send Verification Email
Write-Host "Test 1: Send Verification Email" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$BASE_URL/api/email/send-verification" -Method Post -Headers $headers
    $result | ConvertTo-Json | Write-Host
    Write-Host "✅ Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check Verification Status
Write-Host "Test 2: Check Verification Status" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$BASE_URL/api/email/verification-status" -Headers $headers
    $result | ConvertTo-Json | Write-Host
    Write-Host "✅ Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Resend Verification Email
Write-Host "Test 3: Resend Verification Email" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$BASE_URL/api/email/verification/resend" -Method Post -Headers $headers
    $result | ConvertTo-Json | Write-Host
    Write-Host "✅ Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Rate Limiting
Write-Host "Test 4: Rate Limiting Check (6 rapid requests)" -ForegroundColor Yellow
for ($i = 1; $i -le 6; $i++) {
    Write-Host "Request $i: " -NoNewline
    try {
        $result = Invoke-RestMethod -Uri "$BASE_URL/api/email/verification/resend" -Method Post -Headers $headers
        Write-Host "✅ Success" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            Write-Host "❌ Rate limited (expected)" -ForegroundColor Red
        } else {
            Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 500
}
Write-Host ""

# Test 5: Verify Email
Write-Host "Test 5: Verify Email (need token from logs)" -ForegroundColor Yellow
Write-Host "Check backend logs for verification link in development mode" -ForegroundColor Gray
Write-Host "Example: Invoke-RestMethod -Uri '$BASE_URL/api/email/verify?token=YOUR_TOKEN_HERE'" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Test suite complete!" -ForegroundColor Green
```

## Manual Testing Steps

### 1. Get JWT Token

```powershell
# Login
$loginBody = @{
    email = "test@example.com"
    password = "yourpassword"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Uri "http://localhost:4000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody

$JWT_TOKEN = $login.token
Write-Host "Token: $JWT_TOKEN"
```

### 2. Send Verification Email

```powershell
$headers = @{ "Authorization" = "Bearer $JWT_TOKEN" }

Invoke-RestMethod `
  -Uri "http://localhost:4000/api/email/send-verification" `
  -Method Post `
  -Headers $headers | ConvertTo-Json
```

**Expected Output:**

```json
{
  "success": true,
  "message": "Verification email sent",
  "verificationLink": "http://localhost:3000/verify-email?token=..."
}
```

### 3. Check Backend Logs

In development mode (without Resend configured), the verification link is logged:

```
[WARN] RESEND_API_KEY not configured. Verification link: {
  link: 'http://localhost:3000/verify-email?token=abc123...',
  userId: 'clx...',
  email: 'test@example.com'
}
```

### 4. Verify Email

Copy the token from logs:

```powershell
$token = "abc123..."
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/email/verify?token=$token" | ConvertTo-Json
```

**Expected Output:**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 5. Check Verification Status

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/email/verification-status" `
  -Headers $headers | ConvertTo-Json
```

**Expected Output:**

```json
{
  "success": true,
  "emailVerified": true,
  "verifiedAt": "2025-11-26T12:34:56.789Z"
}
```

### 6. Test Resend

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/email/verification/resend" `
  -Method Post `
  -Headers $headers | ConvertTo-Json
```

**Expected Output (if already verified):**

```json
{
  "error": "Email is already verified"
}
```

### 7. Test Rate Limiting

```powershell
1..6 | ForEach-Object {
  try {
    Invoke-RestMethod `
      -Uri "http://localhost:4000/api/email/verification/resend" `
      -Method Post `
      -Headers $headers | Out-Null
    Write-Host "Request $_ : ✅ Success" -ForegroundColor Green
  } catch {
    Write-Host "Request $_ : ❌ $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
  }
  Start-Sleep -Milliseconds 500
}
```

**Expected Output:**

```
Request 1 : ✅ Success
Request 2 : ✅ Success
Request 3 : ✅ Success
Request 4 : ✅ Success
Request 5 : ✅ Success
Request 6 : ❌ 429
```

## Frontend Testing

### 1. Test Verification Banner

1. Start frontend: `npm run dev`
2. Login as unverified user
3. Navigate to dashboard
4. Verify banner appears at top
5. Click "Resend verification email"
6. Check toast notification

### 2. Test Verification Page

1. Get verification link from backend logs
2. Open link in browser
3. Verify:
   - Loading spinner appears
   - Success message shows
   - Countdown timer works
   - Auto-redirect after 5 seconds
   - Manual redirect button works

### 3. Test Verification Badge

1. Verify email
2. Navigate to profile
3. Verify green "Verified" badge appears
4. Confirm banner is hidden

## Database Verification

```sql
-- Check user verification status
SELECT 
  id,
  email,
  "emailVerified",
  "emailVerifiedAt",
  "emailSignupToken",
  "emailSignupTokenExpiry"
FROM "User"
WHERE email = 'test@example.com';

-- Check token expiry
SELECT 
  email,
  "emailSignupTokenExpiry",
  CASE 
    WHEN "emailSignupTokenExpiry" > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as token_status
FROM "User"
WHERE "emailSignupToken" IS NOT NULL;

-- Count verified vs unverified users
SELECT 
  "emailVerified",
  COUNT(*) as count
FROM "User"
GROUP BY "emailVerified";
```

## Expected Results

| Test | Expected Result | Status |
|------|----------------|--------|
| Send verification email | 200 OK, email sent | ✅ |
| Resend verification | 200 OK, email resent | ✅ |
| Verify with valid token | 200 OK, email verified | ✅ |
| Verify with expired token | 400 Bad Request, "expired" | ✅ |
| Verify with invalid token | 400 Bad Request, "invalid" | ✅ |
| Check status (verified) | 200 OK, emailVerified: true | ✅ |
| Check status (unverified) | 200 OK, emailVerified: false | ✅ |
| Rate limit (6th request) | 429 Too Many Requests | ✅ |
| Resend when verified | 400 Bad Request, "already verified" | ✅ |

## Troubleshooting

### Issue: "User not authenticated"

**Solution**: Ensure JWT token is valid and included in Authorization header

```powershell
$headers = @{ "Authorization" = "Bearer $JWT_TOKEN" }
```

### Issue: "Email already verified"

**Solution**: Expected behavior - email is already verified. No action needed.

### Issue: "Too many requests"

**Solution**: Wait 15 minutes or change rate limit in `emailVerification.ts`

### Issue: No verification link in logs

**Solution**: Check `RESEND_API_KEY` is not set (for dev mode) or check Resend dashboard

### Issue: Token expired

**Solution**: Request new verification email - tokens expire after 1 hour

---

**Save these scripts for automated testing during deployment!**

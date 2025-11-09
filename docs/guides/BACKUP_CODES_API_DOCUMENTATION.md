# 🔐 Backup Codes API Documentation
## Advancia Pay Ledger - Authentication Recovery System

**Domain**: advanciapayledger.com  
**API Base URL**: https://api.advanciapayledger.com  
**Version**: 1.0  
**Last Updated**: October 18, 2025

---

## 📋 Overview

The Backup Codes system provides emergency authentication recovery for users who cannot access their primary authentication methods (email OTP, SMS OTP). Each user can generate 8 single-use backup codes that can be used to gain account access.

---

## 🔑 Authentication

Most endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 📡 API Endpoints

### 1. Generate Backup Codes

**POST** `/api/auth/generate-backup-codes`

Generates 8 new backup codes for the authenticated user. Any existing backup codes are invalidated.

#### Headers:
```json
{
  "Authorization": "Bearer <jwt-token>",
  "x-api-key": "<api-key>",
  "Content-Type": "application/json"
}
```

#### Request Body:
```json
{}
```
(No body required - user is identified from JWT token)

#### Success Response (200 OK):
```json
{
  "success": true,
  "message": "Backup codes generated successfully",
  "codes": [
    "054888320",
    "663159158",
    "431051915",
    "652737970",
    "727885936",
    "491612534",
    "250800293",
    "010948514"
  ],
  "warning": "Save these codes securely. They will not be shown again."
}
```

#### Error Responses:

**401 Unauthorized:**
```json
{
  "error": "Authorization token required"
}
```

**401 Invalid Token:**
```json
{
  "error": "Invalid or expired token"
}
```

**500 Server Error:**
```json
{
  "error": "Failed to generate backup codes"
}
```

#### Notes:
- ⚠️ **CRITICAL**: Codes are only shown once during generation
- All previous backup codes are invalidated when new ones are generated
- Codes are 9-digit numbers
- Codes are hashed using bcrypt before storage
- Each code can only be used once

#### Example Usage (curl):
```bash
curl -X POST https://api.advanciapayledger.com/api/auth/generate-backup-codes \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json"
```

#### Example Usage (JavaScript):
```javascript
const response = await fetch('https://api.advanciapayledger.com/api/auth/generate-backup-codes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Backup codes:', data.codes);
// Save these codes securely!
```

---

### 2. Verify Backup Code

**POST** `/api/auth/verify-backup-code`

Authenticates a user using a backup code. The code is marked as used after successful verification.

#### Headers:
```json
{
  "x-api-key": "<api-key>",
  "Content-Type": "application/json"
}
```

#### Request Body:
```json
{
  "email": "user@example.com",
  "code": "054888320"
}
```

#### Success Response (200 OK):
```json
{
  "success": true,
  "message": "Authentication successful via backup code",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "remainingBackupCodes": 7,
  "warning": "You have 3 or fewer backup codes remaining. Consider generating new ones."
}
```

#### Error Responses:

**400 Bad Request:**
```json
{
  "error": "Email and code are required"
}
```

**400 No Codes:**
```json
{
  "error": "No backup codes available. Please use another authentication method or contact support."
}
```

**401 Invalid User:**
```json
{
  "error": "Invalid credentials"
}
```

**401 Invalid Code:**
```json
{
  "error": "Invalid backup code"
}
```

**500 Server Error:**
```json
{
  "error": "Failed to verify backup code"
}
```

#### Notes:
- The backup code is marked as used immediately after successful verification
- A JWT token is issued with 7-day expiration
- User's `lastLogin` timestamp is updated
- Warning is shown when 3 or fewer codes remain
- Once used, a code cannot be used again

#### Example Usage (curl):
```bash
curl -X POST https://api.advanciapayledger.com/api/auth/verify-backup-code \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "054888320"
  }'
```

#### Example Usage (JavaScript):
```javascript
const response = await fetch('https://api.advanciapayledger.com/api/auth/verify-backup-code', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    code: '054888320'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('authToken', data.token);
  console.log('Logged in!', data.user);
  console.log('Remaining codes:', data.remainingBackupCodes);
}
```

---

### 3. Get Backup Codes Status

**GET** `/api/auth/backup-codes-status`

Retrieves the status of backup codes for the authenticated user (without revealing the codes themselves).

#### Headers:
```json
{
  "Authorization": "Bearer <jwt-token>",
  "x-api-key": "<api-key>"
}
```

#### Request Body:
None (GET request)

#### Success Response (200 OK):
```json
{
  "success": true,
  "totalCodes": 8,
  "unusedCodes": 7,
  "usedCodes": 1,
  "hasBackupCodes": true,
  "needsRegeneration": false
}
```

**When regeneration is needed:**
```json
{
  "success": true,
  "totalCodes": 8,
  "unusedCodes": 3,
  "usedCodes": 5,
  "hasBackupCodes": true,
  "needsRegeneration": true
}
```

**When no codes exist:**
```json
{
  "success": true,
  "totalCodes": 0,
  "unusedCodes": 0,
  "usedCodes": 0,
  "hasBackupCodes": false,
  "needsRegeneration": true
}
```

#### Error Responses:

**401 Unauthorized:**
```json
{
  "error": "Authorization token required"
}
```

**401 Invalid Token:**
```json
{
  "error": "Invalid or expired token"
}
```

**500 Server Error:**
```json
{
  "error": "Failed to get backup codes status"
}
```

#### Notes:
- Does not reveal actual backup codes
- `needsRegeneration` is `true` when 3 or fewer codes remain
- Use this endpoint to display status in user settings
- Safe to call frequently for UI updates

#### Example Usage (curl):
```bash
curl -X GET https://api.advanciapayledger.com/api/auth/backup-codes-status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "x-api-key: your-api-key"
```

#### Example Usage (JavaScript):
```javascript
const response = await fetch('https://api.advanciapayledger.com/api/auth/backup-codes-status', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'x-api-key': apiKey
  }
});

const status = await response.json();
console.log(`Backup codes: ${status.unusedCodes} of ${status.totalCodes} remaining`);

if (status.needsRegeneration) {
  alert('Consider generating new backup codes!');
}
```

---

## 🔄 Typical User Flows

### Flow 1: Initial Setup (First Time)

1. User registers or logs in normally
2. User navigates to Settings → Security
3. Frontend calls `POST /api/auth/generate-backup-codes`
4. Backend returns 8 codes
5. Frontend displays codes with instructions to save them
6. User saves codes in password manager
7. User confirms and codes are no longer shown

### Flow 2: Using a Backup Code (Emergency)

1. User attempts to log in but can't access email/SMS
2. User clicks "Use backup code" on login page
3. User enters email and one backup code
4. Frontend calls `POST /api/auth/verify-backup-code`
5. Backend validates code and returns JWT token
6. User is logged in
7. Backend marks code as used (7 codes remaining)
8. User sees warning if 3 or fewer codes remain

### Flow 3: Regenerating Codes

1. User logs in normally
2. User navigates to Settings → Security
3. Frontend calls `GET /api/auth/backup-codes-status`
4. UI shows "3 of 8 codes remaining" with warning
5. User clicks "Generate New Codes"
6. Frontend calls `POST /api/auth/generate-backup-codes`
7. Backend invalidates old codes and generates 8 new ones
8. User saves new codes securely

### Flow 4: Checking Status

1. User visits Settings → Security page
2. Frontend calls `GET /api/auth/backup-codes-status`
3. UI displays backup codes status
4. If `needsRegeneration` is true, show regeneration prompt

---

## 🗄️ Database Schema

```sql
CREATE TABLE "backup_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,            -- Hashed with bcrypt
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "backup_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "backup_codes_code_key" ON "backup_codes"("code");
CREATE INDEX "backup_codes_userId_idx" ON "backup_codes"("userId");
CREATE INDEX "backup_codes_code_idx" ON "backup_codes"("code");
CREATE INDEX "backup_codes_isUsed_idx" ON "backup_codes"("isUsed");
```

---

## 🔒 Security Considerations

### Storage
- ✅ Codes are hashed with bcrypt before storage
- ✅ Plain codes are ONLY returned during generation
- ✅ Codes cannot be retrieved after generation
- ✅ Used codes are marked and cannot be reused

### Rate Limiting
Consider implementing:
- Max 3 failed verification attempts per hour
- Max 5 code generations per day
- Exponential backoff on failed attempts

### Best Practices
- ✅ Always use HTTPS in production
- ✅ Require API key for all requests
- ✅ Validate JWT tokens properly
- ✅ Log all backup code usage for audit
- ✅ Notify users via email when codes are used
- ✅ Implement account lockout after too many failures

---

## 📊 Audit Logging

All backup code operations should be logged:

```typescript
// Code generation
{
  action: "GENERATE_BACKUP_CODES",
  userId: "user-id",
  metadata: { codesGenerated: 8 }
}

// Code verification
{
  action: "VERIFY_BACKUP_CODE",
  userId: "user-id",
  metadata: { 
    success: true,
    remainingCodes: 7
  }
}

// Status check
{
  action: "CHECK_BACKUP_CODES_STATUS",
  userId: "user-id"
}
```

---

## 🧪 Testing

### Test Code Generation
```bash
# Get auth token first
TOKEN=$(curl -X POST https://api.advanciapayledger.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# Generate codes
curl -X POST https://api.advanciapayledger.com/api/auth/generate-backup-codes \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-api-key: $API_KEY" \
  | jq
```

### Test Code Verification
```bash
# Use one of the codes from generation
curl -X POST https://api.advanciapayledger.com/api/auth/verify-backup-code \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "email": "test@example.com",
    "code": "054888320"
  }' \
  | jq
```

### Test Status Check
```bash
curl -X GET https://api.advanciapayledger.com/api/auth/backup-codes-status \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-api-key: $API_KEY" \
  | jq
```

---

## 🐛 Troubleshooting

### Issue: "Authorization token required"
**Solution**: Include JWT token in Authorization header: `Bearer <token>`

### Issue: "Invalid backup code"
**Solution**: 
- Verify the code hasn't been used before
- Check for typos or extra spaces
- Ensure code belongs to the correct user
- Confirm backup codes were generated for this account

### Issue: "No backup codes available"
**Solution**: 
- User needs to generate backup codes first
- OR all codes have been used (generate new ones)
- Use alternative authentication method

### Issue: Codes not working after generation
**Solution**:
- Wait a few seconds for database sync
- Check database migration was run
- Verify codes were saved correctly
- Check server logs for errors

---

## 📞 Support

**Questions?** Contact support@advanciapayledger.com

**Documentation**: 
- Main Guide: `BACKUP_CODES_GUIDE.md`
- Storage Info: `BACKUP_CODES_STORED.md`
- Your Codes: `AUTH_BACKUP_KEYS.md` (local only, not in Git)

---

## 📝 Changelog

### Version 1.0 (October 18, 2025)
- ✅ Initial implementation
- ✅ Generate backup codes endpoint
- ✅ Verify backup code endpoint
- ✅ Get status endpoint
- ✅ Database migration
- ✅ Comprehensive documentation

---

**Platform**: Advancia Pay Ledger  
**Domain**: advanciapayledger.com  
**API**: api.advanciapayledger.com  
**Version**: 1.0  
**Status**: Production Ready ✅

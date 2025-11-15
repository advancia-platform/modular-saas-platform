# Admin 2FA Setup Guide

## Admin Account Credentials

**Email**: `admin@advvancia.com`  
**Password**: `admin123`  
**Role**: `admin`

## TOTP Configuration

### TOTP Secret

```
LBBCQ32QOUZEKZSBNFYD6YRMLZMGYPS3
```

### Setup with Authenticator App

1. **Google Authenticator / Authy / Microsoft Authenticator**

   - Open your authenticator app
   - Select "Add Account" or "+"
   - Choose "Enter a setup key" or "Manual entry"
   - Enter these details:
     - **Account name**: Advancia Pay Admin
     - **Key**: `LBBCQ32QOUZEKZSBNFYD6YRMLZMGYPS3`
     - **Type**: Time-based
   - Save the account

2. **Generate TOTP Token**
   - The app will generate a 6-digit code every 30 seconds
   - Use this code when logging in as admin

### QR Code URL (Alternative Method)

```
otpauth://totp/Advancia%20Pay%20Ledger:admin@advvancia.com?secret=LBBCQ32QOUZEKZSBNFYD6YRMLZMGYPS3&issuer=Advancia%20Pay%20Ledger
```

You can generate a QR code from this URL using any QR code generator online, then scan it with your authenticator app.

## Backup Codes

The admin account has **5 backup codes** stored as bcrypt hashes in the database. These are single-use codes for emergency access if you lose access to your authenticator app.

**Note**: The raw backup codes were generated during seeding but are stored as hashes. To use backup codes in production:

1. Generate new backup codes via the admin panel
2. Store them securely (password manager recommended)
3. Each code can only be used once

### Viewing Backup Codes from Database

```bash
docker exec advancia-postgres psql -U postgres -d advvancia -t -c "SELECT jsonb_pretty(backup_codes) FROM users WHERE email='admin@advvancia.com'"
```

## Testing Admin Login

### Method 1: Login with TOTP (Recommended)

**POST** `http://localhost:4000/api/auth/admin-login`

```json
{
  "email": "admin@advvancia.com",
  "password": "admin123",
  "token": "123456"
}
```

Replace `123456` with the 6-digit code from your authenticator app.

### Method 2: Login with Backup Code (Emergency)

**POST** `http://localhost:4000/api/auth/admin-login`

```json
{
  "email": "admin@advvancia.com",
  "password": "admin123",
  "backupCode": "generated-backup-code"
}
```

**Important**: Each backup code can only be used once. After use, it's automatically removed from the database.

## Lockout Policy

The admin account is protected by the same lockout policy as regular users:

- **Max failed attempts**: 5
- **Lockout duration**: 15 minutes
- **Applies to**:
  - Wrong password
  - Invalid TOTP token
  - Invalid backup code

After 5 failed attempts, the account will be locked for 15 minutes, regardless of correct credentials.

## Testing with Postman

The Postman collection includes pre-configured requests:

1. **Admin Login (TOTP)**: Tests standard 2FA login
2. **Admin Login (Backup Code)**: Tests emergency access

Both requests automatically extract and store the JWT token for subsequent authenticated requests.

## Security Best Practices

1. ✅ Change default password immediately in production
2. ✅ Store TOTP secret securely (never commit to git)
3. ✅ Generate and save new backup codes
4. ✅ Use environment variables for sensitive data
5. ✅ Enable audit logging for admin actions
6. ✅ Monitor failed login attempts
7. ✅ Regularly rotate backup codes

## Troubleshooting

### TOTP Token Always Fails

- Check your device's time synchronization (TOTP requires accurate time)
- Verify the secret key was entered correctly
- Try resetting the TOTP secret and rescanning

### Account Locked

- Wait 15 minutes for automatic unlock
- Or manually reset via database:
  ```sql
  UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE email = 'admin@advvancia.com';
  ```

### Lost Authenticator Access

- Use backup codes for emergency access
- Contact system administrator to reset 2FA

## Production Deployment Checklist

Before deploying to production:

- [ ] Change admin password from default `admin123`
- [ ] Generate new TOTP secret
- [ ] Create new backup codes
- [ ] Store secrets in secure vault (e.g., AWS Secrets Manager)
- [ ] Update environment variables
- [ ] Test 2FA login
- [ ] Document recovery procedures
- [ ] Set up monitoring alerts for failed login attempts

---

**Created**: November 14, 2025  
**Status**: Development Environment  
**Backend**: http://localhost:4000

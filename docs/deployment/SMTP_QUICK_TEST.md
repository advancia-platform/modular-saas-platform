# SMTP Quick Test Guide

## Prerequisites

Ensure your `backend/.env` contains:

```bash
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=noreply@yourdomain.tld
EMAIL_REPLY_TO=support@yourdomain.tld
API_KEY=dev-api-key-123-change-in-production
```

**Gmail App Password:**

- Required if 2FA is enabled (recommended)
- Create at: https://myaccount.google.com/apppasswords
- Select "Mail" and "Other (Custom name)"
- Copy the 16-character password

---

## Method 1: CLI Script (Easiest)

Run the test script directly:

```powershell
cd backend
tsx scripts/test-smtp.ts your-email@gmail.com
```

Expected output:

```
📧 Testing SMTP configuration...
   From: noreply@yourdomain.tld
   Reply-To: support@yourdomain.tld
   To: your-email@gmail.com
   SMTP: Gmail (your-gmail@gmail.com)

✅ Email sent successfully!
   Message ID: <...>
   Response: 250 2.0.0 OK ...

🎉 SMTP configuration is working correctly!
```

---

## Method 2: HTTP Endpoint (No DB Required)

Start the backend server:

```powershell
cd backend
npm run dev
```

Send a POST request:

**Using PowerShell:**

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = "dev-api-key-123-change-in-production"
}

$body = @{
    to = "your-email@gmail.com"
    subject = "SMTP Test"
    message = "Hello from Advancia"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/test-smtp" -Method POST -Headers $headers -Body $body
```

**Using cURL:**

```bash
curl -X POST http://localhost:4000/api/auth/test-smtp \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-123-change-in-production" \
  -d '{"to":"your-email@gmail.com","subject":"SMTP Test","message":"Hello from Advancia"}'
```

Expected response:

```json
{
  "message": "SMTP test email sent",
  "to": "your-email@gmail.com"
}
```

---

## Method 3: Authenticated Notification Test

Requires a JWT token (register/login first).

1. Register a user:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = "dev-api-key-123-change-in-production"
}

$body = @{
    email = "test@example.com"
    password = "Password123!"
    username = "testuser"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/register" -Method POST -Headers $headers -Body $body
$token = $response.token
```

2. Send test email:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = "dev-api-key-123-change-in-production"
    "Authorization" = "Bearer $token"
}

$body = @{
    subject = "Notifications SMTP Check"
    message = "This came from notificationService."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/auth/test-email" -Method POST -Headers $headers -Body $body
```

Expected response:

```json
{
  "message": "Test email enqueued"
}
```

---

## Troubleshooting

### "Invalid login" or EAUTH error

- Verify EMAIL_USER is your Gmail address
- Verify EMAIL_PASSWORD is an App Password (not your regular password)
- Create App Password: https://myaccount.google.com/apppasswords
- Restart backend server after changing .env

### Emails land in spam

- Add SPF record: `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all`
- Add DMARC record: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.tld`
- See `FREE_CUSTOM_EMAIL_SETUP.md` for full DNS setup

### "via gmail.com" appears in email

- This is normal when using Gmail SMTP with a custom domain
- Gmail personal accounts cannot DKIM-sign for your domain
- For perfect DKIM/DMARC alignment, use Zoho Mail Free for outbound

### Port 4000 already in use

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
cd backend
npm run dev
```

---

## What Gets Tested

✅ Gmail SMTP authentication (EMAIL_USER/EMAIL_PASSWORD)
✅ Custom From header (EMAIL_FROM)
✅ Custom Reply-To header (EMAIL_REPLY_TO)
✅ Email deliverability
✅ HTML email formatting

---

## Next Steps

1. **Test locally** using Method 1 (CLI script)
2. **Set up custom domain** (see `FREE_CUSTOM_EMAIL_SETUP.md`)
3. **Add DNS records** for SPF/DMARC
4. **Configure Gmail "Send As"** for your custom domain
5. **Deploy to production** with environment variables set

---

## Quick Reference

| Env Variable   | Example                | Purpose                |
| -------------- | ---------------------- | ---------------------- |
| EMAIL_USER     | your-gmail@gmail.com   | Gmail SMTP auth        |
| EMAIL_PASSWORD | abcd efgh ijkl mnop    | Gmail App Password     |
| EMAIL_FROM     | noreply@yourdomain.tld | Visible "From" address |
| EMAIL_REPLY_TO | support@yourdomain.tld | Where replies go       |

---

**Need help?** See `FREE_CUSTOM_EMAIL_SETUP.md` for the complete free custom email guide.

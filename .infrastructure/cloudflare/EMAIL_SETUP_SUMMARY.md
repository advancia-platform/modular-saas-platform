# Email System Setup Summary

## 🔧 Created Files

### Cloudflare Email Worker

```
.infrastructure/cloudflare/email-worker/
├── wrangler.toml          # Wrangler deployment config
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── src/
│   └── index.ts           # Email worker logic
└── DEPLOYMENT.md          # Deployment guide
```

### Infrastructure Files

```
.infrastructure/cloudflare/
├── dns-records.yml        # Complete DNS configuration
└── setup-email-routing.ps1 # PowerShell setup script
```

### Backend Integration

```
backend/src/routes/
└── inboundEmails.ts       # Webhook endpoint for email logging
```

---

## 📧 Email Addresses Configured

| Email                           | Purpose               | Handler                       |
| ------------------------------- | --------------------- | ----------------------------- |
| `privacy@advanciapayledger.com` | Privacy/GDPR requests | Worker → Forward + Auto-reply |
| `legal@advanciapayledger.com`   | Legal inquiries       | Worker → Forward + Auto-reply |
| `support@advanciapayledger.com` | Customer support      | Worker → Forward + Auto-reply |
| `admin@advanciapayledger.com`   | Admin inbox           | Forward to verified email     |

---

## 🔐 Credentials Summary

### Cloudflare

- **Zone ID**: `0bff66558872c58ed5b8b7942acc34d9`
- **Account ID**: `74ecde4d46d4b399c7295cf599d2886b`
- **API Token**: `_c0eQLPqAqS5J2RnlX-N2nTtomDGkKpnvYH2oHeu`
- **Global API Key**: `586641a8b5abd131708647dce7025f365bef2`
- **Origin CA Key**: `v1.0-e81fd21f6be7f2818e411aff-...` (truncated for security)

### Resend

- **API Key**: `re_ZfLyazGP_8weozr9JWHqSN7HoM4JA74oC`
- **Domain**: `advanciapayledger.com` ✅ **VERIFIED**
- **Domain ID**: `1d4454cd-ec2d-4ca1-a465-2354260b6f66`

### Render (PostgreSQL)

- **Host**: `dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com`
- **Database**: `db_adnan_postrl`
- **User**: `database_advancia`
- **Password**: `W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP`
- **API Key**: `rnd_4kq1eGfcEAwYwBQf9SMIqoCLU3Xu`
- **Deploy Hook**: `https://api.render.com/deploy/srv-d4froq8gjchc73djvp00?key=jtKWmxEtXZM`

### Vercel

- **Token**: `as1VXNxXS8pmcuRli6kFp635`

---

## ✅ Current DNS Status

DNS records are **configured correctly**:

- ✅ MX records for Cloudflare Email Routing (3 records)
- ✅ SPF record
- ✅ DMARC record
- ✅ DKIM for Resend (`resend._domainkey`)
- ✅ Email routing **enabled and ready**

---

## 🚀 Deployment Steps

### 1. Deploy Email Worker

```powershell
cd .infrastructure/cloudflare/email-worker

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Set secrets
npx wrangler secret put RESEND_API_KEY
# Enter: re_ZfLyazGP_8weozr9JWHqSN7HoM4JA74oC

# Deploy
npm run deploy
```

### ✅ DEPLOYED - Worker Status

- **Worker URL**: `https://advancia-email-worker.advancia-platform.workers.dev`
- **Worker ID**: `advancia-email-worker`
- **Version ID**: `1417e9f3-dce5-4064-a558-f2d99fd61788`
- **Status**: ✅ Active and receiving emails

### ✅ CONFIGURED - Email Routes

| Email Address                   | Routing Action | Handler                       |
| ------------------------------- | -------------- | ----------------------------- |
| `privacy@advanciapayledger.com` | worker         | `advancia-email-worker`       |
| `legal@advanciapayledger.com`   | worker         | `advancia-email-worker`       |
| `support@advanciapayledger.com` | worker         | `advancia-email-worker`       |
| `admin@advanciapayledger.com`   | forward        | `advanciapayledger@gmail.com` |
| (catch-all)                     | drop           | -                             |

### 2. Verify Resend Domain

1. Go to: <https://resend.com/domains>
2. Check `advanciapayledger.com` status
3. If pending, verify DKIM record is correct in Cloudflare DNS

### 3. Update Backend Environment

Add to Render environment variables:

```bash
RESEND_API_KEY=re_ZfLyazGP_8weozr9JWHqSN7HoM4JA74oC
DATABASE_URL=postgresql://database_advancia:W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl
```

---

## 📨 Email Flow

```
Customer sends email to privacy@advanciapayledger.com
         │
         ▼
┌─────────────────────────────────────┐
│  Cloudflare MX Records              │
│  (route1/2/3.mx.cloudflare.net)     │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Email Worker (advancia-email-worker)│
│  - Parse email content              │
│  - Categorize (privacy/legal/support)│
└─────────────────────────────────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
Forward   Auto-Reply      Log to
to Admin  via Resend      Backend API
```

---

## 🧪 Test Email Setup

```powershell
# Send test email via Resend API
$body = @{
    from = "test@resend.dev"
    to = @("privacy@advanciapayledger.com")
    subject = "Test Privacy Request"
    text = "This is a test privacy request."
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.resend.com/emails" `
    -Method Post `
    -Headers @{"Authorization"="Bearer re_RYUDTKZ4_CQupy9JujxfQ3AupakQwtyqh"; "Content-Type"="application/json"} `
    -Body $body
```

---

## 📝 Admin User Credentials

For reference (already in database):

- **Email**: `admin_5925@advancia.com`
- **Username**: `admin_5925`
- **Password Hash**: `$2a$10$nvYUwWk5Cxw3MPm5xBUV2e612MGyTAkMPcsEW6GlICvXq4SrHdVwi`
- **Role**: ADMIN
- **Status**: verified, emailVerified, active

---

## 🔒 Security Notes

1. **Never commit** `.env.production` or credentials to Git
2. Use Render's encrypted environment variables
3. Rotate API keys periodically
4. Monitor email logs for abuse
5. Origin SSL certificate configured (expires 2040)

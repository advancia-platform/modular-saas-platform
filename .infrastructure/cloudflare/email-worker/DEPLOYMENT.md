# Cloudflare Email Worker Deployment Guide

## Prerequisites

1. **Cloudflare Account** with Email Routing enabled
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Resend API Key**: `re_ZfLyazGP_8weozr9JWHqSN7HoM4JA74oC` ✅ Domain verified

## DNS Records Required

Add these records in Cloudflare DNS for `advanciapayledger.com`:

### MX Records (Email Routing)

| Type | Name | Content                    | Priority | TTL  |
| ---- | ---- | -------------------------- | -------- | ---- |
| MX   | @    | `route1.mx.cloudflare.net` | 69       | Auto |
| MX   | @    | `route2.mx.cloudflare.net` | 12       | Auto |
| MX   | @    | `route3.mx.cloudflare.net` | 84       | Auto |

### TXT Records (SPF/DKIM)

| Type | Name    | Content                                                            |
| ---- | ------- | ------------------------------------------------------------------ |
| TXT  | @       | `v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all` |
| TXT  | \_dmarc | `v=DMARC1; p=quarantine; rua=mailto:admin@advanciapayledger.com`   |

### DKIM for Resend

Add Resend's DKIM records (get from Resend dashboard after domain verification):

- `resend._domainkey.advanciapayledger.com`

## Setup Steps

### 1. Configure Cloudflare Email Routing

1. Go to **Cloudflare Dashboard** → **Email** → **Email Routing**
2. Enable Email Routing for `advanciapayledger.com`
3. Add email addresses:
   - `privacy@advanciapayledger.com` → Route to Worker
   - `legal@advanciapayledger.com` → Route to Worker
   - `support@advanciapayledger.com` → Route to Worker (or forward)

### 2. Deploy the Email Worker

```bash
cd .infrastructure/cloudflare/email-worker

# Install dependencies
npm install

# Authenticate with Cloudflare
wrangler login

# Set secrets
wrangler secret put RESEND_API_KEY
# Enter: re_ZfLyazGP_8weozr9JWHqSN7HoM4JA74oC

wrangler secret put FORWARD_TO
# Enter: admin@advanciapayledger.com

# Deploy worker
npm run deploy
```

### 3. Link Worker to Email Routes

1. Go to **Email** → **Email Routing** → **Routes**
2. For each email address, set action to "Send to Worker"
3. Select `advancia-email-worker`

## Environment Variables

| Variable          | Value                                  | Description                 |
| ----------------- | -------------------------------------- | --------------------------- |
| `RESEND_API_KEY`  | `re_ZfLyazGP_8weozr9JWHqSN7HoM4JA74oC` | Resend API for auto-replies |
| `FORWARD_TO`      | `admin@advanciapayledger.com`          | Admin email for forwarding  |
| `DOMAIN`          | `advanciapayledger.com`                | Domain name                 |
| `COMPANY_NAME`    | `Advancia Pay Ledger`                  | Company name                |
| `BACKEND_API_URL` | `https://api.advanciapayledger.com`    | Backend API (optional)      |

## Credentials Reference

### Cloudflare

- **Zone ID**: `0bff66558872c58ed5b8b7942acc34d9`
- **Account ID**: `74ecde4d46d4b399c7295cf599d2886b`
- **API Token**: `_c0eQLPqAqS5J2RnlX-N2nTtomDGkKpnvYH2oHeu`

### Resend

- **API Key**: `re_RYUDTKZ4_CQupy9JujxfQ3AupakQwtyqh`

### Database (Render PostgreSQL)

- **Host**: `dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com`
- **Port**: `5432`
- **Database**: `db_adnan_postrl`
- **Username**: `database_advancia`
- **Password**: `W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP`
- **External URL**: `postgresql://database_advancia:W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl`

### Render

- **Deploy Hook**: `https://api.render.com/deploy/srv-d4froq8gjchc73djvp00?key=jtKWmxEtXZM`
- **API Key**: `rnd_4kq1eGfcEAwYwBQf9SMIqoCLU3Xu`

### Vercel

- **Token**: `as1VXNxXS8pmcuRli6kFp635`

## Testing

### Test Email Routing

```bash
# Send test email
curl -X POST https://api.resend.com/emails \\
  -H "Authorization: Bearer re_RYUDTKZ4_CQupy9JujxfQ3AupakQwtyqh" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "test@resend.dev",
    "to": ["privacy@advanciapayledger.com"],
    "subject": "Test Privacy Request",
    "text": "This is a test privacy request."
  }'
```

### Check Worker Logs

```bash
wrangler tail advancia-email-worker
```

## Email Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Incoming Email Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customer → privacy@advanciapayledger.com                       │
│      │                                                          │
│      ▼                                                          │
│  Cloudflare Email Routing (MX Records)                          │
│      │                                                          │
│      ▼                                                          │
│  Email Worker (advancia-email-worker)                           │
│      │                                                          │
│      ├──► Parse & Categorize (privacy/legal/support)            │
│      │                                                          │
│      ├──► Forward to admin@advanciapayledger.com                │
│      │                                                          │
│      ├──► Send Auto-Reply via Resend                            │
│      │                                                          │
│      └──► Log to Backend API (optional)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Email Not Arriving

1. Check MX records: `dig MX advanciapayledger.com`
2. Verify Email Routing is enabled
3. Check Worker logs: `wrangler tail`

### Auto-Reply Not Sending

1. Verify Resend API key is correct
2. Check Resend domain verification
3. Check Worker logs for errors

### SPF/DKIM Issues

1. Run: `dig TXT advanciapayledger.com`
2. Verify SPF includes Cloudflare and Resend
3. Check DMARC policy

## Security Notes

- Never commit secrets to Git
- Use `wrangler secret` for sensitive values
- Rotate API keys periodically
- Monitor for abuse/spam

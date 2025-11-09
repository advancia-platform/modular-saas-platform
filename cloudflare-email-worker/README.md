# CloudFlare Email Worker

Automatically handles incoming emails to support@advanciapayledger.com

## Features

✅ Forwards emails to your Gmail
✅ Optionally creates support tickets in your backend
✅ Logs all incoming emails
✅ Error handling and email rejection on failure

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to CloudFlare

```bash
wrangler login
```

### 3. Deploy the Worker

```bash
cd /root/projects/advancia-pay-ledger/cloudflare-email-worker
npm install
wrangler deploy
```

### 4. Configure Email Routing in CloudFlare Dashboard

1. Go to: https://dash.cloudflare.com/
2. Select: advanciapayledger.com
3. Click: Email → Email Routing
4. Click: Email Workers tab
5. Click: Create Email Worker
6. Select: advancia-email-worker
7. Add route: support@advanciapayledger.com → advancia-email-worker

### 5. Set Environment Variables

In CloudFlare Dashboard → Workers → advancia-email-worker → Settings → Variables:

```
BACKEND_API_URL = https://api.advanciapayledger.com
API_SECRET_KEY = your-secret-key-here
```

## How It Works

1. **Email arrives** at support@advanciapayledger.com
2. **Worker processes** the email
3. **Forwards** to advanciapayledger@gmail.com
4. **Creates support ticket** in backend (optional)
5. **Logs** the event

## Testing

Send test email to: support@advanciapayledger.com

Check:
- ✅ Email arrives in your Gmail
- ✅ Support ticket created in backend (if API configured)
- ✅ Check CloudFlare Workers logs

## Manual Deployment Steps

Since you need to do this in CloudFlare Dashboard:

1. **Enable Email Routing:**
   - CloudFlare → Email → Email Routing → Enable

2. **Add Destination:**
   - Add: advanciapayledger@gmail.com
   - Verify the email

3. **Create Simple Route (No Worker):**
   - Custom address: support@advanciapayledger.com
   - Action: Send to → advanciapayledger@gmail.com

OR

4. **Deploy Worker (Advanced):**
   - Run: `wrangler deploy`
   - CloudFlare → Email Routing → Email Workers
   - Assign worker to support@ route

## Worker Code

The worker automatically:
- Forwards emails to Gmail
- Extracts sender, subject, content
- Sends to backend API (optional)
- Logs all activity

## Cost

✅ FREE - CloudFlare Email Workers are free
✅ UNLIMITED - No email limits

## Support

Questions? Check CloudFlare docs:
https://developers.cloudflare.com/email-routing/


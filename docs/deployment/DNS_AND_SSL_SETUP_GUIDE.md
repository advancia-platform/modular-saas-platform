# Step 2: DNS & SSL Configuration Guide

## Overview
This guide walks you through setting up DNS and SSL/TLS for your production domain: **advanciapayledger.com**

## Prerequisites
- Domain name: `advanciapayledger.com` (must be registered and have DNS control)
- Backend server IP or hostname (e.g., from Render.com, AWS, etc.)
- SSL certificate provider (Let's Encrypt is free)

## Architecture

```
┌─────────────────────────────────────────────┐
│       User Browser                          │
│  (https://advanciapayledger.com)            │
└─────────────────┬───────────────────────────┘
                  │
                  │ DNS A Record
                  ↓
┌─────────────────────────────────────────────┐
│  Domain Registrar DNS (GoDaddy, Namecheap)  │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┼─────────┐
        ↓                   ↓
┌───────────────┐    ┌──────────────┐
│ @ → IP        │    │ api → IP     │
│ (A record)    │    │ (A record)   │
└───────────────┘    └──────────────┘
        ↓                   ↓
┌──────────────────┐  ┌──────────────────┐
│ Frontend Server  │  │ Backend Server   │
│ (Vercel)         │  │ (Render/AWS)     │
└──────────────────┘  └──────────────────┘
        ↓                   ↓
    HTTPS                HTTPS
  Port 443             Port 443
```

## Step-by-Step DNS Configuration

### 1. Get Your Server Information

#### From Render.com (if using)
```bash
# Visit: https://dashboard.render.com
# For your backend service:
# - Service name: your-backend-service
# - Deployment URL: your-service.onrender.com
# - Get the Render IP (runs behind Render's infrastructure)
```

#### From AWS/Other Providers
```bash
# Get your backend server's public IP
# If behind load balancer, get the load balancer IP/DNS
```

### 2. Add DNS Records

**Provider:** GoDaddy, Namecheap, Cloudflare, AWS Route 53, etc.

#### Record 1: A Record for Frontend
```
Type:  A
Name:  @
Value: <frontend-server-ip>
TTL:   3600 (1 hour)
```

#### Record 2: A Record for Backend (Subdomain)
```
Type:  A
Name:  api
Value: <backend-server-ip>
TTL:   3600 (1 hour)
```

#### Record 3: CNAME Record (Optional, for www)
```
Type:  CNAME
Name:  www
Value: advanciapayledger.com
TTL:   3600 (1 hour)
```

#### Example DNS Configuration in Namecheap/GoDaddy:
```
Host                 Type   Value                        TTL
@                    A      123.45.67.89                 3600
api                  A      234.56.78.90                 3600
www                  CNAME  advanciapayledger.com        3600
```

### 3. Verify DNS Propagation

```bash
# Check DNS propagation (takes 24-48 hours to fully propagate)
nslookup advanciapayledger.com
nslookup api.advanciapayledger.com

# Or use online tool:
# https://www.whatsmydns.net/

# Expected output:
# advanciapayledger.com -> 123.45.67.89
# api.advanciapayledger.com -> 234.56.78.90
```

## Step-by-Step SSL/TLS Configuration

### Option 1: Using Let's Encrypt (Free) with Certbot

#### Install Certbot
```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# On CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### Generate Certificate
```bash
# Single domain
sudo certbot certonly --standalone -d advanciapayledger.com

# Multiple domains
sudo certbot certonly --standalone -d advanciapayledger.com -d api.advanciapayledger.com

# Wildcard (requires DNS challenge)
sudo certbot certonly --dns-route53 -d advanciapayledger.com -d '*.advanciapayledger.com'
```

#### Certificate Paths
```
/etc/letsencrypt/live/advanciapayledger.com/
├── cert.pem          # Certificate
├── chain.pem         # Chain
├── fullchain.pem     # Full chain (use this)
└── privkey.pem       # Private key (use this)
```

#### Auto-Renewal
```bash
# Enable auto-renewal (runs twice daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check renewal status
sudo certbot renew --dry-run
```

### Option 2: Using Render.com (Auto SSL)

If deploying on Render.com:

```bash
# Render automatically handles SSL/TLS for .onrender.com domains
# No additional configuration needed!

# For custom domain:
1. Go to Service Settings
2. Under "Custom Domains"
3. Add: advanciapayledger.com
4. Render automatically provisions Let's Encrypt certificate
```

### Option 3: Using AWS Certificate Manager (ACM)

```bash
# In AWS Console:
1. Services → Certificate Manager
2. Request Certificate
3. Add domain: advanciapayledger.com
4. Add subdomain: api.advanciapayledger.com
5. Validate via DNS (add CNAME record)
6. Use certificate in CloudFront/Load Balancer
```

## Backend Configuration

### 1. Update Environment Variables

```bash
# backend/.env
DATABASE_URL="postgresql://user:password@host:5432/advancia_ledger"
FRONTEND_URL="https://advanciapayledger.com"
BACKEND_URL="https://api.advanciapayledger.com"
JWT_SECRET="your-strong-32-char-secret-key"
SESSION_SECRET="your-strong-32-char-session-key"

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Stripe (Payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# API Protection
API_KEY="your-api-key-for-external-services"

# Node Environment
NODE_ENV="production"
PORT=4000
```

### 2. Configure HTTPS on Backend

#### Using Express with SSL Certificate
```typescript
import https from 'https';
import fs from 'fs';
import app from './app';

const options = {
  key: fs.readFileSync('/path/to/privkey.pem'),
  cert: fs.readFileSync('/path/to/fullchain.pem')
};

https.createServer(options, app).listen(443, () => {
  console.log('✅ Backend running on https://api.advanciapayledger.com');
});
```

#### Using Render.com or AWS (Recommended)
- Let the platform handle SSL/TLS
- Keep backend on HTTP (port 3000 or 4000)
- Platform handles HTTPS termination automatically

### 3. Update CORS Settings

```typescript
// backend/src/config/index.ts
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://advanciapayledger.com',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
};
```

## Frontend Configuration

### 1. Update API Base URL

```typescript
// frontend/src/config/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
  || 'https://api.advanciapayledger.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true
});
```

### 2. Environment Variables

```bash
# frontend/.env.production
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_APP_NAME="Advancia Pay Ledger"
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
```

### 3. Vercel Deployment

```bash
# If using Vercel for frontend:
1. Connect repository
2. Set environment variables
3. Add custom domain: advanciapayledger.com
4. Vercel handles SSL automatically
```

## Testing & Validation

### 1. Test DNS Resolution
```bash
# Terminal
nslookup advanciapayledger.com
nslookup api.advanciapayledger.com

# Expected:
# advanciapayledger.com name = 123.45.67.89
# api.advanciapayledger.com name = 234.56.78.90
```

### 2. Test SSL Certificate
```bash
# Check certificate
openssl s_client -connect api.advanciapayledger.com:443

# Expected: Certificate chain and "Verify return code: 0 (ok)"
```

### 3. Test Backend Endpoint
```bash
# HTTPS request to backend
curl -X GET https://api.advanciapayledger.com/health \
  -H "X-API-Key: your-api-key"

# Expected: 200 OK with health status
```

### 4. Test Frontend Access
```bash
# Visit in browser
https://advanciapayledger.com

# Check for:
# - No SSL warnings
# - Padlock icon in address bar
# - API calls working
```

## Troubleshooting

### Issue: DNS Not Resolving
```bash
# Wait 24-48 hours for full propagation
# Use https://www.whatsmydns.net/ to check global propagation
# Flush DNS cache:
# Linux: sudo systemctl restart systemd-resolved
# macOS: sudo dscacheutil -flushcache
# Windows: ipconfig /flushdns
```

### Issue: SSL Certificate Errors
```bash
# Clear browser cache and cookies
# Check certificate expiration:
openssl x509 -in /etc/letsencrypt/live/advanciapayledger.com/cert.pem -noout -dates

# Renew certificate manually:
sudo certbot renew --force-renewal
```

### Issue: Mixed Content Warning
```
# Ensure ALL resources are loaded over HTTPS
# In frontend code:
// ❌ Wrong
<img src="http://example.com/image.png" />

// ✅ Correct
<img src="https://example.com/image.png" />
```

### Issue: CORS Errors
```typescript
// Update backend CORS to match frontend URL
const corsOptions = {
  origin: 'https://advanciapayledger.com',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

## Security Checklist

- [ ] DNS records created and verified
- [ ] SSL certificate installed and renewed
- [ ] HTTPS enforced (redirect HTTP → HTTPS)
- [ ] HSTS header configured
- [ ] CORS properly configured
- [ ] API keys secured (not in code)
- [ ] Environment variables set on production server
- [ ] Rate limiting enabled on API
- [ ] CSRF protection enabled
- [ ] Database connection encrypted
- [ ] Secrets not exposed in logs

## Next Steps

After completing DNS & SSL configuration:

1. **Commit Changes**
   ```bash
   git add backend/src/config/index.ts frontend/src/config/api.ts
   git commit -m "config: Update URLs for production domain advanciapayledger.com"
   git push origin main
   ```

2. **Proceed to Step 3**
   - Set up production environment variables
   - Configure database for production
   - Set up Twilio and Stripe keys

3. **Deploy to Production**
   - Deploy backend to Render/AWS
   - Deploy frontend to Vercel
   - Run final testing

## Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Render.com Custom Domain Setup](https://render.com/docs/custom-domains)
- [AWS Certificate Manager](https://docs.aws.amazon.com/acm/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OWASP HSTS Header](https://owasp.org/www-project-secure-headers/)

---

**Status:** Ready to configure  
**Estimated Time:** 30-60 minutes  
**Difficulty:** Medium

✅ **Next:** Step 3 - Set Production Secrets

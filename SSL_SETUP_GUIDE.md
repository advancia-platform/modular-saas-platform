# SSL Certificate Setup Guide

**Date:** November 16, 2025

## Prerequisites

Before setting up SSL, you need:

1. ✅ A domain name (e.g., `advancia.com`)
2. ✅ Domain DNS pointing to your server IP: `157.245.8.131`
3. ✅ Certbot installed (already done ✓)
4. ✅ Nginx configured (already done ✓)

---

## Step 1: Configure DNS Records

Add these DNS records at your domain registrar:

| Type  | Name | Value         | TTL  |
| ----- | ---- | ------------- | ---- |
| A     | @    | 157.245.8.131 | 3600 |
| A     | www  | 157.245.8.131 | 3600 |
| CNAME | api  | @             | 3600 |

**Wait 5-10 minutes for DNS propagation**, then verify:

```bash
# Check DNS propagation
nslookup yourdomain.com
nslookup www.yourdomain.com
```

---

## Step 2: Update Nginx Configuration

SSH into your server and update the Nginx config with your domain:

```bash
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131

# Edit Nginx config
nano /etc/nginx/sites-available/advancia
```

Replace `server_name 157.245.8.131;` with:

```nginx
server_name yourdomain.com www.yourdomain.com;
```

Test and reload:

```bash
nginx -t
systemctl reload nginx
```

---

## Step 3: Obtain SSL Certificate

Run Certbot to automatically obtain and configure SSL:

```bash
# Interactive mode (recommended for first time)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Or non-interactive mode
certbot --nginx -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos --email your-email@example.com
```

**Certbot will:**

1. Validate domain ownership
2. Generate SSL certificate
3. Update Nginx config automatically
4. Set up auto-renewal

**Follow the prompts:**

- Enter email for renewal notices
- Agree to Terms of Service
- Choose: Redirect HTTP to HTTPS (recommended)

---

## Step 4: Verify SSL Certificate

Test your SSL certificate:

```bash
# Check certificate
curl -I https://yourdomain.com

# Test SSL configuration
curl https://yourdomain.com/api/health

# Check certificate details
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -dates
```

Online tools:

- https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
- https://www.sslshopper.com/ssl-checker.html

---

## Step 5: Update Backend CORS

Update your backend to accept HTTPS connections:

```bash
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131

cd /var/www/advancia/backend
nano .env
```

Update `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://frontend-theta-three-91.vercel.app
```

Restart backend:

```bash
pm2 restart advancia-backend
```

---

## Step 6: Update Vercel Frontend

Update Vercel environment variable:

1. Go to: https://vercel.com/advanciapayledger/frontend/settings/environment-variables
2. Edit `NEXT_PUBLIC_API_URL`
3. Change to: `https://yourdomain.com` (or `https://api.yourdomain.com`)
4. Redeploy frontend

Or via CLI:

```bash
vercel env rm NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://yourdomain.com
vercel --prod
```

---

## Step 7: Configure Auto-Renewal

Certbot automatically sets up renewal. Verify:

```bash
# Check renewal timer
systemctl status certbot.timer

# Test renewal (dry run)
certbot renew --dry-run

# View renewal config
cat /etc/letsencrypt/renewal/yourdomain.com.conf
```

Certificates auto-renew every 60 days. No action needed!

---

## Final Nginx Configuration (After SSL)

Your `/etc/nginx/sites-available/advancia` will look like:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:4000;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.yourdomain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = yourdomain.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 404; # managed by Certbot
}
```

---

## Troubleshooting

### DNS not propagating

```bash
# Check from different DNS servers
dig @8.8.8.8 yourdomain.com
dig @1.1.1.1 yourdomain.com

# Use online tools
https://dnschecker.org
```

### Certbot validation fails

```bash
# Ensure port 80 is open
ufw allow 80/tcp

# Check Nginx is serving on port 80
curl -I http://yourdomain.com

# Try standalone mode
systemctl stop nginx
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
systemctl start nginx
```

### Mixed content errors

- Ensure all API calls use `https://`
- Update `NEXT_PUBLIC_API_URL` to use HTTPS
- Check browser console for blocked resources

### Certificate renewal fails

```bash
# Check logs
cat /var/log/letsencrypt/letsencrypt.log

# Manual renewal
certbot renew --force-renewal
```

---

## Quick Commands

```bash
# Check SSL certificate expiry
certbot certificates

# Force renewal
certbot renew --force-renewal

# Revoke certificate
certbot revoke --cert-path /etc/letsencrypt/live/yourdomain.com/cert.pem

# Delete certificate
certbot delete --cert-name yourdomain.com
```

---

## Summary Checklist

- [ ] Domain DNS pointing to 157.245.8.131
- [ ] DNS propagated (test with nslookup)
- [ ] Nginx config updated with domain
- [ ] Certbot certificate obtained
- [ ] HTTPS working on domain
- [ ] Backend CORS updated with HTTPS URLs
- [ ] Vercel frontend updated with HTTPS API URL
- [ ] Auto-renewal tested
- [ ] Force HTTPS redirect enabled

---

## When You're Ready

1. **Get your domain**: Purchase from Namecheap, GoDaddy, etc.
2. **Update DNS**: Point to `157.245.8.131`
3. **Wait 10 minutes** for DNS propagation
4. **Run the commands above** in order
5. **Test**: `curl https://yourdomain.com/api/health`

**Estimated time:** 20-30 minutes (plus DNS propagation wait)

Your SSL certificate will be free via Let's Encrypt and auto-renew every 60 days! 🔒

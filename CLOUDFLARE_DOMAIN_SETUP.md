# Cloudflare Domain Setup - advanciapayledger.com

**Date:** November 16, 2025  
**Status:** ✅ Server configured and ready

---

## ✅ Server Configuration Complete

Your server is now configured to accept requests from:

- `advanciapayledger.com`
- `www.advanciapayledger.com`
- `api.advanciapayledger.com`
- Plus your existing IPs and Vercel frontend

---

## Step 1: Add DNS Records in Cloudflare

Go to your Cloudflare dashboard:
https://dash.cloudflare.com → Select `advanciapayledger.com` → DNS

**Add these records:**

### Primary Domain

| Type  | Name | Content         | Proxy Status | TTL  |
| ----- | ---- | --------------- | ------------ | ---- |
| A     | @    | `157.245.8.131` | ✅ Proxied   | Auto |
| A     | www  | `157.245.8.131` | ✅ Proxied   | Auto |
| CNAME | api  | @               | ✅ Proxied   | Auto |

**Important:** Click the orange cloud icon to enable "Proxied" mode!

---

## Step 2: Configure Cloudflare SSL/TLS

### Go to: SSL/TLS tab

**Set encryption mode:**

- ✅ **Full** or **Full (strict)**
  - Full: Works immediately
  - Full (strict): Best security (requires valid cert on server)

**Enable these settings:**

- ✅ Always Use HTTPS → ON
- ✅ Automatic HTTPS Rewrites → ON
- ✅ Minimum TLS Version → 1.2

### Go to: SSL/TLS → Edge Certificates

- ✅ Always Use HTTPS → ON
- ✅ HTTP Strict Transport Security (HSTS) → Enable

---

## Step 3: Configure Cloudflare Security (Optional but Recommended)

### Firewall Rules

Go to: Security → WAF

Create a rule to allow your IP:

- Rule name: "Allow Admin"
- Field: IP Address
- Operator: equals
- Value: Your IP
- Action: Allow

### DDoS Protection

- Already enabled by default with Cloudflare

### Bot Protection

Go to: Security → Bots

- Enable Bot Fight Mode (Free) or Super Bot Fight Mode (Pro+)

---

## Step 4: Update Vercel Frontend

Update your frontend to use the custom domain:

### Option A: Via Vercel Dashboard

1. Go to: https://vercel.com/advanciapayledger/frontend/settings/environment-variables
2. Edit `NEXT_PUBLIC_API_URL`
3. Change to: `https://advanciapayledger.com`
4. Save and redeploy

### Option B: Via CLI

```powershell
cd frontend
vercel env rm NEXT_PUBLIC_API_URL production
# When prompted, enter: https://advanciapayledger.com
vercel env add NEXT_PUBLIC_API_URL production
# Redeploy
vercel --prod
```

---

## Step 5: Add Custom Domain to Vercel (Optional)

To use `app.advanciapayledger.com` instead of Vercel's default:

### In Cloudflare:

Add CNAME record:
| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| CNAME | app | cname.vercel-dns.com | ⚪ DNS Only |

### In Vercel:

1. Go to: https://vercel.com/advanciapayledger/frontend/settings/domains
2. Click "Add Domain"
3. Enter: `app.advanciapayledger.com`
4. Follow verification steps

---

## Step 6: Test Your Setup

Wait 5-10 minutes for DNS propagation, then test:

```powershell
# Test DNS resolution
nslookup advanciapayledger.com
nslookup www.advanciapayledger.com
nslookup api.advanciapayledger.com

# Test HTTPS (after Cloudflare is configured)
curl https://advanciapayledger.com/api/health
curl https://www.advanciapayledger.com/api/health
curl https://api.advanciapayledger.com/api/health
```

---

## Current Configuration Summary

### ✅ Server (DigitalOcean)

- IP: `157.245.8.131`
- Nginx configured for custom domain
- Backend CORS updated with:
  - `https://advanciapayledger.com`
  - `https://www.advanciapayledger.com`
  - `https://api.advanciapayledger.com`
  - `https://frontend-theta-three-91.vercel.app`

### ⏳ Pending (Your Actions)

1. Add DNS records in Cloudflare
2. Configure SSL/TLS settings
3. Wait for DNS propagation (5-10 minutes)
4. Update Vercel frontend environment variable
5. Test all URLs

---

## Recommended URL Structure

After setup, your URLs will be:

| Service         | URL                                          | Purpose                                      |
| --------------- | -------------------------------------------- | -------------------------------------------- |
| **API**         | `https://advanciapayledger.com/api/*`        | Main API endpoints                           |
| **API Alt**     | `https://api.advanciapayledger.com/api/*`    | Alternative API access                       |
| **Website**     | `https://www.advanciapayledger.com`          | Marketing site (if added)                    |
| **App**         | `https://app.advanciapayledger.com`          | Frontend app (optional Vercel custom domain) |
| **Current App** | `https://frontend-theta-three-91.vercel.app` | Current frontend (works now)                 |

---

## Cloudflare Benefits You'll Get

✅ **Free SSL Certificate** - Automatic HTTPS  
✅ **DDoS Protection** - Enterprise-grade security  
✅ **Global CDN** - Faster loading worldwide  
✅ **Caching** - Reduced server load  
✅ **Analytics** - Traffic insights  
✅ **Firewall** - Custom security rules

---

## Troubleshooting

### DNS not propagating

```powershell
# Check from different DNS servers
nslookup advanciapayledger.com 8.8.8.8
nslookup advanciapayledger.com 1.1.1.1

# Online checker
# Visit: https://dnschecker.org
```

### SSL errors

- Make sure Cloudflare SSL mode is "Full" not "Flexible"
- Check that orange cloud (Proxied) is enabled
- Wait 5 minutes after changing settings

### 502 Bad Gateway

```bash
# Check if backend is running
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 "pm2 status"

# Check Nginx
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 "nginx -t && systemctl status nginx"
```

### Mixed content warnings

- Ensure all resources use HTTPS
- Update `NEXT_PUBLIC_API_URL` to use HTTPS
- Enable "Automatic HTTPS Rewrites" in Cloudflare

---

## Quick Commands

```powershell
# Check backend is accepting domain
curl https://advanciapayledger.com/api/health

# View Nginx config on server
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 "cat /etc/nginx/sites-available/advancia"

# View backend CORS settings
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 "grep ALLOWED_ORIGINS /var/www/advancia/backend/.env"

# Restart services if needed
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 "pm2 restart advancia-backend && systemctl reload nginx"
```

---

## Next Steps After DNS Propagation

1. ✅ Test all domain URLs
2. ✅ Update Vercel environment variable
3. ✅ Add custom domain to Vercel (optional)
4. ✅ Update any documentation with new URLs
5. ✅ Enable Cloudflare security features
6. ✅ Set up email forwarding (optional)

---

## Security Notes

**Cloudflare acts as a proxy:**

- All traffic goes through Cloudflare first
- SSL termination happens at Cloudflare
- Cloudflare connects to your server (port 80 is fine)
- Your server IP is hidden from attackers

**Recommended Cloudflare settings:**

- Enable "Under Attack Mode" if you get DDoS
- Set up Rate Limiting rules
- Configure Page Rules for caching
- Enable Bot Fight Mode

---

**🎉 Your server is ready! Complete the Cloudflare setup and test your custom domain!**

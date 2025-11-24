# 🌐 Nginx Configuration for Advancia Pay Ledger

Production-ready Nginx configuration for DigitalOcean Droplet deployment.

---

## 📁 Files in This Directory

-   **`advancia.conf`** - Complete Nginx configuration file
-   **Setup script location**: `../scripts/setup-nginx.sh` - Automated setup script

---

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# On your DigitalOcean Droplet
cd /app/-modular-saas-platform
sudo bash scripts/setup-nginx.sh
```

**This script will:**

1. ✅ Install Nginx (if not installed)
2. ✅ Copy configuration to `/etc/nginx/sites-available/`
3. ✅ Prompt for your domain name
4. ✅ Replace placeholder with your actual domain
5. ✅ Enable the site configuration
6. ✅ Test Nginx configuration
7. ✅ Reload Nginx service

---

### Option 2: Manual Setup

```bash
# 1. Copy configuration file to Nginx directory
sudo cp nginx/advancia.conf /etc/nginx/sites-available/advancia

# 2. Replace 'yourdomain.com' with your actual domain
sudo nano /etc/nginx/sites-available/advancia
# Change: yourdomain.com → advanciapayledger.com (or your domain)

# 3. Enable the site
sudo ln -s /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/

# 4. Remove default site
sudo rm /etc/nginx/sites-enabled/default

# 5. Test configuration
sudo nginx -t

# 6. Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate Setup

After Nginx is configured, secure your site with Let's Encrypt:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose redirect option (2 - redirect HTTP to HTTPS)
```

**Certbot will automatically:**

-   ✅ Obtain SSL certificates from Let's Encrypt
-   ✅ Update your Nginx configuration
-   ✅ Set up automatic renewal (via cron job)

**Test SSL renewal:**

```bash
sudo certbot renew --dry-run
```

---

## 🧪 Testing Your Configuration

### Test Backend API

```bash
# Local test (on droplet)
curl http://localhost:4000/api/health

# Remote test (after SSL setup)
curl https://yourdomain.com/api/health
```

### Test Frontend

```bash
# Local test
curl http://localhost:3000

# Remote test
curl https://yourdomain.com
```

### Test WebSocket (Socket.IO)

```bash
# Should show Socket.IO response
curl https://yourdomain.com/socket.io/
```

---

## 📋 Configuration Details

### What This Configuration Does

**HTTP Server (Port 80):**

-   Redirects all HTTP traffic to HTTPS for security

**HTTPS Server (Port 443):**

-   **`/api` routes** → Backend API (port 4000)
-   **`/socket.io` routes** → WebSocket support (port 4000)
-   **`/` routes** → Frontend Next.js app (port 3000)
-   **Static assets** → Cached for optimal performance

### Security Features

✅ **SSL/TLS Configuration:**

-   TLS 1.2 and TLS 1.3 only (secure protocols)
-   Strong cipher suites
-   HTTP Strict Transport Security (HSTS) enabled

✅ **Security Headers:**

-   X-Frame-Options (clickjacking protection)
-   X-Content-Type-Options (MIME sniffing protection)
-   X-XSS-Protection (cross-site scripting protection)
-   Referrer-Policy (referrer information control)

✅ **Performance Optimization:**

-   HTTP/2 enabled
-   Static asset caching (365 days for immutable assets)
-   Image optimization caching (7 days)
-   Gzip compression (inherited from main Nginx config)

---

## 🔧 Common Modifications

### Change Upload Size Limit

```nginx
# In advancia.conf, modify this line:
client_max_body_size 10M;  # Change to 50M, 100M, etc.
```

### Add Rate Limiting

```nginx
# Add to http block in /etc/nginx/nginx.conf:
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Then in advancia.conf, add to location /api:
location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of config
}
```

### Enable Gzip Compression

```nginx
# Add to server block in advancia.conf:
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

---

## 🐛 Troubleshooting

### "nginx: [emerg] bind() to 0.0.0.0:80 failed"

**Cause:** Port 80 already in use  
**Fix:**

```bash
# Check what's using port 80
sudo netstat -tlnp | grep :80

# Stop conflicting service
sudo systemctl stop apache2  # if Apache is running
```

### "502 Bad Gateway"

**Cause:** Backend/frontend services not running  
**Fix:**

```bash
# Check if applications are running
pm2 status

# Start applications if needed
pm2 start ecosystem.config.js

# Check logs
pm2 logs
```

### "SSL certificate problem"

**Cause:** Certificate paths incorrect or expired  
**Fix:**

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew
```

### Changes not taking effect

**Cause:** Nginx cache or config not reloaded  
**Fix:**

```bash
# Test configuration first
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Or restart if reload doesn't work
sudo systemctl restart nginx
```

---

## 📊 Monitoring Nginx

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### View Access Logs

```bash
sudo tail -f /var/log/nginx/access.log
```

### View Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### Check Active Connections

```bash
# Add to nginx.conf http block:
# server {
#     listen 8080;
#     location /nginx_status {
#         stub_status;
#         allow 127.0.0.1;
#         deny all;
#     }
# }

curl http://localhost:8080/nginx_status
```

---

## 📚 Additional Resources

-   [Nginx Official Documentation](https://nginx.org/en/docs/)
-   [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
-   [DigitalOcean Nginx Tutorials](https://www.digitalocean.com/community/tags/nginx)
-   [Nginx SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

## 🔗 Related Documentation

-   [DigitalOcean Droplet Deployment Guide](../DIGITALOCEAN_DROPLET_DEPLOYMENT.md)
-   [Nginx Configuration Reference](../NGINX_CONFIG_REFERENCE.md)
-   [One Hour Migration Guide](../ONE_HOUR_MIGRATION_GUIDE.md)
-   [Environment Setup Guide](../ENV_SETUP_GUIDE.md)

---

**Built for production-ready DigitalOcean deployments** 🚀

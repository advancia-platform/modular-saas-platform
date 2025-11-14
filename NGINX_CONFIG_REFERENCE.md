# 🌐 Nginx Configuration Quick Reference

Fast reference for Nginx reverse proxy setup on DigitalOcean Droplet.

---

## 📄 Complete Nginx Config

**File**: `/etc/nginx/sites-available/advancia`

```nginx
# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS Server (SSL configured by Certbot)
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (added automatically by Certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Upload limit
    client_max_body_size 10M;

    # Backend API (Node.js on port 4000)
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend (React/Next.js on port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    # Next.js static files optimization
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Optimize image caching
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## ⚡ Quick Setup Commands

```bash
# 1. Create config file
sudo nano /etc/nginx/sites-available/advancia
# (Paste config above, replace 'yourdomain.com' with your actual domain)

# 2. Enable site
sudo ln -s /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/

# 3. Remove default site
sudo rm /etc/nginx/sites-enabled/default

# 4. Test configuration
sudo nginx -t

# 5. Reload Nginx
sudo systemctl reload nginx

# 6. Install Certbot and get SSL certificates
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 7. Verify SSL
curl https://yourdomain.com
```

---

## 🎯 What This Config Does

### HTTP → HTTPS Redirect

- All traffic on port 80 (HTTP) automatically redirects to port 443 (HTTPS)
- Enforces secure connections

### Backend API Routing

- `https://yourdomain.com/api/*` → `http://localhost:4000/api/*`
- `https://yourdomain.com/socket.io/*` → `http://localhost:4000/socket.io/*`
- Supports WebSocket connections for real-time features

### Frontend Routing

- `https://yourdomain.com/*` → `http://localhost:3000/*`
- Caches static assets (images, Next.js bundles)
- Optimizes performance with proper cache headers

### Security Features

- ✅ TLS 1.2/1.3 only
- ✅ Strong cipher suites
- ✅ X-Frame-Options (prevents clickjacking)
- ✅ X-Content-Type-Options (prevents MIME sniffing)
- ✅ XSS Protection
- ✅ Referrer Policy

---

## 🔧 Common Modifications

### Increase Upload Limit

```nginx
# Change from 10M to 50M for larger file uploads
client_max_body_size 50M;
```

### Add Rate Limiting

```nginx
# Add to http block in /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Then add to location /api block
limit_req zone=api_limit burst=20 nodelay;
```

### Add Gzip Compression

```nginx
# Add to server block
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### Custom Error Pages

```nginx
# Add to server block
error_page 404 /404.html;
error_page 500 502 503 504 /50x.html;

location = /404.html {
    root /var/www/errors;
    internal;
}
```

---

## 🧪 Testing Commands

```bash
# Test Nginx configuration syntax
sudo nginx -t

# Check which config files are loaded
sudo nginx -T

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Test HTTP response
curl -I http://yourdomain.com

# Test HTTPS response
curl -I https://yourdomain.com

# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check if ports are listening
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

---

## 🚨 Troubleshooting

### "nginx: [emerg] bind() to 0.0.0.0:80 failed"

**Problem**: Port 80 already in use  
**Solution**:

```bash
sudo lsof -i :80
sudo systemctl stop apache2  # If Apache is running
sudo systemctl restart nginx
```

### "502 Bad Gateway"

**Problem**: Backend/Frontend not running  
**Solution**:

```bash
pm2 status
pm2 restart all
pm2 logs
```

### "SSL certificate problem"

**Problem**: Certificate not configured  
**Solution**:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx
```

### Changes not applying

**Problem**: Configuration not reloaded  
**Solution**:

```bash
sudo nginx -t  # Test first
sudo systemctl reload nginx  # Reload without downtime
# OR
sudo systemctl restart nginx  # Full restart if needed
```

---

## 📊 Architecture Overview

```
Internet
    ↓
Cloudflare DNS
    ↓
DigitalOcean Droplet (YOUR_IP)
    ↓
Nginx (Port 80/443)
    ├─→ /api → Backend (Port 4000)
    ├─→ /socket.io → Backend WebSocket (Port 4000)
    └─→ / → Frontend (Port 3000)
```

---

## 📚 Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/) - Check SSL security
- [DigitalOcean Nginx Guide](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-22-04)

---

## ✅ Checklist

- [ ] Nginx installed (`sudo apt install nginx`)
- [ ] Config file created (`/etc/nginx/sites-available/advancia`)
- [ ] Config enabled (`sudo ln -s ...`)
- [ ] Syntax tested (`sudo nginx -t`)
- [ ] Nginx reloaded (`sudo systemctl reload nginx`)
- [ ] DNS configured (A records for domain)
- [ ] SSL installed (`sudo certbot --nginx`)
- [ ] HTTPS working (`curl https://yourdomain.com`)
- [ ] Backend API accessible (`curl https://yourdomain.com/api/health`)
- [ ] WebSocket working (test in browser console)

---

**Your Nginx reverse proxy is now production-ready!** 🚀

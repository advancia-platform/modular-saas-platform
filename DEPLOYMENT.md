# Frontend & Backend Connection Guide

## Overview
This guide shows how to connect your frontend (advanciapayledger.com) to the backend API with CloudFlare SSL certificates.

## Architecture
```
CloudFlare CDN (advanciapayledger.com)
    ↓ HTTPS
Frontend (Next.js on port 3000)
    ↓ API Calls
CloudFlare Proxy (api.advanciapayledger.com)
    ↓ HTTPS (CloudFlare Origin Certificate)
Backend (Node.js/Express on port 4000)
    ↓ Encrypted Connection
PostgreSQL Database (157.245.8.131:5432)
```

## SSL Certificate Setup ✅

### 1. CloudFlare Origin Certificate
- **Location**: `/root/projects/advancia-pay-ledger/backend/ssl/cloudflare-cert.pem`
- **Type**: ECC Certificate
- **Validity**: Nov 7, 2025 → Nov 3, 2040
- **Domains**: `*.advanciapayledger.com`, `advanciapayledger.com`

### 2. Private Key
- **Location**: `/root/projects/advancia-pay-ledger/backend/ssl/cloudflare-key.pem`
- **Type**: ECC (prime256v1)
- **Permissions**: `600` (read-only by owner)

## Backend Configuration

### Environment Variables (.env.production)
```bash
# Server
PORT=4000
NODE_ENV=production
SSL_ENABLED=true
SSL_CERT_PATH=/root/projects/advancia-pay-ledger/backend/ssl/cloudflare-cert.pem
SSL_KEY_PATH=/root/projects/advancia-pay-ledger/backend/ssl/cloudflare-key.pem

# URLs
FRONTEND_URL=https://advanciapayledger.com
BACKEND_URL=https://api.advanciapayledger.com

# Database
DATABASE_URL=postgresql://user:password@157.245.8.131:5432/saas_db
```

### Start Backend with SSL
```bash
cd /root/projects/advancia-pay-ledger/backend

# Copy production environment
cp .env.production .env

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start dist/index.js --name advancia-backend
pm2 save
pm2 startup
```

## Frontend Configuration

### Environment Variables (.env.production)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_WS_URL=wss://api.advanciapayledger.com
NEXT_PUBLIC_APP_URL=https://advanciapayledger.com
```

### Using the API Client
```typescript
import { apiRequest, API_ENDPOINTS } from '@/lib/api';

// Login example
const response = await apiRequest(API_ENDPOINTS.LOGIN, {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

// Get user data with auth token
const userData = await apiRequest(API_ENDPOINTS.ME);
```

### Build and Deploy Frontend
```bash
cd /root/projects/advancia-pay-ledger/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start

# Or use PM2
pm2 start npm --name advancia-frontend -- start
pm2 save
```

## CloudFlare DNS Configuration

### Required DNS Records:

1. **Root Domain**
   ```
   Type: A
   Name: @
   Content: 157.245.8.131
   Proxy: ✅ Proxied (Orange cloud)
   ```

2. **API Subdomain**
   ```
   Type: A
   Name: api
   Content: 157.245.8.131
   Proxy: ✅ Proxied (Orange cloud)
   ```

3. **WWW Redirect (optional)**
   ```
   Type: CNAME
   Name: www
   Content: advanciapayledger.com
   Proxy: ✅ Proxied
   ```

## CloudFlare SSL/TLS Settings

1. **SSL/TLS Encryption Mode**: Full (strict)
   - CloudFlare → Origin Server encrypted with valid certificate
   
2. **Edge Certificates**: Enabled
   - Universal SSL active
   - HTTPS Auto Rewrites: ON
   - Always Use HTTPS: ON

3. **Origin Server Certificate**: Uploaded ✅
   - ECC certificate for `*.advanciapayledger.com`

## CORS Configuration

Backend CORS is configured to allow:
- `https://advanciapayledger.com`
- `https://www.advanciapayledger.com`
- `http://localhost:3000` (development)

```typescript
// Already configured in backend/src/index.ts
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://advanciapayledger.com',
      'https://www.advanciapayledger.com',
      'http://localhost:3000'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## Nginx Reverse Proxy (Optional)

If using Nginx as reverse proxy:

```nginx
# /etc/nginx/sites-available/advancia-backend
server {
    listen 80;
    server_name api.advanciapayledger.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.advanciapayledger.com;

    ssl_certificate /root/projects/advancia-pay-ledger/backend/ssl/cloudflare-cert.pem;
    ssl_certificate_key /root/projects/advancia-pay-ledger/backend/ssl/cloudflare-key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
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
}
```

```nginx
# /etc/nginx/sites-available/advancia-frontend
server {
    listen 80;
    server_name advanciapayledger.com www.advanciapayledger.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name advanciapayledger.com www.advanciapayledger.com;

    ssl_certificate /root/projects/advancia-pay-ledger/backend/ssl/cloudflare-cert.pem;
    ssl_certificate_key /root/projects/advancia-pay-ledger/backend/ssl/cloudflare-key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable sites:
```bash
sudo ln -s /etc/nginx/sites-available/advancia-backend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/advancia-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Firewall Configuration

```bash
# Allow HTTPS (443)
sudo ufw allow 443/tcp

# Allow HTTP (80) for redirects
sudo ufw allow 80/tcp

# Allow backend port if not using reverse proxy
sudo ufw allow 4000/tcp

# Allow frontend port
sudo ufw allow 3000/tcp

# Reload firewall
sudo ufw reload
```

## Testing the Connection

### 1. Test Backend SSL
```bash
# Check certificate
curl -v https://api.advanciapayledger.com/health

# Should show:
# * SSL connection using TLSv1.3
# * Server certificate: *.advanciapayledger.com
# {"status":"healthy"}
```

### 2. Test Frontend → Backend
```bash
# From browser console on advanciapayledger.com
fetch('https://api.advanciapayledger.com/health')
  .then(r => r.json())
  .then(console.log);

# Should NOT show CORS errors
```

### 3. Test WebSocket
```javascript
const ws = new WebSocket('wss://api.advanciapayledger.com');
ws.onopen = () => console.log('Connected');
ws.onmessage = (e) => console.log('Message:', e.data);
```

## Process Management with PM2

### Install PM2
```bash
npm install -g pm2
```

### Backend
```bash
cd /root/projects/advancia-pay-ledger/backend
pm2 start ecosystem.config.js
```

### Frontend
```bash
cd /root/projects/advancia-pay-ledger/frontend
pm2 start npm --name "advancia-frontend" -- start
```

### PM2 Commands
```bash
pm2 status              # View all processes
pm2 logs advancia-backend    # View backend logs
pm2 logs advancia-frontend   # View frontend logs
pm2 restart all         # Restart all processes
pm2 stop all            # Stop all processes
pm2 save                # Save current process list
pm2 startup             # Generate startup script
```

## Deployment Checklist

- [x] SSL certificates installed in `/backend/ssl/`
- [x] `.env.production` files created for backend and frontend
- [x] API client (`/frontend/src/lib/api.ts`) configured
- [x] CORS allowed origins updated
- [ ] CloudFlare DNS records pointing to 157.245.8.131
- [ ] CloudFlare SSL/TLS mode set to "Full (strict)"
- [ ] Backend running on port 4000 with HTTPS
- [ ] Frontend running on port 3000
- [ ] Database connection tested from backend
- [ ] PM2 configured for auto-restart
- [ ] Firewall rules applied
- [ ] Health endpoint accessible: `https://api.advanciapayledger.com/health`
- [ ] Login flow tested from frontend

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` templates
2. **Rotate JWT secrets** regularly
3. **Enable rate limiting** (already configured)
4. **Monitor failed login attempts** via security admin dashboard
5. **Keep SSL certificates updated** (current cert valid until 2040)
6. **Use strong database passwords**
7. **Enable CloudFlare WAF** (Web Application Firewall)
8. **Set up monitoring** with Sentry/DataDog

## Troubleshooting

### Backend won't start
```bash
# Check if port is in use
sudo lsof -i :4000

# Check SSL certificates
openssl x509 -in /root/projects/advancia-pay-ledger/backend/ssl/cloudflare-cert.pem -text -noout

# Check logs
pm2 logs advancia-backend
```

### CORS errors
- Verify `FRONTEND_URL` in backend `.env`
- Check CloudFlare proxy is enabled (orange cloud)
- Ensure frontend uses `https://` not `http://`

### Database connection fails
- Test connection: `psql postgresql://user:password@157.245.8.131:5432/saas_db`
- Check firewall allows port 5432
- Verify DATABASE_URL in `.env`

### Certificate errors
- Ensure `SSL_ENABLED=true` in backend `.env`
- Check certificate paths are correct
- Verify CloudFlare SSL mode is "Full (strict)"

## Monitoring & Logs

### Backend Logs
```bash
pm2 logs advancia-backend --lines 100
```

### Frontend Logs
```bash
pm2 logs advancia-frontend --lines 100
```

### Database Logs
```bash
# On database server
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### CloudFlare Analytics
- Visit CloudFlare dashboard
- Navigate to Analytics & Logs
- Monitor traffic, threats, and performance

## Next Steps

1. **Set up automatic deployments** with GitHub Actions
2. **Configure CloudFlare Workers** for edge caching
3. **Enable CloudFlare Page Rules** for performance optimization
4. **Set up monitoring alerts** (Sentry, Uptime Robot)
5. **Implement database backups** (automated daily backups)
6. **Add CDN for static assets**
7. **Configure load balancing** if scaling to multiple servers

## Support

For issues, check:
- Backend logs: `pm2 logs advancia-backend`
- Frontend logs: `pm2 logs advancia-frontend`
- Security alerts: `https://api.advanciapayledger.com/api/admin/security-management/alerts`
- System health: `https://api.advanciapayledger.com/health`

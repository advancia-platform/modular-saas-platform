# 🌐 DigitalOcean Droplet Deployment Checklist

A comprehensive step-by-step guide to deploying Advancia Pay Ledger from local development to a production-ready DigitalOcean Droplet.

---

## 📋 Overview

This guide will help you deploy both **backend** and **frontend** on a single DigitalOcean Droplet with:

- ✅ Nginx reverse proxy
- ✅ SSL/HTTPS via Let's Encrypt
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ PM2 process management
- ✅ Automatic deployments via GitHub Actions

**Estimated Time**: 1-2 hours for first deployment

---

## ✅ Phase 1: Droplet Setup (15 minutes)

### 1.1 Create Droplet

- [ ] Log in to [DigitalOcean](https://cloud.digitalocean.com)
- [ ] Click **Create** → **Droplets**
- [ ] Choose configuration:
  - **Image**: Ubuntu 22.04 LTS (recommended) or Ubuntu 24.04 LTS
  - **Plan**: Basic (Regular, $12/month minimum for production)
  - **CPU Options**: Regular Intel (2 GB RAM / 1 CPU minimum)
  - **Datacenter**: Choose closest to your users (e.g., `nyc1`, `sfo3`, `lon1`)
  - **Authentication**: SSH keys (strongly recommended)
- [ ] Add your SSH public key (copy from `~/.ssh/id_rsa.pub` or `~/.ssh/id_ed25519.pub`)
- [ ] Choose hostname: `advancia-production`
- [ ] Click **Create Droplet**

**Note your Droplet IP address** (e.g., `157.245.8.131`)

### 1.2 Initial SSH Connection

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Accept fingerprint when prompted
```

### 1.3 System Update

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl wget build-essential software-properties-common ufw
```

### 1.4 Create Deployment User

```bash
# Create non-root user for deployment (security best practice)
adduser deployer
usermod -aG sudo deployer

# Copy SSH keys to new user
mkdir -p /home/deployer/.ssh
cp ~/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys

# Test SSH as deployer
# (in a new terminal)
ssh deployer@YOUR_DROPLET_IP
```

---

## 🔹 Phase 2: Dependencies Installation (20 minutes)

### 2.1 Install Node.js (v22 LTS)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v22.x.x
npm --version   # Should show v10.x.x
```

### 2.2 Install PostgreSQL 15

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE advancia_payledger;
CREATE USER advancia_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger TO advancia_user;
\q
EOF

# Verify connection
psql -U advancia_user -d advancia_payledger -h localhost -W
```

### 2.3 Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf
# Set: supervised systemd
# Set: bind 127.0.0.1 ::1
# Set: requirepass your_redis_password

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test Redis
redis-cli
# AUTH your_redis_password
# PING (should return PONG)
# exit
```

### 2.4 Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd -u deployer --hp /home/deployer
# Run the command it outputs
```

### 2.5 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
curl http://localhost
```

---

## 📂 Phase 3: Project Setup (15 minutes)

### 3.1 Clone Repository

```bash
# Create app directory
sudo mkdir -p /app
sudo chown deployer:deployer /app
cd /app

# Clone your repository
git clone https://github.com/pdtribe181-prog/-modular-saas-platform.git
cd -modular-saas-platform

# Checkout main branch
git checkout main
```

### 3.2 Backend Configuration

```bash
cd /app/-modular-saas-platform/backend

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Backend Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://advancia_user:your_secure_password_here@localhost:5432/advancia_payledger?schema=public"

# Server
PORT=4000
NODE_ENV=production
BACKEND_URL="https://api.yourdomain.com"
FRONTEND_URL="https://yourdomain.com"

# Authentication
JWT_SECRET="generate_with_openssl_rand_base64_32"
SESSION_SECRET="generate_with_openssl_rand_base64_32"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="your_redis_password"

# Email (Gmail example)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Stripe
STRIPE_SECRET_KEY="sk_live_your_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# VAPID for push notifications
VAPID_PUBLIC_KEY="your_vapid_public_key"
VAPID_PRIVATE_KEY="your_vapid_private_key"
```

**Generate Secrets:**

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32

# Generate VAPID keys
cd /app/-modular-saas-platform/backend
node generate-vapid.js
```

### 3.3 Frontend Configuration

```bash
cd /app/-modular-saas-platform/frontend

# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

**Required Frontend Environment Variables:**

```env
# API Configuration
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_FRONTEND_URL="https://yourdomain.com"

# Stripe (public key only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_key_here"

# VAPID
NEXT_PUBLIC_VAPID_KEY="your_vapid_public_key"

# App Info
NEXT_PUBLIC_APP_NAME="Advancia PayLedger"
NODE_ENV=production
```

### 3.4 Install Dependencies

```bash
# Backend dependencies
cd /app/-modular-saas-platform/backend
npm ci --production

# Frontend dependencies
cd /app/-modular-saas-platform/frontend
npm ci --production
```

### 3.5 Database Migration

```bash
# Run Prisma migrations
cd /app/-modular-saas-platform/backend
npx prisma migrate deploy
npx prisma generate
```

### 3.6 Build Applications

```bash
# Build backend
cd /app/-modular-saas-platform/backend
npm run build

# Build frontend
cd /app/-modular-saas-platform/frontend
npm run build
```

---

## ⚙️ Phase 4: Application Run with PM2 (10 minutes)

### 4.1 Create PM2 Ecosystem File

```bash
cd /app/-modular-saas-platform
nano ecosystem.config.js
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: "advancia-backend",
      cwd: "/app/-modular-saas-platform/backend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "500M",
      error_file: "/var/log/pm2/backend-error.log",
      out_file: "/var/log/pm2/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "advancia-frontend",
      cwd: "/app/-modular-saas-platform/frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "cluster",
      max_memory_restart: "500M",
      error_file: "/var/log/pm2/frontend-error.log",
      out_file: "/var/log/pm2/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],
};
```

### 4.2 Start Applications

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R deployer:deployer /var/log/pm2

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to restart on reboot
pm2 startup systemd -u deployer --hp /home/deployer
# Run the command it outputs

# Check status
pm2 status
pm2 logs
```

### 4.3 Verify Applications

```bash
# Test backend
curl http://localhost:4000/api/health

# Test frontend
curl http://localhost:3000
```

---

## 🌐 Phase 5: Nginx Reverse Proxy (20 minutes)

### 5.1 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/advancia
```

**Production-Ready Nginx Configuration:**

```nginx
# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS Server (SSL will be configured by Certbot)
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (Certbot will automatically add these)
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

### 5.2 Enable Nginx Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5.3 Configure DNS

**In your Cloudflare dashboard (or DNS provider):**

- [ ] Add A record: `yourdomain.com` → `YOUR_DROPLET_IP`
- [ ] Add A record: `www.yourdomain.com` → `YOUR_DROPLET_IP`
- [ ] Wait for DNS propagation (5-30 minutes)

**Note**: With this configuration:

- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/api`
- WebSocket: `https://yourdomain.com/socket.io`

**Test DNS propagation:**

```bash
# Check if DNS is resolving
nslookup yourdomain.com
ping yourdomain.com

# Test HTTP connection (before SSL)
curl http://yourdomain.com
```

---

## 🔒 Phase 6: Security & SSL (15 minutes)

### 6.1 Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obtain SSL Certificates

```bash
# Get SSL certificates for your domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter your email address (for renewal notifications)
# - Agree to Terms of Service (Y)
# - Share email with EFF (optional - Y or N)
# - Certbot will automatically configure SSL in Nginx

# Verify SSL is working
curl https://yourdomain.com
```

**What Certbot does:**

- ✅ Obtains free SSL certificates from Let's Encrypt
- ✅ Automatically updates Nginx config with SSL settings
- ✅ Sets up auto-renewal (certificates valid for 90 days)
- ✅ Forces HTTPS redirect (HTTP → HTTPS)

### 6.3 Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw --force enable

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow OpenSSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to app ports
sudo ufw deny 3000/tcp
sudo ufw deny 4000/tcp

# Check status
sudo ufw status
```

### 6.4 Harden SSH

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config
```

**Recommended SSH Settings:**

```conf
# Disable root login
PermitRootLogin no

# Use SSH keys only
PasswordAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Change default port (optional but recommended)
# Port 2222
```

```bash
# Restart SSH
sudo systemctl restart sshd
```

### 6.5 Auto-Renew SSL Certificates

```bash
# Certbot auto-renewal is already configured
# Test renewal process
sudo certbot renew --dry-run
```

---

## 📊 Phase 7: Monitoring & Maintenance (10 minutes)

### 7.1 Enable DigitalOcean Monitoring

- [ ] Go to DigitalOcean dashboard → Droplet → **Monitoring**
- [ ] Enable metrics collection
- [ ] Set up alerts:
  - CPU usage > 80% for 5 minutes
  - Memory usage > 85%
  - Disk usage > 90%

### 7.2 PM2 Monitoring

```bash
# Install PM2 monitoring dashboard (optional)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Monitor in real-time
pm2 monit
```

### 7.3 Database Backups

```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

**backup-db.sh:**

```bash
#!/bin/bash
BACKUP_DIR="/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE="advancia_payledger"

mkdir -p $BACKUP_DIR
pg_dump -U advancia_user $DATABASE | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily backups at 2 AM)
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/backup-db.sh
```

### 7.4 Application Health Checks

```bash
# Create health check script
nano /home/deployer/health-check.sh
```

**health-check.sh:**

```bash
#!/bin/bash

# Check backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.yourdomain.com/api/health)
if [ "$BACKEND_STATUS" != "200" ]; then
    echo "Backend unhealthy - restarting"
    pm2 restart advancia-backend
fi

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com)
if [ "$FRONTEND_STATUS" != "200" ]; then
    echo "Frontend unhealthy - restarting"
    pm2 restart advancia-frontend
fi
```

```bash
# Make executable
chmod +x /home/deployer/health-check.sh

# Add to crontab (every 5 minutes)
crontab -e
# Add line: */5 * * * * /home/deployer/health-check.sh >> /var/log/health-check.log 2>&1
```

---

## 🚀 Phase 8: CI/CD Integration (GitHub Actions)

### 8.1 Setup GitHub Secrets

In your GitHub repository: **Settings → Secrets and variables → Actions**

Add these secrets:

- [ ] `DO_DROPLET_IP` - Your droplet IP address
- [ ] `DO_SSH_KEY` - Your private SSH key (entire contents of `~/.ssh/id_rsa` or `~/.ssh/id_ed25519`)

### 8.2 Verify GitHub Actions Workflow

Your workflow at `.github/workflows/do-auto-deploy.yml` is already configured!

**It will automatically:**

- ✅ Trigger on push to `main` branch
- ✅ SSH into your droplet
- ✅ Pull latest code
- ✅ Install dependencies
- ✅ Build applications
- ✅ Restart PM2 processes
- ✅ Run health checks

### 8.3 Test Deployment

```bash
# Make a small change and push to main
git add .
git commit -m "Test CI/CD deployment"
git push origin main

# Monitor deployment in GitHub Actions tab
```

---

## 📝 Phase 9: Scaling Strategy

### 9.1 Vertical Scaling (Resize Droplet)

When you need more resources:

- [ ] Snapshot your droplet first (backup)
- [ ] Power off droplet
- [ ] Resize to larger plan (e.g., 4GB RAM / 2 CPUs)
- [ ] Power on
- [ ] Update PM2 instances in `ecosystem.config.js`

### 9.2 Horizontal Scaling (Multiple Droplets)

For high traffic:

- [ ] Create additional droplets
- [ ] Set up DigitalOcean Load Balancer
- [ ] Use managed PostgreSQL database
- [ ] Use managed Redis cluster
- [ ] Configure session sticky routing

### 9.3 Database Optimization

```bash
# Monitor slow queries
sudo -u postgres psql advancia_payledger

# Add indexes for frequently queried columns
CREATE INDEX idx_transactions_user_id ON "Transaction"(user_id);
CREATE INDEX idx_transactions_created_at ON "Transaction"(created_at);
```

---

## ✅ Post-Deployment Checklist

- [ ] Test all critical user flows (signup, login, transactions)
- [ ] Verify email notifications work
- [ ] Test payment processing (Stripe)
- [ ] Check SSL certificates are valid
- [ ] Verify database backups are running
- [ ] Test health monitoring and alerts
- [ ] Review PM2 logs for errors
- [ ] Monitor memory and CPU usage (first 24 hours)
- [ ] Document any customizations made
- [ ] Share deployment guide with team

---

## 🆘 Troubleshooting

### Backend not responding

```bash
# Check PM2 status
pm2 status
pm2 logs advancia-backend --lines 100

# Check if port is listening
sudo netstat -tlnp | grep :4000

# Restart backend
pm2 restart advancia-backend
```

### Frontend not loading

```bash
# Check PM2 status
pm2 logs advancia-frontend --lines 100

# Check Next.js build
cd /app/-modular-saas-platform/frontend
npm run build

# Restart frontend
pm2 restart advancia-frontend
```

### Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U advancia_user -d advancia_payledger -h localhost

# Check DATABASE_URL in .env
cat /app/-modular-saas-platform/backend/.env | grep DATABASE_URL
```

### SSL certificate errors

```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew --force-renewal

# Check Nginx SSL configuration
sudo nginx -t
```

### High memory usage

```bash
# Check PM2 memory
pm2 status

# Restart high-memory processes
pm2 restart all

# Check system memory
free -h
htop
```

---

## 📚 Additional Resources

- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [One-Hour Migration Guide](./ONE_HOUR_MIGRATION_GUIDE.md) - Quick demo setup
- [Environment Setup Guide](./ENV_SETUP_GUIDE.md) - Detailed env configuration

---

## 🎯 Summary

**Total Deployment Time**: ~1-2 hours

**Monthly Cost Estimate**:

- Droplet (2GB RAM): $12-18/month
- Bandwidth (1TB included): $0
- Backups (optional): +20% ($2.40/month)
- **Total**: ~$15-20/month

**Next Steps After Deployment**:

1. Monitor application for 24-48 hours
2. Set up domain email forwarding
3. Configure Cloudflare DNS and WAF
4. Enable DigitalOcean backups
5. Document any custom configurations

---

**Built with ❤️ for production DigitalOcean deployments**

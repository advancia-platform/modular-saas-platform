# 🚀 Phase 4: Production Deployment Guide

**Date**: November 8, 2025  
**Platform**: Advancia Pay Ledger  
**Status**: Ready for Deployment

---

## 📋 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       CLOUDFLARE                            │
│              (DNS + SSL + CDN + DDoS Protection)            │
└──────────────────┬──────────────────┬──────────────────────┘
                   │                  │
        ┌──────────▼─────────┐  ┌────▼──────────────┐
        │   VERCEL           │  │   RENDER          │
        │   Frontend         │  │   Backend API     │
        │   Next.js 14       │  │   Express.js      │
        │   Port: 3000       │  │   Port: 4000      │
        └────────────────────┘  └────┬──────────────┘
                                     │
                          ┌──────────▼─────────────┐
                          │  DIGITAL OCEAN         │
                          │  PostgreSQL Database   │
                          │  Port: 5432            │
                          └────────────────────────┘
```

---

## 🎯 Infrastructure Overview

| Service | Provider | Purpose | Status |
|---------|----------|---------|--------|
| **Frontend** | Vercel | Next.js hosting, CDN, auto-scaling | ✅ Ready |
| **Backend** | Render | Express.js API, WebSocket support | ✅ Ready |
| **Database** | Digital Ocean Droplet | PostgreSQL production DB | ⏳ Setup needed |
| **DNS/CDN** | Cloudflare | Domain management, SSL, security | ✅ Available |

---

## 📦 Phase 4 Deployment Steps

### **Step 1: Digital Ocean - Database Setup**

#### 1.1 Access Your Droplet
```bash
ssh root@your-droplet-ip
```

#### 1.2 Install PostgreSQL 14
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

#### 1.3 Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create production database and user
CREATE DATABASE advancia_prod;
CREATE USER advancia_user WITH ENCRYPTED PASSWORD 'your-secure-password-here';
GRANT ALL PRIVILEGES ON DATABASE advancia_prod TO advancia_user;

# Grant schema privileges
\c advancia_prod
GRANT ALL ON SCHEMA public TO advancia_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO advancia_user;

# Exit psql
\q
```

#### 1.4 Configure Remote Access
```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Change listen_addresses (find and modify):
listen_addresses = '*'

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add at the end:
host    advancia_prod    advancia_user    0.0.0.0/0    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 1.5 Set Up Firewall
```bash
# Allow PostgreSQL through firewall
sudo ufw allow 5432/tcp
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

#### 1.6 Test Connection
```bash
# From your local machine
psql -h your-droplet-ip -U advancia_user -d advancia_prod
```

#### 1.7 Database Connection String
```
postgresql://advancia_user:your-secure-password@your-droplet-ip:5432/advancia_prod
```

---

### **Step 2: Render - Backend Deployment**

#### 2.1 Prepare Backend for Deployment

**Create `render.yaml` in project root:**
```yaml
services:
  - type: web
    name: advancia-backend
    env: node
    region: oregon
    plan: starter
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 4000
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: RESEND_API_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://your-domain.com
```

#### 2.2 Update Backend Package.json
```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon src/server.ts"
  }
}
```

#### 2.3 Deploy to Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Create New Web Service**
3. **Connect GitHub Repository**: `advancia-pay-ledger`
4. **Configure Service**:
   - Name: `advancia-backend`
   - Environment: `Node`
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

5. **Add Environment Variables**:
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://advancia_user:password@droplet-ip:5432/advancia_prod
JWT_SECRET=your-jwt-secret-here
RESEND_API_KEY=re_your_resend_api_key
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

6. **Deploy**: Click "Create Web Service"

#### 2.4 Run Database Migration
```bash
# After deployment, run in Render Shell
npx prisma migrate deploy
npx prisma generate
```

#### 2.5 Get Backend URL
```
https://advancia-backend.onrender.com
```

---

### **Step 3: Vercel - Frontend Deployment**

#### 3.1 Prepare Frontend for Deployment

**Create `vercel.json` in frontend directory:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://advancia-backend.onrender.com",
    "NEXT_PUBLIC_WS_URL": "wss://advancia-backend.onrender.com"
  }
}
```

#### 3.2 Update Frontend Environment Variables

**Create `.env.production` in frontend:**
```bash
NEXT_PUBLIC_API_URL=https://advancia-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://advancia-backend.onrender.com
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_your_stripe_key
```

#### 3.3 Deploy to Vercel

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Deploy via CLI**:
```bash
cd ~/projects/advancia-pay-ledger/frontend
vercel --prod
```

3. **OR Deploy via Dashboard**:
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import `advancia-pay-ledger` from GitHub
   - Framework Preset: `Next.js`
   - Root Directory: `frontend`
   - Click "Deploy"

4. **Add Environment Variables in Vercel Dashboard**:
```
NEXT_PUBLIC_API_URL = https://advancia-backend.onrender.com
NEXT_PUBLIC_WS_URL = wss://advancia-backend.onrender.com
NEXT_PUBLIC_STRIPE_PUBLIC_KEY = pk_live_...
```

#### 3.4 Get Frontend URL
```
https://advancia-pay-ledger.vercel.app
```

---

### **Step 4: Cloudflare - DNS & SSL Configuration**

#### 4.1 Add Site to Cloudflare

1. **Log into Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Add Site**: Enter your domain (e.g., `advancia.com`)
3. **Select Plan**: Free plan is sufficient
4. **Update Nameservers**: Point your domain registrar to Cloudflare nameservers

#### 4.2 Configure DNS Records

**Add the following DNS records:**

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| CNAME | @ | advancia-pay-ledger.vercel.app | Proxied (Orange) |
| CNAME | www | advancia-pay-ledger.vercel.app | Proxied (Orange) |
| CNAME | api | advancia-backend.onrender.com | Proxied (Orange) |
| A | db | your-droplet-ip | DNS Only (Grey) |

**Example Configuration:**
```
advancia.com          → CNAME → advancia-pay-ledger.vercel.app (Proxied)
www.advancia.com      → CNAME → advancia-pay-ledger.vercel.app (Proxied)
api.advancia.com      → CNAME → advancia-backend.onrender.com (Proxied)
db.advancia.com       → A     → 123.45.67.89 (DNS Only)
```

#### 4.3 SSL/TLS Configuration

1. **Go to SSL/TLS tab**
2. **Set Encryption Mode**: `Full (strict)`
3. **Enable "Always Use HTTPS"**
4. **Enable "Automatic HTTPS Rewrites"**
5. **Edge Certificates**:
   - Universal SSL should auto-provision
   - Wait 5-15 minutes for certificate activation

#### 4.4 Page Rules (Optional Performance Boost)

Create these page rules:

1. **Cache Everything**:
   - URL: `advancia.com/*`
   - Setting: Cache Level = `Cache Everything`

2. **Security Level**:
   - URL: `api.advancia.com/*`
   - Setting: Security Level = `High`

#### 4.5 Firewall Rules

1. **Rate Limiting**:
   - Path: `/api/*`
   - Requests: 100 per minute per IP

2. **Block Bad Bots**:
   - Enable "Bot Fight Mode" (free tier)

#### 4.6 Final URLs After Cloudflare

```
Frontend:  https://advancia.com
           https://www.advancia.com
Backend:   https://api.advancia.com
Database:  db.advancia.com:5432 (internal only)
```

---

### **Step 5: Environment Variables Summary**

#### Backend (Render)
```bash
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://advancia_user:password@db.advancia.com:5432/advancia_prod
JWT_SECRET=super-secure-random-string-min-32-chars
RESEND_API_KEY=re_your_resend_api_key_here
FRONTEND_URL=https://advancia.com
CORS_ORIGIN=https://advancia.com,https://www.advancia.com
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://api.advancia.com
NEXT_PUBLIC_WS_URL=wss://api.advancia.com
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
```

#### Database (Digital Ocean)
```bash
# Connection string
postgresql://advancia_user:password@db.advancia.com:5432/advancia_prod

# For Prisma
DATABASE_URL="postgresql://advancia_user:password@db.advancia.com:5432/advancia_prod?schema=public"
```

---

### **Step 6: Database Migration & Seeding**

#### 6.1 Run Migrations on Production

```bash
# SSH into Render backend shell OR run locally pointing to prod DB
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Check database
npx prisma studio
```

#### 6.2 Seed Initial Data (Optional)

```bash
# Create seed script: backend/prisma/seed.ts
npx prisma db seed
```

---

### **Step 7: Testing & Verification**

#### 7.1 Health Checks

```bash
# Backend health
curl https://api.advancia.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-08T...",
  "service": "advancia-backend",
  "version": "1.0.0"
}

# Database connection test
curl https://api.advancia.com/api/admin/dashboard/health
```

#### 7.2 Frontend Verification

1. Visit https://advancia.com
2. Check:
   - [ ] Homepage loads
   - [ ] Dashboard accessible
   - [ ] Login/Register works
   - [ ] API calls working
   - [ ] WebSocket connections

#### 7.3 API Endpoint Tests

```bash
# Test authentication
curl -X POST https://api.advancia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test token wallet
curl https://api.advancia.com/api/tokens/balance/user-id

# Test invoices
curl https://api.advancia.com/api/invoices/test
```

---

### **Step 8: Monitoring & Logging**

#### 8.1 Render Monitoring

- **Go to Render Dashboard** → `advancia-backend`
- **Metrics Tab**: CPU, Memory, Response times
- **Logs Tab**: Real-time application logs
- **Events Tab**: Deployment history

#### 8.2 Vercel Analytics

- **Go to Vercel Dashboard** → `advancia-pay-ledger`
- **Analytics**: Page views, performance
- **Logs**: Serverless function logs
- **Deployment**: Build logs

#### 8.3 Cloudflare Analytics

- **Traffic Analysis**: Visitors, bandwidth
- **Security Events**: Blocked threats
- **Performance**: Cache hit rates
- **SSL/TLS**: Certificate status

#### 8.4 Database Monitoring

```bash
# SSH into Digital Ocean Droplet
ssh root@your-droplet-ip

# Check PostgreSQL status
sudo systemctl status postgresql

# Monitor active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('advancia_prod'));"

# Table sizes
sudo -u postgres psql advancia_prod -c "
  SELECT schemaname, tablename, 
         pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

---

### **Step 9: Backups & Disaster Recovery**

#### 9.1 Automated Database Backups

**Create backup script on Digital Ocean:**

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Create backup directory
mkdir -p /backups/postgres

# Create backup script
nano /usr/local/bin/backup-postgres.sh
```

**Backup script content:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="advancia_prod"
DB_USER="advancia_user"

# Create backup
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/advancia_$DATE.sql.gz

# Keep only last 30 days of backups
find $BACKUP_DIR -name "advancia_*.sql.gz" -mtime +30 -delete

echo "Backup completed: advancia_$DATE.sql.gz"
```

**Make executable and schedule:**
```bash
chmod +x /usr/local/bin/backup-postgres.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /usr/local/bin/backup-postgres.sh >> /var/log/postgres-backup.log 2>&1
```

#### 9.2 Restore from Backup

```bash
# List backups
ls -lh /backups/postgres/

# Restore specific backup
gunzip -c /backups/postgres/advancia_20251108_020000.sql.gz | \
  psql -U advancia_user -d advancia_prod
```

---

### **Step 10: Security Hardening**

#### 10.1 Digital Ocean Droplet Security

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install fail2ban (prevent brute force)
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 5432/tcp
sudo ufw enable

# Change SSH port (optional)
sudo nano /etc/ssh/sshd_config
# Change: Port 2222
sudo systemctl restart sshd
sudo ufw allow 2222/tcp
```

#### 10.2 Database Security

```bash
# Create read-only user for analytics
sudo -u postgres psql advancia_prod

CREATE USER analytics_readonly WITH ENCRYPTED PASSWORD 'analytics-password';
GRANT CONNECT ON DATABASE advancia_prod TO analytics_readonly;
GRANT USAGE ON SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_readonly;
```

#### 10.3 Render Security

- Enable **"Auto-Deploy"** only for specific branches
- Set up **Health Check Path**: `/health`
- Enable **"Zero Downtime Deploys"**
- Use **Environment Variable Groups** for secrets

#### 10.4 Cloudflare Security

- Enable **"Bot Fight Mode"**
- Enable **"Email Address Obfuscation"**
- Set **Security Level** to "Medium" or "High"
- Enable **"Challenge Passage"** = 30 minutes
- Enable **"Browser Integrity Check"**

---

## 📊 Post-Deployment Checklist

### Functionality Tests
- [ ] User registration works
- [ ] Login/logout works
- [ ] 2FA setup and validation
- [ ] Token wallet transactions
- [ ] Rewards system updates
- [ ] Invoice generation and PDF download
- [ ] Email notifications sending
- [ ] Admin dashboard accessible
- [ ] WebSocket real-time updates
- [ ] Payment processing (Stripe)

### Performance Tests
- [ ] Page load time < 2 seconds
- [ ] API response time < 200ms
- [ ] Database query performance
- [ ] WebSocket latency < 100ms
- [ ] CDN cache hit rate > 80%

### Security Tests
- [ ] SSL certificates valid
- [ ] HTTPS redirect working
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] CSRF tokens validated

### Monitoring Setup
- [ ] Render logs accessible
- [ ] Vercel analytics enabled
- [ ] Cloudflare analytics active
- [ ] Database backup running
- [ ] Error tracking configured
- [ ] Uptime monitoring (optional: UptimeRobot)

---

## 💰 Phase 4 Payment Milestone

**Completion Criteria:**
- ✅ Database deployed on Digital Ocean
- ✅ Backend deployed on Render
- ✅ Frontend deployed on Vercel
- ✅ Cloudflare DNS configured
- ✅ SSL certificates active
- ✅ All functionality tested
- ✅ Backups configured
- ✅ Monitoring enabled

**Payment**: $1,800 (15% of $12,000)

---

## 🎓 Client Handoff

### Documentation Provided
- [x] ROADMAP.md - Development timeline
- [x] SETUP.md - Local development guide
- [x] API_REFERENCE.md - API documentation
- [x] PHASE4_DEPLOYMENT.md - This deployment guide
- [x] PROGRESS_REPORT.md - Complete progress report
- [x] FEATURE_INVENTORY.md - Feature audit

### Access Credentials Needed from Client
- [ ] Render account access
- [ ] Vercel account access
- [ ] Digital Ocean droplet IP & SSH key
- [ ] Cloudflare account access
- [ ] Domain registrar access (for nameserver update)
- [ ] Stripe API keys (live mode)
- [ ] Resend API key

### Training Session Topics
1. Admin dashboard usage
2. User management
3. Invoice generation
4. Email template customization
5. Monitoring & logs
6. Database backups & restore
7. Troubleshooting common issues

---

## 🆘 Troubleshooting

### Backend Not Connecting to Database

```bash
# Check DATABASE_URL format
# Should be: postgresql://user:password@host:5432/database

# Test connection from Render shell
nc -zv your-droplet-ip 5432

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Frontend API Calls Failing

```bash
# Check CORS settings in backend
# Ensure CORS_ORIGIN includes your Vercel domain

# Check environment variables in Vercel
# NEXT_PUBLIC_API_URL should match Render URL

# Check Cloudflare SSL mode
# Should be "Full (strict)"
```

### WebSocket Connection Issues

```bash
# Render supports WebSocket on all plans
# Ensure WS_URL uses wss:// (not ws://)
# Check Cloudflare WebSocket support (enabled by default)
```

### Database Performance Issues

```bash
# Create indexes
sudo -u postgres psql advancia_prod

CREATE INDEX idx_transactions_user_id ON "Transaction"("userId");
CREATE INDEX idx_transactions_created_at ON "Transaction"("createdAt");
CREATE INDEX idx_invoices_user_id ON "Invoice"("userId");

# Analyze and vacuum
ANALYZE;
VACUUM;
```

---

## 📞 Support & Maintenance

### Included (30 Days Post-Launch)
- Bug fixes
- Performance optimization
- Security patches
- Deployment assistance

### Optional Ongoing Support
- Monthly retainer: $500/month
  - 5 hours support time
  - Feature updates
  - Database maintenance
  - Performance monitoring

---

## 🎉 Deployment Timeline

| Day | Task | Duration |
|-----|------|----------|
| Day 1 | Digital Ocean database setup | 2-3 hours |
| Day 2 | Render backend deployment | 2-3 hours |
| Day 3 | Vercel frontend deployment | 1-2 hours |
| Day 4 | Cloudflare DNS & SSL config | 1-2 hours |
| Day 5 | Testing & verification | 3-4 hours |
| Day 6 | Monitoring & backup setup | 2-3 hours |
| Day 7 | Client training & handoff | 2-3 hours |

**Total Estimated Time**: 15-20 hours over 1 week

---

**Status**: Ready to Deploy  
**Next Step**: Provide access credentials and begin Day 1

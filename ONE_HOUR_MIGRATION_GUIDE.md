# 🚀 One-Hour DigitalOcean Migration Guide

Complete DigitalOcean migration in **under 1 hour** using automated demo setup with mock services.

## 📋 Prerequisites (5 minutes)

### Required

- ✅ DigitalOcean droplet (Ubuntu 24.04 LTS, $12/month minimum)
- ✅ SSH key configured (`~/.ssh/id_ed25519_mucha`)
- ✅ Droplet IP address (e.g., `157.245.8.131`)
- ✅ PowerShell (Windows) or Bash (Linux/Mac)

### Optional (for production later)

- CloudFlare account
- Domain name
- Production API keys (Stripe, Cryptomus, etc.)

---

## 🎯 Quick Start (One Command)

### Windows (PowerShell)

```powershell
# Run from repository root
.\scripts\one-hour-migration.ps1 -DropletIP "157.245.8.131" -SSHKeyPath "$env:USERPROFILE\.ssh\id_ed25519_mucha"
```

### Linux/Mac (Bash)

```bash
# Run from repository root
bash scripts/fast-demo-setup.sh 157.245.8.131
```

**That's it!** The script will automatically:

1. Test SSH connection (30 seconds)
2. Run initial droplet setup (5 minutes)
3. Create demo environment with test credentials (1 minute)
4. Upload configuration files (30 seconds)
5. Build and deploy all services (15-20 minutes)
6. Run health checks (2 minutes)
7. Display access URLs and credentials

**Total time: 20-30 minutes**

---

## 📊 What Gets Deployed

### Services Running on Droplet

| Service        | Port | Purpose          | Demo/Prod     |
| -------------- | ---- | ---------------- | ------------- |
| **Frontend**   | 3000 | Next.js UI       | ✅ Demo Ready |
| **Backend**    | 4000 | Node.js API      | ✅ Demo Ready |
| **PostgreSQL** | 5432 | Database         | ✅ Demo Ready |
| **Redis**      | 6379 | Cache            | ✅ Demo Ready |
| **MailHog**    | 8025 | Email Testing UI | 🧪 Demo Only  |

### Demo Features Enabled

| Feature                | Status       | Details                    |
| ---------------------- | ------------ | -------------------------- |
| **User Auth**          | ✅ Working   | Email/password, JWT tokens |
| **2FA/TOTP**           | ✅ Working   | TOTP codes via MailHog     |
| **Transactions**       | ✅ Working   | Full CRUD operations       |
| **Payments (Stripe)**  | 🧪 Test Mode | Uses `sk_test_*` keys      |
| **Crypto Payments**    | 🧪 Mock      | Demo API keys              |
| **Email**              | 🧪 MailHog   | View at `http://IP:8025`   |
| **Push Notifications** | ⚠️ Limited   | Demo VAPID keys            |
| **Admin Dashboard**    | ✅ Working   | Full access                |
| **Analytics**          | ✅ Working   | Mock data                  |
| **SSL/HTTPS**          | ❌ Disabled  | HTTP only for demo         |
| **S3 Backups**         | ❌ Disabled  | Local backups only         |

---

## 🔑 Demo Credentials

### Default Demo User

```
Email:    demo@advanciapayledger.local
Password: demo123
```

### Database Access

```bash
psql "postgresql://demo_user:demo_pass_2024@157.245.8.131:5432/advancia_demo"
```

### Redis Access

```bash
redis-cli -h 157.245.8.131 -p 6379 -a demo_redis_pass
```

### MailHog (Email Testing)

```
Web UI: http://157.245.8.131:8025
SMTP:   157.245.8.131:1025
```

---

## 🛠️ Manual Step-by-Step (If Script Fails)

### Step 1: SSH Into Droplet (1 minute)

```bash
ssh -i ~/.ssh/id_ed25519_mucha root@157.245.8.131
```

### Step 2: Run Initial Setup (5 minutes)

```bash
curl -fsSL https://raw.githubusercontent.com/muchaeljohn739337-cloud/-modular-saas-platform/main/scripts/setup-do-droplet.sh | bash
```

### Step 3: Create Demo Environment (2 minutes)

```bash
cat > /app/.env.production << 'EOF'
DATABASE_URL=postgresql://demo_user:demo_pass_2024@postgres:5432/advancia_demo
REDIS_URL=redis://:demo_redis_pass@redis:6379
NODE_ENV=production
PORT=4000
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://157.245.8.131:3000
BACKEND_URL=http://157.245.8.131:4000
STRIPE_SECRET_KEY=sk_test_demo_key
CRYPTOMUS_API_KEY=demo_crypto_key
SMTP_HOST=mailhog
SMTP_PORT=1025
EMAIL_USER=demo@advanciapayledger.local
POSTGRES_USER=demo_user
POSTGRES_PASSWORD=demo_pass_2024
POSTGRES_DB=advancia_demo
REDIS_PASSWORD=demo_redis_pass
CORS_ORIGIN=http://157.245.8.131:3000
LOG_LEVEL=debug
EOF
```

### Step 4: Deploy Services (15-20 minutes)

```bash
cd /app/modular-saas-platform

# Build Docker images
docker-compose -f docker-compose.demo.yml build

# Run migrations
docker-compose -f docker-compose.demo.yml run --rm backend npx prisma migrate deploy

# Start all services
docker-compose -f docker-compose.demo.yml up -d

# Check status
docker-compose -f docker-compose.demo.yml ps
```

### Step 5: Verify Deployment (2 minutes)

```bash
# Check backend health
curl http://localhost:4000/api/health

# Check frontend
curl http://localhost:3000

# View logs
docker-compose -f docker-compose.demo.yml logs -f
```

---

## 🧪 Testing the Demo

### 1. Access Frontend

```
http://157.245.8.131:3000
```

### 2. Create Demo User

- Click "Sign Up"
- Email: `test@demo.local`
- Password: `Test123!`
- Check MailHog for verification email: `http://157.245.8.131:8025`

### 3. Test Payments (Stripe Test Mode)

Use test cards:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

### 4. Test Admin Dashboard

```
http://157.245.8.131:3000/admin
```

### 5. Test API Directly

```bash
# Health check
curl http://157.245.8.131:4000/api/health

# Login
curl -X POST http://157.245.8.131:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@advanciapayledger.local","password":"demo123"}'
```

---

## 📊 Monitoring & Troubleshooting

### View Logs

```bash
ssh -i ~/.ssh/id_ed25519_mucha root@157.245.8.131
cd /app/modular-saas-platform
docker-compose -f docker-compose.demo.yml logs -f
```

### Check Service Status

```bash
docker-compose -f docker-compose.demo.yml ps
```

### Restart Services

```bash
docker-compose -f docker-compose.demo.yml restart
```

### Stop All Services

```bash
docker-compose -f docker-compose.demo.yml down
```

### Full Rebuild

```bash
docker-compose -f docker-compose.demo.yml down -v
docker-compose -f docker-compose.demo.yml build --no-cache
docker-compose -f docker-compose.demo.yml up -d
```

### Common Issues

#### Backend Won't Start

```bash
# Check database connection
docker-compose -f docker-compose.demo.yml logs postgres
docker-compose -f docker-compose.demo.yml logs backend

# Verify environment variables
cat /app/.env.production
```

#### Frontend Build Fails

```bash
# Check Node.js memory
docker-compose -f docker-compose.demo.yml logs frontend

# Rebuild with more memory
docker-compose -f docker-compose.demo.yml build --build-arg NODE_OPTIONS="--max-old-space-size=4096" frontend
```

#### Database Migration Errors

```bash
# Reset database (WARNING: deletes all data)
docker-compose -f docker-compose.demo.yml down -v
docker volume rm modular-saas-platform_postgres_data
docker-compose -f docker-compose.demo.yml up -d postgres
docker-compose -f docker-compose.demo.yml run --rm backend npx prisma migrate deploy
```

#### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# If low, upgrade droplet to $24/month (4GB RAM)
```

---

## 🔄 Upgrading to Production

Once demo is working, upgrade to production:

### 1. Update Environment Variables

```bash
nano /app/.env.production
```

Replace demo values with production:

- ✅ Real Stripe keys (`sk_live_*`)
- ✅ Real Cryptomus API keys
- ✅ Real SMTP credentials (Gmail, SendGrid, etc.)
- ✅ Sentry DSN for error tracking
- ✅ AWS credentials for S3 backups

### 2. Set Up SSL Certificates

```bash
apt-get install -y certbot python3-certbot-nginx

certbot certonly --standalone \
  -d advanciapayledger.com \
  -d www.advanciapayledger.com \
  -d api.advanciapayledger.com
```

### 3. Configure CloudFlare DNS

- A Record: `advanciapayledger.com` → `157.245.8.131`
- A Record: `www.advanciapayledger.com` → `157.245.8.131`
- CNAME: `api.advanciapayledger.com` → `advanciapayledger.com`

### 4. Use Production Docker Compose

```bash
cd /app/modular-saas-platform
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Enable GitHub Actions Auto-Deploy

Add secrets to GitHub:

- `DO_SSH_KEY` - SSH private key
- `DO_DROPLET_IP` - `157.245.8.131`
- `DATABASE_URL` - Production database URL

---

## ⚠️ Demo Limitations

### What's Not Included

- ❌ SSL/HTTPS (HTTP only)
- ❌ Real payment processing (test mode only)
- ❌ Real email delivery (MailHog only)
- ❌ S3 backups (local only)
- ❌ CloudFlare CDN
- ❌ Production DNS
- ❌ Web push notifications (demo keys)
- ❌ Sentry error tracking
- ❌ Rate limiting (relaxed for demo)

### Demo-Only Services

- **MailHog**: Email testing UI (won't send real emails)
- **Test Stripe Keys**: Payments won't actually process
- **Mock Crypto API**: Crypto payments won't work
- **Self-Signed SSL**: Browsers will show warnings

### Security Warnings

- 🔴 Demo credentials are public (change immediately)
- 🔴 No firewall rules (expose only necessary ports)
- 🔴 No SSL encryption (use production SSL ASAP)
- 🔴 Demo JWT secrets (regenerate for production)

---

## 📈 Performance Optimization

### Recommended Droplet Sizes

| Users         | Droplet      | vCPU | RAM  | Cost/Month |
| ------------- | ------------ | ---- | ---- | ---------- |
| Demo/Testing  | Basic        | 2    | 2GB  | $12        |
| < 100 users   | Regular      | 2    | 4GB  | $24        |
| 100-500 users | Professional | 4    | 8GB  | $48        |
| 500+ users    | Business     | 8    | 16GB | $96        |

### Scaling Checklist

- [ ] Monitor CPU/memory with `htop` and `docker stats`
- [ ] Enable DigitalOcean monitoring dashboard
- [ ] Set up Sentry for error tracking
- [ ] Configure Redis for session storage
- [ ] Enable PostgreSQL connection pooling
- [ ] Add CloudFlare CDN for static assets
- [ ] Set up horizontal scaling with load balancer

---

## 📝 Next Steps

### After Successful Demo (Same Day)

1. ✅ Test all features (auth, payments, admin)
2. ✅ Review logs for errors
3. ✅ Note any missing features
4. ✅ Document any issues

### Within 24 Hours

1. 🔐 Update demo credentials
2. 🔐 Generate production JWT secrets
3. 🌐 Configure CloudFlare DNS
4. 📧 Set up production email (Gmail, SendGrid)

### Within 1 Week

1. 💳 Add production Stripe keys
2. 🔒 Set up SSL certificates (Let's Encrypt)
3. 📊 Enable Sentry error tracking
4. 💾 Configure S3 backups
5. 🔄 Test automated deployments via GitHub Actions

### Production Launch

1. ✅ All production secrets configured
2. ✅ SSL/HTTPS working
3. ✅ Real payment processing tested
4. ✅ Email delivery verified
5. ✅ Backups running daily
6. ✅ Monitoring configured
7. ✅ Team trained on deployment process

---

## 🆘 Support & Resources

### Documentation

- [DIGITALOCEAN_MIGRATION_GUIDE.md](./DIGITALOCEAN_MIGRATION_GUIDE.md) - Full migration details
- [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) - Daily operations
- [DIGITALOCEAN_SECRETS.md](./DIGITALOCEAN_SECRETS.md) - Secret management

### Troubleshooting

- [Logs](#view-logs) - View service logs
- [Common Issues](#common-issues) - Quick fixes
- [GitHub Issues](https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/issues) - Report bugs

### Community

- Discord: [Join server](#)
- Email: support@advanciapayledger.com

---

## ✅ Migration Checklist

### Pre-Migration (5 min)

- [ ] DigitalOcean droplet created
- [ ] SSH key configured
- [ ] Droplet IP noted: `_______________`

### Demo Deployment (30 min)

- [ ] Ran `one-hour-migration.ps1` script
- [ ] All services running (verified with `docker ps`)
- [ ] Backend health check passed: `http://IP:4000/api/health`
- [ ] Frontend accessible: `http://IP:3000`
- [ ] MailHog UI accessible: `http://IP:8025`

### Testing (15 min)

- [ ] Created test user account
- [ ] Verified email in MailHog
- [ ] Logged in successfully
- [ ] Created test transaction
- [ ] Tested Stripe payment (test mode)
- [ ] Accessed admin dashboard

### Documentation (10 min)

- [ ] Noted droplet IP and credentials
- [ ] Saved access URLs
- [ ] Documented any issues
- [ ] Planned production upgrade timeline

---

**Status**: Demo Ready ✨

**Migration Completed**: `_________________` (date)

**Migrated By**: `_________________` (name)

**Droplet IP**: `_________________`

**Next Milestone**: Production upgrade within 1 week

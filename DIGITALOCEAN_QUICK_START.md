problem i want # ✅ DigitalOcean Migration - Quick Start Checklist

Complete this checklist to migrate from Render + Vercel to DigitalOcean.

---

## 🚀 NEW: One-Hour Demo Migration

**Want to complete everything in under 1 hour with automated demo setup?**

👉 **See [ONE_HOUR_MIGRATION_GUIDE.md](./ONE_HOUR_MIGRATION_GUIDE.md)** for fully automated migration with:

- ✅ One-command PowerShell/Bash scripts
- ✅ Automated Docker setup
- ✅ Demo credentials and mock services (MailHog, test Stripe, etc.)
- ✅ No SSL/DNS hassle (HTTP demo only)
- ✅ Quick reference card for troubleshooting

**Quick Start Command (Windows)**:

```powershell
.\scripts\one-hour-migration.ps1 -DropletIP "157.245.8.131"
```

**For production-ready migration with SSL, DNS, and real API keys**, continue with this checklist below.

---

## 📋 Pre-Migration (Preparation)

- [ ] **Backup Current Configuration**
  - [ ] Export environment variables from Render backend
  - [ ] Export environment variables from Vercel frontend
  - [ ] Document current database backups location
  - [ ] Save Stripe webhook endpoint settings
  - [ ] Note CloudFlare DNS settings

- [ ] **Generate SSH Key for GitHub Actions**

  ```bash
  ssh-keygen -t ed25519 -f ~/.ssh/do_github_actions -N ""
  ```

  - [ ] Save `do_github_actions` (private key)
  - [ ] Save `do_github_actions.pub` (public key)

- [ ] **Create DigitalOcean Account**
  - [ ] Sign up at https://digitalocean.com
  - [ ] Enable SSH key authentication
  - [ ] Generate API token for automation

## 🚀 Droplet Setup

- [ ] **Create Ubuntu 24.04 LTS Droplet**
  - [ ] Choose region (NY, SF, London, etc.)
  - [ ] Select size: $12/month (2 vCPU, 2GB RAM) recommended
  - [ ] Add SSH key from `do_github_actions.pub`
  - [ ] Enable monitoring
  - [ ] Note droplet IP address: `_______________`

- [ ] **SSH Into Droplet**

  ```bash
  ssh -i ~/.ssh/do_github_actions root@YOUR_DROPLET_IP
  ```

- [ ] **Run Initial Setup Script**

  ```bash
  curl -fsSL https://raw.githubusercontent.com/muchaeljohn739337-cloud/-modular-saas-platform/main/scripts/setup-do-droplet.sh | bash
  ```

  - [ ] Updates system
  - [ ] Installs Docker & Docker Compose
  - [ ] Clones repository
  - [ ] Creates `/app/.env.production`

- [ ] **Configure Environment Variables**

  ```bash
  nano /app/.env.production
  ```

  - [ ] `DATABASE_URL` - PostgreSQL connection
  - [ ] `JWT_SECRET` - Random secure string
  - [ ] `FRONTEND_URL` - https://advanciapayledger.com
  - [ ] `BACKEND_URL` - https://api.advanciapayledger.com
  - [ ] `STRIPE_SECRET_KEY` - From Render
  - [ ] `CRYPTOMUS_API_KEY` - From Render
  - [ ] `EMAIL_*` - SMTP credentials
  - [ ] `SENTRY_DSN` - Error tracking
  - [ ] `AWS_*` - S3 backup credentials (optional)

## 📦 Docker Setup

- [ ] **Build & Start Services**

  ```bash
  cd /app/modular-saas-platform
  docker-compose -f docker-compose.prod.yml build
  docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
  docker-compose -f docker-compose.prod.yml up -d
  ```

- [ ] **Verify Services Running**

  ```bash
  docker-compose -f docker-compose.prod.yml ps
  curl http://localhost:4000/api/health
  curl http://localhost:3000
  ```

  - [ ] Backend service running (port 4000)
  - [ ] Frontend service running (port 3000)
  - [ ] Nginx running (port 80/443)
  - [ ] PostgreSQL running

## 🔐 SSL & DNS

- [ ] **Set Up SSL Certificate (Let's Encrypt)**

  ```bash
  apt-get install -y certbot python3-certbot-nginx
  certbot certonly --standalone \
    -d advanciapayledger.com \
    -d www.advanciapayledger.com \
    -d api.advanciapayledger.com
  ```

  - [ ] Certificate issued successfully

- [ ] **Update CloudFlare DNS**
  - [ ] A Record: `advanciapayledger.com` → `YOUR_DROPLET_IP`
  - [ ] A Record: `www.advanciapayledger.com` → `YOUR_DROPLET_IP`
  - [ ] CNAME Record: `api.advanciapayledger.com` → `advanciapayledger.com`
  - [ ] Wait for DNS propagation (up to 24 hours)

## 🔑 GitHub Configuration

- [ ] **Add SSH Key to Droplet**

  ```bash
  ssh -i ~/.ssh/do_github_actions root@YOUR_DROPLET_IP
  mkdir -p ~/.ssh
  echo "your-public-key-content" >> ~/.ssh/authorized_keys
  ```

- [ ] **Add GitHub Secrets**
  - Go to: Repository → Settings → Secrets and Variables → Actions
  - [ ] `DO_SSH_KEY` - Content of private key file
  - [ ] `DO_DROPLET_IP` - Your droplet IP address
  - [ ] `DATABASE_URL` - PostgreSQL connection string
  - [ ] `AWS_ACCESS_KEY_ID` - (optional, for S3 backups)
  - [ ] `AWS_SECRET_ACCESS_KEY` - (optional, for S3 backups)

- [ ] **Verify Workflows Exist**
  - [ ] `.github/workflows/do-auto-deploy.yml` - Auto-deploy on push
  - [ ] `.github/workflows/do-backup-and-migrate.yml` - Daily backups

## 🧪 Testing & Validation

- [ ] **Test Automated Deployment**

  ```bash
  git commit --allow-empty -m "test: verify DO deployment"
  git push origin main
  ```

  - [ ] GitHub Actions workflow triggered
  - [ ] No errors in workflow logs
  - [ ] Services running on droplet

- [ ] **Verify API Health**

  ```bash
  curl https://api.advanciapayledger.com/api/health
  ```

  - [ ] Returns 200 OK

- [ ] **Verify Frontend**

  ```bash
  curl https://advanciapayledger.com
  ```

  - [ ] Returns HTML (not error)

- [ ] **Test User Scenarios**
  - [ ] User registration works
  - [ ] Email verification sends
  - [ ] Login with 2FA works
  - [ ] Create transaction works
  - [ ] Payment processing works
  - [ ] Admin dashboard accessible

- [ ] **Monitor Logs**

  ```bash
  ssh -i ~/.ssh/do_github_actions root@YOUR_DROPLET_IP
  docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs -f
  ```

  - [ ] No ERROR level logs
  - [ ] No repeated warnings

## 📊 Database Verification

- [ ] **Verify Data Integrity**

  ```bash
  # On droplet
  psql "postgresql://advancia_user:PASSWORD@localhost:5432/advancia_prod"
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM transactions;
  \q
  ```

  - [ ] User count matches expectations
  - [ ] Transaction count matches expectations

- [ ] **Test Backup**

  ```bash
  bash /app/modular-saas-platform/scripts/backup-do-db.sh
  ls -lh /app/backups/
  ```

  - [ ] Backup file created successfully
  - [ ] File size reasonable

- [ ] **Schedule Automated Backups**
  - [ ] Verify cron job or GitHub Actions scheduled (3 AM UTC daily)
  - [ ] Monitor first backup completion
  - [ ] Verify S3 upload (if configured)

## 📈 Performance & Monitoring

- [ ] **Monitor Droplet Resources**

  ```bash
  ssh -i ~/.ssh/do_github_actions root@YOUR_DROPLET_IP
  htop
  docker stats
  ```

  - [ ] CPU usage < 50%
  - [ ] Memory usage < 70%
  - [ ] No disk space warnings

- [ ] **Enable DigitalOcean Monitoring**
  - [ ] Enable on droplet dashboard
  - [ ] Set up alerts for high CPU/memory

- [ ] **Check Sentry (if configured)**
  - [ ] No spike in error rates
  - [ ] Investigate any new error patterns

## 🧹 Cleanup (After 1-2 Weeks)

Once confident everything works on DigitalOcean:

- [ ] **Keep Render & Vercel as Fallback**
  - [ ] Monitor for 7+ days on DO
  - [ ] Keep Render backend deployed (different version)
  - [ ] Keep Vercel frontend deployed (different version)

- [ ] **Disable Render Auto-Deploy**
  - [ ] Go to Render dashboard
  - [ ] Disable GitHub integration
  - [ ] Scale down or pause services

- [ ] **Disable Vercel Auto-Deploy**
  - [ ] Go to Vercel dashboard
  - [ ] Disable GitHub integration
  - [ ] Unlink project from GitHub (optional)

- [ ] **Update Documentation**
  - [ ] Update README with DigitalOcean architecture
  - [ ] Document deployment procedures
  - [ ] Update incident response playbook
  - [ ] Archive old Render/Vercel docs

- [ ] **Delete Old Services** (Only After 2+ Weeks)
  - [ ] Delete Render backend service
  - [ ] Delete Render PostgreSQL database (if applicable)
  - [ ] Delete Vercel project
  - [ ] Delete DigitalOcean API token (if temporary)

## 📚 Documentation

- [ ] **Read Guides**
  - [ ] [DIGITALOCEAN_MIGRATION_GUIDE.md](./DIGITALOCEAN_MIGRATION_GUIDE.md) - Detailed setup
  - [ ] [DIGITALOCEAN_DEPLOYMENT.md](./DIGITALOCEAN_DEPLOYMENT.md) - Daily operations
  - [ ] [DIGITALOCEAN_SECRETS.md](./DIGITALOCEAN_SECRETS.md) - Secret management

- [ ] **Update Team**
  - [ ] Notify team of new infrastructure
  - [ ] Share access credentials (encrypted)
  - [ ] Document SSH access procedures
  - [ ] Share incident response procedures

## 🆘 Troubleshooting

**SSH Connection Fails**

```bash
# Verify key has correct permissions
chmod 600 ~/.ssh/do_github_actions

# Test connection
ssh -i ~/.ssh/do_github_actions -vvv root@YOUR_DROPLET_IP
```

**Services Won't Start**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml logs
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml down -v
docker-compose -f /app/modular-saas-platform/docker-compose.prod.yml up -d
```

**Database Connection Error**

```bash
PGPASSWORD=PASSWORD psql -h localhost -U advancia_user -d advancia_prod -c "SELECT 1"
```

**High Memory Usage**

```bash
docker stats
# Increase droplet size if consistently > 80%
```

---

## 📝 Important Notes

- **Droplet IP**: `_________________`
- **Database Host**: `_________________`
- **SSH Key Location**: `~/.ssh/do_github_actions`
- **App Directory**: `/app/modular-saas-platform`
- **Backups Location**: `/app/backups/`
- **Logs Location**: Check `docker-compose logs`

## ✅ Final Checklist

- [ ] All services running on DigitalOcean
- [ ] All tests passing
- [ ] DNS pointing to DigitalOcean
- [ ] SSL certificate valid
- [ ] Automated deployments working
- [ ] Automated backups running
- [ ] Team notified
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Incident response plan updated

---

**Status**: Ready for Production ✨

**Migration Completed**: `_________________` (date)

**Migrated By**: `_________________` (name)

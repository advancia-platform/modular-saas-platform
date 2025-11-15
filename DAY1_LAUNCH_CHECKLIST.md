# 🚀 Advancia Day-1 Launch Checklist

Complete pre-launch checklist for Advancia Pay Ledger production deployment.

---

## 📋 Pre-Launch Checklist

### 🔹 Infrastructure & Security

- [ ] **Droplet provisioned**
  - Ubuntu 22.04 LTS
  - 2 vCPU / 4GB RAM minimum
  - SSH keys configured (no password login)
  - Located in optimal region
- [ ] **System hardened**

  ```bash
  # Verify firewall
  sudo ufw status verbose

  # Check for updates
  sudo apt update && sudo apt list --upgradable

  # Verify SSH config
  grep "PermitRootLogin\|PasswordAuthentication" /etc/ssh/sshd_config
  ```

  - [ ] UFW firewall enabled (ports: 22, 80, 443 only)
  - [ ] Root login disabled
  - [ ] Password authentication disabled
  - [ ] Fail2ban installed (optional but recommended)

- [ ] **SSL certificates active**

  ```bash
  # Check certificates
  sudo certbot certificates

  # Test renewal
  sudo certbot renew --dry-run
  ```

  - [ ] HTTPS enabled for main domain
  - [ ] HTTPS enabled for status subdomain
  - [ ] Auto-renewal configured
  - [ ] Certificates expire > 30 days

- [ ] **Backups configured**

  ```bash
  # Manual snapshot
  doctl compute droplet-action snapshot DROPLET_ID --snapshot-name "pre-launch-$(date +%Y%m%d)"

  # Check DB backups
  ls -lh /backups/postgres/
  ```

  - [ ] Droplet snapshot created
  - [ ] Database backup schedule active
  - [ ] Backup retention policy set (30 days)
  - [ ] Off-site backup tested

---

### 🔹 Backend & Monitoring

- [ ] **PM2 processes healthy**

  ```bash
  pm2 list
  pm2 describe advancia-backend
  pm2 describe backend-watchdog
  pm2 describe status-updater
  ```

  - [ ] advancia-backend: online, 0 restarts
  - [ ] backend-watchdog: online
  - [ ] status-updater: online, cron_restart active
  - [ ] PM2 startup enabled: `pm2 startup`
  - [ ] PM2 save executed: `pm2 save`

- [ ] **Watchdog operational**

  ```bash
  # Check watchdog logs
  tail -f /opt/advancia/logs/backend-watchdog.log

  # Simulate failure
  pm2 stop advancia-backend
  # Wait 60 seconds, verify auto-restart
  ```

  - [ ] Health checks running every 60s
  - [ ] Auto-restart tested successfully
  - [ ] Logs writing to correct location

- [ ] **Logs accessible**

  ```bash
  # Check log locations
  ls -lh /opt/advancia/logs/
  ls -lh /opt/advancia/backend/logs/

  # Verify PM2 logs
  pm2 logs --lines 20
  ```

  - [ ] PM2 logs: `/opt/advancia/backend/logs/`
  - [ ] Watchdog logs: `/opt/advancia/logs/`
  - [ ] Log rotation configured
  - [ ] Logs readable and recent

- [ ] **Slack alerts configured**

  ```bash
  # Test error alert
  curl -X POST https://advanciapayledger.com/api/test-error

  # Check Slack channels
  ```

  - [ ] #backend-errors channel receiving alerts
  - [ ] #backend-metrics channel active
  - [ ] #backend-alerts channel configured
  - [ ] Test alert sent successfully
  - [ ] Alert playbook documented

- [ ] **Sentry integrated**

  ```bash
  # Check SENTRY_DSN in .env
  grep SENTRY_DSN /opt/advancia/backend/.env

  # Trigger test error
  node -e "const Sentry = require('@sentry/node'); Sentry.init({dsn: 'YOUR_DSN'}); Sentry.captureException(new Error('Test error'));"
  ```

  - [ ] SENTRY_DSN configured
  - [ ] Test error appears in Sentry dashboard
  - [ ] Source maps uploaded
  - [ ] Release tracking enabled
  - [ ] User context captured

- [ ] **Datadog monitors active**
  - [ ] Uptime monitor: > 99.9%
  - [ ] Restart storm alert: > 3 restarts/hour
  - [ ] CPU monitor: > 80% threshold
  - [ ] Memory monitor: > 80% threshold
  - [ ] Disk space monitor: > 85% threshold
  - [ ] Response time alert: > 500ms p95

---

### 🔹 Status Page

- [ ] **Frontend built and deployed**

  ```bash
  # Check build exists
  ls -lh /var/www/status/build/

  # Verify index.html
  curl -s http://localhost/status | grep "Advancia"
  ```

  - [ ] React app built: `npm run build`
  - [ ] Files deployed to `/var/www/status/build/`
  - [ ] Assets loading correctly
  - [ ] No console errors in browser

- [ ] **status.json auto-updates**

  ```bash
  # Check current status
  cat /opt/advancia/backend/public/status.json | jq .

  # Check file age (should be < 5 min old)
  ls -lh /opt/advancia/backend/public/status.json

  # Watch for updates
  watch -n 10 'ls -lh /opt/advancia/backend/public/status.json'
  ```

  - [ ] status.json exists and valid
  - [ ] File updates every 5 minutes
  - [ ] Metrics accurate (uptime, errors, restarts)
  - [ ] PM2 cron job running OR crontab configured

- [ ] **Nginx serving correctly**

  ```bash
  # Test status page
  curl -s https://status.advanciapayledger.com | grep "Advancia"

  # Test JSON endpoint
  curl -s https://status.advanciapayledger.com/status.json | jq .overallStatus

  # Check Nginx config
  sudo nginx -t
  ```

  - [ ] React UI accessible at status subdomain
  - [ ] status.json accessible via HTTP
  - [ ] CORS headers configured
  - [ ] Cache headers set correctly
  - [ ] No 404 errors

- [ ] **Incident detection tested**

  ```bash
  # Simulate restart storm
  for i in {1..4}; do pm2 restart advancia-backend; sleep 300; done

  # Check status.json for incident
  curl -s https://status.advanciapayledger.com/status.json | jq .incidents
  ```

  - [ ] Restart storm detected (3+ restarts/hour)
  - [ ] Error spike detected (>50 errors/24h)
  - [ ] Incident appears on status page
  - [ ] Incident severity accurate

---

### 🔹 User Experience

- [ ] **Frontend accessible**

  ```bash
  # Test main domain
  curl -I https://advanciapayledger.com

  # Test API endpoint
  curl -s https://advanciapayledger.com/api/health | jq .
  ```

  - [ ] Users can access main app
  - [ ] Login/registration working
  - [ ] Dashboard loads successfully
  - [ ] All routes functional

- [ ] **Latency acceptable**

  ```bash
  # Test API response times
  curl -w "@curl-format.txt" -o /dev/null -s https://advanciapayledger.com/api/health

  # curl-format.txt:
  # time_total: %{time_total}s\n
  ```

  - [ ] API responses < 200ms average
  - [ ] Static assets < 100ms
  - [ ] Database queries optimized
  - [ ] CDN configured (if applicable)

- [ ] **Error handling graceful**

  - [ ] 404 pages display correctly
  - [ ] 500 errors show user-friendly messages
  - [ ] No stack traces exposed to users
  - [ ] Error boundary catches React errors

- [ ] **Status page linked**
  - [ ] Footer contains status link
  - [ ] Help center mentions status page
  - [ ] Status badge in nav (optional)
  - [ ] Status page URL documented

---

### 🔹 Database & Data

- [ ] **Database healthy**

  ```bash
  # Connect to database
  psql $DATABASE_URL

  # Check tables
  \dt

  # Check migrations
  SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;

  # Check connections
  SELECT count(*) FROM pg_stat_activity;
  ```

  - [ ] All migrations applied
  - [ ] Indexes created
  - [ ] Connection pooling configured
  - [ ] Backup tested and verified

- [ ] **Data integrity**
  ```bash
  # Check critical tables
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM transactions;"
  ```
  - [ ] Test data removed
  - [ ] Production data seeded (if applicable)
  - [ ] Foreign key constraints active
  - [ ] Audit logs enabled

---

### 🔹 Security

- [ ] **Environment variables secured**

  ```bash
  # Check .env permissions
  ls -la /opt/advancia/backend/.env

  # Verify secrets not in logs
  grep -r "JWT_SECRET\|STRIPE_SECRET" /opt/advancia/logs/
  ```

  - [ ] .env file has 600 permissions
  - [ ] No secrets in logs
  - [ ] No secrets in repository
  - [ ] Secrets rotated from development

- [ ] **Rate limiting active**

  ```bash
  # Test login rate limit
  for i in {1..15}; do curl -X POST https://advanciapayledger.com/api/auth/login; done
  ```

  - [ ] Login: 10 req/min limit
  - [ ] Register: 5 req/hour limit
  - [ ] API: 1000 req/hour global limit
  - [ ] Rate limit headers present

- [ ] **Authentication secure**

  - [ ] JWT tokens expire correctly
  - [ ] Refresh token rotation enabled
  - [ ] Password hashing (bcrypt) verified
  - [ ] 2FA/TOTP tested (if applicable)

- [ ] **HTTPS enforced**
  ```bash
  # Test HTTP redirect
  curl -I http://advanciapayledger.com
  ```
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS headers present
  - [ ] Security headers configured
  - [ ] SSL Labs grade A or higher

---

### 🔹 Communication & Transparency

- [ ] **Slack channels organized**

  - [ ] #backend-errors: Error alerts only
  - [ ] #backend-metrics: Daily summaries
  - [ ] #backend-alerts: Critical incidents
  - [ ] Team members invited
  - [ ] Alert routing tested

- [ ] **Incident response documented**

  - [ ] Playbook created for each alert type
  - [ ] On-call schedule defined
  - [ ] Escalation paths documented
  - [ ] Team trained on procedures

- [ ] **Investor-ready metrics**

  - [ ] Status page shows uptime %
  - [ ] Incident history visible
  - [ ] Historical data displays 30 days
  - [ ] Metrics accurate and trustworthy

- [ ] **Documentation complete**
  - [ ] README updated with production URLs
  - [ ] API docs published
  - [ ] Admin guide finalized
  - [ ] User guide accessible

---

## 🧪 Pre-Launch Tests

### Load Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API endpoint
ab -n 1000 -c 10 https://advanciapayledger.com/api/health

# Test with auth
ab -n 100 -c 5 -H "Authorization: Bearer TOKEN" https://advanciapayledger.com/api/users/me
```

- [ ] API handles 100+ concurrent requests
- [ ] No timeouts under normal load
- [ ] Response times consistent

### Failover Testing

```bash
# Stop backend
pm2 stop advancia-backend

# Wait 60 seconds

# Verify watchdog restarts
pm2 list
```

- [ ] Watchdog detects failure within 60s
- [ ] Backend restarts automatically
- [ ] Status page shows incident

### Backup & Restore

```bash
# Create backup
pg_dump $DATABASE_URL > /tmp/test-backup.sql

# Simulate disaster
# (DO NOT DO THIS ON PRODUCTION!)
# psql $DATABASE_URL -c "DROP DATABASE advancia_prod;"

# Restore from backup
# psql $DATABASE_URL < /tmp/test-backup.sql
```

- [ ] Backup completes successfully
- [ ] Restore tested (on staging)
- [ ] Backup automation verified

---

## ✅ Launch Readiness Score

### Scoring

- Infrastructure & Security: \_\_\_/6
- Backend & Monitoring: \_\_\_/6
- Status Page: \_\_\_/4
- User Experience: \_\_\_/4
- Database & Data: \_\_\_/2
- Security: \_\_\_/4
- Communication: \_\_\_/4
- Pre-Launch Tests: \_\_\_/3

**Total: \_\_\_/33**

### Launch Decision

- **30-33**: ✅ Ready to launch
- **25-29**: ⚠️ Minor issues - fix before launch
- **20-24**: ❌ Major issues - delay launch
- **<20**: 🚨 Not ready - significant work needed

---

## 🚀 Launch Commands

When all checks pass:

```bash
# Final verification
pm2 list
sudo systemctl status nginx
sudo certbot certificates

# Start monitoring
pm2 logs

# Open status page
open https://status.advanciapayledger.com

# Announce launch
echo "🚀 Advancia Pay Ledger is LIVE!"
```

---

## 📞 Emergency Contacts

**On-Call Engineer**: ******\_\_\_******  
**Slack Emergency Channel**: #incidents  
**Escalation Email**: emergency@advanciapayledger.com  
**Status Page**: https://status.advanciapayledger.com

---

## 📚 Related Documentation

- [DIGITALOCEAN_DROPLET_DEPLOYMENT.md](./DIGITALOCEAN_DROPLET_DEPLOYMENT.md) - Deployment guide
- [STATUS_PAGE_AUTOMATION_GUIDE.md](./STATUS_PAGE_AUTOMATION_GUIDE.md) - Status automation
- [SLACK_ALERT_WORKFLOW.md](./SLACK_ALERT_WORKFLOW.md) - Alert configuration
- [OPS_PLAYBOOK.md](./OPS_PLAYBOOK.md) - Operations manual
- [PM2_GUIDE.md](./backend/PM2_GUIDE.md) - PM2 management

---

**Checked by**: ******\_\_\_******  
**Date**: ******\_\_\_******  
**Launch Date**: ******\_\_\_******

---

## ✨ Post-Launch

After successful launch:

- [ ] Monitor status page for 24 hours
- [ ] Review alert frequency
- [ ] Collect user feedback
- [ ] Schedule post-launch retrospective
- [ ] Update documentation based on learnings

**🎉 Congratulations on launching Advancia Pay Ledger!**

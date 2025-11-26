# 🔧 One-Hour Migration - Troubleshooting Guide

Comprehensive troubleshooting for the automated DigitalOcean migration.

---

## 🚨 Common Issues & Solutions

### 1. SSH Connection Fails

#### Symptoms

```
ssh: connect to host 157.245.8.131 port 22: Connection timed out
```

#### Solutions

**A. Verify SSH key permissions (Windows)**

```powershell
# Check if key exists
Test-Path "$env:USERPROFILE\.ssh\id_ed25519_mucha"

# If false, generate new key
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\id_ed25519_mucha" -N ""

# Add to droplet
# Copy public key
Get-Content "$env:USERPROFILE\.ssh\id_ed25519_mucha.pub"
# Paste into DigitalOcean droplet SSH keys
```

**B. Test SSH connection manually**

```powershell
ssh -i "$env:USERPROFILE\.ssh\id_ed25519_mucha" -vvv root@157.245.8.131
```

**C. Check droplet IP address**

- Log into DigitalOcean dashboard
- Verify droplet is running
- Confirm IP address matches script parameter

**D. Check firewall rules**

```bash
# On droplet
ufw status
# Should show: 22/tcp ALLOW
```

---

### 2. Script Fails: "Access Denied" or "Permission Denied"

#### Symptoms

```
scp: permission denied
```

#### Solutions

**A. Run PowerShell as Administrator**

```powershell
# Right-click PowerShell
# Select "Run as Administrator"
# Re-run script
```

**B. Check SSH key is added to droplet**

```bash
# On droplet
cat ~/.ssh/authorized_keys
# Should contain your public key
```

**C. Verify file permissions on droplet**

```bash
# On droplet
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

### 3. Docker Build Fails

#### Symptoms

```
ERROR: failed to solve: failed to fetch
```

#### Solutions

**A. Check internet connectivity on droplet**

```bash
ping -c 4 8.8.8.8
```

**B. Clear Docker cache and rebuild**

```bash
ssh root@157.245.8.131
cd /app/modular-saas-platform
docker-compose -f docker-compose.demo.yml down -v
docker system prune -af
docker-compose -f docker-compose.demo.yml build --no-cache
```

**C. Check disk space**

```bash
df -h
# If / is > 90%, clean up:
docker system prune -af --volumes
apt-get autoremove -y
apt-get clean
```

---

### 4. Backend Won't Start

#### Symptoms

```
backend exited with code 1
```

#### Solutions

**A. Check backend logs**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml logs backend
```

**B. Verify database connection**

```bash
# Check if PostgreSQL is running
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml ps postgres

# Test database connection
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml exec postgres \
  psql -U demo_user -d advancia_demo -c "SELECT 1"
```

**C. Check environment variables**

```bash
cat /app/.env.production
# Verify DATABASE_URL matches postgres service
```

**D. Reset database and migrations**

```bash
cd /app/modular-saas-platform
docker-compose -f docker-compose.demo.yml down -v
docker volume rm modular-saas-platform_postgres_data
docker-compose -f docker-compose.demo.yml up -d postgres
sleep 10
docker-compose -f docker-compose.demo.yml run --rm backend npx prisma migrate deploy
docker-compose -f docker-compose.demo.yml up -d
```

---

### 5. Frontend Build Fails

#### Symptoms

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

#### Solutions

**A. Increase Node.js memory limit**

```bash
cd /app/modular-saas-platform
docker-compose -f docker-compose.demo.yml down
docker-compose -f docker-compose.demo.yml build --build-arg NODE_OPTIONS="--max-old-space-size=4096" frontend
docker-compose -f docker-compose.demo.yml up -d
```

**B. Upgrade droplet to 4GB RAM**

- DigitalOcean dashboard → Resize → $24/month (4GB)
- Power off droplet first
- Resize
- Power on
- Re-run deployment

**C. Build frontend locally and copy**

```bash
# On your local machine
cd frontend
npm run build
# SCP the .next folder to droplet
scp -r .next root@157.245.8.131:/app/modular-saas-platform/frontend/
```

---

### 6. Database Migration Fails

#### Symptoms

```
Error: P3005
The database schema is not empty.
```

#### Solutions

**A. Reset database (WARNING: Deletes all data)**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml down -v
docker volume rm modular-saas-platform_postgres_data
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml up -d postgres
sleep 15
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml run --rm backend npx prisma migrate deploy
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml up -d
```

**B. Force migration reset**

```bash
cd /app/modular-saas-platform/backend
npx prisma migrate reset --force
npx prisma migrate deploy
```

**C. Check Prisma schema syntax**

```bash
cd /app/modular-saas-platform/backend
npx prisma validate
```

---

### 7. Services Start But Health Checks Fail

#### Symptoms

```
curl http://157.245.8.131:4000/api/health
curl: (7) Failed to connect
```

#### Solutions

**A. Check if services are actually running**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml ps
# Should show all services "Up"
```

**B. Check Docker logs for errors**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml logs backend | tail -50
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml logs frontend | tail -50
```

**C. Wait longer (services may still be starting)**

```bash
# Wait 2 minutes
sleep 120
# Try again
curl http://157.245.8.131:4000/api/health
```

**D. Check firewall rules**

```bash
ufw status
# Make sure 3000, 4000, 8025 are allowed
ufw allow 3000/tcp
ufw allow 4000/tcp
ufw allow 8025/tcp
```

---

### 8. MailHog Not Accessible

#### Symptoms

```
http://157.245.8.131:8025 - Connection refused
```

#### Solutions

**A. Check if MailHog container is running**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml ps mailhog
```

**B. Restart MailHog**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml restart mailhog
```

**C. Check MailHog logs**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml logs mailhog
```

**D. Access MailHog UI from droplet**

```bash
# SSH into droplet
ssh root@157.245.8.131
# Access locally
curl http://localhost:8025
# If works, firewall issue - add rule:
ufw allow 8025/tcp
```

---

### 9. "Out of Memory" Errors

#### Symptoms

```
Cannot allocate memory
```

#### Solutions

**A. Check current memory usage**

```bash
free -h
docker stats
```

**B. Increase swap space**

```bash
# Create 2GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

**C. Upgrade droplet**

- Minimum: $24/month (4GB RAM)
- Recommended for production: $48/month (8GB RAM)

**D. Reduce running services**

```bash
# Stop frontend temporarily
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml stop frontend
# Build backend only
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml build backend
# Start all
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml up -d
```

---

### 10. PowerShell Script Errors

#### Symptoms

```
Invoke-WebRequest : The term 'Invoke-WebRequest' is not recognized
```

#### Solutions

**A. Update PowerShell to version 5.1+**

```powershell
$PSVersionTable.PSVersion
# If < 5.1, download from Microsoft
```

**B. Use alternative health check**

```powershell
# Instead of Invoke-WebRequest, use:
Test-NetConnection -ComputerName 157.245.8.131 -Port 4000
```

**C. Run with execution policy bypass**

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\one-hour-migration.ps1
```

---

### 11. Git Clone Fails on Droplet

#### Symptoms

```
fatal: could not read from remote repository
```

#### Solutions

**A. Use HTTPS instead of SSH**

```bash
cd /app
rm -rf modular-saas-platform
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git modular-saas-platform
```

**B. Check GitHub repository is public**

- Go to GitHub repository settings
- Ensure visibility is "Public"

**C. Use GitHub personal access token**

```bash
git clone https://TOKEN@github.com/muchaeljohn739337-cloud/-modular-saas-platform.git modular-saas-platform
```

---

### 12. Redis Connection Fails

#### Symptoms

```
Error: Redis connection failed
```

#### Solutions

**A. Check if Redis is running**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml ps redis
```

**B. Test Redis connection**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml exec redis \
  redis-cli -a demo_redis_pass ping
# Should return: PONG
```

**C. Restart Redis**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml restart redis
```

**D. Check Redis logs**

```bash
docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml logs redis
```

---

## 🔍 Diagnostic Commands

### General Health Check

```bash
# SSH into droplet
ssh -i ~/.ssh/id_ed25519_mucha root@157.245.8.131

# Check all services
cd /app/modular-saas-platform
docker-compose -f docker-compose.demo.yml ps

# Check logs for all services
docker-compose -f docker-compose.demo.yml logs --tail=50

# Check system resources
htop  # Press q to quit
df -h  # Disk space
free -h  # Memory
```

### Service-Specific Checks

```bash
# Backend
curl http://localhost:4000/api/health
docker-compose -f docker-compose.demo.yml logs backend | tail -50

# Frontend
curl http://localhost:3000
docker-compose -f docker-compose.demo.yml logs frontend | tail -50

# Database
docker-compose -f docker-compose.demo.yml exec postgres \
  psql -U demo_user -d advancia_demo -c "\dt"

# Redis
docker-compose -f docker-compose.demo.yml exec redis \
  redis-cli -a demo_redis_pass info
```

### Network Checks

```bash
# Check open ports
netstat -tlnp

# Check firewall
ufw status verbose

# Check DNS resolution
nslookup advanciapayledger.com

# Test connectivity
ping -c 4 8.8.8.8
```

---

## 🆘 Emergency Recovery

### Full Reset (Nuclear Option)

**WARNING**: This deletes everything and starts fresh!

```bash
# SSH into droplet
ssh -i ~/.ssh/id_ed25519_mucha root@157.245.8.131

# Stop all containers
cd /app/modular-saas-platform
docker-compose -f docker-compose.demo.yml down -v

# Remove all Docker data
docker system prune -af --volumes

# Delete app directory
rm -rf /app/*

# Re-run setup script
curl -fsSL https://raw.githubusercontent.com/muchaeljohn739337-cloud/-modular-saas-platform/main/scripts/setup-do-droplet.sh | bash

# Re-run migration script from local machine
.\scripts\one-hour-migration.ps1 -DropletIP "157.245.8.131"
```

---

## 📞 Getting Help

### Before Asking for Help

1. **Collect logs**:

   ```bash
   docker-compose -f /app/modular-saas-platform/docker-compose.demo.yml logs > /tmp/all-logs.txt
   cat /tmp/all-logs.txt
   ```

2. **Document the error**:
   - Full error message
   - When it occurred (which step)
   - What you tried already

3. **Check system info**:

   ```bash
   uname -a
   docker --version
   docker-compose --version
   free -h
   df -h
   ```

### Support Channels

- **GitHub Issues**: <https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/issues>
- **Email**: <support@advanciapayledger.com>
- **Discord**: [Join server](#)

### Information to Include

```
**Environment**:
- OS: [e.g., Windows 11, Ubuntu 24.04]
- Droplet IP: [e.g., 157.245.8.131]
- Droplet Size: [e.g., $12/month, 2GB RAM]
- PowerShell Version: [run `$PSVersionTable.PSVersion`]

**Issue**:
[Describe what went wrong]

**Error Message**:
```

[Paste full error here]

```

**Logs**:
[Attach or paste relevant logs]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**What I've Tried**:
- [Solution 1]
- [Solution 2]
```

---

## ✅ Verification Checklist

After resolving issues, verify everything works:

- [ ] SSH into droplet: `ssh root@157.245.8.131`
- [ ] All containers running: `docker-compose ps`
- [ ] Backend health: `curl http://157.245.8.131:4000/api/health`
- [ ] Frontend loads: `curl http://157.245.8.131:3000`
- [ ] MailHog UI: `curl http://157.245.8.131:8025`
- [ ] Database accessible: `psql "postgresql://demo_user:demo_pass_2024@157.245.8.131:5432/advancia_demo"`
- [ ] Redis accessible: `redis-cli -h 157.245.8.131 -p 6379 -a demo_redis_pass ping`
- [ ] No ERROR logs: `docker-compose logs | grep -i error`
- [ ] CPU < 80%: `htop`
- [ ] Memory < 80%: `free -h`
- [ ] Disk < 80%: `df -h`

---

**Last Updated**: November 14, 2025

**For**: One-Hour DigitalOcean Migration v1.0

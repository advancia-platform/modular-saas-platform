# 🚀 Production Deployment Guide - Advancia PayLedger

## Overview

Complete production deployment workflow using PM2 with built-in log rotation, environment management, and auto-restart capabilities.

## 📋 Prerequisites

### Server Requirements

- Ubuntu 20.04+ or CentOS 7+
- Node.js 18+ installed
- PM2 installed globally (`npm install -g pm2`)
- Git repository cloned
- SSL certificates configured
- Environment files prepared

### Environment Setup

```bash
# Clone repository
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
cd -modular-saas-platform

# Copy environment files
cp .env.production.example backend/.env.production
cp .env.production.example frontend/.env.production

# Edit environment variables (see .env.production.example for details)
nano backend/.env.production
nano frontend/.env.production
```

---

## 🔄 Deployment Workflow

### Phase 1: Staging Deployment & Testing

#### 1. Deploy to Staging

```bash
# Switch to staging branch (if using branches)
git checkout staging
git pull origin staging

# Or deploy main branch to staging server
ssh user@staging-server
cd /path/to/project
git pull origin main
```

#### 2. Build and Start Services

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

#### 3. Verify Log Rotation Setup

```bash
# Check PM2 status
pm2 list

# Monitor logs in real-time
pm2 logs advancia-backend

# Check log directory structure
ls -la backend/logs/
ls -la frontend/logs/

# Verify logrotate is active
pm2 show advancia-backend | grep -A 10 logrotate
```

#### 4. Test Health Endpoints

```bash
# Backend health check
curl http://localhost:4000/health

# Frontend availability
curl http://localhost:3000

# Database connectivity (if applicable)
curl http://localhost:4000/api/health/db
```

#### 5. Load Testing (Optional)

```bash
# Simple load test
ab -n 1000 -c 10 http://localhost:4000/health

# Monitor resource usage
pm2 monit
```

---

### Phase 2: Production Deployment

#### 1. Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Database backups created
- [ ] Previous deployment logs archived
- [ ] Monitoring alerts configured

#### 2. Zero-Downtime Deployment

```bash
# Connect to production server
ssh user@production-server

# Navigate to project directory
cd /root/projects/advancia-pay-ledger

# Pull latest changes
git pull origin main

# Run deployment script
./deploy.sh
```

#### 3. Post-Deployment Verification

```bash
# Check all services are running
pm2 list

# Verify log rotation is working
pm2 logs --lines 10

# Test external endpoints
curl https://api.advanciapayledger.com/health
curl https://advanciapayledger.com

# Check SSL certificate
openssl s_client -connect advanciapayledger.com:443 -servername advanciapayledger.com < /dev/null
```

---

## 🔧 PM2 Ecosystem Configuration

### Key Features

- **Log Rotation**: 10MB max, 7 day retention, gzip compression
- **Auto-Restart**: Memory limits, health checks, graceful restarts
- **Environment Management**: Separate configs for staging/production
- **Process Monitoring**: Built-in monitoring and alerting

### Configuration Details

```javascript
// ecosystem.config.js highlights
{
  apps: [
    {
      name: 'advancia-backend',
      script: './dist/index.js',
      instances: 1,
      max_memory_restart: '1G',
      env_file: './backend/.env.production',
      // ... more config
    }
  ],
  logrotate: {
    max_size: '10M',
    retain: 7,
    compress: true,
    dateFormat: 'YYYY-MM-DD_HH-mm-ss'
  }
}
```

### PM2 Commands Reference

```bash
# Start all services
pm2 start ecosystem.config.js

# View status
pm2 list

# Monitor resources
pm2 monit

# View logs
pm2 logs
pm2 logs advancia-backend --lines 50

# Restart services
pm2 restart ecosystem.config.js

# Reload for zero-downtime
pm2 reload ecosystem.config.js

# Stop all
pm2 stop ecosystem.config.js

# Delete processes
pm2 delete ecosystem.config.js

# Save process list for auto-startup
pm2 save
pm2 startup
```

---

## 📊 Monitoring & Maintenance

### Log Management

```bash
# View current logs
pm2 logs advancia-backend

# Follow logs in real-time
pm2 logs advancia-backend --follow

# Check log rotation status
ls -la backend/logs/
# Should show: out.log, err.log, combined.log
# Plus rotated: out-2025-11-14_00-00-00.log.gz

# Manual log rotation
pm2 reloadLogs
```

### Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
free -h

# Application metrics
curl http://localhost:4000/metrics  # If implemented
```

### Backup Strategy

```bash
# Database backup
pg_dump -U postgres -h localhost advancia_payledger > backup_$(date +%Y%m%d_%H%M%S).sql

# Log archives
tar -czf logs_backup_$(date +%Y%m%d).tar.gz backend/logs/

# Configuration backup
cp ecosystem.config.js ecosystem.config.js.backup
```

---

## 🚨 Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check PM2 status
pm2 list

# View detailed logs
pm2 logs advancia-backend --lines 50

# Check environment variables
pm2 show advancia-backend

# Restart with verbose logging
pm2 restart ecosystem.config.js --log-level debug
```

#### Log Rotation Not Working

```bash
# Check if pm2-logrotate is installed
pm2 list | grep logrotate

# Install if missing
pm2 install pm2-logrotate

# Verify configuration
pm2 show advancia-backend | grep logrotate

# Manual rotation test
pm2 reloadLogs
```

#### Memory Issues

```bash
# Check memory usage
pm2 monit

# View memory limits
pm2 show advancia-backend

# Adjust memory limit if needed
pm2 set advancia-backend max_memory_restart 2G
```

#### Port Conflicts

```bash
# Check what's using ports
netstat -tulpn | grep :4000
netstat -tulpn | grep :3000

# Kill conflicting processes
sudo kill -9 <PID>

# Or change ports in ecosystem.config.js
```

### Health Check Failures

```bash
# Manual health check
curl http://localhost:4000/health

# Check backend logs
pm2 logs advancia-backend --lines 20

# Restart backend
pm2 restart advancia-backend

# Check database connectivity
curl http://localhost:4000/api/health/db
```

---

## 🔄 Rollback Procedures

### Quick Rollback

```bash
# Stop current deployment
pm2 stop ecosystem.config.js

# Revert to previous commit
git log --oneline -10
git checkout <previous-commit-hash>

# Rebuild and restart
./deploy.sh
```

### Emergency Rollback

```bash
# Stop all services
pm2 kill

# Restore from backup
cp ecosystem.config.js.backup ecosystem.config.js
cp .env.production.backup backend/.env.production

# Start services
pm2 start ecosystem.config.js
```

---

## 📈 Scaling Considerations

### Horizontal Scaling

```javascript
// ecosystem.config.js for multiple instances
{
  name: 'advancia-backend',
  instances: 'max',  // CPU core count
  exec_mode: 'cluster',
  // Load balancer will be needed
}
```

### Vertical Scaling

```javascript
// Increase memory limits
{
  max_memory_restart: '2G',
  node_args: '--max-old-space-size=2048'
}
```

### Database Scaling

- Implement connection pooling
- Add read replicas
- Consider database clustering

---

## 🔒 Security Checklist

### Pre-Deployment

- [ ] SSL certificates valid and current
- [ ] Environment variables encrypted
- [ ] Database credentials rotated
- [ ] Firewall rules configured
- [ ] SSH keys updated

### Post-Deployment

- [ ] Security headers enabled
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Sensitive data not in logs

---

## 📞 Support & Monitoring

### Alert Configuration

```bash
# PM2 alerts (requires PM2 Plus)
pm2 link <secret> <public>

# System monitoring
# Configure alerts for:
# - Service down
# - High memory usage
# - Log rotation failures
# - SSL certificate expiration
```

### Contact Information

- **DevOps Team**: devops@advanciapayledger.com
- **Emergency**: +1-XXX-XXX-XXXX
- **Documentation**: https://github.com/muchaeljohn739337-cloud/-modular-saas-platform

---

## ✅ Success Metrics

After successful deployment, verify:

- [ ] All services running (pm2 list)
- [ ] Health checks passing
- [ ] Logs rotating properly
- [ ] SSL certificates valid
- [ ] External URLs accessible
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested

---

_Last updated: November 14, 2025_
_Version: 1.0.0_</content>
<parameter name="filePath">c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\-modular-saas-platform\PRODUCTION_DEPLOYMENT_GUIDE.md

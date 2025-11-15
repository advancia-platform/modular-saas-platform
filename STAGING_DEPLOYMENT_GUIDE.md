# Advancia Pay Ledger - Staging Deployment Guide

## 🎯 Overview

This guide covers deploying the Advancia Pay Ledger to a staging environment for pre-production testing.

## 📋 Prerequisites

- Docker & Docker Compose installed
- Domain/subdomain configured (e.g., staging.advancia.com)
- SSL certificates (Let's Encrypt recommended)
- Access to staging server (SSH)
- Environment variables configured

## 🚀 Quick Start

### 1. Configure Environment

```bash
# Copy environment template
cp .env.staging.example .env.staging

# Edit with your staging credentials
nano .env.staging

# Generate secure secrets
openssl rand -base64 32  # For JWT secrets
openssl rand -base64 24  # For passwords
```

### 2. Start Staging Environment

```bash
# Build and start all services
docker-compose -f docker-compose.staging.yml up -d

# Check service status
docker-compose -f docker-compose.staging.yml ps

# View logs
docker-compose -f docker-compose.staging.yml logs -f
```

### 3. Initialize Database

```bash
# Run migrations
docker-compose -f docker-compose.staging.yml exec backend-staging npm run prisma:migrate:deploy

# Seed initial data
docker-compose -f docker-compose.staging.yml exec backend-staging npm run seed:staging

# Verify database
docker-compose -f docker-compose.staging.yml exec postgres-staging psql -U staging_user -d advancia_staging -c "\dt"
```

### 4. Verify Deployment

```bash
# Check backend health
curl https://staging-api.advancia.com/api/health

# Check frontend
curl -I https://staging.advancia.com

# Check API documentation
curl https://staging-api.advancia.com/api-docs
```

## 🔧 Staging Management Commands

### Service Management

```bash
# Start services
docker-compose -f docker-compose.staging.yml up -d

# Stop services
docker-compose -f docker-compose.staging.yml down

# Restart specific service
docker-compose -f docker-compose.staging.yml restart backend-staging

# View service logs
docker-compose -f docker-compose.staging.yml logs -f backend-staging

# Scale services
docker-compose -f docker-compose.staging.yml up -d --scale backend-staging=2
```

### Database Operations

```bash
# Backup database
docker-compose -f docker-compose.staging.yml exec postgres-staging pg_dump -U staging_user advancia_staging > staging_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
cat backup.sql | docker-compose -f docker-compose.staging.yml exec -T postgres-staging psql -U staging_user -d advancia_staging

# Connect to database
docker-compose -f docker-compose.staging.yml exec postgres-staging psql -U staging_user -d advancia_staging

# Reset database
docker-compose -f docker-compose.staging.yml exec backend-staging npm run prisma:migrate:reset
```

### Monitoring

```bash
# Access Prometheus
open https://staging-prometheus.advancia.com

# Access Grafana
open https://staging-grafana.advancia.com

# Check container stats
docker stats

# Check disk usage
docker system df
```

## 🔐 Security Checklist

- [ ] All secrets generated and stored securely
- [ ] SSL certificates installed and valid
- [ ] Firewall configured (only allow 80, 443, SSH)
- [ ] Database access restricted to internal network
- [ ] Redis password protected
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Sentry monitoring active
- [ ] Backup automation configured

## 🧪 Testing in Staging

### 1. Run Integration Tests

```bash
# From local machine against staging
npm run test:integration:staging

# Or connect and run
ssh staging-server
cd /app
npm run test:e2e
```

### 2. Test Authentication

```bash
# Register new user
curl -X POST https://staging-api.advancia.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST https://staging-api.advancia.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 3. Test Payment Flow

```bash
# Create test deposit (requires auth token)
curl -X POST https://staging-api.advancia.com/api/transactions/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100,
    "currency": "ADVP",
    "walletId": "wallet-id"
  }'
```

## 📊 Monitoring & Alerts

### Access Monitoring Dashboards

- **Prometheus**: https://staging-prometheus.advancia.com
- **Grafana**: https://staging-grafana.advancia.com
  - Username: admin
  - Password: (from .env.staging)

### Key Metrics to Monitor

- API response times
- Error rates
- Database connection pool
- Redis cache hit rate
- Transaction success rates
- Active user sessions

## 🔄 Deployment Pipeline

### Automated Deployment (GitHub Actions)

Pushes to `staging` branch automatically deploy:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches: [staging]
```

### Manual Deployment

```bash
# On local machine
git checkout staging
git pull origin main
git push origin staging

# On staging server
cd /app
git pull origin staging
docker-compose -f docker-compose.staging.yml up -d --build
```

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.staging.yml logs backend-staging

# Check container status
docker ps -a

# Remove and recreate
docker-compose -f docker-compose.staging.yml down
docker-compose -f docker-compose.staging.yml up -d --build
```

### Database Connection Issues

```bash
# Test database connectivity
docker-compose -f docker-compose.staging.yml exec postgres-staging pg_isready

# Check environment variables
docker-compose -f docker-compose.staging.yml exec backend-staging env | grep DATABASE

# Restart database
docker-compose -f docker-compose.staging.yml restart postgres-staging
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check database performance
docker-compose -f docker-compose.staging.yml exec postgres-staging psql -U staging_user -d advancia_staging -c "SELECT * FROM pg_stat_activity;"

# Clear Redis cache
docker-compose -f docker-compose.staging.yml exec redis-staging redis-cli -a $STAGING_REDIS_PASSWORD FLUSHALL
```

## 📦 Backup & Recovery

### Automated Backups

Backups run daily at 2 AM (configured in docker-compose.staging.yml).

### Manual Backup

```bash
# Full backup script
./scripts/backup-staging.sh

# Database only
docker-compose -f docker-compose.staging.yml exec postgres-staging pg_dump -U staging_user advancia_staging | gzip > staging_db_$(date +%Y%m%d).sql.gz

# Files only
tar -czf staging_files_$(date +%Y%m%d).tar.gz ./backend/logs ./frontend/logs
```

### Restore from Backup

```bash
# Restore database
gunzip < staging_db_20241115.sql.gz | docker-compose -f docker-compose.staging.yml exec -T postgres-staging psql -U staging_user -d advancia_staging

# Restore files
tar -xzf staging_files_20241115.tar.gz
```

## 🔄 Update & Rollback

### Update to Latest Version

```bash
# Pull latest code
git pull origin staging

# Rebuild and restart
docker-compose -f docker-compose.staging.yml up -d --build

# Run migrations
docker-compose -f docker-compose.staging.yml exec backend-staging npm run prisma:migrate:deploy
```

### Rollback

```bash
# Revert to previous commit
git log --oneline  # Find commit hash
git checkout <commit-hash>

# Rebuild with old code
docker-compose -f docker-compose.staging.yml up -d --build

# Restore database if needed
# (Use backup from before update)
```

## ✅ Staging Environment Checklist

Before promoting to production:

- [ ] All services healthy and running
- [ ] Database migrations applied successfully
- [ ] SSL certificates valid
- [ ] Monitoring dashboards accessible
- [ ] API documentation accessible at /api-docs
- [ ] Authentication flow working
- [ ] Payment processing tested (test mode)
- [ ] Email notifications working (test SMTP)
- [ ] 2FA tested
- [ ] Rate limiting verified
- [ ] Error tracking active (Sentry)
- [ ] Backup automation working
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] All critical user flows tested

## 🆘 Support

For staging environment issues:
- Check logs: `docker-compose -f docker-compose.staging.yml logs`
- Review monitoring: Grafana dashboards
- Contact DevOps team
- Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 📚 Additional Resources

- [API Documentation](https://staging-api.advancia.com/api-docs)
- [DEPLOYMENT_ARCHITECTURE.md](DEPLOYMENT_ARCHITECTURE.md)
- [SECURITY_HARDENING.md](SECURITY_HARDENING.md)
- [MONITORING_QUICK_REFERENCE.md](MONITORING_QUICK_REFERENCE.md)

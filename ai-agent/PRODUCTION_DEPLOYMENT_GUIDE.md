# Production Deployment Guide

# Complete guide for deploying the Cybersecurity AI system to production

## Overview

This guide provides step-by-step instructions for deploying the Cybersecurity AI system to a production environment using Docker containers, SSL/TLS encryption, monitoring, and automated health checks.

## Prerequisites

### System Requirements

- Linux server (Ubuntu 20.04+ or CentOS 8+ recommended)
- Docker 20.10+ and Docker Compose 2.0+
- Node.js 18+ (for development and build processes)
- PostgreSQL 14+ (containerized or external)
- Redis 6+ (containerized or external)
- NGINX (included in Docker setup)

### Hardware Requirements

- **Minimum**: 4 CPU cores, 8GB RAM, 100GB storage
- **Recommended**: 8 CPU cores, 16GB RAM, 250GB SSD storage
- **Network**: Stable internet connection with static IP
- **SSL**: Domain name with DNS configuration

### Software Prerequisites

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install additional tools
sudo apt update
sudo apt install -y openssl curl jq bc
```

## Deployment Steps

### Step 1: Environment Configuration

1. **Run the production setup script:**

```bash
chmod +x setup-production.sh
./setup-production.sh
```

2. **Configure your domain and services:**
   - Enter your domain name (e.g., cybersec-ai.com)
   - Configure database credentials
   - Set up email notifications
   - Configure external service integrations

3. **Review the generated configuration:**

```bash
# Verify environment file
cat .env.production

# Check file permissions (should be 600)
ls -la .env.production
```

### Step 2: SSL Certificate Setup

Choose one of the following SSL certificate options:

#### Option A: Let's Encrypt (Recommended for Production)

```bash
# Set your domain
export DOMAIN=your-domain.com

# Generate Let's Encrypt certificate
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh --letsencrypt
```

#### Option B: Self-Signed Certificate (Development/Testing)

```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh --self-signed
```

#### Option C: Commercial Certificate

1. Generate a Certificate Signing Request (CSR)
2. Purchase certificate from a Certificate Authority
3. Install certificate files to `/etc/ssl/certs/cybersecurity-ai.crt` and `/etc/ssl/private/cybersecurity-ai.key`

### Step 3: Database Initialization

1. **Initialize the PostgreSQL database:**

```bash
# If using external PostgreSQL
sudo -u postgres psql < init-database.sql

# If using Docker PostgreSQL (skip this step, handled automatically)
```

2. **Verify database connection:**

```bash
# Test connection using environment variables
docker run --rm --env-file .env.production postgres:14-alpine pg_isready -h database -p 5432
```

### Step 4: Production Deployment

1. **Build and deploy the system:**

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

2. **Monitor the deployment:**

```bash
# Watch container logs
docker-compose -f docker-compose.production.yml logs -f

# Check container status
docker-compose -f docker-compose.production.yml ps
```

### Step 5: Health Check and Verification

1. **Run comprehensive health checks:**

```bash
chmod +x health-check.sh
./health-check.sh
```

2. **Verify system functionality:**

```bash
# Check API endpoints
curl -k https://your-domain.com/health
curl -k https://your-domain.com/api/health

# Check dashboard access
curl -k https://your-domain.com/

# Check metrics endpoint
curl -k https://your-domain.com/metrics
```

### Step 6: Monitoring Setup

1. **Access monitoring dashboards:**
   - **Grafana**: `https://your-domain.com:3001` (admin/admin)
   - **Prometheus**: `https://your-domain.com:9090`
   - **Kibana**: `https://your-domain.com:5601`

2. **Configure monitoring alerts:**
   - Set up email notifications
   - Configure Slack webhooks
   - Set alert thresholds

## Service Configuration

### Core Services

#### AI Agent Service

- **Port**: 3001 (internal), 443 (external HTTPS)
- **Health Check**: `/health`
- **Metrics**: `/metrics`
- **Configuration**: Environment variables in `.env.production`

#### Dashboard Service

- **Port**: 3000 (internal), 443 (external HTTPS)
- **URL**: `https://your-domain.com`
- **Authentication**: JWT-based

#### Database Service (PostgreSQL)

- **Port**: 5432 (internal only)
- **Database**: `cybersecurity_ai`
- **Backup**: Automated daily backups
- **Persistence**: Docker volume `postgres_data`

#### Cache Service (Redis)

- **Port**: 6379 (internal only)
- **Configuration**: Password protected
- **Persistence**: Docker volume `redis_data`

#### Reverse Proxy (NGINX)

- **Ports**: 80 (HTTP redirect), 443 (HTTPS)
- **SSL Termination**: Automatic
- **Load Balancing**: Round-robin

### Monitoring Services

#### Prometheus (Metrics Collection)

- **Port**: 9090
- **Configuration**: `monitoring/prometheus.yml`
- **Retention**: 15 days

#### Grafana (Visualization)

- **Port**: 3001
- **Default Login**: admin/admin
- **Dashboards**: Pre-configured for AI system

#### ELK Stack (Logging)

- **Elasticsearch**: 9200
- **Logstash**: 5000
- **Kibana**: 5601

## Security Configuration

### Network Security

```bash
# Configure firewall rules
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# Block direct access to service ports
sudo ufw deny 3000/tcp     # Dashboard
sudo ufw deny 3001/tcp     # AI Agent
sudo ufw deny 5432/tcp     # PostgreSQL
sudo ufw deny 6379/tcp     # Redis
```

### SSL/TLS Configuration

- **Protocol**: TLS 1.2+
- **Cipher Suites**: Modern, secure ciphers only
- **HSTS**: Enabled with 1-year max-age
- **Certificate**: Auto-renewal with Let's Encrypt

### Authentication & Authorization

- **JWT Tokens**: 256-bit signing keys
- **Password Hashing**: bcrypt with 12 rounds
- **Session Management**: Redis-backed sessions
- **Rate Limiting**: 1000 requests/minute per IP

## Maintenance & Operations

### Backup Procedures

#### Automated Backups

```bash
# Database backup (runs daily at 2 AM)
0 2 * * * /usr/local/bin/backup-database.sh

# Application backup
0 3 * * * /usr/local/bin/backup-application.sh
```

#### Manual Backup

```bash
# Create database backup
docker exec cybersecurity_ai_database pg_dump -U cybersec_user cybersecurity_ai > backup_$(date +%Y%m%d).sql

# Create full system backup
docker run --rm -v $(pwd):/backup alpine tar -czf /backup/system_backup_$(date +%Y%m%d).tar.gz /data
```

### Log Management

```bash
# View application logs
docker-compose -f docker-compose.production.yml logs ai_agent

# View system logs
journalctl -u docker -f

# Access centralized logs via Kibana
# URL: https://your-domain.com:5601
```

### Performance Monitoring

```bash
# System resource monitoring
htop

# Docker container stats
docker stats

# Application metrics
curl -s https://your-domain.com/metrics
```

### Updates and Patches

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d

# Update application code
git pull origin main
./deploy-production.sh
```

## Troubleshooting

### Common Issues

#### Service Won't Start

1. Check environment variables: `cat .env.production`
2. Verify Docker containers: `docker ps -a`
3. Check logs: `docker-compose logs service_name`
4. Verify ports: `netstat -tulpn | grep :3001`

#### SSL Certificate Issues

```bash
# Verify certificate files
sudo ls -la /etc/ssl/certs/cybersecurity-ai.crt
sudo ls -la /etc/ssl/private/cybersecurity-ai.key

# Check certificate validity
sudo openssl x509 -in /etc/ssl/certs/cybersecurity-ai.crt -noout -dates

# Renew Let's Encrypt certificate
sudo certbot renew
```

#### Database Connection Issues

```bash
# Test database connectivity
docker exec cybersecurity_ai_database pg_isready

# Check database logs
docker logs cybersecurity_ai_database

# Verify credentials
grep DATABASE_URL .env.production
```

#### Performance Issues

```bash
# Check system resources
free -h
df -h
top

# Monitor Docker containers
docker stats

# Check application metrics
curl -s https://your-domain.com/metrics | grep -E "(cpu|memory|disk)"
```

### Log Analysis

```bash
# Application errors
docker logs cybersecurity_ai_main | grep -i error

# Authentication issues
docker logs cybersecurity_ai_main | grep -i "auth\|login"

# Performance issues
docker logs cybersecurity_ai_main | grep -i "slow\|timeout"
```

## Scaling and High Availability

### Horizontal Scaling

```bash
# Scale AI agent service
docker-compose -f docker-compose.production.yml up -d --scale ai_agent=3

# Load balancer configuration
# Update NGINX configuration for multiple backend servers
```

### Database Scaling

- **Read Replicas**: Configure PostgreSQL streaming replication
- **Connection Pooling**: Use PgBouncer for connection management
- **Backup Strategy**: Multi-region backups

### Monitoring Scaling

- **Metrics Retention**: Configure Prometheus for longer retention
- **Log Aggregation**: Centralize logs from multiple instances
- **Alert Management**: Configure escalation policies

## Disaster Recovery

### Backup Strategy

- **Database**: Daily automated backups with 30-day retention
- **Application Data**: Weekly full backups
- **Configuration**: Version-controlled environment files
- **SSL Certificates**: Automated renewal and backup

### Recovery Procedures

1. **System Recovery**: Restore from latest backup
2. **Database Recovery**: Point-in-time recovery from backup
3. **Certificate Recovery**: Re-issue certificates if needed
4. **Service Recovery**: Deploy from version control

## Security Compliance

### Data Protection

- **Encryption**: TLS 1.2+ for all communications
- **Data at Rest**: PostgreSQL encryption
- **Access Control**: Role-based authentication
- **Audit Logging**: Comprehensive access logging

### Compliance Standards

- **SOC 2 Type II**: Security controls implementation
- **ISO 27001**: Information security management
- **GDPR**: Data protection and privacy
- **PCI DSS**: Payment data security (if applicable)

## Support and Documentation

### Documentation

- **API Documentation**: `https://your-domain.com/docs`
- **Admin Guide**: `https://your-domain.com/admin/docs`
- **Monitoring Guide**: `https://your-domain.com/monitoring/docs`

### Support Contacts

- **Technical Support**: <admin@your-domain.com>
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Documentation**: Internal wiki or knowledge base

### Monitoring Contacts

- **Alert Notifications**: Configured in monitoring systems
- **Escalation Procedures**: Defined in incident response plan
- **Status Page**: Public system status updates

---

## Quick Reference

### Essential Commands

```bash
# Deploy production system
./deploy-production.sh

# Run health checks
./health-check.sh

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Check status
docker-compose -f docker-compose.production.yml ps

# Backup database
docker exec cybersecurity_ai_database pg_dump -U cybersec_user cybersecurity_ai > backup.sql

# Update SSL certificates
sudo ./setup-ssl.sh --letsencrypt

# Monitor system resources
htop
```

### Important URLs

- **Main Application**: `https://your-domain.com`
- **API Health Check**: `https://your-domain.com/health`
- **Metrics**: `https://your-domain.com/metrics`
- **Grafana Dashboard**: `https://your-domain.com:3001`
- **Kibana Logs**: `https://your-domain.com:5601`

### Configuration Files

- **Environment**: `.env.production`
- **Docker Compose**: `docker-compose.production.yml`
- **SSL Certificates**: `/etc/ssl/certs/cybersecurity-ai.crt`
- **Database Init**: `init-database.sql`
- **Health Check**: `health-check.sh`

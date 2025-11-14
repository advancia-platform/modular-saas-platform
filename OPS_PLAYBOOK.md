# ⚙️ Advvancia Ops Playbook

**Self-hosted SaaS Master Manual** - Complete infrastructure, deployment, security, and scaling guide for the Advvancia fintech platform.

---

## 🏗️ Infrastructure Overview

### Cloud Provider

- **Provider**: DigitalOcean Droplet (Ubuntu 22.04 LTS)
- **Specs**: 2 vCPU, 4GB RAM, 80GB SSD (scale as needed)
- **Firewall**: UFW (allow only SSH:22, HTTP:80, HTTPS:443)
- **DNS**: Cloudflare nameservers
- **Edge Security**: Cloudflare (SSL, WAF, Rate Limiting, Bot Protection)

### Application Stack

- **Frontend**: React + Next.js (Dockerized, port 3000)
- **Backend**: Node.js + Express (Dockerized, port 4000)
- **Database**: PostgreSQL (Dockerized, persistent volume)
- **Reverse Proxy**: Nginx
- **Containerization**: Docker + Docker Compose
- **Process Management**: PM2 (optional for non-Docker deployments)

### Security & Compliance

- **WAF**: Cloudflare (SQLi, XSS, brute force protection)
- **Rate Limiting**: 10 requests/minute on `/api/login` and `/api/register`
- **Bot Protection**: Cloudflare Bot Fight Mode enabled
- **Access Control**: Role-based (admin/user) + Cloudflare Access for admin routes
- **Encryption**: HTTPS enforced everywhere
- **Compliance**: Audit logs (PCI DSS, SOC2 ready)

---

## 🚀 Quick Start Deployment

### 1. Provision Infrastructure

```bash
# Create DigitalOcean Droplet
# Ubuntu 22.04 LTS, 2GB RAM minimum
# Add SSH key during creation
```

### 2. Base Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker + Compose
sudo apt install docker.io docker-compose -y

# Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/your-org/advvancia.git
cd advvancia

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit .env files with your secrets:
# - JWT_SECRET
# - STRIPE_SECRET_KEY
# - PLAID_CLIENT_ID/SECRET
# - DATABASE_URL
# - SENTRY_DSN

# Start the stack
docker-compose up -d --build

# Verify deployment
docker-compose ps
curl http://localhost/api/health
```

### 4. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/advvancia`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/advvancia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Enable SSL Certificates

```bash
# Get Let's Encrypt certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test renewal
sudo certbot renew --dry-run

# Setup auto-renewal (runs twice daily)
sudo systemctl status certbot.timer
```

### 6. Configure Cloudflare Security

1. **DNS Setup**:
   - Point domain to Cloudflare nameservers
   - Add A record: `@` → your Droplet IP
   - Add CNAME: `www` → `@`

2. **SSL Configuration**:
   - Set SSL mode to "Full (Strict)"
   - Enable "Always Use HTTPS"

3. **WAF & Security**:
   - Enable Cloudflare WAF with OWASP ruleset
   - Add custom rules for SQLi/XSS protection
   - Enable Bot Fight Mode

4. **Rate Limiting**:

   ```
   Rate limit: 10 requests per minute
   URL pattern: *login* or *register*
   Action: Block with 429 status
   ```

5. **Zero Trust Access** (for admin routes):
   - Enable Cloudflare Access
   - Protect `/admin/*` routes
   - Require authentication for admin access

---

## 📊 Monitoring & Logging

### DigitalOcean Monitoring

```bash
# Enable in DigitalOcean dashboard
# Monitors: CPU, Memory, Disk, Bandwidth
# Alerts: Configure thresholds for each metric
```

### Sentry Error Tracking

```bash
# Backend: Add SENTRY_DSN to .env
# Frontend: Add NEXT_PUBLIC_SENTRY_DSN to .env.local
# Configure releases and environments
```

### Datadog APM

```bash
# Install Datadog agent
DD_API_KEY=your_datadog_api_key bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure application monitoring
# Add Datadog tracing to your Node.js apps
```

### Cloudflare Analytics

- **Dashboard**: Traffic, threats, performance
- **Logs**: Real-time request logging
- **Security Events**: WAF blocks, rate limit hits

### Audit Logging

```sql
-- PostgreSQL audit table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(255),
    resource VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Advvancia

on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Build Docker Images
        run: |
          docker-compose build
          docker tag advvancia-backend your-registry/advvancia-backend:latest
          docker tag advvancia-frontend your-registry/advvancia-frontend:latest

      - name: Push to Registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push your-registry/advvancia-backend:latest
          docker push your-registry/advvancia-frontend:latest

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: ${{ secrets.DROPLET_USER }}
          key: ${{ secrets.DROPLET_SSH_KEY }}
          script: |
            cd /path/to/advvancia
            git pull origin main
            docker-compose pull
            docker-compose up -d --build
            docker system prune -f
```

### Required Secrets

Add to GitHub repository secrets:

- `DROPLET_IP`: Your DigitalOcean Droplet IP
- `DROPLET_USER`: SSH username (usually `root`)
- `DROPLET_SSH_KEY`: Private SSH key
- `REGISTRY_USER`: Docker registry username
- `REGISTRY_PASSWORD`: Docker registry password

---

## 📈 Scaling & Maintenance

### Vertical Scaling

```bash
# Resize Droplet via DigitalOcean dashboard
# Options: 4GB → 8GB RAM, 2 → 4 vCPUs
# Zero downtime: Power off, resize, power on
```

### Database Scaling

```bash
# Option 1: Upgrade to DigitalOcean Managed Database
# Option 2: Migrate to AWS RDS or Google Cloud SQL
# Option 3: Set up read replicas for high availability
```

### Backup Strategy

```bash
# Daily PostgreSQL backup
0 2 * * * pg_dump -U postgres -h localhost advvancia > /backups/advancia_$(date +\%Y\%m\%d).sql

# Weekly full backup
0 3 * * 0 docker exec advvancia-db pg_dumpall -U postgres > /backups/full_$(date +\%Y\%m\%d).sql

# Offsite backup (upload to cloud storage)
aws s3 cp /backups/ s3://your-backup-bucket/ --recursive
```

### Log Management

```bash
# Centralize logs with ELK stack
docker run -d --name elasticsearch -p 9200:9200 -p 9300:9300 elasticsearch:7.10.0
docker run -d --name logstash -p 5044:5044 logstash:7.10.0
docker run -d --name kibana -p 5601:5601 kibana:7.10.0

# Or use Datadog log collection
# Configure log shipping from Docker containers
```

### Security Updates

```bash
# Weekly security updates
0 4 * * 0 apt update && apt upgrade -y && apt autoremove -y

# Docker image updates
docker-compose pull && docker-compose up -d

# SSL certificate renewal (auto via certbot)
```

---

## 🚨 Troubleshooting

### Common Issues

**Port 80/443 already in use:**

```bash
sudo netstat -tulpn | grep :80
sudo systemctl stop apache2  # if Apache is running
```

**Docker containers not starting:**

```bash
docker-compose logs
docker-compose ps
docker system df  # check disk space
```

**SSL certificate issues:**

```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

**Database connection failed:**

```bash
docker-compose exec db psql -U postgres -d advvancia
# Check DATABASE_URL in .env files
```

**Rate limiting too aggressive:**

- Adjust Cloudflare rate limiting rules
- Check application-level rate limiting in backend

### Performance Optimization

```bash
# Nginx optimization
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Docker resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## 📋 Feature Checklist

### ✅ Authentication & User Management

- [x] JWT-based login/signup
- [x] Password hashing (bcrypt)
- [x] Role-based access control (admin/user)
- [x] MFA/SSO for admin routes (Cloudflare Access)

### ✅ Payments & Transactions

- [x] Stripe integration (payments)
- [x] Plaid integration (bank linking)
- [x] Transaction history API
- [x] Webhooks for payment events

### ✅ Dashboard & UI

- [x] Responsive React dashboard
- [x] Charts (Chart.js or Recharts)
- [x] Notifications (toast, email)
- [x] User profile & settings

### ✅ Backend Logic

- [x] RESTful API with Express
- [x] PostgreSQL models (users, transactions, logs)
- [x] Validation middleware (Joi/Zod)
- [x] Error handling middleware

### ✅ DevOps & Deployment

- [x] Dockerfiles for backend/frontend
- [x] .dockerignore and .env.example files
- [x] docker-compose.yml for full stack
- [x] Nginx reverse proxy config
- [x] CI/CD pipeline (GitHub Actions)
- [x] GitHub Container Registry (optional)

### ✅ Monitoring & Logging

- [x] Sentry (frontend/backend errors)
- [x] Datadog (performance metrics)
- [x] DigitalOcean Monitoring (CPU, memory, disk)
- [x] Cloudflare Analytics (traffic, threats)
- [x] Audit logs for compliance

---

## 📞 Support & Resources

### Quick Commands Reference

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service]

# Restart services
docker-compose restart

# Update and redeploy
git pull && docker-compose up -d --build

# Backup database
docker exec advvancia-db pg_dump -U postgres advvancia > backup.sql

# Check SSL certificate
sudo certbot certificates

# Renew SSL
sudo certbot renew
```

### Documentation Links

- [README.md](./README.md) - Project overview
- [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) - Feature checklist
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DIGITALOCEAN_DROPLET_DEPLOYMENT.md](./DIGITALOCEAN_DROPLET_DEPLOYMENT.md) - Detailed deployment guide
- [CLOUDFLARE_SECURITY_GUIDE.md](./CLOUDFLARE_SECURITY_GUIDE.md) - Security configuration
- [DAY2_OPS_CHECKLIST.md](./DAY2_OPS_CHECKLIST.md) - Ongoing operations checklist
- [OPS_WALL_CHART.md](./OPS_WALL_CHART.md) - Visual ops timeline
- [FOUNDERS_OPS_HANDBOOK.md](./FOUNDERS_OPS_HANDBOOK.md) - Consolidated ops guide
- [POST_LAUNCH_ROADMAP.md](./POST_LAUNCH_ROADMAP.md) - Feature rollout priorities
- [NOTION_BOARD_TEMPLATE.md](./NOTION_BOARD_TEMPLATE.md) - Kanban board template for tracking

### Job Execution Patterns

#### GitHub Actions (CI/CD)

```yaml
name: Advvancia Pipeline

on:
  push:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: docker-compose build

  deploy:
    runs-on: ubuntu-latest
    needs: build # ensures deploy only runs after build
    concurrency: # prevents duplicate runs
      group: advvancia-deploy
      cancel-in-progress: true
    steps:
      - uses: actions/checkout@v3
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v0.1.7
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: ${{ secrets.DROPLET_USER }}
          key: ${{ secrets.DROPLET_SSH_KEY }}
          script: |
            cd advvancia
            git pull origin main
            docker-compose up -d --build
```

✅ **Key points**

- `needs:` → ensures jobs run systematically in order.
- `concurrency:` → avoids duplicate runs (only one deploy job per branch).

#### Node.js Job Runner (Custom Script)

```js
import Queue from "bull";

const jobQueue = new Queue("advvancia-jobs");

// Prevent duplicate jobs by using jobId
function addJob(name, data) {
  return jobQueue.add(name, data, { jobId: `${name}-${data.id}` });
}

// Worker
jobQueue.process("deploy", async (job) => {
  console.log("Running deploy job:", job.id);
  // run deployment script here
});

await addJob("deploy", { id: "main-branch" });
```

✅ **Key points**

- `jobId` ensures duplicates are skipped.
- Queue enforces systematic execution.

#### Bash Script with Lockfile

```bash
#!/bin/bash
LOCKFILE="/tmp/advvancia.lock"

if [ -f "$LOCKFILE" ]; then
  echo "Job already running. Exiting."
  exit 1
fi

trap "rm -f $LOCKFILE" EXIT
touch $LOCKFILE

echo "Running job systematically..."
# your job steps here
```

✅ **Key points**

- Lockfile prevents duplicate runs.
- Trap cleans up lockfile after job finishes.

⚡ **Recommendation**: For SaaS deployment via GitHub → Droplet, use the **GitHub Actions approach with `concurrency`** for systematic, duplicate-free execution.

#### Staging vs Production Environments

- **Staging**: Deploys automatically on every push to `main` branch. Use for testing changes safely.
- **Production**: Deploys only on GitHub releases (manual promotion). Ensures stability.
- **Setup**: Configure separate secrets (`DROPLET_IP_STAGING`, `DROPLET_IP_PROD`, etc.) for each environment.
- **Approval Gates**: For production, set up environment protection in GitHub: Settings > Environments > `production` > Add required reviewers to approve deploys.
- **Workflow**: Push to `main` → Staging deploy. Create release → Wait for approval → Production deploy.

### Emergency Contacts

- **Infrastructure Issues**: DigitalOcean support
- **Security Incidents**: security@advvancia.com
- **Application Bugs**: GitHub Issues
- **Performance Issues**: Datadog alerts

---

**⚡ This Ops Playbook is your complete self-hosted SaaS master manual. Hand it to collaborators and they'll know exactly how to run, secure, and scale Advvancia.**

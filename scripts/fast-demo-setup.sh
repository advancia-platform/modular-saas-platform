#!/bin/bash
# Fast Demo Setup Script - Completes migration in 1 hour
# Uses demo credentials, self-signed SSL, and mock services

set -e

echo "🚀 Fast Demo Setup - 1 Hour Migration"
echo "======================================"

DROPLET_IP=${1:-"157.245.8.131"}
DEMO_DOMAIN=${2:-"demo.advanciapayledger.local"}

echo "📍 Droplet IP: $DROPLET_IP"
echo "🌐 Demo Domain: $DEMO_DOMAIN"

# Step 1: Create demo environment file
echo "📝 Creating demo .env.production..."
cat > /tmp/demo-env.production << EOF
# Database
DATABASE_URL=postgresql://demo_user:demo_pass_2024@postgres:5432/advancia_demo

# Redis
REDIS_URL=redis://:demo_redis_pass@redis:6379

# Backend
NODE_ENV=production
PORT=4000
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://${DROPLET_IP}:3000
BACKEND_URL=http://${DROPLET_IP}:4000

# Demo Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_demo_key_for_testing_only
STRIPE_WEBHOOK_SECRET=whsec_demo_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_demo_key_for_testing

# Demo Crypto
CRYPTOMUS_API_KEY=demo_crypto_api_key
CRYPTOMUS_MERCHANT_ID=demo_merchant_123

# Demo Email (MailHog or console)
SMTP_HOST=mailhog
SMTP_PORT=1025
EMAIL_USER=demo@advanciapayledger.local
EMAIL_PASSWORD=demo_email_pass

# Sentry (disabled for demo)
SENTRY_DSN=

# AWS (disabled for demo)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BACKUPS_BUCKET=

# Frontend
NEXT_PUBLIC_API_URL=http://${DROPLET_IP}:4000
NEXT_PUBLIC_VAPID_KEY=demo_vapid_key_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_demo_key_for_testing

# Demo PostgreSQL
POSTGRES_USER=demo_user
POSTGRES_PASSWORD=demo_pass_2024
POSTGRES_DB=advancia_demo

# Demo Redis
REDIS_PASSWORD=demo_redis_pass

# CORS
CORS_ORIGIN=http://${DROPLET_IP}:3000,http://localhost:3000

# Rate Limiting (relaxed for demo)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000

# Log Level
LOG_LEVEL=debug
EOF

echo "✅ Demo environment created at /tmp/demo-env.production"

# Step 2: Create self-signed SSL certificates (for demo)
echo "🔐 Creating self-signed SSL certificates..."
mkdir -p /tmp/demo-ssl
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout /tmp/demo-ssl/key.pem \
  -out /tmp/demo-ssl/cert.pem \
  -days 365 \
  -subj "/C=US/ST=Demo/L=Demo/O=Advancia/OU=Demo/CN=${DEMO_DOMAIN}"

echo "✅ Self-signed certificates created"

# Step 3: Create simplified docker-compose for demo
echo "🐳 Creating demo docker-compose.yml..."
cat > /tmp/docker-compose.demo.yml << 'EOFCOMPOSE'
version: "3.8"

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: advancia-postgres-demo
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-demo_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-demo_pass_2024}
      POSTGRES_DB: ${POSTGRES_DB:-advancia_demo}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - advancia-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-demo_user}"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: advancia-redis-demo
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD:-demo_redis_pass}
    volumes:
      - redis_data:/data
    networks:
      - advancia-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "6379:6379"

  # MailHog (Email testing)
  mailhog:
    image: mailhog/mailhog:latest
    container_name: advancia-mailhog-demo
    restart: always
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    networks:
      - advancia-network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: advancia-backend-demo
    restart: always
    env_file:
      - /app/.env.production
    ports:
      - "4000:4000"
    volumes:
      - backend_logs:/app/logs
      - backend_uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mailhog:
        condition: service_started
    networks:
      - advancia-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Frontend Next.js App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: advancia-frontend-demo
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - advancia-network

volumes:
  postgres_data:
  redis_data:
  backend_logs:
  backend_uploads:

networks:
  advancia-network:
    driver: bridge
EOFCOMPOSE

echo "✅ Demo docker-compose created"

# Step 4: Create deployment script
echo "📦 Creating automated deployment script..."
cat > /tmp/deploy-demo.sh << 'EOFDEPLOY'
#!/bin/bash
set -e

echo "🚀 Deploying Advancia PayLedger Demo..."

cd /app/modular-saas-platform

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Copy demo environment
cp /app/.env.production .env

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f /tmp/docker-compose.demo.yml down || true

# Build and start services
echo "🏗️ Building services..."
docker-compose -f /tmp/docker-compose.demo.yml build --no-cache

echo "🗃️ Running database migrations..."
docker-compose -f /tmp/docker-compose.demo.yml run --rm backend npx prisma migrate deploy

echo "🌱 Seeding demo data..."
docker-compose -f /tmp/docker-compose.demo.yml run --rm backend npm run seed:demo || true

echo "🚀 Starting services..."
docker-compose -f /tmp/docker-compose.demo.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 30

# Health checks
echo "🩺 Running health checks..."
curl -f http://localhost:4000/api/health || echo "⚠️ Backend health check failed"
curl -f http://localhost:3000 || echo "⚠️ Frontend health check failed"

echo ""
echo "✅ Demo Deployment Complete!"
echo ""
echo "📍 Access Points:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):3000"
echo "  Backend API: http://$(hostname -I | awk '{print $1}'):4000"
echo "  API Health: http://$(hostname -I | awk '{print $1}'):4000/api/health"
echo "  MailHog UI: http://$(hostname -I | awk '{print $1}'):8025"
echo ""
echo "🔑 Demo Credentials:"
echo "  Email: demo@advanciapayledger.local"
echo "  Password: demo123"
echo ""
echo "📊 Monitor logs:"
echo "  docker-compose -f /tmp/docker-compose.demo.yml logs -f"
echo ""
EOFDEPLOY

chmod +x /tmp/deploy-demo.sh

echo "✅ All demo files created!"
echo ""
echo "📋 Next Steps (to be run on droplet):"
echo "1. Copy files to droplet:"
echo "   scp /tmp/demo-env.production root@${DROPLET_IP}:/app/.env.production"
echo "   scp /tmp/docker-compose.demo.yml root@${DROPLET_IP}:/tmp/docker-compose.demo.yml"
echo "   scp /tmp/deploy-demo.sh root@${DROPLET_IP}:/tmp/deploy-demo.sh"
echo ""
echo "2. SSH into droplet and run:"
echo "   ssh root@${DROPLET_IP}"
echo "   bash /tmp/deploy-demo.sh"
echo ""
echo "3. Access the demo:"
echo "   Frontend: http://${DROPLET_IP}:3000"
echo "   Backend: http://${DROPLET_IP}:4000"
echo "   MailHog: http://${DROPLET_IP}:8025"
echo ""
echo "⏱️ Total estimated time: 15-20 minutes"
echo ""

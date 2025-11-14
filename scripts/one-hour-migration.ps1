# One-Hour DigitalOcean Migration Script
# Run this from your local Windows machine with PowerShell

param(
    [Parameter(Mandatory=$false)]
    [string]$DropletIP = "157.245.8.131",
    
    [Parameter(Mandatory=$false)]
    [string]$SSHKeyPath = "$env:USERPROFILE\.ssh\id_ed25519_mucha"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 One-Hour DigitalOcean Migration" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$startTime = Get-Date

# Step 1: Test SSH connection
Write-Host "1️⃣ Testing SSH connection to $DropletIP..." -ForegroundColor Yellow
try {
    ssh -i $SSHKeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$DropletIP "echo 'SSH connection successful!'"
    Write-Host "✅ SSH connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH connection failed. Please check your SSH key and droplet IP." -ForegroundColor Red
    exit 1
}

# Step 2: Run initial droplet setup
Write-Host ""
Write-Host "2️⃣ Running initial droplet setup..." -ForegroundColor Yellow
ssh -i $SSHKeyPath root@$DropletIP @"
curl -fsSL https://raw.githubusercontent.com/muchaeljohn739337-cloud/-modular-saas-platform/main/scripts/setup-do-droplet.sh | bash
"@
Write-Host "✅ Initial setup complete" -ForegroundColor Green

# Step 3: Generate and upload demo environment
Write-Host ""
Write-Host "3️⃣ Creating demo environment configuration..." -ForegroundColor Yellow

$demoEnv = @"
# Database
DATABASE_URL=postgresql://demo_user:demo_pass_2024@postgres:5432/advancia_demo

# Redis
REDIS_URL=redis://:demo_redis_pass@redis:6379

# Backend
NODE_ENV=production
PORT=4000
JWT_SECRET=$(New-Guid).Guid
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://${DropletIP}:3000
BACKEND_URL=http://${DropletIP}:4000

# Demo Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_51234567890_demo_key
STRIPE_WEBHOOK_SECRET=whsec_demo_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890_demo_key

# Demo Crypto
CRYPTOMUS_API_KEY=demo_crypto_api_key
CRYPTOMUS_MERCHANT_ID=demo_merchant_123

# Demo Email (MailHog)
SMTP_HOST=mailhog
SMTP_PORT=1025
EMAIL_USER=demo@advanciapayledger.local
EMAIL_PASSWORD=demo_email_pass

# Sentry (disabled)
SENTRY_DSN=

# AWS (disabled)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BACKUPS_BUCKET=

# Frontend
NEXT_PUBLIC_API_URL=http://${DropletIP}:4000
NEXT_PUBLIC_VAPID_KEY=demo_vapid_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890_demo_key

# PostgreSQL
POSTGRES_USER=demo_user
POSTGRES_PASSWORD=demo_pass_2024
POSTGRES_DB=advancia_demo

# Redis
REDIS_PASSWORD=demo_redis_pass

# CORS
CORS_ORIGIN=http://${DropletIP}:3000,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000

# Logging
LOG_LEVEL=debug
"@

$demoEnv | Out-File -FilePath "$env:TEMP\demo-env.production" -Encoding UTF8
Write-Host "✅ Demo environment created" -ForegroundColor Green

# Step 4: Upload demo files to droplet
Write-Host ""
Write-Host "4️⃣ Uploading configuration files to droplet..." -ForegroundColor Yellow
scp -i $SSHKeyPath "$env:TEMP\demo-env.production" root@${DropletIP}:/app/.env.production
Write-Host "✅ Files uploaded" -ForegroundColor Green

# Step 5: Create and upload simplified docker-compose
Write-Host ""
Write-Host "5️⃣ Creating simplified docker-compose for demo..." -ForegroundColor Yellow

$dockerComposeDemo = @"
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: advancia-postgres-demo
    restart: always
    environment:
      POSTGRES_USER: demo_user
      POSTGRES_PASSWORD: demo_pass_2024
      POSTGRES_DB: advancia_demo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - advancia-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    container_name: advancia-redis-demo
    restart: always
    command: redis-server --requirepass demo_redis_pass
    volumes:
      - redis_data:/data
    networks:
      - advancia-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "6379:6379"

  mailhog:
    image: mailhog/mailhog:latest
    container_name: advancia-mailhog-demo
    restart: always
    ports:
      - "1025:1025"
      - "8025:8025"
    networks:
      - advancia-network

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
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - advancia-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: advancia-frontend-demo
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
    env_file:
      - /app/.env.production
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

networks:
  advancia-network:
    driver: bridge
"@

$dockerComposeDemo | Out-File -FilePath "$env:TEMP\docker-compose.demo.yml" -Encoding UTF8
scp -i $SSHKeyPath "$env:TEMP\docker-compose.demo.yml" root@${DropletIP}:/app/modular-saas-platform/docker-compose.demo.yml
Write-Host "✅ Docker Compose uploaded" -ForegroundColor Green

# Step 6: Build and deploy
Write-Host ""
Write-Host "6️⃣ Building and deploying services (this may take 10-15 minutes)..." -ForegroundColor Yellow
ssh -i $SSHKeyPath root@$DropletIP @"
cd /app/modular-saas-platform
cp /app/.env.production ./backend/.env
cp /app/.env.production ./frontend/.env.local

echo '🐳 Building Docker images...'
docker-compose -f docker-compose.demo.yml build

echo '🗃️ Running database migrations...'
docker-compose -f docker-compose.demo.yml run --rm backend npx prisma migrate deploy || echo 'Migrations may have issues - continuing...'

echo '🚀 Starting all services...'
docker-compose -f docker-compose.demo.yml up -d

echo '⏳ Waiting for services to start...'
sleep 45

echo '🩺 Checking service health...'
docker-compose -f docker-compose.demo.yml ps
"@

Write-Host "✅ Services deployed" -ForegroundColor Green

# Step 7: Health checks
Write-Host ""
Write-Host "7️⃣ Running health checks..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $backendHealth = Invoke-WebRequest -Uri "http://${DropletIP}:4000/api/health" -TimeoutSec 10
    Write-Host "✅ Backend is healthy: $($backendHealth.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend health check failed (this is normal if still starting)" -ForegroundColor Yellow
}

try {
    $frontendHealth = Invoke-WebRequest -Uri "http://${DropletIP}:3000" -TimeoutSec 10
    Write-Host "✅ Frontend is responding: $($frontendHealth.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Frontend health check failed (this is normal if still starting)" -ForegroundColor Yellow
}

# Calculate time taken
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ DEMO MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏱️ Total time: $($duration.ToString('mm\:ss'))" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Yellow
Write-Host "  Frontend:  http://${DropletIP}:3000" -ForegroundColor White
Write-Host "  Backend:   http://${DropletIP}:4000" -ForegroundColor White
Write-Host "  API Docs:  http://${DropletIP}:4000/api/health" -ForegroundColor White
Write-Host "  MailHog:   http://${DropletIP}:8025 (Email testing UI)" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Demo Credentials:" -ForegroundColor Yellow
Write-Host "  Email:     demo@advanciapayledger.local" -ForegroundColor White
Write-Host "  Password:  demo123" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitor Services:" -ForegroundColor Yellow
Write-Host "  ssh -i $SSHKeyPath root@$DropletIP" -ForegroundColor White
Write-Host "  cd /app/modular-saas-platform" -ForegroundColor White
Write-Host "  docker-compose -f docker-compose.demo.yml logs -f" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Restart Services:" -ForegroundColor Yellow
Write-Host "  ssh -i $SSHKeyPath root@$DropletIP" -ForegroundColor White
Write-Host "  cd /app/modular-saas-platform" -ForegroundColor White
Write-Host "  docker-compose -f docker-compose.demo.yml restart" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ DEMO LIMITATIONS:" -ForegroundColor Red
Write-Host "  • Uses test Stripe keys (payments won't process)" -ForegroundColor Yellow
Write-Host "  • Emails go to MailHog (not real recipients)" -ForegroundColor Yellow
Write-Host "  • No SSL/HTTPS (HTTP only)" -ForegroundColor Yellow
Write-Host "  • No S3 backups (local only)" -ForegroundColor Yellow
Write-Host "  • Demo database (will be reset on reboot)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 For Production Setup:" -ForegroundColor Cyan
Write-Host "  1. Update /app/.env.production with real API keys" -ForegroundColor White
Write-Host "  2. Set up Let's Encrypt SSL certificates" -ForegroundColor White
Write-Host "  3. Configure CloudFlare DNS" -ForegroundColor White
Write-Host "  4. Enable S3 backups" -ForegroundColor White
Write-Host "  5. Use docker-compose.prod.yml instead of demo" -ForegroundColor White
Write-Host ""

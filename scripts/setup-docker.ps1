#!/usr/bin/env pwsh
# Quick Docker Setup for Development

Write-Host "🐳 Setting up Docker for Advancia Pay Development..." -ForegroundColor Cyan

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first:" -ForegroundColor Red
    Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host "   After installation, restart your computer and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Stop existing containers
Write-Host "`n🛑 Stopping existing containers..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml down 2>$null

# Create backend .env if it doesn't exist
$backendEnvPath = "backend\.env"
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "📝 Creating backend .env file..." -ForegroundColor Yellow

    $envContent = @"
# Development Environment for Advancia Pay Backend
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000

# Database (Docker PostgreSQL on port 5433)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/advancia

# Redis (Docker Redis with password)
REDIS_URL=redis://:redis_dev_password@localhost:6379

# JWT Secrets (Development only)
JWT_SECRET=dev_jwt_secret_key_change_in_production_min_64_chars_long_string
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production_min_64_chars_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email (Optional - fill in if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=

# Payment Gateways (Test keys - fill in if needed)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=
CRYPTOMUS_API_KEY=
CRYPTOMUS_MERCHANT_ID=
"@

    $envContent | Out-File -FilePath $backendEnvPath -Encoding UTF8
    Write-Host "✅ Created $backendEnvPath" -ForegroundColor Green
}

# Start Docker services
Write-Host "`n🚀 Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
$retries = 0
$maxRetries = 30

do {
    Start-Sleep 2
    $retries++

    $postgresReady = $false
    $redisReady = $false

    try {
        docker exec advancia-postgres pg_isready -U postgres -d advancia 2>$null
        $postgresReady = $true
    }
    catch {}

    try {
        $pingResult = docker exec advancia-redis redis-cli -a redis_dev_password ping 2>$null
        if ($pingResult -eq "PONG") {
            $redisReady = $true
        }
    }
    catch {}

    if ($postgresReady -and $redisReady) {
        Write-Host "✅ All services are ready!" -ForegroundColor Green
        break
    }

    if ($retries -eq $maxRetries) {
        Write-Host "⚠️  Timeout waiting for services. Check docker logs." -ForegroundColor Yellow
        break
    }

    Write-Host "⏳ Still waiting... ($retries/$maxRetries)" -ForegroundColor Gray
} while ($retries -lt $maxRetries)

# Show status
Write-Host "`n📋 Service Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`n🎉 Docker setup complete!" -ForegroundColor Green
Write-Host "📡 PostgreSQL: localhost:5433 (user: postgres, password: postgres, db: advancia)" -ForegroundColor Yellow
Write-Host "🔴 Redis: localhost:6379 (password: redis_dev_password)" -ForegroundColor Yellow
Write-Host "🖥️  pgAdmin: http://localhost:5050 (admin@advancia.com / admin123)" -ForegroundColor Yellow

Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. cd backend && npm install && npm run dev" -ForegroundColor White
Write-Host "2. cd frontend && npm install && npm run dev" -ForegroundColor White
Write-Host "3. Visit http://localhost:3000" -ForegroundColor White

Write-Host "`n💡 Useful commands:" -ForegroundColor Cyan
Write-Host "• Check health: .\scripts\health-check.ps1" -ForegroundColor White
Write-Host "• Stop services: docker compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "• View logs: docker logs advancia-postgres" -ForegroundColor White

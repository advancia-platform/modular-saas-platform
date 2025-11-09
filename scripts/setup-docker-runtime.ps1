# Docker Container Runtime Setup for Advancia Pay Ledger
# Optimizes Docker settings for production deployment

Write-Host "🐳 Configuring Docker Container Runtime...`n"

# Create or update Docker daemon config
$dockerConfigPath = "$env:ProgramData\Docker\config\daemon.json"
$dockerConfig = @{
    "log-driver" = "json-file"
    "log-opts" = @{
        "max-size" = "10m"
        "max-file" = "3"
    }
    "dns" = @("8.8.8.8", "8.8.4.4")
    "storage-driver" = "overlay2"
    "default-ulimits" = @{
        "nofile" = @{
            "Name" = "nofile"
            "Hard" = 64000
            "Soft" = 64000
        }
    }
}

Write-Host "📝 Docker Configuration:"
$dockerConfig | ConvertTo-Json -Depth 10 | Write-Host

Write-Host "`n⚠️ Note: Modifying daemon.json requires Docker restart"
Write-Host "   Location: $dockerConfigPath"
Write-Host "   Apply manually or restart Docker Desktop`n"

# Check current Docker info
Write-Host "📊 Current Docker Info:"
docker info --format "{{.ServerVersion}} - {{.OperatingSystem}}"

# List running containers
Write-Host "`n📦 Running Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Docker Compose services for Advancia
Write-Host "`n🚀 Advancia Services Setup:"
Write-Host "   Backend: Node.js + Express + Socket.IO (Port 4000)"
Write-Host "   Frontend: Next.js (Port 3000)"
Write-Host "   Database: PostgreSQL 15 (Port 5432)"
Write-Host "   Cache: Redis 7 (Port 6379)"

# Optimize Docker Desktop settings
Write-Host "`n⚡ Recommended Docker Desktop Settings:"
Write-Host "   Memory: 4GB minimum (8GB recommended)"
Write-Host "   CPUs: 2 minimum (4 recommended)"
Write-Host "   Disk: 20GB minimum"
Write-Host "   Enable WSL 2 backend (for better performance)"

# Container health check
Write-Host "`n🏥 Setting up health checks..."
$healthScript = @'
# Add to docker-compose.yml:
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
'@

Write-Host $healthScript

Write-Host "`n✅ Docker runtime configuration guide displayed"
Write-Host "📚 See docker-compose.yml for full service configuration"

# Docker Registry Setup for Advancia Pay Ledger
# Automated setup for Docker Hub and GitHub Container Registry

Write-Host "🐳 Docker Registry Setup for Advancia Pay Ledger`n"

# Check if Docker is running
try {
    docker info > $null 2>&1
    Write-Host "✅ Docker is running"
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
}

Write-Host "`n📦 Setting up registries...`n"

# Docker Hub Login
Write-Host "1️⃣ Docker Hub Login"
Write-Host "   Registry: docker.io (default)"
$dockerLogin = Read-Host "   Login to Docker Hub? (y/n)"
if ($dockerLogin -eq 'y') {
    docker login
}

# GitHub Container Registry Login
Write-Host "`n2️⃣ GitHub Container Registry (ghcr.io)"
Write-Host "   Use your GitHub PAT for authentication"
$ghcrLogin = Read-Host "   Login to GitHub Container Registry? (y/n)"
if ($ghcrLogin -eq 'y') {
    $ghUsername = Read-Host "   GitHub username"
    Write-Host "   Use your GitHub PAT (already configured): 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"
    docker login ghcr.io -u $ghUsername
}

Write-Host "`n✅ Registry setup complete!`n"

# Test pulling a public image
Write-Host "🧪 Testing registry access..."
docker pull hello-world
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker registry access working!"
} else {
    Write-Host "⚠️ Registry access test failed"
}

Write-Host "`n📋 Next steps:"
Write-Host "   - Build images: docker-compose build"
Write-Host "   - Start services: docker-compose up -d"
Write-Host "   - Push to registry: docker push your-image"
Write-Host "`n🔐 Credentials stored securely in Windows Credential Manager"

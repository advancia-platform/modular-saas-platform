param()
$ErrorActionPreference = 'Stop'

Write-Host "🧱 Building backend..."
Push-Location "$PSScriptRoot\..\backend"
try {
  npm run -s build
} finally {
  Pop-Location
}

if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }

Write-Host "🧹 Cleaning .next cache..."
Push-Location "$PSScriptRoot\..\frontend"
try {
  Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
  Write-Host "🧱 Building frontend..."
  npm run -s build
} finally {
  Pop-Location
}

if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }

Write-Host '✅ Build completed successfully.'

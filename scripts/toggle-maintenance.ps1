# PowerShell script to toggle maintenance mode on/off

Write-Host "🛠️  Maintenance Mode Toggle" -ForegroundColor Yellow
Write-Host ""

$envPath = "backend\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ backend\.env not found" -ForegroundColor Red
    exit 1
}

# Check current status
$content = Get-Content $envPath -Raw
if ($content -match "MAINTENANCE_MODE=(\w+)") {
    $current = $matches[1]
} else {
    $current = "false"
}

Write-Host "Current status: $current" -ForegroundColor Yellow
Write-Host ""
Write-Host "What would you like to do?"
Write-Host "  1) Enable maintenance mode (show maintenance page)"
Write-Host "  2) Disable maintenance mode (normal operation)"
Write-Host "  3) Cancel"
Write-Host ""

$choice = Read-Host "Enter choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host "🔧 Enabling maintenance mode..." -ForegroundColor Yellow
        
        # Update backend .env
        $content = Get-Content $envPath -Raw
        if ($content -match "MAINTENANCE_MODE=") {
            $content = $content -replace "MAINTENANCE_MODE=\w+", "MAINTENANCE_MODE=true"
        } else {
            $content += "`nMAINTENANCE_MODE=true"
        }
        $content | Set-Content $envPath -NoNewline
        
        # Update frontend .env if exists
        $frontendEnv = "frontend\.env"
        if (Test-Path $frontendEnv) {
            $frontendContent = Get-Content $frontendEnv -Raw
            if ($frontendContent -match "MAINTENANCE_MODE=") {
                $frontendContent = $frontendContent -replace "MAINTENANCE_MODE=\w+", "MAINTENANCE_MODE=true"
            } else {
                $frontendContent += "`nMAINTENANCE_MODE=true"
            }
            $frontendContent | Set-Content $frontendEnv -NoNewline
        }
        
        Write-Host "✅ Maintenance mode enabled" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:"
        Write-Host "  1. Restart services: npm run dev (or PM2)"
        Write-Host "  2. Visit http://localhost:3000 - you'll see maintenance page"
        Write-Host "  3. Users will see: 'We'll Be Right Back! 🚀'"
        Write-Host ""
        Write-Host "For production (Render):"
        Write-Host "  Set MAINTENANCE_MODE=true in Render dashboard → Manual Deploy"
    }
    
    "2" {
        Write-Host "🔓 Disabling maintenance mode..." -ForegroundColor Yellow
        
        # Update backend .env
        $content = Get-Content $envPath -Raw
        if ($content -match "MAINTENANCE_MODE=") {
            $content = $content -replace "MAINTENANCE_MODE=\w+", "MAINTENANCE_MODE=false"
        } else {
            $content += "`nMAINTENANCE_MODE=false"
        }
        $content | Set-Content $envPath -NoNewline
        
        # Update frontend .env if exists
        $frontendEnv = "frontend\.env"
        if (Test-Path $frontendEnv) {
            $frontendContent = Get-Content $frontendEnv -Raw
            if ($frontendContent -match "MAINTENANCE_MODE=") {
                $frontendContent = $frontendContent -replace "MAINTENANCE_MODE=\w+", "MAINTENANCE_MODE=false"
            } else {
                $frontendContent += "`nMAINTENANCE_MODE=false"
            }
            $frontendContent | Set-Content $frontendEnv -NoNewline
        }
        
        Write-Host "✅ Maintenance mode disabled" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:"
        Write-Host "  1. Restart services: npm run dev (or PM2)"
        Write-Host "  2. Site will return to normal operation"
        Write-Host ""
        Write-Host "For production (Render):"
        Write-Host "  Set MAINTENANCE_MODE=false in Render dashboard → Manual Deploy"
    }
    
    "3" {
        Write-Host "❌ Cancelled" -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

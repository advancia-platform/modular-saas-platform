# No-Config Debug PowerShell Script
# Usage: .\scripts\debug.ps1 [backend|frontend|test|auto]

param(
    [string]$Command = "auto"
)

Write-Host "🚀 No-Config Debug CLI (PowerShell)" -ForegroundColor Green
Write-Host "Command: $Command" -ForegroundColor Cyan

$WorkspaceRoot = Get-Location

function Debug-Backend {
    Write-Host "⚡ Starting backend debug mode..." -ForegroundColor Yellow
    Write-Host "🔗 Debug URL: chrome://inspect" -ForegroundColor Blue
    Write-Host "📍 Debugger listening on: 127.0.0.1:9229" -ForegroundColor Blue

    $env:NODE_ENV = "development"
    $env:DEBUG = "app:*"

    Set-Location "$WorkspaceRoot\backend"
    node --inspect=9229 --loader tsx src/index.ts
    Set-Location $WorkspaceRoot
}

function Debug-Frontend {
    Write-Host "🎨 Starting frontend debug mode..." -ForegroundColor Yellow
    Write-Host "🔗 Debug URL: chrome://inspect" -ForegroundColor Blue
    Write-Host "📍 Debugger listening on: 127.0.0.1:9230" -ForegroundColor Blue

    $env:NODE_ENV = "development"
    $env:NEXT_PUBLIC_API_URL = "http://localhost:4000"
    $env:NEXTAUTH_URL = "http://localhost:3000"

    Set-Location "$WorkspaceRoot\frontend"
    node --inspect=9230 node_modules/next/dist/bin/next dev
    Set-Location $WorkspaceRoot
}

function Debug-Test {
    Write-Host "🧪 Starting test debug mode..." -ForegroundColor Yellow
    Write-Host "🔗 Debug URL: chrome://inspect" -ForegroundColor Blue
    Write-Host "📍 Debugger listening on: 127.0.0.1:9229" -ForegroundColor Blue

    $env:NODE_ENV = "test"

    Set-Location "$WorkspaceRoot\backend"
    node --inspect-brk=9229 node_modules/.bin/jest --runInBand --no-cache
    Set-Location $WorkspaceRoot
}

function Debug-Auto {
    Write-Host "🔍 Auto-detecting debug target..." -ForegroundColor Yellow

    $CurrentPath = Get-Location

    if ($CurrentPath -like "*frontend*" -or $args -like "*.tsx*" -or $args -like "*.jsx*") {
        Debug-Frontend
    }
    elseif ($CurrentPath -like "*test*" -or $args -like "*.test.*" -or $args -like "*.spec.*") {
        Debug-Test
    }
    else {
        Debug-Backend
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host "`n🛑 Stopping debug session..." -ForegroundColor Red
}

# Main execution
try {
    switch ($Command) {
        { $_ -in @("backend", "back", "be") } {
            Debug-Backend
        }
        { $_ -in @("frontend", "front", "fe") } {
            Debug-Frontend
        }
        { $_ -in @("test", "tests") } {
            Debug-Test
        }
        { $_ -in @("auto", "") } {
            Debug-Auto
        }
        default {
            Write-Host "❌ Unknown command: $Command" -ForegroundColor Red
            Write-Host "Available commands: backend, frontend, test, auto" -ForegroundColor Yellow
            exit 1
        }
    }

    Write-Host "`n💡 Debug Tips:" -ForegroundColor Green
    Write-Host "   • Open Chrome and go to chrome://inspect" -ForegroundColor White
    Write-Host "   • Click 'Open dedicated DevTools for Node'" -ForegroundColor White
    Write-Host "   • Set breakpoints in your code" -ForegroundColor White
    Write-Host "   • Press Ctrl+C to stop debugging" -ForegroundColor White
}
catch {
    Write-Host "❌ Debug failed: $_" -ForegroundColor Red
    exit 1
}

# Crypto System Setup Script
# Run this after database migration to configure your crypto system

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      🪙 CRYPTO SYSTEM SETUP WIZARD                      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Helper: quick TCP port check (bypasses proxy entirely)
function Test-LocalPortOpen {
    param([int]$Port)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $ar = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
        $success = $ar.AsyncWaitHandle.WaitOne(1000, $false)
        if ($success -and $client.Connected) { $client.Close(); return $true }
    } catch { }
    return $false
}

# Check if backend is running (retry with /health and /api/health, bypass proxy)
Write-Host "🔍 Checking backend status..." -ForegroundColor Yellow
$ProgressPreference = 'SilentlyContinue'
$healthOk = $false
$healthEndpoints = @(
    "http://127.0.0.1:4000/health",
    "http://localhost:4000/health",
    "http://127.0.0.1:4000/api/health",
    "http://localhost:4000/api/health"
)

# Create HttpClient with proxy disabled
Add-Type -AssemblyName System.Net.Http | Out-Null
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.UseProxy = $false
$client = New-Object System.Net.Http.HttpClient($handler)
$client.Timeout = [TimeSpan]::FromSeconds(3)

for ($i = 0; $i -lt 8 -and -not $healthOk; $i++) {
    foreach ($url in $healthEndpoints) {
        try {
            $task = $client.GetAsync($url)
            $task.Wait()
            if ($task.Result.IsSuccessStatusCode) { $healthOk = $true; break }
        } catch {
            Start-Sleep -Milliseconds 400
        }
    }
    if (-not $healthOk) { Start-Sleep -Seconds 1 }
}

if ($healthOk -or (Test-LocalPortOpen -Port 4000)) {
    Write-Host "✅ Backend is running!`n" -ForegroundColor Green
} else {
        Write-Host "❌ Backend is NOT running (attempting to start it)..." -ForegroundColor Yellow
        try {
            # Start backend in a new terminal
            Start-Process pwsh -ArgumentList '-NoExit','-Command','cd "$PSScriptRoot/backend"; $env:NODE_ENV="development"; npm run dev' | Out-Null
        } catch {
            Write-Host "Failed to launch backend automatically. Start it manually: cd backend && npm run dev" -ForegroundColor Red
        }
        # Wait up to 20 seconds for it to come up
        for ($i = 0; $i -lt 20 -and -not $healthOk; $i++) {
            if (Test-LocalPortOpen -Port 4000) {
                foreach ($url in $healthEndpoints) {
                    try { $task = $client.GetAsync($url); $task.Wait(); if ($task.Result.IsSuccessStatusCode) { $healthOk = $true; break } } catch { }
                }
            }
            if (-not $healthOk) { Start-Sleep -Seconds 1 }
        }
        if (-not $healthOk) {
            Write-Host "❌ Backend still not reachable. Please ensure it's running: cd backend && npm run dev`n" -ForegroundColor Red
            exit 1
        } else {
            Write-Host "✅ Backend is running!`n" -ForegroundColor Green
        }
}

# Step 1: Database Migration
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 1: DATABASE MIGRATION" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$migrationDone = Read-Host "Have you run 'npx prisma migrate dev'? (y/n)"

if ($migrationDone -ne 'y') {
    Write-Host "`n⚠️  Please run the migration first:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   npx prisma migrate dev --name add_crypto_system`n" -ForegroundColor White
    exit 0
}

Write-Host "✅ Database migration confirmed!`n" -ForegroundColor Green

# Step 2: Collect Admin Wallet Addresses
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 2: CONFIGURE WALLET ADDRESSES" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Enter your crypto wallet addresses:" -ForegroundColor Yellow
Write-Host "(Press Enter to skip a cryptocurrency)`n" -ForegroundColor Gray

$btcAddress = Read-Host "Bitcoin (BTC) Address"
$ethAddress = Read-Host "Ethereum (ETH) Address"
$usdtAddress = Read-Host "USDT Address (ERC-20 or TRC-20)"

Write-Host ""

# Step 3: Set Exchange Rates
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 3: SET EXCHANGE RATES" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "Current market prices (approximate):" -ForegroundColor Yellow
Write-Host "  BTC: ~`$45,000 USD" -ForegroundColor Gray
Write-Host "  ETH: ~`$2,800 USD" -ForegroundColor Gray
Write-Host "  USDT: `$1.00 USD`n" -ForegroundColor Gray

$btcRate = Read-Host "BTC/USD Rate (default: 45000)"
if ([string]::IsNullOrWhiteSpace($btcRate)) { $btcRate = "45000" }

$ethRate = Read-Host "ETH/USD Rate (default: 2800)"
if ([string]::IsNullOrWhiteSpace($ethRate)) { $ethRate = "2800" }

$usdtRate = Read-Host "USDT/USD Rate (default: 1.00)"
if ([string]::IsNullOrWhiteSpace($usdtRate)) { $usdtRate = "1.00" }

Write-Host ""

# Step 4: Set Fees and Limits
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 4: CONFIGURE FEES & LIMITS" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$feePercent = Read-Host "Processing Fee Percentage (default: 2.5)"
if ([string]::IsNullOrWhiteSpace($feePercent)) { $feePercent = "2.5" }

$minAmount = Read-Host "Minimum Purchase Amount USD (default: 10)"
if ([string]::IsNullOrWhiteSpace($minAmount)) { $minAmount = "10" }

Write-Host ""

# Build the settings object
$settings = @{
    btcAddress = $btcAddress
    ethAddress = $ethAddress
    usdtAddress = $usdtAddress
    exchangeRateBtc = [decimal]$btcRate
    exchangeRateEth = [decimal]$ethRate
    exchangeRateUsdt = [decimal]$usdtRate
    processingFeePercent = [decimal]$feePercent
    minPurchaseAmount = [decimal]$minAmount
}

# Remove empty addresses
if ([string]::IsNullOrWhiteSpace($btcAddress)) { $settings.Remove('btcAddress') }
if ([string]::IsNullOrWhiteSpace($ethAddress)) { $settings.Remove('ethAddress') }
if ([string]::IsNullOrWhiteSpace($usdtAddress)) { $settings.Remove('usdtAddress') }

# Step 5: Confirm and Save
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STEP 5: REVIEW & SAVE" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📋 Your Configuration:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Wallet Addresses:" -ForegroundColor Cyan
if ($btcAddress) { Write-Host "    BTC:  $btcAddress" -ForegroundColor White }
if ($ethAddress) { Write-Host "    ETH:  $ethAddress" -ForegroundColor White }
if ($usdtAddress) { Write-Host "    USDT: $usdtAddress" -ForegroundColor White }
Write-Host ""
Write-Host "  Exchange Rates:" -ForegroundColor Cyan
Write-Host "    BTC/USD:  `$$btcRate" -ForegroundColor White
Write-Host "    ETH/USD:  `$$ethRate" -ForegroundColor White
Write-Host "    USDT/USD: `$$usdtRate" -ForegroundColor White
Write-Host ""
Write-Host "  Fees & Limits:" -ForegroundColor Cyan
Write-Host "    Processing Fee: $feePercent%" -ForegroundColor White
Write-Host "    Minimum Order:  `$$minAmount" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Save these settings? (y/n)"

if ($confirm -ne 'y') {
    Write-Host "`n❌ Setup cancelled. Run this script again to try." -ForegroundColor Red
    exit 0
}

# Save to backend
Write-Host "`n💾 Saving configuration..." -ForegroundColor Yellow

try {
    $body = $settings | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "http://localhost:4000/api/crypto/admin/settings" `
        -Method PUT `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Configuration saved successfully!`n" -ForegroundColor Green
    
    # Display success message
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                 🎉 SETUP COMPLETE! 🎉                    ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

    Write-Host "Your crypto system is now configured!`n" -ForegroundColor White

    Write-Host "📍 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Access admin panel: http://localhost:3000/admin/crypto" -ForegroundColor White
    Write-Host "  2. Test with a small purchase" -ForegroundColor White
    Write-Host "  3. Update rates regularly (prices change!)" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor Yellow
    Write-Host "  - CRYPTO_QUICK_START.md    - Quick setup guide" -ForegroundColor White
    Write-Host "  - CRYPTO_SYSTEM_GUIDE.md   - Full documentation" -ForegroundColor White
    Write-Host "  - CRYPTO_VISUAL_FLOW.md    - Visual diagrams" -ForegroundColor White
    Write-Host "  - CRYPTO_SETUP_SUMMARY.md  - Complete summary" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Important Reminders:" -ForegroundColor Yellow
    Write-Host "  • Update exchange rates daily" -ForegroundColor Red
    Write-Host "  • Verify wallet addresses before sending crypto" -ForegroundColor Red
    Write-Host "  • Check pending orders regularly" -ForegroundColor Red
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to save configuration!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   Make sure backend is running and database migration is complete.`n" -ForegroundColor Yellow
    exit 1
}

# Test the setup
Write-Host "🧪 Testing configuration..." -ForegroundColor Yellow

try {
    $rates = Invoke-RestMethod -Uri "http://localhost:4000/api/crypto/rates" -ErrorAction Stop
    Write-Host "✅ Configuration verified!" -ForegroundColor Green
    Write-Host "`n   BTC Rate: `$$($rates.BTC)" -ForegroundColor Gray
    Write-Host "   ETH Rate: `$$($rates.ETH)" -ForegroundColor Gray
    Write-Host "   USDT Rate: `$$($rates.USDT)" -ForegroundColor Gray
    Write-Host "   Processing Fee: $($rates.processingFeePercent)%" -ForegroundColor Gray
    Write-Host "   Minimum Order: `$$($rates.minPurchaseAmount)`n" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Could not verify configuration, but it should be saved." -ForegroundColor Yellow
}

Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
Write-Host "Happy crypto trading! 🚀`n" -ForegroundColor Green

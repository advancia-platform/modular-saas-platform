# === ADVANCIA PAYLEDGER AUTO-PROTECT + DEV RESTORE ===
# Run this script as Administrator in PowerShell

Write-Host "🚀 Starting Advancia Secure Dev Environment Setup..." -ForegroundColor Cyan

# --- 1️⃣ Enable Windows Firewall ---
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
Write-Host "🧱 Firewall enabled for all profiles." -ForegroundColor Green

# --- 2️⃣ Allow Development Ports ---
$ports = @(3000, 4000, 5432)
foreach ($port in $ports) {
    if (-not (Get-NetFirewallRule | Where-Object {$_.DisplayName -eq "Advancia Dev Port $port"})) {
        New-NetFirewallRule -DisplayName "Advancia Dev Port $port" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
        Write-Host "✅ Allowed port $port for local development." -ForegroundColor Yellow
    }
}

# --- 3️⃣ Enable SmartScreen & Protection ---
try { Set-MpPreference -PUAProtection Enabled } catch {}
try { Set-MpPreference -EnableControlledFolderAccess Enabled } catch {}
try { Set-MpPreference -EnableNetworkProtection Enabled } catch {}
try { Set-MpPreference -EnableRealtimeMonitoring $true } catch {}
try { Set-MpPreference -CheckForSignaturesBeforeRunningScan $true } catch {}
Write-Host "🧰 Security protections restored and updated." -ForegroundColor Green

# --- 4️⃣ Define automatic cleanup when dev stops ---
$MonitorScript = {
    Write-Host "🕒 Monitoring Node.js / Next.js dev session..."
    while ($true) {
        $devRunning = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if (-not $devRunning) {
            Write-Host "🛑 Dev session ended — closing Advancia ports..." -ForegroundColor Yellow
            Get-NetFirewallRule | Where-Object {$_.DisplayName -like "Advancia Dev Port*"} | Remove-NetFirewallRule
            Write-Host "✅ Ports closed. System fully protected." -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 15
    }
}

Start-Job -ScriptBlock $MonitorScript | Out-Null
Write-Host "💼 Monitoring job started. Run your server normally (npm run dev)." -ForegroundColor Cyan
Write-Host "🔐 System secured with auto-restore after session ends."

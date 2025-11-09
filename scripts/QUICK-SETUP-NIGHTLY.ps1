# ========================================
# QUICK SETUP - RUN THIS IMMEDIATELY
# ========================================
# This script sets up everything in one go

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 ADVANCIA NIGHTLY AUTOMATION - QUICK SETUP         ║" -ForegroundColor Cyan  
Write-Host "╚═══════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# 1. Create scheduled task
Write-Host "⏰ Creating scheduled task..." -ForegroundColor Yellow
$scriptPath = "$PSScriptRoot\ADVANCIA-FULL-RPA.ps1"
$taskName = "AdvanciaAutoRPA"

# Remove old task if exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "   Removing existing task..." -ForegroundColor Gray
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create new task
$action = New-ScheduledTaskAction -Execute "pwsh.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask -Action $action -Trigger $trigger -Settings $settings `
    -TaskName $taskName `
    -Description "Automatically build, deploy, and clean Advancia nightly at 2 AM" `
    -User $env:USERNAME `
    -RunLevel Highest | Out-Null

Write-Host "   ✅ Task created" -ForegroundColor Green

# 2. Install BurntToast (optional but recommended)
Write-Host "`n📬 Installing BurntToast for notifications..." -ForegroundColor Yellow
try {
    if (-not (Get-Module -ListAvailable -Name BurntToast)) {
        Install-Module -Name BurntToast -Scope CurrentUser -Force -ErrorAction Stop
        Write-Host "   ✅ BurntToast installed" -ForegroundColor Green
    } else {
        Write-Host "   ✅ BurntToast already installed" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  BurntToast installation skipped (will use fallback notifications)" -ForegroundColor Yellow
}

# 3. Create Event Log source (requires admin)
Write-Host "`n📋 Setting up Event Log source..." -ForegroundColor Yellow
try {
    $eventSource = "AdvanciaRPA"
    if (-not [System.Diagnostics.EventLog]::SourceExists($eventSource)) {
        New-EventLog -LogName Application -Source $eventSource -ErrorAction Stop
        Write-Host "   ✅ Event Log source created" -ForegroundColor Green
    } else {
        Write-Host "   ✅ Event Log source already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Event Log source creation skipped (requires admin - will use file logging)" -ForegroundColor Yellow
}

# 4. Create logs directory
Write-Host "`n📁 Creating logs directory..." -ForegroundColor Yellow
$logsDir = "$PSScriptRoot\..\logs"
if (!(Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
    Write-Host "   ✅ Logs directory created" -ForegroundColor Green
} else {
    Write-Host "   ✅ Logs directory exists" -ForegroundColor Green
}

# 5. Verify task
Write-Host "`n🔍 Verifying setup..." -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName $taskName
$taskInfo = Get-ScheduledTaskInfo -TaskName $taskName

Write-Host "`n✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "`n📊 Task Details:" -ForegroundColor Cyan
Write-Host "   Name:       $($task.TaskName)" -ForegroundColor Gray
Write-Host "   State:      $($task.State)" -ForegroundColor Gray
Write-Host "   Next Run:   $($taskInfo.NextRunTime)" -ForegroundColor Gray
Write-Host "   Script:     $scriptPath" -ForegroundColor Gray

# 6. Test notification
Write-Host "`n🧪 Testing notification system..." -ForegroundColor Yellow
try {
    Import-Module BurntToast -ErrorAction Stop
    New-BurntToastNotification -Text "Advancia RPA", "✅ Nightly automation is now active! Next run: $($taskInfo.NextRunTime)"
    Write-Host "   ✅ Toast notification sent" -ForegroundColor Green
} catch {
    Write-Host "   ℹ️  Toast unavailable - using Event Log" -ForegroundColor Gray
    try {
        Write-EventLog -LogName Application -Source "AdvanciaRPA" -EntryType Information -EventId 1000 `
            -Message "Advancia RPA nightly automation is now active. Next run: $($taskInfo.NextRunTime)"
        Write-Host "   ✅ Event Log notification sent" -ForegroundColor Green
    } catch {
        Write-Host "   ℹ️  Event Log unavailable - using file" -ForegroundColor Gray
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        "$timestamp  [Info] Advancia RPA — Nightly automation is now active. Next run: $($taskInfo.NextRunTime)" | 
            Out-File (Join-Path $logsDir "nightly-summary.txt") -Append -Encoding UTF8
        Write-Host "   ✅ File notification written" -ForegroundColor Green
    }
}

# 7. Ask to test run
Write-Host "`n🚀 Would you like to test run the deployment now? (y/n): " -ForegroundColor Yellow -NoNewline
$response = Read-Host

if ($response -eq 'y') {
    Write-Host "`n🎬 Starting test deployment..." -ForegroundColor Cyan
    Write-Host "   This will take 10-15 minutes..." -ForegroundColor Gray
    Write-Host "   Watch for notifications when complete.`n" -ForegroundColor Gray
    
    Start-ScheduledTask -TaskName $taskName
    Write-Host "✅ Task started! Monitor progress:" -ForegroundColor Green
    Write-Host "   • Task Scheduler: taskschd.msc" -ForegroundColor Gray
    Write-Host "   • Logs: Get-Content $logsDir\nightly-summary.txt -Wait" -ForegroundColor Gray
    Write-Host "   • Status: Get-ScheduledTaskInfo -TaskName '$taskName'" -ForegroundColor Gray
} else {
    Write-Host "`n⏭️  Test run skipped. Task will run automatically at 2 AM." -ForegroundColor Gray
}

Write-Host "`n╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🎉 ALL SET! Nightly automation is active.            ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "   • Full guide: NIGHTLY_AUTOMATION_GUIDE.md" -ForegroundColor Gray
Write-Host "   • Manage task: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "   • View logs: Get-Content $logsDir\nightly-summary.txt`n" -ForegroundColor Gray

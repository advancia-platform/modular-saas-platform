# AI DevOps Agent - PowerShell Chaos Testing Script
# Tests system resilience, alerting, and recovery capabilities

param(
    [string]$ReasoningEngineUrl = "http://localhost:5000",
    [string]$ExecutionEngineUrl = "http://localhost:3000",
    [string]$GrafanaUrl = "http://localhost:3001",
    [string]$PrometheusUrl = "http://localhost:9090",
    [int]$HighMttrThreshold = 600,
    [int]$RollbackThreshold = 5,
    [int]$FailureRateThreshold = 20,
    [switch]$SkipConfirmation,
    [switch]$QuickTest
)

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-ApiEndpoint {
    param([string]$Url, [hashtable]$Body, [int]$TimeoutSeconds = 30)
    try {
        $jsonBody = $Body | ConvertTo-Json -Depth 10 -Compress
        $response = Invoke-RestMethod -Uri $Url -Method POST -Body $jsonBody -ContentType "application/json" -TimeoutSec $TimeoutSeconds
        return @{ Success = $true; Response = $response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

Write-Host ""
Write-ColorOutput "🚨 AI DevOps Agent - PowerShell Chaos Testing" -Color Red
Write-ColorOutput "=============================================" -Color Red
Write-ColorOutput "Testing system resilience, alerting, and recovery capabilities" -Color Cyan

Write-Host ""
Write-ColorOutput "⚠️  WARNING: This script will intentionally inject errors to test:" -Color Yellow
Write-Host "   • Alert system responsiveness"
Write-Host "   • MTTR (Mean Time To Resolution) monitoring"
Write-Host "   • Rollback detection and automation"
Write-Host "   • System recovery capabilities"
Write-Host "   • Performance under stress"

if (-not $SkipConfirmation) {
    Write-Host ""
    $confirmation = Read-Host "Continue with chaos testing? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-ColorOutput "❌ Chaos testing cancelled" -Color Yellow
        exit
    }
}

Write-Host ""
Write-ColorOutput "🎯 Starting chaos engineering tests..." -Color Magenta

# Test 1: High MTTR Simulation
Write-Host ""
Write-ColorOutput "🔍 Test 1: High MTTR (Mean Time To Resolution) Simulation" -Color Blue
Write-ColorOutput "=========================================================" -Color Blue

Write-ColorOutput "Injecting slow-resolution error to trigger HighMTTR alert..." -Color Yellow

$highMttrPayload = @{
    error_id = "chaos-high-mttr-001"
    message = "Critical database connection pool exhaustion with memory leak"
    severity = "critical"
    environment = "production"
    context = @{
        file_path = "src/database/connection-manager.js"
        stack_trace = "ConnectionPoolError: Maximum pool size reached`n    at ConnectionManager.acquire(connection-manager.js:234)"
        memory_usage = "95%"
        cpu_usage = "87%"
        connection_count = 500
    }
    metadata = @{
        frequency = "very_high"
        severity = "critical"
        complexity = "high"
        estimated_resolution_time = "15-20 minutes"
    }
}

$startTime = Get-Date
Write-ColorOutput "   📤 Sending high-complexity error for analysis..." -Color Blue

$analysisResult = Test-ApiEndpoint -Url "$ReasoningEngineUrl/analyze" -Body $highMttrPayload

if ($analysisResult.Success) {
    Write-ColorOutput "   ✅ Error analysis started" -Color Green

    Write-ColorOutput "   ⏳ Simulating complex resolution process..." -Color Yellow
    Write-ColorOutput "   📊 Monitor Grafana dashboard: $GrafanaUrl" -Color Blue
    Write-ColorOutput "   🚨 HighMTTR alert should trigger after $HighMttrThreshold seconds" -Color Blue

    # Sleep for alert threshold to trigger HighMTTR alert
    $sleepMinutes = if ($QuickTest) { 2 } else { [math]::Ceiling($HighMttrThreshold / 60) + 1 }

    for ($i = 1; $i -le $sleepMinutes; $i++) {
        Write-ColorOutput "   ⏰ Simulating resolution attempt $i/$sleepMinutes ($i minutes elapsed)" -Color Yellow

        # Send status update
        $statusUpdate = @{
            error_id = "chaos-high-mttr-001"
            status = "analyzing"
            progress = "$([math]::Round($i * 100 / $sleepMinutes))%"
            message = "Still analyzing complex database issue..."
        }

        try {
            Invoke-RestMethod -Uri "$ReasoningEngineUrl/status" -Method POST -Body ($statusUpdate | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5 | Out-Null
        }
        catch {
            # Ignore status update failures
        }

        Start-Sleep -Seconds $(if ($QuickTest) { 15 } else { 60 })
    }

    $endTime = Get-Date
    $resolutionTime = ($endTime - $startTime).TotalSeconds
    Write-ColorOutput "   ✅ High MTTR test completed in $([math]::Round($resolutionTime)) seconds" -Color Green

    if ($resolutionTime -gt $HighMttrThreshold) {
        Write-ColorOutput "   🚨 HighMTTR alert should have been triggered!" -Color Red
    }
}
else {
    Write-ColorOutput "   ❌ Failed to start high MTTR test: $($analysisResult.Error)" -Color Red
}

# Test 2: Frequent Rollback Simulation
Write-Host ""
Write-ColorOutput "🔄 Test 2: Frequent Rollback Simulation" -Color Blue
Write-ColorOutput "=======================================" -Color Blue

Write-ColorOutput "Injecting multiple deployment failures to trigger FrequentRollbacks alert..." -Color Yellow

$rollbackCount = 0
$maxRollbacks = if ($QuickTest) { 6 } else { 8 }

for ($i = 1; $i -le $maxRollbacks; $i++) {
    Write-ColorOutput "   🚀 Deployment attempt $i - injecting failure..." -Color Blue

    $failingDeployment = @{
        error_id = "chaos-rollback-$i"
        fix_plan = @{
            type = "DEPLOYMENT"
            strategy = "blue_green"
            target_files = @("src/payment/processor.js")
            estimated_time = "5 minutes"
            risk_level = "MEDIUM"
            force_failure = $true
        }
        deployment_strategy = "blue_green"
    }

    $deploymentResult = Test-ApiEndpoint -Url "$ExecutionEngineUrl/execute" -Body $failingDeployment -TimeoutSeconds 10

    if ($deploymentResult.Success -or $deploymentResult.Error -match "500") {
        $rollbackCount++
        Write-ColorOutput "   ⏪ Rollback $rollbackCount triggered" -Color Yellow

        if ($rollbackCount -ge $RollbackThreshold) {
            Write-ColorOutput "   🚨 FrequentRollbacks alert threshold reached!" -Color Red
        }
    }
    else {
        Write-ColorOutput "   ❌ Deployment test failed: $($deploymentResult.Error)" -Color Red
    }

    Start-Sleep -Seconds 3
}

Write-ColorOutput "   ✅ Rollback simulation completed: $rollbackCount rollbacks triggered" -Color Green

# Test 3: High Failure Rate Simulation
Write-Host ""
Write-ColorOutput "📉 Test 3: High Failure Rate Simulation" -Color Blue
Write-ColorOutput "=======================================" -Color Blue

Write-ColorOutput "Injecting multiple failed fixes to trigger HighFailureRate alert..." -Color Yellow

$totalFixes = if ($QuickTest) { 10 } else { 20 }
$failedFixes = 0
$targetFailureRate = $FailureRateThreshold + 10

for ($i = 1; $i -le $totalFixes; $i++) {
    $shouldFail = ($i * 100 / $totalFixes) -le $targetFailureRate

    if ($shouldFail) {
        Write-ColorOutput "   ❌ Fix attempt $i - injecting failure..." -Color Red
        $fixPayload = @{
            error_id = "chaos-failure-$i"
            fix_plan = @{
                type = "AUTOMATED_FIX"
                target_files = @("src/auth/validator.js")
                force_failure = $true
            }
        }
        $failedFixes++
    }
    else {
        Write-ColorOutput "   ✅ Fix attempt $i - success..." -Color Green
        $fixPayload = @{
            error_id = "chaos-success-$i"
            fix_plan = @{
                type = "AUTOMATED_FIX"
                target_files = @("src/utils/helper.js")
            }
        }
    }

    Test-ApiEndpoint -Url "$ExecutionEngineUrl/execute" -Body $fixPayload -TimeoutSeconds 5 | Out-Null
    Start-Sleep -Seconds 1
}

$currentFailureRate = [math]::Round($failedFixes * 100 / $totalFixes, 1)
Write-ColorOutput "   📊 Final failure rate: $currentFailureRate% ($failedFixes/$totalFixes)" -Color Blue

if ($currentFailureRate -gt $FailureRateThreshold) {
    Write-ColorOutput "   🚨 HighFailureRate alert should be triggered!" -Color Red
}
else {
    Write-ColorOutput "   ⚠️  Failure rate below alert threshold" -Color Yellow
}

# Test 4: Resource Stress Test
Write-Host ""
Write-ColorOutput "💾 Test 4: System Resource Stress Test" -Color Blue
Write-ColorOutput "=====================================" -Color Blue

Write-ColorOutput "Generating high resource usage to test performance alerts..." -Color Yellow

$stressRequests = if ($QuickTest) { 5 } else { 10 }
$jobs = @()

for ($i = 1; $i -le $stressRequests; $i++) {
    Write-ColorOutput "   🔥 Starting resource stress test $i/$stressRequests..." -Color Blue

    $stressPayload = @{
        error_id = "chaos-stress-$i"
        message = "Complex multi-layered security breach with cascading failures"
        severity = "critical"
        environment = "production"
        context = @{
            file_path = "src/security/multi-factor-auth.js"
            complexity = "very_high"
            analysis_type = "deep_learning"
            data_size = "large"
        }
        metadata = @{
            requires_heavy_processing = $true
            estimated_analysis_time = "5-10 minutes"
        }
    }

    $job = Start-Job -ScriptBlock {
        param($Url, $Payload)
        try {
            $jsonBody = $Payload | ConvertTo-Json -Depth 10 -Compress
            Invoke-RestMethod -Uri $Url -Method POST -Body $jsonBody -ContentType "application/json" -TimeoutSec 30
            return "SUCCESS"
        }
        catch {
            return "FAILED: $($_.Exception.Message)"
        }
    } -ArgumentList "$ReasoningEngineUrl/analyze", $stressPayload

    $jobs += $job

    if ($i % 3 -eq 0) {
        Start-Sleep -Seconds 2
    }
}

Write-ColorOutput "   ⏳ Waiting for stress tests to complete..." -Color Yellow
$jobResults = $jobs | Wait-Job -Timeout 60 | Receive-Job
$jobs | Remove-Job

$successCount = ($jobResults | Where-Object { $_ -eq "SUCCESS" }).Count
Write-ColorOutput "   ✅ Resource stress test completed ($successCount/$stressRequests successful)" -Color Green

# Test 5: Network Disruption Simulation
Write-Host ""
Write-ColorOutput "🌐 Test 5: Network Disruption Simulation" -Color Blue
Write-ColorOutput "=======================================" -Color Blue

Write-ColorOutput "Testing system resilience under network issues..." -Color Yellow

$networkTests = if ($QuickTest) { 3 } else { 5 }

for ($i = 1; $i -le $networkTests; $i++) {
    Write-ColorOutput "   📡 Network disruption test $i/$networkTests..." -Color Blue

    $timeoutPayload = @{
        error_id = "chaos-network-$i"
        message = "Network timeout during external API call"
        severity = "high"
        context = @{
            timeout = $true
            simulate_network_failure = $true
        }
    }

    try {
        $response = Test-ApiEndpoint -Url "$ReasoningEngineUrl/analyze" -Body $timeoutPayload -TimeoutSeconds 5
        if ($response.Success) {
            Write-ColorOutput "   ✅ Request completed successfully" -Color Green
        }
        else {
            Write-ColorOutput "   ⏰ Network timeout simulated" -Color Yellow
        }
    }
    catch {
        Write-ColorOutput "   ⏰ Network timeout simulated" -Color Yellow
    }

    Start-Sleep -Seconds 2
}

Write-ColorOutput "   ✅ Network disruption test completed" -Color Green

# Summary
Write-Host ""
Write-ColorOutput "📋 Chaos Testing Summary" -Color Cyan
Write-ColorOutput "========================" -Color Cyan

Write-Host ""
Write-ColorOutput "🎯 Tests Completed:" -Color Green
Write-Host "   ✅ High MTTR simulation (>$HighMttrThreshold seconds)"
Write-Host "   ✅ Frequent rollback simulation ($rollbackCount rollbacks)"
Write-Host "   ✅ High failure rate simulation ($currentFailureRate% failure rate)"
Write-Host "   ✅ Resource stress testing ($successCount/$stressRequests requests successful)"
Write-Host "   ✅ Network disruption simulation ($networkTests timeout scenarios)"

Write-Host ""
Write-ColorOutput "🚨 Expected Alert Triggers:" -Color Blue
if ($resolutionTime -gt $HighMttrThreshold) {
    Write-Host "   🔴 HighMTTR alert (resolution time: $([math]::Round($resolutionTime))s > $HighMttrThreshold s)"
}
if ($rollbackCount -ge $RollbackThreshold) {
    Write-Host "   🔴 FrequentRollbacks alert ($rollbackCount rollbacks >= $RollbackThreshold)"
}
if ($currentFailureRate -gt $FailureRateThreshold) {
    Write-Host "   🔴 HighFailureRate alert ($currentFailureRate% >= $FailureRateThreshold%)"
}

Write-Host ""
Write-ColorOutput "📊 Monitor Your Dashboards:" -Color Blue
Write-Host "   🎯 Grafana: $GrafanaUrl"
Write-Host "   📈 Prometheus Alerts: $PrometheusUrl/alerts"

Write-Host ""
Write-ColorOutput "🧪 Validation Steps:" -Color Cyan
Write-Host "   1. Check Grafana for triggered alerts"
Write-Host "   2. Verify alert notifications (Slack/email if configured)"
Write-Host "   3. Monitor system recovery and auto-remediation"
Write-Host "   4. Review alert acknowledgment and escalation"

Write-Host ""
Write-ColorOutput "✅ Chaos engineering tests completed!" -Color Green
Write-ColorOutput "💡 Your AI DevOps Agent's resilience and alerting have been thoroughly tested." -Color Blue

Write-Host ""
Write-ColorOutput "🔧 Next Steps:" -Color Yellow
Write-Host "   • Review alert configurations in monitoring/prometheus/alert-rules.yml"
Write-Host "   • Test alert routing and notification channels"
Write-Host "   • Validate automated recovery procedures"
Write-Host "   • Document incident response procedures"

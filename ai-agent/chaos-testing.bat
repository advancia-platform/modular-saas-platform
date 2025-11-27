@echo off
REM AI DevOps Agent - Windows Chaos Testing Script
REM Tests system resilience, alerting, and recovery capabilities

echo.
echo 🚨 AI DevOps Agent - Error Injection ^& Chaos Testing (Windows)
echo ============================================================
echo Testing system resilience, alerting, and recovery capabilities

REM Configuration
set "REASONING_ENGINE_URL=http://localhost:5000"
set "EXECUTION_ENGINE_URL=http://localhost:3000"
set "GRAFANA_URL=http://localhost:3001"
set "PROMETHEUS_URL=http://localhost:9090"

REM Alert thresholds
set "HIGH_MTTR_THRESHOLD=600"
set "ROLLBACK_THRESHOLD=5"
set "FAILURE_RATE_THRESHOLD=20"

echo.
echo ⚠️ WARNING: This script will intentionally inject errors to test:
echo    • Alert system responsiveness
echo    • MTTR (Mean Time To Resolution) monitoring
echo    • Rollback detection and automation
echo    • System recovery capabilities
echo    • Performance under stress

echo.
set /p "CONTINUE=Continue with chaos testing? (y/N): "
if /i not "%CONTINUE%"=="y" (
    echo ❌ Chaos testing cancelled
    exit /b 1
)

echo.
echo 🎯 Starting chaos engineering tests...

REM Test 1: High MTTR Simulation
echo.
echo 🔍 Test 1: High MTTR Simulation
echo ===============================

echo Injecting slow-resolution error to trigger HighMTTR alert...

curl -s -X POST %REASONING_ENGINE_URL%/analyze ^
    -H "Content-Type: application/json" ^
    -d "{\"error_id\":\"chaos-high-mttr-001\",\"message\":\"Critical database connection pool exhaustion\",\"severity\":\"critical\",\"environment\":\"production\",\"metadata\":{\"complexity\":\"high\",\"estimated_resolution_time\":\"15-20 minutes\"}}" ^
    -w "Analysis HTTP: %%{http_code}\n" ^
    -o nul

if %ERRORLEVEL% EQU 0 (
    echo    ✅ Error analysis started
    echo    ⏳ Simulating %HIGH_MTTR_THRESHOLD%+ second resolution...
    echo    📊 Monitor Grafana: %GRAFANA_URL%

    REM Simulate long resolution (in chunks to show progress)
    for /l %%i in (1,1,10) do (
        echo    ⏰ Resolution attempt %%i/10 ^(%%i minutes elapsed^)
        timeout /t 60 /nobreak >nul 2>&1

        REM Send status update
        curl -s -X POST %REASONING_ENGINE_URL%/status ^
            -H "Content-Type: application/json" ^
            -d "{\"error_id\":\"chaos-high-mttr-001\",\"status\":\"analyzing\",\"progress\":\"%%i0%%\"}" ^
            -o nul 2>nul
    )

    echo    ✅ High MTTR test completed
    echo    🚨 HighMTTR alert should have been triggered!
) else (
    echo    ❌ Failed to start high MTTR test
)

REM Test 2: Frequent Rollback Simulation
echo.
echo 🔄 Test 2: Frequent Rollback Simulation
echo =======================================

echo Injecting multiple deployment failures...

set "rollback_count=0"
for /l %%i in (1,1,8) do (
    echo    🚀 Deployment attempt %%i - injecting failure...

    curl -s -X POST %EXECUTION_ENGINE_URL%/execute ^
        -H "Content-Type: application/json" ^
        -d "{\"error_id\":\"chaos-rollback-%%i\",\"fix_plan\":{\"type\":\"DEPLOYMENT\",\"strategy\":\"blue_green\",\"force_failure\":true}}" ^
        -w "Deployment %%i HTTP: %%%%{http_code}\n" ^
        -o nul

    if %ERRORLEVEL% EQU 0 (
        set /a rollback_count+=1
        echo    ⏪ Rollback !rollback_count! triggered
    )

    timeout /t 5 /nobreak >nul 2>&1
)

echo    ✅ Rollback simulation completed
if %rollback_count% GEQ %ROLLBACK_THRESHOLD% (
    echo    🚨 FrequentRollbacks alert threshold reached!
)

REM Test 3: High Failure Rate Simulation
echo.
echo 📉 Test 3: High Failure Rate Simulation
echo =======================================

echo Injecting multiple failed fixes...

set "total_fixes=15"
set "failed_fixes=0"

for /l %%i in (1,1,%total_fixes%) do (
    set /a "should_fail=%%i*100/%total_fixes%"

    if !should_fail! LEQ 30 (
        echo    ❌ Fix attempt %%i - injecting failure...
        curl -s -X POST %EXECUTION_ENGINE_URL%/execute ^
            -H "Content-Type: application/json" ^
            -d "{\"error_id\":\"chaos-failure-%%i\",\"fix_plan\":{\"type\":\"AUTOMATED_FIX\",\"force_failure\":true}}" ^
            -o nul
        set /a failed_fixes+=1
    ) else (
        echo    ✅ Fix attempt %%i - success...
        curl -s -X POST %EXECUTION_ENGINE_URL%/execute ^
            -H "Content-Type: application/json" ^
            -d "{\"error_id\":\"chaos-success-%%i\",\"fix_plan\":{\"type\":\"AUTOMATED_FIX\"}}" ^
            -o nul
    )

    timeout /t 2 /nobreak >nul 2>&1
)

set /a "failure_rate=failed_fixes*100/total_fixes"
echo    📊 Final failure rate: %failure_rate%% (%failed_fixes%/%total_fixes%)

if %failure_rate% GTR %FAILURE_RATE_THRESHOLD% (
    echo    🚨 HighFailureRate alert should be triggered!
)

REM Test 4: Resource Stress Test
echo.
echo 💾 Test 4: Resource Stress Test
echo ==============================

echo Generating high resource usage...

for /l %%i in (1,1,5) do (
    echo    🔥 Resource stress test %%i/5...

    start /b curl -s -X POST %REASONING_ENGINE_URL%/analyze ^
        -H "Content-Type: application/json" ^
        -d "{\"error_id\":\"chaos-stress-%%i\",\"message\":\"Complex security breach\",\"severity\":\"critical\",\"metadata\":{\"requires_heavy_processing\":true}}" ^
        -o nul

    timeout /t 2 /nobreak >nul 2>&1
)

echo    ⏳ Waiting for stress tests to complete...
timeout /t 15 /nobreak >nul 2>&1
echo    ✅ Resource stress test completed

REM Test 5: Network Disruption
echo.
echo 🌐 Test 5: Network Disruption Simulation
echo ========================================

echo Testing network resilience...

for /l %%i in (1,1,3) do (
    echo    📡 Network disruption test %%i/3...

    REM Use short timeout to simulate network issues
    curl -s -m 5 -X POST %REASONING_ENGINE_URL%/analyze ^
        -H "Content-Type: application/json" ^
        -d "{\"error_id\":\"chaos-network-%%i\",\"message\":\"Network timeout\",\"context\":{\"timeout\":true}}" ^
        -w "Network test %%i: %%%%{http_code}\n" ^
        -o nul 2>nul || echo    ⏰ Network timeout simulated

    timeout /t 3 /nobreak >nul 2>&1
)

echo    ✅ Network disruption test completed

REM Summary
echo.
echo 📋 Chaos Testing Summary
echo ========================

echo.
echo 🎯 Tests Completed:
echo    ✅ High MTTR simulation (^>%HIGH_MTTR_THRESHOLD% seconds)
echo    ✅ Frequent rollback simulation (%rollback_count% rollbacks)
echo    ✅ High failure rate simulation (%failure_rate%%% failure rate)
echo    ✅ Resource stress testing (5 concurrent requests)
echo    ✅ Network disruption simulation (3 timeout scenarios)

echo.
echo 🚨 Expected Alert Triggers:
echo    🔴 HighMTTR alert (resolution time ^> %HIGH_MTTR_THRESHOLD%s)
if %rollback_count% GEQ %ROLLBACK_THRESHOLD% (
    echo    🔴 FrequentRollbacks alert (%rollback_count% rollbacks ^>= %ROLLBACK_THRESHOLD%)
)
if %failure_rate% GTR %FAILURE_RATE_THRESHOLD% (
    echo    🔴 HighFailureRate alert (%failure_rate%%% ^>= %FAILURE_RATE_THRESHOLD%%%)
)

echo.
echo 📊 Monitor Your Dashboards:
echo    🎯 Grafana: %GRAFANA_URL%
echo    📈 Prometheus Alerts: %PROMETHEUS_URL%/alerts

echo.
echo 🧪 Validation Steps:
echo    1. Check Grafana for triggered alerts
echo    2. Verify alert notifications (if configured)
echo    3. Monitor system recovery and auto-remediation
echo    4. Review alert acknowledgment and escalation

echo.
echo ✅ Chaos engineering tests completed!
echo 💡 Your AI DevOps Agent's resilience has been thoroughly tested.

echo.
echo 🔧 Next Steps:
echo    • Review alert configurations
echo    • Test alert routing and notifications
echo    • Validate automated recovery procedures
echo    • Document incident response procedures

echo.
pause

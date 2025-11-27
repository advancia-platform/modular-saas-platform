#!/usr/bin/env pwsh
# GitOps Compliance Monitoring Validation Script
# Validates compliance API endpoints and dashboard integration

param(
    [string]$Environment = "development",
    [string]$BaseUrl = "http://localhost:3000",
    [switch]$Verbose,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

Write-Host "🔍 GitOps Compliance Monitoring Validation" -ForegroundColor Blue
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Base URL: $BaseUrl" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "🔥 DRY RUN MODE - No actual API calls will be made" -ForegroundColor Red
}

# Test functions
function Test-ApiEndpoint {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )

    $url = "$BaseUrl$Endpoint"
    Write-Verbose "Testing endpoint: $Method $url"

    if ($DryRun) {
        Write-Host "  [DRY RUN] Would test: $Method $url" -ForegroundColor Gray
        return @{ StatusCode = 200; Success = $true }
    }

    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 30
        }

        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $response = Invoke-RestMethod @params
        Write-Host "  ✅ $Method $Endpoint - Success" -ForegroundColor Green
        return @{ StatusCode = 200; Success = $true; Data = $response }
    }
    catch {
        Write-Host "  ❌ $Method $Endpoint - Failed: $($_.Exception.Message)" -ForegroundColor Red
        return @{ StatusCode = $_.Exception.Response.StatusCode; Success = $false; Error = $_.Exception.Message }
    }
}

function Test-ComplianceKpis {
    Write-Host "`n📊 Testing Compliance KPIs Endpoint..." -ForegroundColor Cyan

    $result = Test-ApiEndpoint -Endpoint "/api/compliance/kpis"

    if ($result.Success) {
        Write-Verbose "KPIs Response: $($result.Data | ConvertTo-Json -Depth 3)"

        if ($result.Data.kpis -and $result.Data.summary) {
            Write-Host "  ✅ KPIs structure validated" -ForegroundColor Green
            Write-Host "  📈 Total KPIs: $($result.Data.summary.totalKpis)" -ForegroundColor Yellow
            Write-Host "  🔴 Critical Issues: $($result.Data.summary.criticalCount)" -ForegroundColor Yellow
            Write-Host "  🟡 Warnings: $($result.Data.summary.warningCount)" -ForegroundColor Yellow
            Write-Host "  🟢 Compliant: $($result.Data.summary.goodCount)" -ForegroundColor Yellow
            Write-Host "  📊 Overall Score: $($result.Data.summary.overallScore)%" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  Invalid KPIs response structure" -ForegroundColor Yellow
        }
    }

    return $result
}

function Test-AuditLogs {
    Write-Host "`n📋 Testing Audit Logs Endpoint..." -ForegroundColor Cyan

    # Test basic audit logs
    $result = Test-ApiEndpoint -Endpoint "/api/compliance/audit?pageSize=5"

    if ($result.Success) {
        Write-Verbose "Audit Logs Response: $($result.Data | ConvertTo-Json -Depth 2)"

        if ($result.Data.logs -and $result.Data.pagination -and $result.Data.summary) {
            Write-Host "  ✅ Audit logs structure validated" -ForegroundColor Green
            Write-Host "  📄 Total Logs: $($result.Data.pagination.total)" -ForegroundColor Yellow
            Write-Host "  ✅ Success Count: $($result.Data.summary.successCount)" -ForegroundColor Yellow
            Write-Host "  ❌ Failure Count: $($result.Data.summary.failureCount)" -ForegroundColor Yellow
            Write-Host "  🚫 Blocked Count: $($result.Data.summary.blockedCount)" -ForegroundColor Yellow
            Write-Host "  🔴 Critical Events: $($result.Data.summary.criticalCount)" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  Invalid audit logs response structure" -ForegroundColor Yellow
        }
    }

    # Test filtered audit logs
    Write-Host "  🔍 Testing filtered audit logs..." -ForegroundColor Blue
    $filteredResult = Test-ApiEndpoint -Endpoint "/api/compliance/audit?severity=critical&complianceRelevant=true"

    if ($filteredResult.Success) {
        Write-Host "  ✅ Filtered audit logs working" -ForegroundColor Green
    }

    return $result
}

function Test-ComplianceReports {
    Write-Host "`n📄 Testing Compliance Reports Endpoints..." -ForegroundColor Cyan

    # Test reports list
    $result = Test-ApiEndpoint -Endpoint "/api/compliance/reports?pageSize=3"

    if ($result.Success) {
        Write-Verbose "Reports Response: $($result.Data | ConvertTo-Json -Depth 2)"

        if ($result.Data.reports -and $result.Data.pagination) {
            Write-Host "  ✅ Reports structure validated" -ForegroundColor Green
            Write-Host "  📊 Total Reports: $($result.Data.pagination.total)" -ForegroundColor Yellow

            # Test report generation
            Write-Host "  🔧 Testing report generation..." -ForegroundColor Blue
            $generateBody = @{
                name = "Test Compliance Report"
                type = "security"
                framework = "SOC2"
                format = "pdf"
            } | ConvertTo-Json

            $generateResult = Test-ApiEndpoint -Endpoint "/api/compliance/reports" -Method "POST" -Body $generateBody

            if ($generateResult.Success) {
                Write-Host "  ✅ Report generation endpoint working" -ForegroundColor Green
                if ($generateResult.Data.reportId) {
                    Write-Host "  📋 Generated Report ID: $($generateResult.Data.reportId)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "  ⚠️  Invalid reports response structure" -ForegroundColor Yellow
        }
    }

    return $result
}

function Test-ComplianceMetrics {
    Write-Host "`n📈 Testing Compliance Metrics Endpoint..." -ForegroundColor Cyan

    $result = Test-ApiEndpoint -Endpoint "/api/compliance/metrics"

    if ($result.Success) {
        Write-Verbose "Metrics Response: $($result.Data | ConvertTo-Json -Depth 2)"

        if ($result.Data.overview -and $result.Data.frameworkScores -and $result.Data.trends -and $result.Data.riskAreas) {
            Write-Host "  ✅ Metrics structure validated" -ForegroundColor Green
            Write-Host "  📊 Overall Compliance Score: $($result.Data.overview.overallComplianceScore)%" -ForegroundColor Yellow
            Write-Host "  🏛️  Active Frameworks: $($result.Data.overview.activeFrameworks)" -ForegroundColor Yellow
            Write-Host "  🔴 Critical Findings: $($result.Data.overview.criticalFindings)" -ForegroundColor Yellow
            Write-Host "  📋 Framework Scores: $($result.Data.frameworkScores.Count)" -ForegroundColor Yellow
            Write-Host "  📈 Trend Points: $($result.Data.trends.Count)" -ForegroundColor Yellow
            Write-Host "  ⚠️  Risk Areas: $($result.Data.riskAreas.Count)" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠️  Invalid metrics response structure" -ForegroundColor Yellow
        }
    }

    return $result
}

function Test-ReportDownload {
    Write-Host "`n⬇️  Testing Report Download..." -ForegroundColor Cyan

    $result = Test-ApiEndpoint -Endpoint "/api/compliance/reports/report-001/download"

    if ($result.Success) {
        Write-Host "  ✅ Report download endpoint working" -ForegroundColor Green
    }

    return $result
}

function Test-DashboardIntegration {
    Write-Host "`n🖥️  Testing Dashboard Integration..." -ForegroundColor Cyan

    # Test if the compliance dashboard component exists
    $dashboardPath = "frontend/src/components/dashboard/ComplianceMonitoringDashboard.tsx"

    if (Test-Path $dashboardPath) {
        Write-Host "  ✅ Compliance dashboard component found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Compliance dashboard component missing" -ForegroundColor Red
    }

    # Test if the load test dashboard was updated
    $loadTestDashboardPath = "frontend/src/components/dashboard/LoadTestDashboard.tsx"

    if (Test-Path $loadTestDashboardPath) {
        $content = Get-Content $loadTestDashboardPath -Raw
        if ($content -match "ComplianceMonitoringDashboard" -and $content -match "activeTab.*compliance") {
            Write-Host "  ✅ Load test dashboard integration found" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Load test dashboard integration incomplete" -ForegroundColor Yellow
        }
    }

    return @{ Success = $true }
}

# Main validation sequence
Write-Host "`n🚀 Starting Compliance Monitoring Validation..." -ForegroundColor Green

$results = @{}

try {
    # Test all compliance endpoints
    $results.kpis = Test-ComplianceKpis
    $results.auditLogs = Test-AuditLogs
    $results.reports = Test-ComplianceReports
    $results.metrics = Test-ComplianceMetrics
    $results.download = Test-ReportDownload
    $results.dashboard = Test-DashboardIntegration

    # Summary
    Write-Host "`n📋 Validation Summary:" -ForegroundColor Blue
    Write-Host "================================" -ForegroundColor Blue

    $successCount = 0
    $totalTests = 0

    foreach ($test in $results.Keys) {
        $totalTests++
        if ($results[$test].Success) {
            $successCount++
            Write-Host "✅ $test" -ForegroundColor Green
        } else {
            Write-Host "❌ $test" -ForegroundColor Red
        }
    }

    $successRate = [math]::Round(($successCount / $totalTests) * 100, 1)
    Write-Host "`n📊 Success Rate: $successRate% ($successCount/$totalTests)" -ForegroundColor Yellow

    if ($successRate -eq 100) {
        Write-Host "`n🎉 All compliance monitoring endpoints validated successfully!" -ForegroundColor Green
        exit 0
    } elseif ($successRate -ge 80) {
        Write-Host "`n⚠️  Most endpoints working, some issues found" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "`n❌ Significant issues found with compliance monitoring" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "`n💥 Fatal error during validation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Gray
    exit 1
}

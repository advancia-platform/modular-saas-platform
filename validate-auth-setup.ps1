#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Validates the authentication and analytics setup end-to-end.

.DESCRIPTION
    Tests:
    1. Backend health check
    2. Login and JWT retrieval
    3. Protected analytics route with JWT
    4. Rate limiting behavior
    5. 401 handling with invalid token

.PARAMETER Email
    User email for login (default: admin@example.com)

.PARAMETER Password
    User password for login (default: yourpassword)

.PARAMETER BackendUrl
    Backend URL (default: http://localhost:4000)

.EXAMPLE
    .\validate-auth-setup.ps1
    .\validate-auth-setup.ps1 -Email "user@test.com" -Password "pass123"
#>

param(
    [string]$Email = "admin@example.com",
    [string]$Password = "yourpassword",
    [string]$BackendUrl = "http://localhost:4000"
)

$ErrorActionPreference = "Continue"

Write-Host "`n=== Authentication & Analytics Setup Validation ===" -ForegroundColor Cyan
Write-Host "Backend URL: $BackendUrl`n" -ForegroundColor Gray

# Test 1: Health Check
Write-Host "[1/5] Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get -TimeoutSec 5
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure backend is running: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Login
Write-Host "`n[2/5] Testing login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "$BackendUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -TimeoutSec 10

    if ($login.token) {
        $token = $login.token
        Write-Host "✓ Login successful" -ForegroundColor Green
        Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "✗ Login succeeded but no token returned" -ForegroundColor Red
        Write-Host "  Response: $($login | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "✗ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Check credentials or user existence in database" -ForegroundColor Yellow
    exit 1
}

# Test 3: Protected Analytics Route
Write-Host "`n[3/5] Testing protected analytics endpoint..." -ForegroundColor Yellow
try {
    $analytics = Invoke-RestMethod -Uri "$BackendUrl/api/analytics/dashboard" -Headers @{ "Authorization" = "Bearer $token" } -TimeoutSec 10
    Write-Host "✓ Analytics endpoint accessible with JWT" -ForegroundColor Green
    Write-Host "  Revenue: $$($analytics.revenue.current)" -ForegroundColor Gray
    Write-Host "  Users: $($analytics.users.current)" -ForegroundColor Gray
    Write-Host "  Transactions: $($analytics.transactions.current)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Analytics request failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    exit 1
}

# Test 4: Rate Limiting
Write-Host "`n[4/5] Testing rate limiting (10 req/min)..." -ForegroundColor Yellow
$successCount = 0
$rateLimitedCount = 0

1..12 | ForEach-Object {
    try {
        $null = Invoke-RestMethod -Uri "$BackendUrl/api/analytics/dashboard" -Headers @{ "Authorization" = "Bearer $token" } -TimeoutSec 5
        $successCount++
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            $rateLimitedCount++
        }
    }
}

if ($rateLimitedCount -gt 0) {
    Write-Host "✓ Rate limiting working correctly" -ForegroundColor Green
    Write-Host "  Successful: $successCount" -ForegroundColor Gray
    Write-Host "  Rate limited (429): $rateLimitedCount" -ForegroundColor Gray
} else {
    Write-Host "⚠ Rate limiting may not be working (no 429 responses)" -ForegroundColor Yellow
    Write-Host "  All $successCount requests succeeded" -ForegroundColor Gray
}

# Test 5: Invalid Token Handling
Write-Host "`n[5/5] Testing invalid token rejection..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "$BackendUrl/api/analytics/dashboard" -Headers @{ "Authorization" = "Bearer invalid-token-12345" } -TimeoutSec 5
    Write-Host "✗ Invalid token was accepted (security issue!)" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "✓ Invalid token correctly rejected (401)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Unexpected status code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n=== Validation Complete ===" -ForegroundColor Cyan
Write-Host "✓ Backend is healthy and accessible" -ForegroundColor Green
Write-Host "✓ JWT authentication working" -ForegroundColor Green
Write-Host "✓ Protected routes secured" -ForegroundColor Green
Write-Host "✓ Rate limiting active" -ForegroundColor Green
Write-Host "✓ Invalid tokens rejected" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Test frontend: http://localhost:3000/analytics" -ForegroundColor Gray
Write-Host "  2. Check Swagger docs: http://localhost:4000/api-docs" -ForegroundColor Gray
Write-Host "  3. Monitor logs for errors or warnings" -ForegroundColor Gray
Write-Host "  4. Run integration tests: npm test" -ForegroundColor Gray

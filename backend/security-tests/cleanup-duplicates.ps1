#!/usr/bin/env pwsh
# Script to identify and remove duplicate files

Write-Host "🔍 Checking for duplicate files..." -ForegroundColor Cyan
Write-Host ""

# Check for duplicate READMEs
$readmePath = "README.md"
$docsPath = "..\docs\EVALUATION_FRAMEWORK.md"

if ((Test-Path $readmePath) -and (Test-Path $docsPath)) {
    Write-Host "✅ Both README.md and EVALUATION_FRAMEWORK.md exist (different purposes - keep both)" -ForegroundColor Green
}

# Check for duplicate test helpers
$helpersPath1 = "..\tests\helpers\testHelpers.ts"
$helpersPath2 = "..\tests\testHelpers.ts"

if ((Test-Path $helpersPath1) -and (Test-Path $helpersPath2)) {
    Write-Host "⚠️  Found duplicate testHelpers.ts files" -ForegroundColor Yellow

    # Compare file sizes
    $size1 = (Get-Item $helpersPath1).Length
    $size2 = (Get-Item $helpersPath2).Length

    Write-Host "   $helpersPath1 ($size1 bytes)" -ForegroundColor Gray
    Write-Host "   $helpersPath2 ($size2 bytes)" -ForegroundColor Gray

    if ($size1 -gt $size2) {
        Write-Host "   Keeping helpers/testHelpers.ts (larger/more complete)" -ForegroundColor Green
        Write-Host "   To remove duplicate: Remove-Item '$helpersPath2'" -ForegroundColor Gray
    } else {
        Write-Host "   Keeping testHelpers.ts at root" -ForegroundColor Green
        Write-Host "   To remove duplicate: Remove-Item '$helpersPath1'" -ForegroundColor Gray
    }
} elseif (Test-Path $helpersPath1) {
    Write-Host "✅ testHelpers.ts in helpers/ directory" -ForegroundColor Green
} elseif (Test-Path $helpersPath2) {
    Write-Host "✅ testHelpers.ts at root" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No testHelpers.ts found" -ForegroundColor Gray
}

# Check for duplicate evaluator base classes
Write-Host ""
Write-Host "Checking for duplicate base evaluators..." -ForegroundColor Yellow

$baseFiles = Get-ChildItem -Path "evaluators" -Recurse -Filter "*base*" -File 2>$null

if ($baseFiles) {
    foreach ($file in $baseFiles) {
        Write-Host "   Found base evaluator: $($file.FullName)" -ForegroundColor Gray
    }

    if ($baseFiles.Count -gt 1) {
        Write-Host "⚠️  Multiple base evaluator files found - verify if consolidation needed" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Single base evaluator found" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No duplicate base evaluators found" -ForegroundColor Green
}

# Check for duplicate environment files
Write-Host ""
Write-Host "Checking environment files..." -ForegroundColor Yellow

$envFiles = @(".env", ".env.example", ".env.test", ".env.test.example")
$foundEnvFiles = @()

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        $foundEnvFiles += $envFile
        Write-Host "   ✅ $envFile" -ForegroundColor Green
    }
}

if ($foundEnvFiles.Count -eq 0) {
    Write-Host "⚠️  No environment files found - run: npm run eval:setup" -ForegroundColor Yellow
}

# Check for duplicate Python scripts
Write-Host ""
Write-Host "Checking for duplicate Python scripts..." -ForegroundColor Yellow

$pythonScripts = Get-ChildItem -Path . -Filter "*.py" -File | Where-Object { $_.Name -ne "run_all_evaluators.py" -and $_.Name -ne "setup.py" }

$scriptGroups = $pythonScripts | Group-Object { $_.BaseName }

foreach ($group in $scriptGroups) {
    if ($group.Count -gt 1) {
        Write-Host "⚠️  Found duplicate Python scripts:" -ForegroundColor Yellow
        foreach ($file in $group.Group) {
            Write-Host "   - $($file.FullName)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "✅ Duplicate check complete" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  - Run this script to identify duplicates" -ForegroundColor Gray
Write-Host "  - Manually review and remove unnecessary duplicates" -ForegroundColor Gray
Write-Host "  - Keep the most complete/recent version of each file" -ForegroundColor Gray

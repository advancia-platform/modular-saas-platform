#!/usr/bin/env pwsh
# Remove duplicate files from evaluation framework

Write-Host "🧹 Removing duplicate files..." -ForegroundColor Cyan
Write-Host ""

$filesRemoved = 0

# Remove duplicate test file
$duplicateTestFile = "..\tests\security-evaluation.test.ts"
if (Test-Path $duplicateTestFile) {
    Write-Host "Removing duplicate: tests/security-evaluation.test.ts" -ForegroundColor Yellow
    Remove-Item $duplicateTestFile -Force
    $filesRemoved++
}

# Remove duplicate env files except .env.example and .env
Write-Host "Checking for duplicate .env files..." -ForegroundColor Yellow
$envFiles = Get-ChildItem -Path . -Filter ".env.*" -File | Where-Object { 
    $_.Name -ne ".env.example" -and $_.Name -ne ".env" 
}

foreach ($file in $envFiles) {
    Write-Host "Removing duplicate env file: $($file.Name)" -ForegroundColor Yellow
    Remove-Item $file.FullName -Force
    $filesRemoved++
}

# Check for duplicate base evaluator files
Write-Host ""
Write-Host "Checking base evaluator files..." -ForegroundColor Yellow
$baseEvaluators = Get-ChildItem -Path "evaluators" -Filter "*base*.py" -File -ErrorAction SilentlyContinue

if ($baseEvaluators -and $baseEvaluators.Count -gt 1) {
    Write-Host "⚠️  Multiple base evaluator files found - keeping base_evaluator.py" -ForegroundColor Yellow
    foreach ($file in $baseEvaluators) {
        if ($file.Name -ne "base_evaluator.py") {
            Write-Host "   Removing: $($file.Name)" -ForegroundColor Gray
            Remove-Item $file.FullName -Force
            $filesRemoved++
        }
    }
} else {
    Write-Host "   ✅ Only base_evaluator.py exists" -ForegroundColor Green
}

# Remove duplicate test helper files
$testHelperRoot = "..\tests\testHelpers.ts"
$testHelperHelpers = "..\tests\helpers\testHelpers.ts"

if ((Test-Path $testHelperRoot) -and (Test-Path $testHelperHelpers)) {
    Write-Host ""
    Write-Host "Removing duplicate: tests/testHelpers.ts (keeping helpers/)" -ForegroundColor Yellow
    Remove-Item $testHelperRoot -Force
    $filesRemoved++
} elseif (Test-Path $testHelperRoot) {
    Write-Host "   ✅ testHelpers.ts only in root" -ForegroundColor Green
} elseif (Test-Path $testHelperHelpers) {
    Write-Host "   ✅ testHelpers.ts only in helpers/" -ForegroundColor Green
}

# Clean up __pycache__ directories
Write-Host ""
Write-Host "Cleaning up Python cache files..." -ForegroundColor Yellow
$pycacheDirs = Get-ChildItem -Path . -Directory -Recurse -Filter "__pycache__" -ErrorAction SilentlyContinue

if ($pycacheDirs) {
    foreach ($dir in $pycacheDirs) {
        Write-Host "   Removing: $($dir.FullName)" -ForegroundColor Gray
        Remove-Item $dir.FullName -Recurse -Force
        $filesRemoved++
    }
} else {
    Write-Host "   ✅ No __pycache__ directories found" -ForegroundColor Green
}

# Clean up .pyc files
$pycFiles = Get-ChildItem -Path . -File -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue

if ($pycFiles) {
    foreach ($file in $pycFiles) {
        Write-Host "   Removing: $($file.Name)" -ForegroundColor Gray
        Remove-Item $file.FullName -Force
        $filesRemoved++
    }
} else {
    Write-Host "   ✅ No .pyc files found" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host "   Files removed: $filesRemoved" -ForegroundColor Cyan
Write-Host ""

# Show remaining structure
Write-Host "Remaining structure:" -ForegroundColor Yellow
Write-Host "security-tests/" -ForegroundColor Cyan
Write-Host "├── evaluators/" -ForegroundColor Gray
$evaluators = Get-ChildItem -Path "evaluators" -Filter "*.py" -File -ErrorAction SilentlyContinue
foreach ($eval in $evaluators) {
    Write-Host "│   ├── $($eval.Name)" -ForegroundColor Gray
}
Write-Host "├── data/" -ForegroundColor Gray
$dataFiles = Get-ChildItem -Path "data" -Filter "*.jsonl" -File -ErrorAction SilentlyContinue
foreach ($data in $dataFiles) {
    Write-Host "│   ├── $($data.Name)" -ForegroundColor Gray
}
Write-Host "├── .env" -ForegroundColor Gray
Write-Host "├── .env.example" -ForegroundColor Gray
Write-Host "├── requirements.txt" -ForegroundColor Gray
Write-Host "├── run_all_evaluators.py" -ForegroundColor Gray
Write-Host "└── setup.py" -ForegroundColor Gray

Write-Host ""
Write-Host "Run 'npm run eval:diagnose' to verify setup" -ForegroundColor Cyan

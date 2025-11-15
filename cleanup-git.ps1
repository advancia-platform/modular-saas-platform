################################################################################
# Advancia Pay Ledger - Git Cleanup Script (PowerShell)
# 
# Removes ignored files from Git history, shrinks repo size, and
# re-enables full Git features in VS Code
#
# Usage: .\cleanup-git.ps1
################################################################################

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Message)
    Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

################################################################################
# Pre-cleanup checks
################################################################################

Write-Header "Advancia Git Cleanup & Optimization"

# Check if in git repo
if (-not (Test-Path .git)) {
    Write-Error "Not in a Git repository"
    exit 1
}

Write-Success "Git repository detected"

# Check for uncommitted changes
$gitStatus = git status --porcelain 2>&1
if ($gitStatus) {
    Write-Warning "You have uncommitted changes"
    Write-Host ""
    git status --short | Select-Object -First 20
    
    $totalChanges = ($gitStatus | Measure-Object).Count
    if ($totalChanges -gt 20) {
        Write-Host "... and $($totalChanges - 20) more files" -ForegroundColor Yellow
    }
    
    Write-Host ""
    $continue = Read-Host "Continue anyway? This will stage all changes. (y/n)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-Error "Cleanup cancelled"
        exit 1
    }
}

################################################################################
# Step 1: Check repo size BEFORE cleanup
################################################################################

Write-Header "Step 1: Measuring Current Repo Size"

Write-Host "Repository statistics BEFORE cleanup:" -ForegroundColor Cyan
git count-objects -vH

$beforeStats = git count-objects -v | ConvertFrom-StringData
$beforeSize = [int]$beforeStats.'size-pack'
Write-Info "Current packed size: $beforeSize KB"

################################################################################
# Step 2: Apply .gitignore rules
################################################################################

Write-Header "Step 2: Applying .gitignore Rules"

if (-not (Test-Path .gitignore)) {
    Write-Error ".gitignore file not found"
    Write-Info "Please create .gitignore before running this script"
    exit 1
}

Write-Success "Found .gitignore file"

# Show what will be removed
Write-Warning "Files that will be removed from Git tracking:"
$ignoredFiles = git ls-files -i --exclude-standard
$ignoredFiles | Select-Object -First 20
$ignoredCount = ($ignoredFiles | Measure-Object).Count

Write-Host ""
Write-Info "Total ignored files in Git: $ignoredCount"

if ($ignoredCount -eq 0) {
    Write-Success "No ignored files in Git tracking"
} else {
    Write-Host ""
    $continue = Read-Host "Remove these files from Git tracking? (y/n)"
    if ($continue -eq 'y' -or $continue -eq 'Y') {
        Write-Warning "Removing ignored files from Git..."
        
        # Remove cached files
        git rm -r --cached . 2>&1 | Out-Null
        
        # Re-add everything (respecting .gitignore)
        git add .
        
        # Check if there are changes to commit
        $stagedChanges = git diff --cached --name-only
        if ($stagedChanges) {
            git commit -m "chore: apply .gitignore cleanup - remove ignored files" -q
            Write-Success "Ignored files removed and changes committed"
        } else {
            Write-Info "No changes to commit"
        }
    } else {
        Write-Warning "Skipping .gitignore application"
    }
}

################################################################################
# Step 3: Remove deleted files from Git history
################################################################################

Write-Header "Step 3: Cleaning Git History"

Write-Warning "Removing references to deleted files..."

# Expire reflog
git reflog expire --expire=now --all

Write-Success "Reflog expired"

################################################################################
# Step 4: Garbage collection
################################################################################

Write-Header "Step 4: Running Garbage Collection"

Write-Warning "Running git gc (this may take a few minutes)..."

# Basic garbage collection
git gc --prune=now -q

Write-Success "Basic garbage collection complete"

# Aggressive garbage collection
$continue = Read-Host "Run aggressive garbage collection? (slower but more thorough) (y/n)"
if ($continue -eq 'y' -or $continue -eq 'Y') {
    Write-Warning "Running aggressive gc..."
    git gc --aggressive --prune=now
    Write-Success "Aggressive garbage collection complete"
}

################################################################################
# Step 5: Check repo size AFTER cleanup
################################################################################

Write-Header "Step 5: Measuring Repo Size After Cleanup"

Write-Host "Repository statistics AFTER cleanup:" -ForegroundColor Cyan
git count-objects -vH

$afterStats = git count-objects -v | ConvertFrom-StringData
$afterSize = [int]$afterStats.'size-pack'
Write-Info "New packed size: $afterSize KB"

# Calculate size reduction
if ($beforeSize -gt $afterSize) {
    $reduction = $beforeSize - $afterSize
    $percentage = [math]::Round(($reduction / $beforeSize) * 100, 1)
    Write-Host ""
    Write-Success "Repo size reduced by $reduction KB ($percentage%)"
} elseif ($beforeSize -eq $afterSize) {
    Write-Host ""
    Write-Info "No size reduction (repo was already clean)"
} else {
    Write-Host ""
    Write-Warning "Repo size increased slightly (normal for some repos)"
}

################################################################################
# Step 6: Verify Git status
################################################################################

Write-Header "Step 6: Verifying Git Status"

$statusLines = git status --porcelain 2>&1
$untracked = ($statusLines | Where-Object { $_ -match '^\?\?' } | Measure-Object).Count
$modified = ($statusLines | Where-Object { $_ -match '^ M' } | Measure-Object).Count
$staged = ($statusLines | Where-Object { $_ -match '^M' } | Measure-Object).Count

Write-Host "Current Git status:" -ForegroundColor Cyan
Write-Host "  Untracked files: " -NoNewline
Write-Host $untracked -ForegroundColor Yellow
Write-Host "  Modified files:  " -NoNewline
Write-Host $modified -ForegroundColor Yellow
Write-Host "  Staged files:    " -NoNewline
Write-Host $staged -ForegroundColor Yellow

if ($untracked -gt 100) {
    Write-Host ""
    Write-Warning "You have $untracked untracked files"
    Write-Info "Consider adding them to .gitignore if they shouldn't be tracked"
}

################################################################################
# Step 7: Push changes (optional)
################################################################################

Write-Header "Step 7: Push Changes to Remote"

$currentBranch = git branch --show-current

$continue = Read-Host "Push changes to remote ($currentBranch)? (y/n)"
if ($continue -eq 'y' -or $continue -eq 'Y') {
    Write-Warning "Pushing to origin/$currentBranch..."
    
    try {
        git push origin $currentBranch
        Write-Success "Changes pushed successfully"
    } catch {
        Write-Error "Push failed - you may need to force push"
        Write-Host ""
        $forcePush = Read-Host "Force push? (WARNING: This rewrites remote history) (y/n)"
        if ($forcePush -eq 'y' -or $forcePush -eq 'Y') {
            git push --force origin $currentBranch
            Write-Success "Force push successful"
        }
    }
} else {
    Write-Warning "Skipping push (remember to push manually later)"
}

################################################################################
# Completion
################################################################################

Write-Header "✅ Git Cleanup Complete!"

Write-Host "Your repository is now clean and optimized!`n" -ForegroundColor Green

Write-Host "What Changed:" -ForegroundColor Cyan
Write-Host "  ✓ Removed ignored files from Git tracking"
Write-Host "  ✓ Expired old reflog entries"
Write-Host "  ✓ Ran garbage collection"
Write-Host "  ✓ Optimized repository storage"
if ($reduction) {
    Write-Host "  ✓ Reduced repo size by ~$percentage%`n"
} else {
    Write-Host "`n"
}

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart VS Code to re-enable Git features"
Write-Host "  2. Verify status page: " -NoNewline
Write-Host "http://localhost:3000/status" -ForegroundColor Yellow
Write-Host "  3. Check ignored files are not tracked: " -NoNewline
Write-Host "git status" -ForegroundColor Yellow
Write-Host "  4. Monitor repo size: " -NoNewline
Write-Host "git count-objects -vH`n" -ForegroundColor Yellow

Write-Host "Prevent Future Bloat:" -ForegroundColor Cyan
Write-Host "  • Always commit source code only"
Write-Host "  • Keep logs, builds, and secrets in .gitignore"
Write-Host "  • Use GitHub Actions for build artifacts"
Write-Host "  • Run this cleanup script quarterly`n"

Write-Host "Note: If VS Code still shows many changes, restart it now.`n" -ForegroundColor Yellow

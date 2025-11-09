# GitHub Label Setup for Advancia Platform
# Creates standardized labels for better issue and PR organization
param(
  [string]$repo = "pdtribe181-prog/-modular-saas-platform"
)

Write-Host "🏷️  GitHub Label Setup for Advancia Pay Ledger`n" -ForegroundColor Cyan

# Check if gh CLI is authenticated
try {
    gh auth status > $null 2>&1
    Write-Host "✅ GitHub CLI authenticated`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Not authenticated with GitHub CLI" -ForegroundColor Yellow
    Write-Host "Run: gh auth login`n"
    $login = Read-Host "Login now? (y/n)"
    if ($login -eq 'y') {
        gh auth login
    } else {
        Write-Host "❌ Cannot create labels without authentication" -ForegroundColor Red
        exit 1
    }
}

# Define labels
$labels = @(
    # RPA & Automation
    @{ name = "RPA"; color = "00B8D9"; description = "RPA automation and robotic process tasks" },
    @{ name = "automation"; color = "B3D4FF"; description = "Automated tasks and process optimization" },
    @{ name = "AI-analysis"; color = "FFC400"; description = "GPT-5 or AI auto-triage analyzed issues" },
    
    # Infrastructure
    @{ name = "CI/CD"; color = "4C9AFF"; description = "Build pipelines and deployments (Render, Cloudflare, Actions)" },
    @{ name = "render"; color = "6554C0"; description = "Render hosting, deployment or environment issues" },
    @{ name = "cloudflare"; color = "2684FF"; description = "Cloudflare configuration, DNS or SSL issues" },
    @{ name = "docker"; color = "2496ED"; description = "Docker containers, images, and compose" },
    
    # Platform Sections
    @{ name = "backend"; color = "FFAB00"; description = "Backend-related (Node.js, Prisma, API, migrations)" },
    @{ name = "frontend"; color = "36B37E"; description = "Frontend/UI related (Next.js, MedBed, Dashboard)" },
    @{ name = "database"; color = "8777D9"; description = "Prisma, database, migration or query issues" },
    
    # Priority & Status
    @{ name = "urgent"; color = "DE350B"; description = "Critical issues blocking production or deployments" },
    @{ name = "high-priority"; color = "FF8B00"; description = "High priority but not blocking" },
    @{ name = "resolved"; color = "006644"; description = "Issue resolved automatically or manually" },
    @{ name = "needs-review"; color = "FBCA04"; description = "Requires code review or approval" },
    
    # Issue Types
    @{ name = "bug"; color = "FF5630"; description = "General bug or issue" },
    @{ name = "enhancement"; color = "0052CC"; description = "Feature improvement or code upgrade" },
    @{ name = "security"; color = "D93F0B"; description = "Security vulnerability or concern" },
    @{ name = "performance"; color = "FFC400"; description = "Performance optimization needed" },
    
    # Monitoring & Health
    @{ name = "render-health"; color = "00875A"; description = "Render health check failures or alerts" },
    @{ name = "monitoring"; color = "5319E7"; description = "Monitoring, logging, or observability" },
    
    # Special Tags
    @{ name = "dependencies"; color = "0366D6"; description = "Dependency updates (Dependabot)" },
    @{ name = "documentation"; color = "0075CA"; description = "Documentation improvements" },
    @{ name = "good-first-issue"; color = "7057FF"; description = "Good for newcomers" }
)

Write-Host "🧱 Creating labels for: $repo`n" -ForegroundColor Cyan
$successCount = 0
$errorCount = 0

foreach ($label in $labels) {
    try {
        Write-Host "→ Adding label '$($label.name)'..." -ForegroundColor Yellow -NoNewline
        
        gh label create $label.name `
            --color $label.color `
            --description $label.description `
            --repo $repo `
            --force 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host " (already exists, updated)" -ForegroundColor Cyan
            $successCount++
        }
    } catch {
        Write-Host " ✗ Failed" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Success: $successCount labels" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "   ❌ Errors: $errorCount labels" -ForegroundColor Red
}

Write-Host "`n✅ Label setup complete!" -ForegroundColor Green
Write-Host "`n📋 View labels at: https://github.com/$repo/labels" -ForegroundColor Cyan
Write-Host "`n💡 Usage:"
Write-Host "   - Label issues: gh issue edit <number> --add-label `"RPA,urgent`""
Write-Host "   - Label PRs: gh pr edit <number> --add-label `"CI/CD,enhancement`""
Write-Host "   - Auto-label with workflows: See .github/workflows/auto-review-merge.yml"

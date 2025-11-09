<#
.SYNOPSIS
    Comprehensive repository cleanup script
.DESCRIPTION
    Removes obsolete documentation, organizes essential files, and cleans up root directory
#>

Write-Host "🧹 Starting Repository Cleanup..." -ForegroundColor Cyan

# Files to DELETE (obsolete documentation, status reports, fix logs)
$filesToDelete = @(
    "502-FIX-ACTION-PLAN.txt",
    "502-ROOT-CAUSE-SOLUTION.txt",
    "502_BAD_GATEWAY_FIX.md",
    "502_FIX_APPLIED.md",
    "ACTIVE_WORK_GRAPH_FIX.md",
    "ADMIN_AUTH_COMPLETE.md",
    "ADMIN_USER_DETAIL_COMPLETE.md",
    "ADVANCIA-DEPLOY-COMPLETE.ps1",
    "AUTH_ENFORCEMENT_COMPLETE.md",
    "BACKEND_CUSTOM_DOMAIN_COMPLETE.md",
    "BACKEND_CUSTOM_DOMAIN_SETUP.md",
    "BACKUP_CODES_IMPLEMENTATION_COMPLETE.md",
    "BACKUP_CODES_IMPLEMENTATION_SUMMARY.md",
    "BRANDING_ASSETS_COMPLETE.md",
    "CI_CD_FIXES_COMPLETE.md",
    "CI_CD_IMPLEMENTATION_COMPLETE.md",
    "CI_DIAGNOSTIC_REPORT.md",
    "CI_FIXED_STATUS_UPDATE.md",
    "CI_FIX_FINAL_REPORT.md",
    "CI_FIX_SUMMARY.md",
    "CI_FIX_TLDR.md",
    "CI_WORKFLOW_FIX.md",
    "ci-diagnostic-report.txt",
    "CLEANUP_COMPLETE.md",
    "CLEANUP_SUMMARY.txt",
    "CLOUDFLARE_BUILD_FIX.md",
    "CLOUDFLARE_DNS_UPDATE.txt",
    "COMMIT_READY.md",
    "COMPLETE-LAUNCH-PACKAGE.md",
    "COMPLETE_IMPLEMENTATION_GUIDE.md",
    "COMPLETE_ROADMAP_OPTION_D.md",
    "COMPLETION_CHECKLIST.md",
    "CONTACT_FORM_VERIFICATION_REPORT.md",
    "DATABASE_URL_FIX_COMPLETE.md",
    "DATABASE_URL_READY.md",
    "DELIVERABLES_SUMMARY.md",
    "DEPLOYMENT-LIVE-DASHBOARD.txt",
    "DEPLOYMENT-STATUS-LIVE.md",
    "DEPLOYMENT-VERIFICATION-REPORT.md",
    "DEPLOYMENT_COMPLETE_SUCCESS.md",
    "DEPLOYMENT_DASHBOARD.md",
    "DEPLOYMENT_PACKAGE_SUMMARY.md",
    "DEPLOYMENT_PHASE_1_START.md",
    "DEPLOYMENT_PROGRESS_TRACKER.txt",
    "DEPLOYMENT_READY.txt",
    "DEPLOYMENT_STATUS.txt",
    "DEPLOYMENT_STATUS_CORS.md",
    "DEPLOY_HOOK_SETUP_COMPLETE.md",
    "DNS_CONFIGURATION.txt",
    "DNS_SETUP_REQUIRED.md",
    "DOCKERFILE_FIXED_FINAL.md",
    "DOCKERFILE_FIX_COMPLETE.md",
    "DOCTOR_CONSULTATION_SYSTEM_COMPLETE.md",
    "DO_THIS_NOW.md",
    "EMAIL_ROUTING_SETUP.txt",
    "EMAIL_SECURITY_COMPLETE_SETUP.txt",
    "ENHANCED_AUTH_COMPLETE.md",
    "ENVIRONMENT_VARS_CLEANUP.md",
    "ERROR_FIXES_SUMMARY.md",
    "EXECUTIVE-SUMMARY.md",
    "EXISTING_IMPLEMENTATION_STATUS.md",
    "EXTENSIONS_COMPLETE.md",
    "EXTENSIONS_INSTALLATION_REPORT.md",
    "EXTENSIONS_INSTALLED.md",
    "EXTENSIONS_READY.md",
    "EXTENSIONS_VISUAL_SUMMARY.md",
    "FINAL-STATUS.txt",
    "FINAL_DEPLOYMENT_CHECKLIST.txt",
    "FINAL_ENVIRONMENT_SETUP.md",
    "FINAL_FIX_DELETE_RECREATE.md",
    "FINAL_SESSION_WRAP_UP.md",
    "FINAL_STATUS_LIVE.md",
    "FIX-502-VISUAL-GUIDE.txt",
    "FIXES_SUMMARY.md",
    "FIX_AUTH_CORS_ISSUE.md",
    "FIX_CLOUDFLARE_FRONTEND.md",
    "FIX_CSS_IMPORT_WARNING.md",
    "FIX_DATABASE_URL_RENDER.md",
    "FIX_FRONTEND_BUILD_ERRORS.md",
    "FIX_OTP_AUTHENTICATION.md",
    "FIX_PRODUCTION_ERRORS.md",
    "FIX_RENDER_BUILD_ENVIRONMENT.md",
    "FIX_SERVER_CONFIGURATION.md",
    "FIX_SUMMARY_AUTOMATED.md",
    "FIX_WORKSPACE_FOLDER.md",
    "FRONTEND_BUILD_ANALYSIS.md",
    "FRONTEND_COMPONENT_UAT_CHECKLIST.md",
    "FRONTEND_ENV_VARS_READY.md",
    "FRONTEND_ENV_VARS_SETUP.md",
    "GITHUB_CLONE_SETUP.md",
    "GITHUB_DESKTOP_PATH_CLARIFICATION.md",
    "GITHUB_DESKTOP_QUICK_SETUP.md",
    "GITHUB_QUICK_REFERENCE.md",
    "GITHUB_QUICK_START.md",
    "GITHUB_SECRETS_READY.md",
    "GITHUB_SECRETS_SETUP.txt",
    "GITHUB_SETUP_COMPLETE.md",
    "GITHUB_SETUP_SUMMARY.md",
    "HIGH_AVAILABILITY_COMPLETE.md",
    "HUGE_DISCOVERY_YOURE_ALMOST_DONE.md",
    "IMPLEMENTATION_SUMMARY.md",
    "INSTALL_EXTENSIONS_QUICK.md",
    "INTEGRATION-TEST-FIX-COMPLETE.md",
    "INTEGRATION-TEST-FIX-QUICK.txt",
    "ITERATION-ROADMAP.md",
    "JWT_SECRET_GENERATED.md",
    "LAUNCH-DASHBOARD.txt",
    "MARKETING_BUDGET_CLARIFICATION.md",
    "MARKETING_FEATURES_AUDIT.md",
    "MARKETING_FEATURES_TO_BUILD.md",
    "MEDBED_CRYPTO_RECOVERY_VALIDATION_REPORT.md",
    "ORGANIZED_SYSTEM_STATUS.md",
    "PHASE_1_DNS_VERIFIED.md",
    "PHASE_1_TOKEN_WALLET_QUICKSTART.md",
    "PHASE_2_PRODUCTION_SECRETS.md",
    "PHASE_2_QUICK_START.md",
    "PHASE_2_VERIFICATION.md",
    "PHASE_3_BACKEND_DEPLOYMENT.md",
    "PHASE_3_COMPLETE.md",
    "PHASE_3_EXECUTE.md",
    "PHASE_3_GO_NOW.md",
    "PHASE_3_QUICK_REFERENCE.md",
    "PHASE_3_STATUS.txt",
    "PHASE_3_TRACKER.txt",
    "PHASE_4_EXECUTION.md",
    "PHASE_4_FRONTEND_DEPLOYMENT.md",
    "PHASE_4_OPTION_1_CHOSEN.md",
    "PHASE_4_QUICK_START.md",
    "PHASE_4_RENDER_DEPLOYMENT.md",
    "PHASE_4_RENDER_SIMPLE_5_STEPS.md",
    "PRODUCTION-LAUNCH-REPORT.md",
    "PRODUCTION_DEPLOYMENT_GUIDE.md",
    "PRODUCTION_DOCUMENTATION_INDEX.md",
    "PRODUCTION_LIVE_FINAL_REPORT.md",
    "PRODUCTION_LIVE_NOW.md",
    "PRODUCTION_LIVE_VERIFICATION.md",
    "PRODUCTION_READY_SUMMARY.md",
    "PRODUCTION_STATUS_REPORT.md",
    "PR_9_MERGE_COMPLETE.md",
    "QUICK-STATUS.md",
    "QUICK_FIX_STATUS.md",
    "QUICK_FIX_SUMMARY.md",
    "QUICK_START_ADMIN_AUTH.md",
    "README-502-ERROR-FIX.txt",
    "README_IMPROVEMENTS.md",
    "READY_TO_CODE.md",
    "READY_TO_DEPLOY.md",
    "REDEPLOY_TRIGGER.txt",
    "RENDER-DEPLOYMENT-COMPLETE.md",
    "RENDER_CACHE_REBUILD.md",
    "RENDER_CLOUDFLARE_QUICK_REF.md",
    "RENDER_DELETE_VARIABLES_GUIDE.md",
    "RENDER_DEPLOYMENT_FIX.md",
    "RENDER_ENV_VARS_COMPLETE_GUIDE.md",
    "RENDER_ENV_VARS_REFERENCE.md",
    "RENDER_FRONTEND_DEPLOY.md",
    "RENDER_FRONTEND_FIX.md",
    "RPA_AUTO_RESOLVE_COMPLETE.md",
    "SESSION-COMPLETE.md",
    "SESSION_COMPLETION_REPORT.md",
    "SESSION_SUMMARY.md",
    "SETUP_COMPLETE_SUMMARY.md",
    "SETUP_FINAL_SUMMARY.md",
    "SETUP_READY_SUMMARY.md",
    "SILENT_MODE_IMPLEMENTATION.md",
    "START_HERE_DEPLOYMENT.md",
    "STATUS_PHASE_2_IN_PROGRESS.txt",
    "STEPS_1_4_VERIFICATION.md",
    "SUCCESS_YOU_ARE_LIVE.md",
    "SYSTEM_AUDIT_AUTHENTICATION.md",
    "TOKEN_REWARDS_IMPLEMENTATION_COMPLETE.md",
    "TRIGGER_DEPLOY.md",
    "TWILIO_SMS_EXTENSION_COMPLETE.md",
    "UAT_EXECUTIVE_SUMMARY.md",
    "UAT_PACKAGE_SUMMARY.md",
    "UPDATE_PRODUCTION_ENV.md",
    "URGENT_FIX_DATABASE_URL.md",
    "VALIDATION_REPORT.md",
    "VERCEL-DEPLOYMENT-VERIFIED.md",
    "WORKFLOW_DEBUGGING_GUIDE.md",
    "WORKSPACE_ORGANIZATION_COMPLETE.md",
    "🎉_DEPLOYMENT-FIX-COMPLETE.md",
    "🎉_LAUNCH-SUCCESS.txt",
    "🚀_DEPLOYMENT-LIVE-NOW.txt"
)

# Temporary/test scripts to DELETE
$scriptsToDelete = @(
    "add-admin-endpoints.ps1",
    "apply_one_time_deploy_fix.sh",
    "Auto-Cleanup.ps1",
    "Backup-And-Cleanup.ps1",
    "Backup-Database.ps1",
    "check-render-status.ps1",
    "Cleanup-Duplicate-Repo.ps1",
    "cleanup-project.ps1",
    "create-loans-demo.ps1",
    "create-tables-direct.js",
    "Decrypt-Env-AES.ps1",
    "Decrypt-Secrets.ps1",
    "Encrypt-Env-AES.ps1",
    "Encrypt-Secrets.ps1",
    "Execute-Backup-Cleanup.ps1",
    "fix-auth-tests.ps1",
    "fix-login-test.ps1",
    "fix-markdown-lint.js",
    "fix-tests-final.ps1",
    "fix-workflow.ps1",
    "fix_markdown.py",
    "fix_medbeds.py",
    "Generate-APIKeys.ps1",
    "install-extensions.ps1",
    "install-extensions.sh",
    "Install-NotifyDashboard.ps1",
    "Manage-Secrets.ps1",
    "monitor-cloudflare-logs.ps1",
    "monitor-deployment.ps1",
    "notify-status.ps1",
    "push-and-deploy.ps1",
    "reinstall-dependencies.ps1",
    "render-build.sh",
    "reset-migrations-for-postgres.ps1",
    "Restore-Database.ps1",
    "RPA-FINALIZE-MIN.ps1",
    "RPA-FINALIZE.ps1",
    "RUN-ADVANCIA-NOW.ps1",
    "RUN-FULL-BUILD.ps1",
    "run-local.ps1",
    "Seed-CryptoSettings.ps1",
    "Seed-TestData.ps1",
    "setup-github.bat",
    "setup-local.ps1",
    "setup-wsl.sh",
    "Setup-Admin-Wallets.ps1",
    "Setup-Botpress.ps1",
    "Setup-CryptoSettings.ps1",
    "Setup-Daily-Reports.ps1",
    "Setup-Notifications.ps1",
    "Setup-Render-Env.ps1",
    "start-dev-servers.ps1",
    "START-HEALTH-TEST.bat",
    "Start-Servers.ps1",
    "test-admin-bonus.ps1",
    "test-cloudflare-deploy.ps1",
    "test-doctor-registration.ps1",
    "test-endpoints.sh",
    "test-local.ps1",
    "test-production.ps1",
    "test-registration-quick.ps1",
    "Test-Registration.ps1",
    "update-auth-register.ps1",
    "update-auth-tests.ps1",
    "Update-Cloudflare-Env.ps1",
    "verify-deployment.ps1",
    "Verify-Domain.ps1",
    "wait-for-deploy.ps1"
)

# Workflow backup to delete
$workflowBackup = ".github\workflows\deploy-frontend.fixed.yml.bak"

Write-Host "`n📁 Deleting obsolete documentation files..." -ForegroundColor Yellow
$deletedDocs = 0
foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        $deletedDocs++
        Write-Host "  ✓ Deleted: $file" -ForegroundColor Gray
    }
}

Write-Host "`n📜 Deleting temporary/test scripts..." -ForegroundColor Yellow
$deletedScripts = 0
foreach ($script in $scriptsToDelete) {
    if (Test-Path $script) {
        Remove-Item $script -Force
        $deletedScripts++
        Write-Host "  ✓ Deleted: $script" -ForegroundColor Gray
    }
}

Write-Host "`n🗑️  Deleting workflow backup..." -ForegroundColor Yellow
if (Test-Path $workflowBackup) {
    Remove-Item $workflowBackup -Force
    Write-Host "  ✓ Deleted: $workflowBackup" -ForegroundColor Gray
}

# Create docs structure
Write-Host "`n📚 Creating organized docs structure..." -ForegroundColor Cyan
if (!(Test-Path "docs\archive")) {
    New-Item -ItemType Directory -Path "docs\archive" -Force | Out-Null
}
if (!(Test-Path "docs\guides")) {
    New-Item -ItemType Directory -Path "docs\guides" -Force | Out-Null
}
if (!(Test-Path "docs\deployment")) {
    New-Item -ItemType Directory -Path "docs\deployment" -Force | Out-Null
}

# Move essential documentation to docs/guides
$guidesToMove = @{
    "ARCHITECTURE_DIAGRAMS.md" = "docs\guides\ARCHITECTURE_DIAGRAMS.md"
    "AI_KNOWLEDGE_BASE.md" = "docs\guides\AI_KNOWLEDGE_BASE.md"
    "AI_TRAINING_CONTEXT.md" = "docs\guides\AI_TRAINING_CONTEXT.md"
    "SUPPORT_STAFF_TRAINING.md" = "docs\guides\SUPPORT_STAFF_TRAINING.md"
    "BACKUP_CODES_API_DOCUMENTATION.md" = "docs\guides\BACKUP_CODES_API_DOCUMENTATION.md"
    "DOCTOR_REGISTRATION_GUIDE.md" = "docs\guides\DOCTOR_REGISTRATION_GUIDE.md"
    "DOCTOR_SYSTEM_ARCHITECTURE.md" = "docs\guides\DOCTOR_SYSTEM_ARCHITECTURE.md"
    "DOCTOR_SYSTEM_QUICK_START.md" = "docs\guides\DOCTOR_SYSTEM_QUICK_START.md"
    "OAL_AUDIT_SYSTEM.md" = "docs\guides\OAL_AUDIT_SYSTEM.md"
    "REGISTRATION_APPROVAL_IMPLEMENTATION.md" = "docs\guides\REGISTRATION_APPROVAL_IMPLEMENTATION.md"
    "SECURITY_AUDIT_REPORT.md" = "docs\guides\SECURITY_AUDIT_REPORT.md"
    "TEST_ACCOUNT_GUIDE.md" = "docs\guides\TEST_ACCOUNT_GUIDE.md"
    "TEST_INFRASTRUCTURE_IMPROVEMENTS.md" = "docs\guides\TEST_INFRASTRUCTURE_IMPROVEMENTS.md"
    "TESTING_WALKTHROUGH.md" = "docs\guides\TESTING_WALKTHROUGH.md"
    "UAT_EXECUTION_GUIDE.md" = "docs\guides\UAT_EXECUTION_GUIDE.md"
    "UAT_RESOURCES_GUIDE.md" = "docs\guides\UAT_RESOURCES_GUIDE.md"
    "UAT_TEST_PLAN.md" = "docs\guides\UAT_TEST_PLAN.md"
    "VSCODE_EXTENSIONS_GUIDE.md" = "docs\guides\VSCODE_EXTENSIONS_GUIDE.md"
}

$deploymentDocs = @{
    "CLOUDFLARE_ACCESS_BYPASS_RULES.md" = "docs\deployment\CLOUDFLARE_ACCESS_BYPASS_RULES.md"
    "CLOUDFLARE_ADVANCIAPAYLEDGER_SETUP.md" = "docs\deployment\CLOUDFLARE_ADVANCIAPAYLEDGER_SETUP.md"
    "CLOUDFLARE_API_TOKEN_SETUP.md" = "docs\deployment\CLOUDFLARE_API_TOKEN_SETUP.md"
    "CLOUDFLARE_CHECKLIST.md" = "docs\deployment\CLOUDFLARE_CHECKLIST.md"
    "CLOUDFLARE_CREDENTIALS.md" = "docs\deployment\CLOUDFLARE_CREDENTIALS.md"
    "CLOUDFLARE_DEPLOYMENT_CHECKLIST.md" = "docs\deployment\CLOUDFLARE_DEPLOYMENT_CHECKLIST.md"
    "CLOUDFLARE_DEPLOY_QUICKSTART.md" = "docs\deployment\CLOUDFLARE_DEPLOY_QUICKSTART.md"
    "CLOUDFLARE_DNS_EXACT_SETTINGS.md" = "docs\deployment\CLOUDFLARE_DNS_EXACT_SETTINGS.md"
    "CLOUDFLARE_QUICK_START.md" = "docs\deployment\CLOUDFLARE_QUICK_START.md"
    "CLOUDFLARE_SETUP_GUIDE.md" = "docs\deployment\CLOUDFLARE_SETUP_GUIDE.md"
    "CLOUDFLARE_WORKERS_DEPLOYMENT.md" = "docs\deployment\CLOUDFLARE_WORKERS_DEPLOYMENT.md"
    "DEPLOYMENT_CHECKLIST.md" = "docs\deployment\DEPLOYMENT_CHECKLIST.md"
    "DEPLOYMENT_PLATFORMS.md" = "docs\deployment\DEPLOYMENT_PLATFORMS.md"
    "DEPLOYMENT_STEP_BY_STEP.md" = "docs\deployment\DEPLOYMENT_STEP_BY_STEP.md"
    "DEPLOYMENT-SETUP-WINDOWS-POWERSHELL.md" = "docs\deployment\DEPLOYMENT_SETUP_WINDOWS_POWERSHELL.md"
    "CHECK_RENDER_DEPLOYMENT.md" = "docs\deployment\CHECK_RENDER_DEPLOYMENT.md"
    "CI_CD_WORKFLOW_GUIDE.md" = "docs\deployment\CI_CD_WORKFLOW_GUIDE.md"
    "COMPLETE_SETUP_GUIDE.md" = "docs\deployment\COMPLETE_SETUP_GUIDE.md"
    "DNS_AND_SSL_SETUP_GUIDE.md" = "docs\deployment\DNS_AND_SSL_SETUP_GUIDE.md"
    "ENVIRONMENT_VARIABLES_AUDIT.md" = "docs\deployment\ENVIRONMENT_VARIABLES_AUDIT.md"
    "FREE_CUSTOM_EMAIL_SETUP.md" = "docs\deployment\FREE_CUSTOM_EMAIL_SETUP.md"
    "GITHUB_SECRETS_SETUP.md" = "docs\deployment\GITHUB_SECRETS_SETUP.md"
    "IMPLEMENTATION_GUIDE.md" = "docs\deployment\IMPLEMENTATION_GUIDE.md"
    "IMPLEMENTATION_PLAN.md" = "docs\deployment\IMPLEMENTATION_PLAN.md"
    "MARKETING_AND_PROMOTION.md" = "docs\deployment\MARKETING_AND_PROMOTION.md"
    "RENDER_DEPLOYMENT.md" = "docs\deployment\RENDER_DEPLOYMENT.md"
    "RENDER_SHELL_COMMAND.md" = "docs\deployment\RENDER_SHELL_COMMAND.md"
    "REPO_CLEANUP_GUIDE.md" = "docs\deployment\REPO_CLEANUP_GUIDE.md"
    "RESILIENCE_GUIDE.md" = "docs\deployment\RESILIENCE_GUIDE.md"
    "SECURE_SECRETS.md" = "docs\deployment\SECURE_SECRETS.md"
    "SMTP_QUICK_TEST.md" = "docs\deployment\SMTP_QUICK_TEST.md"
    "TROUBLESHOOTING.md" = "docs\deployment\TROUBLESHOOTING.md"
    "WSL_SETUP_GUIDE.md" = "docs\deployment\WSL_SETUP_GUIDE.md"
    "ZERO_TRUST_ACCESS_GUIDE.md" = "docs\deployment\ZERO_TRUST_ACCESS_GUIDE.md"
}

Write-Host "`n📖 Moving essential guides..." -ForegroundColor Yellow
foreach ($source in $guidesToMove.Keys) {
    if (Test-Path $source) {
        Move-Item $source $guidesToMove[$source] -Force
        Write-Host "  ✓ Moved: $source -> $($guidesToMove[$source])" -ForegroundColor Gray
    }
}

Write-Host "`n🚀 Moving deployment docs..." -ForegroundColor Yellow
foreach ($source in $deploymentDocs.Keys) {
    if (Test-Path $source) {
        Move-Item $source $deploymentDocs[$source] -Force
        Write-Host "  ✓ Moved: $source -> $($deploymentDocs[$source])" -ForegroundColor Gray
    }
}

# Move remaining useful scripts to scripts/
Write-Host "`n🔧 Moving essential scripts to scripts/..." -ForegroundColor Yellow
$scriptsToKeep = @(
    "ADVANCIA-AUTO-SYNC-DEPLOY.ps1",
    "ADVANCIA-DAILY-MAINTENANCE.ps1",
    "AUTO_CHECK_DEPLOYMENT.ps1",
    "POWERSHELL-QUICK-REFERENCE.md",
    "DISK_CLEANUP_GUIDE.md",
    "CLONE_THIS.md",
    "CLONE_LOCATION_VISUAL.md",
    "CLEANUP_QUICK_START.md"
)

foreach ($script in $scriptsToKeep) {
    if (Test-Path $script) {
        $destination = "scripts\$script"
        if (!(Test-Path "scripts")) {
            New-Item -ItemType Directory -Path "scripts" -Force | Out-Null
        }
        Move-Item $script $destination -Force
        Write-Host "  ✓ Moved: $script -> $destination" -ForegroundColor Gray
    }
}

# Create documentation index
Write-Host "`n📋 Creating documentation index..." -ForegroundColor Cyan
$indexContent = @"
# Advancia PayLedger Documentation

## 📚 Documentation Structure

This directory contains all organized documentation for the Advancia PayLedger platform.

### 📖 Guides (`docs/guides/`)

Essential guides for development, testing, and operations:

- **AI_KNOWLEDGE_BASE.md** - Comprehensive AI training Q&A examples
- **AI_TRAINING_CONTEXT.md** - AI agent working context
- **SUPPORT_STAFF_TRAINING.md** - Support team training guide
- **ARCHITECTURE_DIAGRAMS.md** - System architecture documentation
- **BACKUP_CODES_API_DOCUMENTATION.md** - 2FA backup codes API
- **DOCTOR_REGISTRATION_GUIDE.md** - Doctor onboarding process
- **DOCTOR_SYSTEM_ARCHITECTURE.md** - Doctor consultation system architecture
- **DOCTOR_SYSTEM_QUICK_START.md** - Quick start for doctor features
- **OAL_AUDIT_SYSTEM.md** - Audit logging system documentation
- **REGISTRATION_APPROVAL_IMPLEMENTATION.md** - User registration workflow
- **SECURITY_AUDIT_REPORT.md** - Security analysis and recommendations
- **TEST_ACCOUNT_GUIDE.md** - Testing credentials and accounts
- **TEST_INFRASTRUCTURE_IMPROVEMENTS.md** - Testing framework enhancements
- **TESTING_WALKTHROUGH.md** - Complete testing guide
- **UAT_EXECUTION_GUIDE.md** - User acceptance testing guide
- **UAT_RESOURCES_GUIDE.md** - UAT resources and tools
- **UAT_TEST_PLAN.md** - UAT test scenarios
- **VSCODE_EXTENSIONS_GUIDE.md** - Recommended VS Code extensions

### 🚀 Deployment (`docs/deployment/`)

Deployment guides and infrastructure documentation:

- **Cloudflare Setup** - Complete Cloudflare configuration guides
- **Render Deployment** - Render.com deployment instructions
- **GitHub Secrets** - CI/CD secrets configuration
- **Environment Variables** - Environment configuration audit
- **DNS & SSL** - Domain and SSL setup
- **Email Setup** - SMTP and email routing configuration
- **Implementation Guides** - Step-by-step implementation plans
- **Troubleshooting** - Common issues and solutions
- **Security** - Zero Trust, secrets management

### 🗄️ Archive (`docs/archive/`)

Historical documentation and deprecated guides (kept for reference).

## 🔗 Quick Links

- [Main README](../README.md) - Project overview
- [Backend README](../backend/README.md) - Backend API documentation
- [Frontend README](../frontend/README.md) - Frontend application guide
- [Contributing Guidelines](../.github/CONTRIBUTING.md) - How to contribute

## 📝 Documentation Standards

- Use Markdown format (`.md` files)
- Include table of contents for long documents
- Use code blocks with language specifiers
- Wrap bare URLs in angle brackets
- Keep headings concise (no trailing punctuation)
- Update index when adding new documentation

## 🛠️ Development Commands

```bash
# Start development servers
npm run dev

# Run tests
npm test

# Type check
npm run type-check

# Lint code
npm run lint
```

## 💡 Need Help?

- Check the [Troubleshooting Guide](deployment/TROUBLESHOOTING.md)
- Review [Testing Documentation](guides/TESTING_WALKTHROUGH.md)
- See [Architecture Diagrams](guides/ARCHITECTURE_DIAGRAMS.md)
- Contact the development team

---

**Last Updated:** $(Get-Date -Format 'yyyy-MM-dd')
**Repository:** <https://github.com/pdtribe181-prog/-modular-saas-platform>
"@

Set-Content -Path "docs\README.md" -Value $indexContent -Encoding UTF8

Write-Host "`n✅ Cleanup Complete!" -ForegroundColor Green
Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  • Deleted $deletedDocs obsolete documentation files" -ForegroundColor White
Write-Host "  • Deleted $deletedScripts temporary scripts" -ForegroundColor White
Write-Host "  • Organized essential docs into docs/guides/" -ForegroundColor White
Write-Host "  • Organized deployment docs into docs/deployment/" -ForegroundColor White
Write-Host "  • Moved utility scripts to scripts/" -ForegroundColor White
Write-Host "  • Created docs/README.md index" -ForegroundColor White
Write-Host "`n📁 New structure:" -ForegroundColor Cyan
Write-Host "  docs/" -ForegroundColor White
Write-Host "    ├── README.md (index)" -ForegroundColor Gray
Write-Host "    ├── guides/ (development & operations)" -ForegroundColor Gray
Write-Host "    ├── deployment/ (infrastructure & CI/CD)" -ForegroundColor Gray
Write-Host "    └── archive/ (deprecated docs)" -ForegroundColor Gray
Write-Host "`n🔄 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review docs/README.md" -ForegroundColor White
Write-Host "  2. Commit changes: git add -A && git commit -m 'chore: repository cleanup and documentation reorganization'" -ForegroundColor White
Write-Host "  3. Push to GitHub: git push" -ForegroundColor White

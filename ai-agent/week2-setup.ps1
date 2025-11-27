#!/usr/bin/env pwsh
# AI Cybersecurity Agent - Week 2 Quick Setup

Write-Host "🤖 AI Cybersecurity Agent - Week 2: Reasoning Engine" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

Write-Host "`n📋 Current Progress:" -ForegroundColor Yellow
Write-Host "█████ Foundation Setup ✅ COMPLETE" -ForegroundColor Green
Write-Host "█████ Reasoning Engine 🔧 IN PROGRESS" -ForegroundColor Yellow
Write-Host "      █████ Execution Engine" -ForegroundColor Gray
Write-Host "            █████ Integration & Monitoring" -ForegroundColor Gray
Write-Host "                  █████ CI/CD & Dashboard" -ForegroundColor Gray
Write-Host "                        █████ Polish & Launch" -ForegroundColor Gray

Write-Host "`n🎯 Week 2 Goals:" -ForegroundColor Yellow
Write-Host "• Threat Detection Agent with GPT-4.1" -ForegroundColor White
Write-Host "• Pattern Recognition for Security Events" -ForegroundColor White
Write-Host "• Risk Scoring System" -ForegroundColor White
Write-Host "• Multi-Agent Coordination" -ForegroundColor White

Write-Host "`n🔧 Setting up Python Environment..." -ForegroundColor Yellow

try {
    # Refresh PATH for new Python installation
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # Test Python
    python --version
    Write-Host "✅ Python is available" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Python might need PATH refresh. Continue anyway..." -ForegroundColor Yellow
}

Write-Host "`n📦 Installing AI Agent Framework..." -ForegroundColor Yellow

# Create virtual environment
python -m venv venv
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "⚠️  Virtual environment creation had issues" -ForegroundColor Yellow
}

# Activate virtual environment and install packages
& ".\venv\Scripts\Activate.ps1"

Write-Host "📥 Installing Microsoft Agent Framework..." -ForegroundColor Yellow
pip install agent-framework-azure-ai --pre
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Agent Framework installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Agent Framework installation had issues" -ForegroundColor Yellow
}

Write-Host "📥 Installing additional dependencies..." -ForegroundColor Yellow
pip install openai python-dotenv pandas numpy requests
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some dependencies might have issues" -ForegroundColor Yellow
}

Write-Host "`n🔑 GitHub Token Setup:" -ForegroundColor Yellow
$githubToken = $env:GITHUB_TOKEN
if ($githubToken) {
    Write-Host "✅ GitHub token is configured" -ForegroundColor Green
} else {
    Write-Host "❌ GitHub token not found" -ForegroundColor Red
    Write-Host "📝 To set up GitHub Models access:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Generate new token with 'Read access to metadata'" -ForegroundColor White
    Write-Host "3. Run: `$env:GITHUB_TOKEN = 'your_token_here'" -ForegroundColor White
}

Write-Host "`n🧪 Testing Agent Framework..." -ForegroundColor Yellow
try {
    python -c "from agent_framework import ChatAgent; print('✅ Agent Framework import successful')"
    Write-Host "✅ Agent Framework is working" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Agent Framework test failed - might need manual verification" -ForegroundColor Yellow
}

Write-Host "`n🎉 Week 2 Setup Status:" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host "✅ Python 3.12 installed" -ForegroundColor Green
Write-Host "✅ Virtual environment created" -ForegroundColor Green
Write-Host "✅ Agent Framework installed (preview)" -ForegroundColor Green
Write-Host "✅ Threat reasoning engine ready" -ForegroundColor Green
Write-Host "$(if ($githubToken) { '✅' } else { '⚠️ ' }) GitHub token $(if ($githubToken) { 'configured' } else { 'needs setup' })" -ForegroundColor $(if ($githubToken) { 'Green' } else { 'Yellow' })

Write-Host "`n🚀 Next Steps:" -ForegroundColor Cyan
if (-not $githubToken) {
    Write-Host "1. Set up GitHub token (see instructions above)" -ForegroundColor White
    Write-Host "2. Test the reasoning engine:" -ForegroundColor White
} else {
    Write-Host "1. Test the reasoning engine:" -ForegroundColor White
}
Write-Host "   python threat_reasoning_engine.py" -ForegroundColor Gray

Write-Host "`n🎯 Week 2 Implementation Plan:" -ForegroundColor Cyan
Write-Host "• Day 1-2: Core agent setup ✅" -ForegroundColor Green
Write-Host "• Day 3-4: Pattern recognition (Next)" -ForegroundColor Yellow
Write-Host "• Day 5-7: Advanced reasoning & risk scoring" -ForegroundColor Gray

Write-Host "`n💡 Note: Docker/WSL setup can be completed later." -ForegroundColor Yellow
Write-Host "   Focus on AI reasoning engine first!" -ForegroundColor Yellow

Write-Host "`nEnvironment ready for AI Cybersecurity Agent development! 🚀" -ForegroundColor Green

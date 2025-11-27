#!/usr/bin/env pwsh
# GitHub Token Setup Helper for AI Cybersecurity Agent

Write-Host "🔑 GitHub Models Access Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

Write-Host "`n📋 Steps to get your GitHub Personal Access Token:" -ForegroundColor Yellow

Write-Host "`n1. 🌐 Open GitHub Settings:" -ForegroundColor Cyan
Write-Host "   https://github.com/settings/tokens" -ForegroundColor White

Write-Host "`n2. 📝 Create New Token:" -ForegroundColor Cyan
Write-Host "   • Click 'Generate new token (classic)'" -ForegroundColor White
Write-Host "   • Name: 'AI Cybersecurity Agent Development'" -ForegroundColor White
Write-Host "   • Expiration: 90 days (or your preference)" -ForegroundColor White
Write-Host "   • Scopes: Select 'public_repo' or 'repo' (for metadata access)" -ForegroundColor White

Write-Host "`n3. 💾 Copy and Set Your Token:" -ForegroundColor Cyan
Write-Host "   After creating the token, copy it and run:" -ForegroundColor White
Write-Host "   `$env:GITHUB_TOKEN = 'ghp_your_token_here'" -ForegroundColor Gray

Write-Host "`n4. ✅ Verify Setup:" -ForegroundColor Cyan
Write-Host "   python threat_reasoning_engine.py" -ForegroundColor Gray

Write-Host "`n🔒 Security Notes:" -ForegroundColor Yellow
Write-Host "• Never share your token publicly" -ForegroundColor White
Write-Host "• Store securely (consider using a password manager)" -ForegroundColor White
Write-Host "• For production, use environment variables or key vault" -ForegroundColor White

Write-Host "`n💡 GitHub Models Benefits:" -ForegroundColor Cyan
Write-Host "• ✅ Free tier access to GPT-4.1 and other models" -ForegroundColor Green
Write-Host "• ✅ No credit card required for development" -ForegroundColor Green
Write-Host "• ✅ Rate limits suitable for testing and development" -ForegroundColor Green
Write-Host "• ✅ Same OpenAI API interface" -ForegroundColor Green

Write-Host "`n🎯 Models Available for Cybersecurity:" -ForegroundColor Yellow
Write-Host "• openai/gpt-4.1 - Enhanced reasoning (recommended)" -ForegroundColor White
Write-Host "• microsoft/phi-4-reasoning - Specialized reasoning" -ForegroundColor White
Write-Host "• openai/gpt-4o - Multimodal capabilities" -ForegroundColor White
Write-Host "• openai/o1 - Advanced problem solving" -ForegroundColor White

Write-Host "`n📊 Current Project Status:" -ForegroundColor Cyan
Write-Host "█████ Foundation Setup ✅ COMPLETE" -ForegroundColor Green
Write-Host "████▌ Reasoning Engine 🔧 90% COMPLETE" -ForegroundColor Yellow
Write-Host "      █████ Execution Engine (Next)" -ForegroundColor Gray
Write-Host "            █████ Integration & Monitoring" -ForegroundColor Gray
Write-Host "                  █████ CI/CD & Dashboard" -ForegroundColor Gray
Write-Host "                        █████ Polish & Launch" -ForegroundColor Gray

Write-Host "`n🚀 After token setup, you can:" -ForegroundColor Green
Write-Host "• Test threat detection with real AI models" -ForegroundColor White
Write-Host "• Analyze security patterns and incidents" -ForegroundColor White
Write-Host "• Generate automated threat responses" -ForegroundColor White
Write-Host "• Calculate risk scores for security events" -ForegroundColor White

Write-Host "`nReady to revolutionize cybersecurity with AI! 🛡️🤖" -ForegroundColor Green

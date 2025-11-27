#!/bin/bash

# AI DevOps Agent Quick Setup Script
# This script will prepare your system to run the AI DevOps Agent

echo "🤖 AI DevOps Agent - Quick Setup"
echo "================================="
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js found: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check Python version
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ Python found: $PYTHON_VERSION"
else
    echo "❌ Python 3.9+ not found. Please install Python first."
    exit 1
fi

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Node.js dependencies installed successfully"
else
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

# Install Python dependencies
echo ""
echo "🐍 Installing Python dependencies..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Check for environment variables
echo ""
echo "🔧 Checking environment configuration..."
if [ -f .env ]; then
    echo "✅ Found .env file"
else
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << EOL
# AI DevOps Agent Configuration
# Copy this file and update with your actual values

# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here

# GitHub Integration (Optional)
GITHUB_TOKEN=your_github_token_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# Sentry Integration (Optional)
SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

# Prometheus Integration (Optional)
PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_QUERY_ENDPOINT=/api/v1/query

# Security Scanning (Optional)
SECURITY_SCAN_API_KEY=your_security_api_key_here

# Agent Configuration
NODE_ENV=development
LOG_LEVEL=debug
RISK_THRESHOLD_AUTO_FIX=0.8
RISK_THRESHOLD_HUMAN_REVIEW=0.6
RISK_THRESHOLD_CRITICAL_ALERT=0.9

# Server Configuration
PORT=3000
PYTHON_SERVICE_PORT=5000
EOL
    echo "📝 Created .env template. Please update it with your actual values."
fi

echo ""
echo "🎯 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your API keys"
echo "2. Run 'npm run demo' to see the AI DevOps Agent in action"
echo "3. Run 'npm start' to start monitoring your systems"
echo ""
echo "Quick commands:"
echo "  npm run demo     - Full demonstration with simulated errors"
echo "  npm start        - Start production monitoring"
echo "  npm run dev      - Start in development mode"
echo "  npm test         - Run test suite"
echo ""
echo "🚀 Ready to transform your DevOps with AI!"

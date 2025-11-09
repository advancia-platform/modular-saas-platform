#!/bin/bash
# Comprehensive Debugging Suite Runner for Advancia Pay Ledger Backend
# This script runs all debugging jobs systematically

set -e  # Exit on error

echo "🚀 Starting Comprehensive Debugging Suite..."
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to backend directory
cd "$(dirname "$0")"

echo -e "${BLUE}📍 Working Directory: $(pwd)${NC}"
echo ""

# Step 1: Health Check
echo -e "${YELLOW}Step 1/6: Health Check${NC}"
echo "Verifying database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

# Step 2: Run Smoke Tests
echo -e "${YELLOW}Step 2/6: Running Smoke Tests${NC}"
echo "Quick validation of critical paths..."
npm test -- smoke.test.ts --runInBand --no-coverage || echo -e "${RED}⚠️ Smoke tests had issues${NC}"
echo ""

# Step 3: Run Health Tests
echo -e "${YELLOW}Step 3/6: Running Health Tests${NC}"
npm test -- health.test.ts --runInBand --no-coverage || echo -e "${RED}⚠️ Health tests had issues${NC}"
echo ""

# Step 4: Run Authentication Tests
echo -e "${YELLOW}Step 4/6: Running Authentication Tests${NC}"
npm test -- auth.test.ts --runInBand --verbose || echo -e "${RED}⚠️ Auth tests had issues${NC}"
echo ""

# Step 5: Run Integration Tests (with debugger)
echo -e "${YELLOW}Step 5/6: Running Integration Tests (Debug Mode)${NC}"
echo "Debugger available at: ws://127.0.0.1:9229"
node --inspect=9229 node_modules/jest/bin/jest.js integration.test.ts --runInBand --verbose || echo -e "${RED}⚠️ Integration tests had issues${NC}"
echo ""

# Step 6: Generate Coverage Report
echo -e "${YELLOW}Step 6/6: Generating Coverage Report${NC}"
npm run test:cov || echo -e "${RED}⚠️ Coverage generation had issues${NC}"
echo ""

# Summary
echo "=============================================="
echo -e "${GREEN}🎉 Debugging Suite Complete!${NC}"
echo ""
echo "📊 Results:"
echo "  - Coverage report: coverage/index.html"
echo "  - Test logs: Available in terminal output above"
echo ""
echo "🐛 Next Steps:"
echo "  1. Review test results above"
echo "  2. Open coverage/index.html in browser"
echo "  3. Use VS Code debugger (F5) for interactive debugging"
echo "  4. Set breakpoints in test files for detailed inspection"
echo ""

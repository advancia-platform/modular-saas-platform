#!/bin/bash
# Workflow Health Check Script
# Runs all pre-commit checks to prevent CI failures

set -e

echo "🔍 Starting Workflow Health Check..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to run check
run_check() {
    local name=$1
    local command=$2

    echo -n "⏳ ${name}... "

    if eval "$command" > /tmp/check_output.txt 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
        cat /tmp/check_output.txt
        FAILURES=$((FAILURES + 1))
    fi
}

# 1. Check Git Status
echo "📂 Git Status Check"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes detected${NC}"
    git status --short
else
    echo -e "${GREEN}✅ Working tree clean${NC}"
fi
echo ""

# 2. Prisma Client
echo "🗄️  Prisma Client Check"
if [ -d "backend/node_modules/.prisma/client" ]; then
    echo -e "${GREEN}✅ Prisma client exists${NC}"
else
    echo -e "${RED}❌ Prisma client missing - run: cd backend && npx prisma generate${NC}"
    FAILURES=$((FAILURES + 1))
fi
echo ""

# 3. Dependencies
echo "📦 Dependencies Check"
run_check "Installing dependencies" "npm ci --quiet"
echo ""

# 4. Linting
echo "🧹 Linting Check"
run_check "ESLint (Backend)" "cd backend && npx eslint . --max-warnings 0"
run_check "ESLint (Frontend)" "cd frontend && npx eslint . --max-warnings 0"
run_check "Prettier" "npx prettier --check ."
echo ""

# 5. TypeScript
echo "🔷 TypeScript Check"
run_check "Backend Type Check" "cd backend && npx tsc --noEmit"
run_check "Frontend Type Check" "cd frontend && npx tsc --noEmit"
echo ""

# 6. Tests
echo "🧪 Test Check"
run_check "Backend Unit Tests" "cd backend && npm run test:unit -- --passWithNoTests"
echo ""

# 7. Build
echo "🏗️  Build Check"
run_check "Backend Build" "cd backend && npm run build"
run_check "Frontend Build" "cd frontend && npm run build"
echo ""

# 8. Security Audit
echo "🔒 Security Audit"
if npm audit --production --audit-level=high > /tmp/audit.txt 2>&1; then
    echo -e "${GREEN}✅ No high/critical vulnerabilities${NC}"
else
    echo -e "${YELLOW}⚠️  Security vulnerabilities found:${NC}"
    cat /tmp/audit.txt | grep -A 5 "vulnerabilities"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo "Safe to push to GitHub!"
    exit 0
else
    echo -e "${RED}❌ ${FAILURES} CHECK(S) FAILED${NC}"
    echo "Fix the issues above before pushing."
    exit 1
fi

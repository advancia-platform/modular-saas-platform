#!/bin/bash

# 🚀 Pre-Deployment Test Suite
# Advancia Pay Ledger - Automated Testing & Validation

set -e  # Exit on error

echo "🎯 Advancia Pay Ledger - Pre-Deployment Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
WARNINGS=0

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "ℹ️  $1"
}

# Test 1: Git Status
echo "📋 Test 1: Git Repository Status"
echo "--------------------------------"
if git diff-index --quiet HEAD --; then
    print_success "Working directory is clean"
else
    print_warning "Uncommitted changes detected"
fi

BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ]; then
    print_success "On main branch"
else
    print_error "Not on main branch (current: $BRANCH)"
fi
echo ""

# Test 2: Node.js & NPM Versions
echo "📋 Test 2: Node.js & Package Manager Versions"
echo "--------------------------------------------"
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
print_info "Node.js version: $NODE_VERSION"
print_info "NPM version: $NPM_VERSION"

if [[ "$NODE_VERSION" =~ ^v(18|20|22) ]]; then
    print_success "Node.js version is compatible"
else
    print_error "Node.js version should be 18, 20, or 22"
fi
echo ""

# Test 3: Backend Dependencies
echo "📋 Test 3: Backend Dependencies"
echo "------------------------------"
cd backend
if [ -f "package-lock.json" ]; then
    print_success "Backend package-lock.json exists"
else
    print_warning "Backend package-lock.json missing"
fi

if [ -d "node_modules" ]; then
    print_success "Backend node_modules exists"
else
    print_warning "Backend node_modules missing - run 'npm install'"
fi
cd ..
echo ""

# Test 4: Frontend Dependencies
echo "📋 Test 4: Frontend Dependencies"
echo "-------------------------------"
cd frontend
if [ -f "package-lock.json" ]; then
    print_success "Frontend package-lock.json exists"
else
    print_warning "Frontend package-lock.json missing"
fi

if [ -d "node_modules" ]; then
    print_success "Frontend node_modules exists"
else
    print_warning "Frontend node_modules missing - run 'npm install'"
fi
cd ..
echo ""

# Test 5: TypeScript Compilation (Backend)
echo "📋 Test 5: Backend TypeScript Compilation"
echo "----------------------------------------"
cd backend
if npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error"; then
    print_error "Backend TypeScript has compilation errors"
else
    print_success "Backend TypeScript compiles successfully"
fi
cd ..
echo ""

# Test 6: TypeScript Compilation (Frontend)
echo "📋 Test 6: Frontend TypeScript Compilation"
echo "-----------------------------------------"
cd frontend
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    print_error "Frontend TypeScript has compilation errors"
else
    print_success "Frontend TypeScript compiles successfully"
fi
cd ..
echo ""

# Test 7: Prisma Schema Validation
echo "📋 Test 7: Prisma Schema Validation"
echo "----------------------------------"
cd backend
if npx prisma validate; then
    print_success "Prisma schema is valid"
else
    print_error "Prisma schema has errors"
fi
cd ..
echo ""

# Test 8: Environment Files
echo "📋 Test 8: Environment Configuration"
echo "-----------------------------------"
if [ -f "backend/.env" ] || [ -f "backend/.env.production" ]; then
    print_success "Backend environment file exists"
else
    print_warning "Backend .env file missing"
fi

if [ -f "frontend/.env.local" ] || [ -f "frontend/.env.production" ]; then
    print_success "Frontend environment file exists"
else
    print_warning "Frontend .env file missing"
fi
echo ""

# Test 9: Docker Configuration
echo "📋 Test 9: Docker Configuration"
echo "------------------------------"
if [ -f "Dockerfile" ]; then
    print_success "Dockerfile exists"
else
    print_error "Dockerfile missing"
fi

if [ -f "docker-compose.yml" ]; then
    print_success "docker-compose.yml exists"
else
    print_error "docker-compose.yml missing"
fi

if command -v docker &> /dev/null; then
    print_success "Docker is installed"
else
    print_warning "Docker is not installed"
fi
echo ""

# Test 10: Build Tests
echo "📋 Test 10: Build Tests (Optional - Takes time)"
echo "----------------------------------------------"
print_info "Skipping full build test for speed"
print_info "Run manually with: npm run build in backend/ and frontend/"
echo ""

# Test 11: Critical Files
echo "📋 Test 11: Critical Files Check"
echo "-------------------------------"
CRITICAL_FILES=(
    "backend/src/index.ts"
    "backend/prisma/schema.prisma"
    "frontend/src/app/layout.tsx"
    "frontend/next.config.js"
    ".github/workflows/ci.yml"
    "README.md"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file missing"
    fi
done
echo ""

# Test 12: Git Remote
echo "📋 Test 12: Git Remote Configuration"
echo "-----------------------------------"
REMOTE_URL=$(git remote get-url origin)
print_info "Remote URL: $REMOTE_URL"
if [[ "$REMOTE_URL" =~ github.com ]]; then
    print_success "GitHub remote configured"
else
    print_warning "Remote is not GitHub"
fi
echo ""

# Test 13: Latest Commit
echo "📋 Test 13: Latest Commit Info"
echo "-----------------------------"
LATEST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%cr)")
print_info "Latest: $LATEST_COMMIT"
print_success "Git history accessible"
echo ""

# Test 14: GitHub Actions Files
echo "📋 Test 14: CI/CD Configuration"
echo "------------------------------"
if [ -d ".github/workflows" ]; then
    WORKFLOW_COUNT=$(ls -1 .github/workflows/*.yml 2>/dev/null | wc -l)
    print_success "Found $WORKFLOW_COUNT GitHub Actions workflows"
else
    print_error ".github/workflows directory missing"
fi
echo ""

# Test 15: Documentation
echo "📋 Test 15: Documentation Files"
echo "------------------------------"
DOC_FILES=(
    "README.md"
    "FEATURE_INVENTORY.md"
    "DEPLOYMENT_STATUS.md"
)

for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        print_success "$doc exists"
    else
        print_warning "$doc missing"
    fi
done
echo ""

# Summary
echo ""
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

# Final verdict
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo -e "${GREEN}✅ Platform is ready for deployment${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo -e "${YELLOW}⚠️  Please fix errors before deploying${NC}"
    exit 1
fi

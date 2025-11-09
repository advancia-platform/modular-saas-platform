#!/bin/bash
# Quick validation script for dev container configuration

echo "🔍 Validating Dev Container Configuration..."
echo ""

# Check if files exist
echo "✓ Checking required files..."
FILES=("devcontainer.json" "docker-compose.yml" "Dockerfile" "setup.sh")
for file in "${FILES[@]}"; do
    if [ -f ".devcontainer/$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
    fi
done
echo ""

# Validate JSON syntax
echo "✓ Validating devcontainer.json..."
if command -v jq &> /dev/null; then
    if jq empty .devcontainer/devcontainer.json 2>/dev/null; then
        echo "  ✓ Valid JSON syntax"
    else
        echo "  ✗ Invalid JSON syntax"
    fi
else
    echo "  ⚠ jq not installed, skipping JSON validation"
fi
echo ""

# Check docker-compose syntax
echo "✓ Validating docker-compose.yml..."
if command -v docker-compose &> /dev/null; then
    if docker-compose -f .devcontainer/docker-compose.yml config > /dev/null 2>&1; then
        echo "  ✓ Valid docker-compose syntax"
    else
        echo "  ✗ Invalid docker-compose syntax"
        docker-compose -f .devcontainer/docker-compose.yml config
    fi
else
    echo "  ⚠ docker-compose not installed, skipping validation"
fi
echo ""

# Check for common issues
echo "✓ Checking for common issues..."

# Check workspace folder consistency
DEVCONTAINER_WORKSPACE=$(grep -o 'workspaceFolder.*' .devcontainer/devcontainer.json | head -1)
COMPOSE_WORKSPACE=$(grep -o '/workspaces/[^:]*' .devcontainer/docker-compose.yml | head -1)

echo "  DevContainer workspace: $DEVCONTAINER_WORKSPACE"
echo "  Compose workspace: $COMPOSE_WORKSPACE"

# Check Redis auth
if grep -q "requirepass" .devcontainer/docker-compose.yml; then
    echo "  ✓ Redis password configured"
    if grep -q "redis://:.*@redis" .devcontainer/docker-compose.yml; then
        echo "  ✓ Redis URL includes password"
    else
        echo "  ⚠ Redis URL might be missing password"
    fi
fi
echo ""

# Check project structure
echo "✓ Checking project structure..."
if [ -d "backend" ]; then
    echo "  ✓ backend/ directory exists"
    if [ -f "backend/package.json" ]; then
        echo "    ✓ backend/package.json exists"
    fi
    if [ -f "backend/prisma/schema.prisma" ]; then
        echo "    ✓ backend/prisma/schema.prisma exists"
    fi
fi

if [ -d "frontend" ]; then
    echo "  ✓ frontend/ directory exists"
    if [ -f "frontend/package.json" ]; then
        echo "    ✓ frontend/package.json exists"
    fi
fi
echo ""

echo "✅ Validation complete!"
echo ""
echo "To rebuild your dev container:"
echo "  1. In VS Code: Ctrl+Shift+P > 'Dev Containers: Rebuild Container'"
echo "  2. Or run: docker-compose -f .devcontainer/docker-compose.yml up --build"

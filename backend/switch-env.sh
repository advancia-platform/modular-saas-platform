#!/bin/bash

# ============================================================================
# Environment Switcher Script
# ============================================================================
# Usage: ./switch-env.sh [development|production|staging]
# This script safely switches between environment configurations
# ============================================================================

set -e

ENV_TYPE=$1

if [ -z "$ENV_TYPE" ]; then
    echo "Usage: ./switch-env.sh [development|production|staging]"
    exit 1
fi

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_ENV="$BACKEND_DIR/.env.$ENV_TYPE"
CURRENT_ENV="$BACKEND_DIR/.env"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ ! -f "$TARGET_ENV" ]; then
    echo -e "${RED}Error: Environment file not found: $TARGET_ENV${NC}"
    exit 1
fi

# Backup current .env if it exists
if [ -f "$CURRENT_ENV" ]; then
    BACKUP_FILE="$CURRENT_ENV.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$CURRENT_ENV" "$BACKUP_FILE"
    echo -e "${YELLOW}Backed up current .env to: $BACKUP_FILE${NC}"
fi

# Copy new environment file
cp "$TARGET_ENV" "$CURRENT_ENV"

echo -e "${GREEN}✓ Switched to $ENV_TYPE environment${NC}"
echo -e "${GREEN}✓ Active config: .env.$ENV_TYPE${NC}"

# Display current NODE_ENV
NODE_ENV=$(grep "^NODE_ENV=" "$CURRENT_ENV" | cut -d '=' -f2)
echo -e "${GREEN}✓ NODE_ENV set to: $NODE_ENV${NC}"

# Warning for production
if [ "$ENV_TYPE" = "production" ]; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  WARNING: PRODUCTION ENVIRONMENT ACTIVE${NC}"
    echo -e "${RED}⚠️  Ensure all credentials are properly configured${NC}"
    echo -e "${RED}⚠️  Never commit .env with real production secrets${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

# Check for fake/placeholder credentials in production
if [ "$ENV_TYPE" = "production" ]; then
    if grep -q "fake\|REPLACE_WITH\|YOUR_PRODUCTION" "$CURRENT_ENV"; then
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${RED}⚠️  CRITICAL: Placeholder/fake credentials detected!${NC}"
        echo -e "${RED}⚠️  Update .env with real production credentials before deploying${NC}"
        echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        exit 1
    fi
fi

echo ""
echo "Next steps:"
echo "  1. Verify configuration: cat .env | head -20"
echo "  2. Start backend: npm run dev"
echo "  3. Check logs for any configuration errors"

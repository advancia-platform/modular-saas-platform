#!/bin/bash
#
# Cron Job Setup for Status Page Generation
# This script sets up a cron job to run status-generator.mjs every 5 minutes
#
# Usage: sudo bash scripts/setup-cron.sh
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Advancia Status Page Cron Setup                     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Detect project root
if [ ! -f "backend/scripts/status-generator.mjs" ]; then
  echo -e "${RED}✗ Error: Must run from project root directory${NC}"
  echo "  Current: $(pwd)"
  echo "  Expected: /opt/advancia or similar"
  exit 1
fi

PROJECT_ROOT=$(pwd)
SCRIPT_PATH="$PROJECT_ROOT/backend/scripts/status-generator.mjs"

echo -e "${YELLOW}📍 Project root: $PROJECT_ROOT${NC}"
echo -e "${YELLOW}📍 Script path: $SCRIPT_PATH${NC}"
echo ""

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
  echo -e "${RED}✗ Script not found: $SCRIPT_PATH${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Script found${NC}"
echo ""

# Check for existing cron job
echo -e "${YELLOW}🔍 Checking for existing cron jobs...${NC}"
if crontab -l 2>/dev/null | grep -q "status-generator.mjs"; then
  echo -e "${YELLOW}⚠️  Existing status-generator cron job found${NC}"
  echo ""
  echo "Current cron jobs:"
  crontab -l | grep "status-generator.mjs" || true
  echo ""
  read -p "Remove existing jobs and continue? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    crontab -l | grep -v "status-generator.mjs" | crontab -
    echo -e "${GREEN}✓ Existing cron jobs removed${NC}"
  else
    echo -e "${YELLOW}⚠️  Setup cancelled${NC}"
    exit 0
  fi
fi
echo ""

# Create cron job
CRON_CMD="*/5 * * * * cd $PROJECT_ROOT/backend && /usr/bin/node scripts/status-generator.mjs >> logs/status-cron.log 2>&1"

echo -e "${YELLOW}📝 Creating cron job:${NC}"
echo "   $CRON_CMD"
echo ""

# Add to crontab
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo -e "${GREEN}✓ Cron job added${NC}"
echo ""

# Verify cron job
echo -e "${YELLOW}🔍 Verifying cron job...${NC}"
if crontab -l | grep -q "status-generator.mjs"; then
  echo -e "${GREEN}✓ Cron job verified${NC}"
  echo ""
  echo "Active cron jobs:"
  crontab -l | grep "status-generator.mjs"
else
  echo -e "${RED}✗ Cron job verification failed${NC}"
  exit 1
fi
echo ""

# Test the script
echo -e "${YELLOW}🧪 Testing status generator...${NC}"
cd "$PROJECT_ROOT/backend"
if node scripts/status-generator.mjs; then
  echo -e "${GREEN}✓ Status generator test passed${NC}"
else
  echo -e "${RED}✗ Status generator test failed${NC}"
  exit 1
fi
echo ""

# Create log file if it doesn't exist
mkdir -p "$PROJECT_ROOT/backend/logs"
touch "$PROJECT_ROOT/backend/logs/status-cron.log"
chmod 644 "$PROJECT_ROOT/backend/logs/status-cron.log"

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Cron Setup Complete!                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Status Generation:${NC}"
echo -e "   • Runs every 5 minutes"
echo -e "   • Output: backend/public/status.json"
echo -e "   • Logs: backend/logs/status-cron.log"
echo ""
echo -e "${GREEN}🔍 Monitoring:${NC}"
echo -e "   crontab -l                    # View cron jobs"
echo -e "   tail -f backend/logs/status-cron.log  # Watch logs"
echo -e "   cat backend/public/status.json | jq .  # View status"
echo ""
echo -e "${GREEN}🛠️ Management:${NC}"
echo -e "   crontab -e                    # Edit cron jobs"
echo -e "   crontab -r                    # Remove all cron jobs"
echo ""
echo -e "${YELLOW}⏳ Next status update in ~5 minutes...${NC}"
echo ""

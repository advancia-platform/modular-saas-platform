#!/bin/bash
#
# Setup Status Page Automation
# This script configures PM2 cron to auto-generate status.json every 5 minutes
#
# Usage: sudo bash scripts/setup-status-automation.sh
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Advancia Status Page Automation Setup               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}✗ Please run with sudo${NC}"
  exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo -e "${RED}✗ PM2 is not installed${NC}"
  echo "  Install with: npm install -g pm2"
  exit 1
fi

echo -e "${YELLOW}📍 Current directory: $(pwd)${NC}"
echo ""

# Verify required files exist
echo -e "${YELLOW}🔍 Checking required files...${NC}"

if [ ! -f "scripts/status-generator.mjs" ]; then
  echo -e "${RED}✗ scripts/status-generator.mjs not found${NC}"
  exit 1
fi

if [ ! -f "ecosystem-status.config.cjs" ]; then
  echo -e "${RED}✗ ecosystem-status.config.cjs not found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ All required files found${NC}"
echo ""

# Create required directories
echo -e "${YELLOW}📁 Creating directories...${NC}"
mkdir -p public
mkdir -p logs
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Check if status-updater is already running
echo -e "${YELLOW}🔍 Checking for existing PM2 process...${NC}"
if pm2 list | grep -q "status-updater"; then
  echo -e "${YELLOW}⚠️  status-updater is already running${NC}"
  echo -e "${YELLOW}   Stopping and deleting existing process...${NC}"
  pm2 stop status-updater 2>/dev/null || true
  pm2 delete status-updater 2>/dev/null || true
  echo -e "${GREEN}✓ Existing process removed${NC}"
fi
echo ""

# Test the status generator script
echo -e "${YELLOW}🧪 Testing status generator...${NC}"
if node scripts/status-generator.mjs; then
  echo -e "${GREEN}✓ Status generator test passed${NC}"
else
  echo -e "${RED}✗ Status generator test failed${NC}"
  exit 1
fi
echo ""

# Verify status.json was created
if [ ! -f "public/status.json" ]; then
  echo -e "${RED}✗ status.json was not created${NC}"
  exit 1
fi

echo -e "${GREEN}✓ status.json created successfully${NC}"
echo -e "${YELLOW}   Location: public/status.json${NC}"
echo ""

# Start PM2 cron process
echo -e "${YELLOW}🚀 Starting PM2 cron process...${NC}"
pm2 start ecosystem-status.config.cjs

# Save PM2 process list
echo -e "${YELLOW}💾 Saving PM2 configuration...${NC}"
pm2 save

# Setup PM2 startup script
echo -e "${YELLOW}🔧 Setting up PM2 startup...${NC}"
pm2 startup

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Status Page Automation Setup Complete!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Status Generation:${NC}"
echo -e "   • Runs every 5 minutes via PM2 cron"
echo -e "   • Output: public/status.json"
echo -e "   • Process: status-updater"
echo ""
echo -e "${GREEN}🔍 Monitoring Commands:${NC}"
echo -e "   pm2 list              # View all processes"
echo -e "   pm2 logs status-updater   # View logs"
echo -e "   pm2 stop status-updater   # Stop automation"
echo -e "   pm2 restart status-updater # Restart automation"
echo ""
echo -e "${GREEN}📝 Manual Generation:${NC}"
echo -e "   node scripts/status-generator.mjs"
echo ""
echo -e "${GREEN}🌐 Next Steps:${NC}"
echo -e "   1. Copy status.json to web directory:"
echo -e "      cp public/status.json /var/www/status/"
echo -e "   2. Configure Nginx to serve it:"
echo -e "      location /api/status.json {"
echo -e "        root /var/www/status;"
echo -e "        add_header Cache-Control 'no-cache';"
echo -e "      }"
echo -e "   3. Restart Nginx: sudo systemctl reload nginx"
echo ""
echo -e "${YELLOW}⏳ Status will update in ~5 minutes...${NC}"
echo ""

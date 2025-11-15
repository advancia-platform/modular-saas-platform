#!/bin/bash
#
# Complete Deployment Script for Status Page
# Sets up Nginx, PM2, cron, and deploys frontend
#
# Usage: sudo bash deploy-status-page.sh
#

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Advancia Status Page - Full Deployment              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}✗ Please run with sudo${NC}"
  exit 1
fi

# Verify we're in the right directory
if [ ! -f "backend/scripts/status-generator.mjs" ]; then
  echo -e "${RED}✗ Error: Must run from project root${NC}"
  exit 1
fi

PROJECT_ROOT=$(pwd)

echo -e "${YELLOW}📍 Project root: $PROJECT_ROOT${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${BLUE}═══ Step 1: Install Dependencies ═══${NC}"
echo ""

if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Installing Node.js...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}Installing PM2...${NC}"
  npm install -g pm2
fi

if ! command -v nginx &> /dev/null; then
  echo -e "${YELLOW}Installing Nginx...${NC}"
  apt-get update
  apt-get install -y nginx
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Setup PM2 for backend
echo -e "${BLUE}═══ Step 2: Setup PM2 ═══${NC}"
echo ""

cd "$PROJECT_ROOT/backend"

# Stop existing processes
pm2 delete advancia-backend 2>/dev/null || true
pm2 delete backend-watchdog 2>/dev/null || true
pm2 delete status-updater 2>/dev/null || true

# Start backend
if [ -f "src/index.js" ]; then
  pm2 start src/index.js --name advancia-backend
  echo -e "${GREEN}✓ Backend started${NC}"
fi

# Start watchdog if exists
if [ -f "scripts/watchdog.js" ]; then
  pm2 start scripts/watchdog.js --name backend-watchdog
  echo -e "${GREEN}✓ Watchdog started${NC}"
fi

# Start status updater (PM2 cron)
if [ -f "ecosystem-status.config.cjs" ]; then
  pm2 start ecosystem-status.config.cjs
  echo -e "${GREEN}✓ Status updater started (PM2 cron)${NC}"
else
  echo -e "${YELLOW}⚠️  ecosystem-status.config.cjs not found, using system cron${NC}"
fi

# Save PM2 process list
pm2 save

# Setup PM2 startup
pm2 startup | tail -1 | bash

echo -e "${GREEN}✓ PM2 configured${NC}"
echo ""

# Step 3: Build frontend
echo -e "${BLUE}═══ Step 3: Build Frontend ═══${NC}"
echo ""

cd "$PROJECT_ROOT/frontend"

# Install dependencies
npm ci

# Build production bundle
npm run build

echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 4: Deploy frontend to Nginx
echo -e "${BLUE}═══ Step 4: Deploy Frontend ═══${NC}"
echo ""

# Create web directory
mkdir -p /var/www/advancia-status

# Copy build files
if [ -d ".next" ]; then
  # Next.js build
  cp -r .next/standalone/* /var/www/advancia-status/
  cp -r .next/static /var/www/advancia-status/.next/
  cp -r public /var/www/advancia-status/
elif [ -d "build" ]; then
  # Create React App build
  cp -r build/* /var/www/advancia-status/
else
  echo -e "${RED}✗ No build directory found${NC}"
  exit 1
fi

# Set permissions
chown -R www-data:www-data /var/www/advancia-status
chmod -R 755 /var/www/advancia-status

echo -e "${GREEN}✓ Frontend deployed to /var/www/advancia-status${NC}"
echo ""

# Step 5: Configure Nginx
echo -e "${BLUE}═══ Step 5: Configure Nginx ═══${NC}"
echo ""

# Copy Nginx config
if [ -f "$PROJECT_ROOT/backend/config/nginx-status-page.conf" ]; then
  cp "$PROJECT_ROOT/backend/config/nginx-status-page.conf" /etc/nginx/sites-available/advancia-status
  
  # Enable site
  ln -sf /etc/nginx/sites-available/advancia-status /etc/nginx/sites-enabled/
  
  # Test configuration
  if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration valid${NC}"
  else
    echo -e "${RED}✗ Nginx configuration invalid${NC}"
    exit 1
  fi
  
  # Reload Nginx
  systemctl reload nginx
  echo -e "${GREEN}✓ Nginx reloaded${NC}"
else
  echo -e "${YELLOW}⚠️  Nginx config not found, skipping${NC}"
fi
echo ""

# Step 6: Setup Cron (if not using PM2 cron)
echo -e "${BLUE}═══ Step 6: Setup Cron (Optional) ═══${NC}"
echo ""

if [ ! -f "$PROJECT_ROOT/backend/ecosystem-status.config.cjs" ]; then
  bash "$PROJECT_ROOT/backend/scripts/setup-cron.sh"
else
  echo -e "${YELLOW}⚠️  Using PM2 cron, skipping system cron setup${NC}"
fi
echo ""

# Step 7: Generate initial status
echo -e "${BLUE}═══ Step 7: Generate Initial Status ═══${NC}"
echo ""

cd "$PROJECT_ROOT/backend"
node scripts/status-generator.mjs

if [ -f "public/status.json" ]; then
  echo -e "${GREEN}✓ Initial status.json generated${NC}"
  
  # Show status
  echo ""
  echo "Current status:"
  cat public/status.json | grep -A 5 "overallStatus" || true
else
  echo -e "${RED}✗ Failed to generate status.json${NC}"
fi
echo ""

# Step 8: Setup SSL (optional)
echo -e "${BLUE}═══ Step 8: Setup SSL (Optional) ═══${NC}"
echo ""

if command -v certbot &> /dev/null; then
  read -p "Setup SSL with Let's Encrypt? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d status.advanciapayledger.com
    echo -e "${GREEN}✓ SSL configured${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  certbot not installed, skipping SSL${NC}"
  echo "  Install with: apt-get install certbot python3-certbot-nginx"
fi
echo ""

# Final summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ Deployment Complete!                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎉 Status Page Deployed Successfully!${NC}"
echo ""
echo -e "${GREEN}📊 Services Running:${NC}"
pm2 list
echo ""
echo -e "${GREEN}🌐 Access Points:${NC}"
echo -e "   Status Page: https://status.advanciapayledger.com"
echo -e "   Status JSON: https://status.advanciapayledger.com/api/status.json"
echo ""
echo -e "${GREEN}🔍 Monitoring:${NC}"
echo -e "   pm2 list                    # View processes"
echo -e "   pm2 logs status-updater     # Status generator logs"
echo -e "   pm2 logs advancia-backend   # Backend logs"
echo -e "   tail -f /var/log/nginx/advancia-status-access.log  # Nginx access"
echo -e "   tail -f /var/log/nginx/advancia-status-error.log   # Nginx errors"
echo ""
echo -e "${GREEN}🔧 Management:${NC}"
echo -e "   pm2 restart all             # Restart all processes"
echo -e "   pm2 reload advancia-backend # Reload backend"
echo -e "   systemctl reload nginx      # Reload Nginx"
echo ""
echo -e "${YELLOW}⏳ Status will update every 5 minutes via PM2 cron${NC}"
echo ""

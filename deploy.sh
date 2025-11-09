#!/bin/bash
set -e

echo "🚀 Deploying Advancia Pay Ledger to Production..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/root/projects/advancia-pay-ledger"

echo -e "${YELLOW}📦 Step 1: Building Backend...${NC}"
cd "$PROJECT_ROOT/backend"

# Install dependencies
npm install --production=false

# Run Prisma migrations
npx prisma generate
npx prisma migrate deploy

# Build TypeScript
npm run build

echo -e "${GREEN}✅ Backend built successfully${NC}"

echo -e "${YELLOW}📦 Step 2: Building Frontend...${NC}"
cd "$PROJECT_ROOT/frontend"

# Install dependencies
npm install

# Build Next.js app
npm run build

echo -e "${GREEN}✅ Frontend built successfully${NC}"

echo -e "${YELLOW}🔄 Step 3: Restarting Services with PM2...${NC}"
cd "$PROJECT_ROOT"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}PM2 not found. Installing...${NC}"
    npm install -g pm2
fi

# Stop existing processes
pm2 stop ecosystem.config.js || true

# Start/restart all services
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

echo -e "${GREEN}✅ Services restarted successfully${NC}"

echo -e "${YELLOW}📊 Step 4: Checking Service Status...${NC}"
pm2 status

echo -e "${YELLOW}🔍 Step 5: Running Health Checks...${NC}"

# Wait for services to start
sleep 5

# Check backend health
if curl -f -k https://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    pm2 logs advancia-backend --lines 20
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    pm2 logs advancia-frontend --lines 20
    exit 1
fi

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Check logs: pm2 logs"
echo "  2. Monitor: pm2 monit"
echo "  3. View status: pm2 status"
echo "  4. Test: curl https://api.advanciapayledger.com/health"

echo -e "${YELLOW}🔗 URLs:${NC}"
echo "  Frontend: https://advanciapayledger.com"
echo "  Backend API: https://api.advanciapayledger.com"
echo "  Health Check: https://api.advanciapayledger.com/health"

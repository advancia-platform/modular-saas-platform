#!/bin/bash
# Quick script to toggle maintenance mode on/off

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🛠️  Maintenance Mode Toggle${NC}"
echo ""

# Check if maintenance mode env exists
if [ ! -f backend/.env ]; then
    echo -e "${RED}❌ backend/.env not found${NC}"
    exit 1
fi

# Check current status
CURRENT=$(grep "^MAINTENANCE_MODE=" backend/.env | cut -d'=' -f2 || echo "false")

echo -e "Current status: ${YELLOW}$CURRENT${NC}"
echo ""
echo "What would you like to do?"
echo "  1) Enable maintenance mode (show maintenance page)"
echo "  2) Disable maintenance mode (normal operation)"
echo "  3) Cancel"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔧 Enabling maintenance mode...${NC}"
        
        # Update .env
        if grep -q "^MAINTENANCE_MODE=" backend/.env; then
            sed -i.bak 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE=true/' backend/.env
        else
            echo "MAINTENANCE_MODE=true" >> backend/.env
        fi
        
        # Copy to frontend if needed
        if [ -f frontend/.env ]; then
            if grep -q "^MAINTENANCE_MODE=" frontend/.env; then
                sed -i.bak 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE=true/' frontend/.env
            else
                echo "MAINTENANCE_MODE=true" >> frontend/.env
            fi
        fi
        
        echo -e "${GREEN}✅ Maintenance mode enabled${NC}"
        echo ""
        echo "📋 Next steps:"
        echo "  1. Restart services: npm run dev (or PM2)"
        echo "  2. Visit http://localhost:3000 - you'll see maintenance page"
        echo "  3. Users will see: 'We'll Be Right Back! 🚀'"
        echo ""
        echo "For production (Render):"
        echo "  Set MAINTENANCE_MODE=true in Render dashboard → Manual Deploy"
        ;;
        
    2)
        echo -e "${YELLOW}🔓 Disabling maintenance mode...${NC}"
        
        # Update .env
        if grep -q "^MAINTENANCE_MODE=" backend/.env; then
            sed -i.bak 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE=false/' backend/.env
        else
            echo "MAINTENANCE_MODE=false" >> backend/.env
        fi
        
        # Copy to frontend if needed
        if [ -f frontend/.env ]; then
            if grep -q "^MAINTENANCE_MODE=" frontend/.env; then
                sed -i.bak 's/^MAINTENANCE_MODE=.*/MAINTENANCE_MODE=false/' frontend/.env
            else
                echo "MAINTENANCE_MODE=false" >> frontend/.env
            fi
        fi
        
        echo -e "${GREEN}✅ Maintenance mode disabled${NC}"
        echo ""
        echo "📋 Next steps:"
        echo "  1. Restart services: npm run dev (or PM2)"
        echo "  2. Site will return to normal operation"
        echo ""
        echo "For production (Render):"
        echo "  Set MAINTENANCE_MODE=false in Render dashboard → Manual Deploy"
        ;;
        
    3)
        echo -e "${YELLOW}❌ Cancelled${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

# Clean up backup files
rm -f backend/.env.bak frontend/.env.bak 2>/dev/null || true

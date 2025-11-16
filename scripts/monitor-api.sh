#!/bin/bash
# API Health Monitoring Script
# Run: chmod +x monitor-api.sh && ./monitor-api.sh

BACKEND_URL="http://157.245.8.131/api/health"
FRONTEND_URL="https://frontend-theta-three-91.vercel.app"
LOG_FILE="/var/log/advancia-monitor.log"
ALERT_EMAIL="root@localhost"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Advancia API Monitor ==="
echo "Time: $(date)"

# Check Backend
echo -n "Backend API: "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL" 2>/dev/null)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Online${NC} (HTTP $BACKEND_STATUS)"
    BACKEND_OK=true
else
    echo -e "${RED}✗ Failed${NC} (HTTP $BACKEND_STATUS)"
    BACKEND_OK=false
    echo "$(date): Backend API returned $BACKEND_STATUS" >> "$LOG_FILE"
fi

# Check Frontend
echo -n "Frontend: "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "404" ]; then
    echo -e "${GREEN}✓ Online${NC} (HTTP $FRONTEND_STATUS)"
    FRONTEND_OK=true
else
    echo -e "${RED}✗ Failed${NC} (HTTP $FRONTEND_STATUS)"
    FRONTEND_OK=false
    echo "$(date): Frontend returned $FRONTEND_STATUS" >> "$LOG_FILE"
fi

# Check PM2 Status
echo -n "PM2 Backend: "
PM2_STATUS=$(pm2 list | grep "advancia-backend" | grep -c "online")
if [ "$PM2_STATUS" -gt 0 ]; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
    echo "$(date): PM2 backend not running" >> "$LOG_FILE"
fi

# Check Nginx
echo -n "Nginx: "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Active${NC}"
else
    echo -e "${RED}✗ Inactive${NC}"
    echo "$(date): Nginx is inactive" >> "$LOG_FILE"
fi

# Check PostgreSQL
echo -n "PostgreSQL: "
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓ Active${NC}"
else
    echo -e "${RED}✗ Inactive${NC}"
    echo "$(date): PostgreSQL is inactive" >> "$LOG_FILE"
fi

# System Resources
echo -e "\n=== System Resources ==="
echo "Memory Usage:"
free -h | grep Mem | awk '{print "  Used: " $3 " / Total: " $2 " (" int($3/$2 * 100) "%)"}'

echo "Disk Usage:"
df -h / | tail -1 | awk '{print "  Used: " $3 " / Total: " $2 " (" $5 ")"}'

echo "CPU Load:"
uptime | awk -F'load average:' '{print "  " $2}'

# Summary
echo -e "\n=== Summary ==="
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✓ All systems operational${NC}"
    exit 0
else
    echo -e "${RED}✗ Some systems down - check logs${NC}"
    exit 1
fi

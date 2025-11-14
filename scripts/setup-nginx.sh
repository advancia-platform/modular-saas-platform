#!/bin/bash
# 🚀 Nginx Setup Script for Advancia Pay Ledger
# Run this script on your DigitalOcean Droplet to configure Nginx

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Advancia Pay Ledger - Nginx Setup   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run with sudo: sudo bash setup-nginx.sh${NC}"
    exit 1
fi

# Step 1: Install Nginx (if not already installed)
echo -e "${GREEN}[1/6] Checking Nginx installation...${NC}"
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    apt update
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "✓ Nginx already installed"
fi

# Step 2: Copy configuration file
echo -e "${GREEN}[2/6] Copying Nginx configuration...${NC}"
if [ ! -f "/app/-modular-saas-platform/nginx/advancia.conf" ]; then
    echo -e "${RED}Error: nginx/advancia.conf not found in repository${NC}"
    echo "Please ensure you've cloned the repository to /app/-modular-saas-platform/"
    exit 1
fi

cp /app/-modular-saas-platform/nginx/advancia.conf /etc/nginx/sites-available/advancia
echo "✓ Configuration copied to /etc/nginx/sites-available/advancia"

# Step 3: Prompt for domain name
echo -e "${GREEN}[3/6] Configuring domain name...${NC}"
read -p "Enter your domain name (e.g., advanciapayledger.com): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}Domain name cannot be empty${NC}"
    exit 1
fi

# Replace yourdomain.com with actual domain in config
sed -i "s/yourdomain.com/$DOMAIN_NAME/g" /etc/nginx/sites-available/advancia
echo "✓ Domain configured as: $DOMAIN_NAME"

# Step 4: Enable site
echo -e "${GREEN}[4/6] Enabling site...${NC}"
ln -sf /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
echo "✓ Site enabled"

# Step 5: Test configuration
echo -e "${GREEN}[5/6] Testing Nginx configuration...${NC}"
if nginx -t; then
    echo "✓ Nginx configuration is valid"
else
    echo -e "${RED}✗ Nginx configuration has errors. Please check the output above.${NC}"
    exit 1
fi

# Step 6: Reload Nginx
echo -e "${GREEN}[6/6] Reloading Nginx...${NC}"
systemctl reload nginx
echo "✓ Nginx reloaded successfully"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Nginx Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Ensure DNS points to this server's IP:"
echo "   - A record: $DOMAIN_NAME → $(curl -s ifconfig.me)"
echo "   - A record: www.$DOMAIN_NAME → $(curl -s ifconfig.me)"
echo ""
echo "2. Install SSL certificate with Certbot:"
echo "   sudo apt install -y certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME"
echo ""
echo "3. Start your applications:"
echo "   cd /app/-modular-saas-platform"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "4. Verify deployment:"
echo "   curl http://localhost:3000  # Frontend"
echo "   curl http://localhost:4000/api/health  # Backend"
echo "   curl https://$DOMAIN_NAME  # After SSL setup"
echo ""

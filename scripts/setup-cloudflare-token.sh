#!/bin/bash
# Interactive Cloudflare API Token Setup
# This script helps you configure your Cloudflare API token

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Known values
ZONE_ID="0bff66558872c58ed5b8b7942acc34d9"
ACCOUNT_ID="74ecde4d46d4b399c7295cf599d2886b"
DOMAIN="advanciapayledger.com"

clear
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Cloudflare API Token Setup Assistant                ║${NC}"
echo -e "${BLUE}║         advanciapayledger.com                                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}This script will help you:${NC}"
echo "  1. Retrieve or create a Cloudflare API token"
echo "  2. Configure it in your environment"
echo "  3. Verify it works"
echo ""

# Check if token already exists
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${GREEN}✅ CLOUDFLARE_API_TOKEN is already set in environment${NC}"
    echo -e "${YELLOW}Token length: ${#CLOUDFLARE_API_TOKEN} characters${NC}"
    echo ""
    read -p "Do you want to test this token? (y/n): " test_existing
    
    if [ "$test_existing" = "y" ]; then
        echo -e "\n${YELLOW}Testing existing token...${NC}"
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            "https://api.cloudflare.com/client/v4/user/tokens/verify")
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
        
        if [ "$http_code" = "200" ]; then
            echo -e "${GREEN}✅ Token is valid!${NC}"
            status=$(echo "$body" | jq -r '.result.status' 2>/dev/null || echo "active")
            echo -e "${GREEN}   Status: $status${NC}"
            exit 0
        else
            echo -e "${RED}❌ Token is invalid or expired${NC}"
            echo -e "${YELLOW}   HTTP Status: $http_code${NC}"
            echo -e "${YELLOW}   You'll need to create a new one${NC}"
        fi
    fi
fi

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   Option 1: Enter Existing Token${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"

echo "If you already have a Cloudflare API token, enter it here."
echo "Otherwise, press Enter to see instructions for creating one."
echo ""
read -p "Enter your Cloudflare API token (or press Enter to skip): " user_token

if [ -n "$user_token" ]; then
    # Test the provided token
    echo -e "\n${YELLOW}Testing provided token...${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $user_token" \
        "https://api.cloudflare.com/client/v4/user/tokens/verify")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Token is valid!${NC}"
        
        # Save to .env file
        env_file="/root/projects/advancia-pay-ledger/.env"
        
        if [ -f "$env_file" ]; then
            # Remove old token if exists
            grep -v "^CLOUDFLARE_API_TOKEN=" "$env_file" > "${env_file}.tmp" || true
            mv "${env_file}.tmp" "$env_file"
        fi
        
        # Add new token
        echo "" >> "$env_file"
        echo "# Cloudflare Configuration (added $(date))" >> "$env_file"
        echo "CLOUDFLARE_API_TOKEN=$user_token" >> "$env_file"
        echo "CLOUDFLARE_ZONE_ID=$ZONE_ID" >> "$env_file"
        echo "CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID" >> "$env_file"
        
        echo -e "${GREEN}✅ Token saved to .env file${NC}"
        
        # Export for current session
        export CLOUDFLARE_API_TOKEN="$user_token"
        export CLOUDFLARE_ZONE_ID="$ZONE_ID"
        export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"
        
        echo -e "${GREEN}✅ Token exported to current session${NC}"
        echo ""
        echo -e "${YELLOW}To use in future sessions, run:${NC}"
        echo -e "${CYAN}export CLOUDFLARE_API_TOKEN='$user_token'${NC}"
        echo ""
        
        # Run verification script
        echo -e "${YELLOW}Running full verification...${NC}"
        bash /root/projects/advancia-pay-ledger/scripts/verify-cloudflare.sh
        exit 0
    else
        echo -e "${RED}❌ Token is invalid${NC}"
        echo -e "${YELLOW}   HTTP Status: $http_code${NC}"
        echo "$body" | jq -r '.errors[]? | "   Error: \(.message)"' 2>/dev/null || echo "   Invalid token format"
        echo ""
        echo -e "${YELLOW}Please create a new token using the instructions below.${NC}"
    fi
fi

# Show creation instructions
echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}   Option 2: Create New Cloudflare API Token${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Step 1: Open Cloudflare Dashboard${NC}"
echo "   → https://dash.cloudflare.com/profile/api-tokens"
echo ""

echo -e "${YELLOW}Step 2: Create API Token${NC}"
echo "   1. Click 'Create Token'"
echo "   2. Use template: 'Edit zone DNS' or 'Custom token'"
echo ""

echo -e "${YELLOW}Step 3: Configure Permissions${NC}"
echo "   Zone | DNS | Edit"
echo "   Zone | Zone Settings | Read"
echo "   Zone | Zone | Read"
echo ""

echo -e "${YELLOW}Step 4: Set Zone Resources${NC}"
echo "   Include | Specific zone | advanciapayledger.com"
echo "   Zone ID: $ZONE_ID"
echo ""

echo -e "${YELLOW}Step 5: Create and Copy Token${NC}"
echo "   1. Click 'Continue to summary'"
echo "   2. Click 'Create Token'"
echo "   3. Copy the token (you won't see it again!)"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""

read -p "Press Enter after creating your token..." 

echo ""
echo -e "${CYAN}Now enter your new token:${NC}"
read -p "Cloudflare API Token: " new_token

if [ -n "$new_token" ]; then
    # Test the new token
    echo -e "\n${YELLOW}Testing new token...${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $new_token" \
        "https://api.cloudflare.com/client/v4/user/tokens/verify")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ New token is valid!${NC}"
        
        # Save to .env file
        env_file="/root/projects/advancia-pay-ledger/.env"
        
        if [ -f "$env_file" ]; then
            grep -v "^CLOUDFLARE_API_TOKEN=" "$env_file" > "${env_file}.tmp" || true
            grep -v "^CLOUDFLARE_ZONE_ID=" "${env_file}.tmp" > "${env_file}.tmp2" || true
            grep -v "^CLOUDFLARE_ACCOUNT_ID=" "${env_file}.tmp2" > "${env_file}.tmp3" || true
            mv "${env_file}.tmp3" "$env_file"
            rm -f "${env_file}.tmp" "${env_file}.tmp2"
        fi
        
        # Add configuration
        echo "" >> "$env_file"
        echo "# Cloudflare Configuration (added $(date))" >> "$env_file"
        echo "CLOUDFLARE_API_TOKEN=$new_token" >> "$env_file"
        echo "CLOUDFLARE_ZONE_ID=$ZONE_ID" >> "$env_file"
        echo "CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID" >> "$env_file"
        
        echo -e "${GREEN}✅ Configuration saved to .env file${NC}"
        
        # Export for current session
        export CLOUDFLARE_API_TOKEN="$new_token"
        export CLOUDFLARE_ZONE_ID="$ZONE_ID"
        export CLOUDFLARE_ACCOUNT_ID="$ACCOUNT_ID"
        
        echo -e "${GREEN}✅ Exported to current session${NC}"
        echo ""
        
        # Run verification
        echo -e "${YELLOW}Running full verification...${NC}"
        echo ""
        bash /root/projects/advancia-pay-ledger/scripts/verify-cloudflare.sh
        
    else
        echo -e "${RED}❌ Token is invalid${NC}"
        echo -e "${YELLOW}   HTTP Status: $http_code${NC}"
        echo "$body" | jq -r '.errors[]? | "   Error: \(.message)"' 2>/dev/null
        echo ""
        echo -e "${RED}Please try again or check the token format.${NC}"
        exit 1
    fi
else
    echo -e "${RED}No token provided. Exiting.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next time, just run:${NC}"
echo -e "${CYAN}bash scripts/verify-cloudflare.sh${NC}"
echo ""

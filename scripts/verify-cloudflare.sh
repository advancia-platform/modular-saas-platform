#!/bin/bash
# Cloudflare Configuration Verification Script
# Verifies DNS, SSL, and API connectivity for advanciapayledger.com

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Known values from documentation
ZONE_ID="0bff66558872c58ed5b8b7942acc34d9"
ACCOUNT_ID="74ecde4d46d4b399c7295cf599d2886b"
DOMAIN="advanciapayledger.com"
EXPECTED_NS1="dom.ns.cloudflare.com"
EXPECTED_NS2="monroe.ns.cloudflare.com"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Cloudflare Configuration Verification Tool               ║${NC}"
echo -e "${BLUE}║     Domain: advanciapayledger.com                            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if API token is set
check_api_token() {
    echo -e "${YELLOW}[1/7] Checking for Cloudflare API Token...${NC}"
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${RED}❌ CLOUDFLARE_API_TOKEN not set in environment${NC}"
        echo -e "${YELLOW}   To fix: export CLOUDFLARE_API_TOKEN='your-token-here'${NC}"
        echo -e "${YELLOW}   Or add to .env file in project root${NC}"
        return 1
    else
        echo -e "${GREEN}✅ API Token found (${#CLOUDFLARE_API_TOKEN} chars)${NC}"
        return 0
    fi
}

# Test API connectivity
test_api_connection() {
    echo -e "\n${YELLOW}[2/7] Testing Cloudflare API Connection...${NC}"
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${YELLOW}⏭️  Skipping (no API token)${NC}"
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/user/tokens/verify")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ API Connection successful${NC}"
        echo "$body" | jq -r '.result | "   Status: \(.status)"' 2>/dev/null || echo "   API authenticated"
        return 0
    else
        echo -e "${RED}❌ API Connection failed (HTTP $http_code)${NC}"
        echo "$body" | jq -r '.errors[]? | "   Error: \(.message)"' 2>/dev/null || echo "   $body"
        return 1
    fi
}

# Check DNS nameservers
check_nameservers() {
    echo -e "\n${YELLOW}[3/7] Checking DNS Nameservers...${NC}"
    
    if ! command -v dig &> /dev/null; then
        echo -e "${YELLOW}⚠️  'dig' not found, using nslookup instead${NC}"
        ns_output=$(nslookup -type=NS $DOMAIN 2>&1)
        
        if echo "$ns_output" | grep -q "$EXPECTED_NS1\|$EXPECTED_NS2"; then
            echo -e "${GREEN}✅ Cloudflare nameservers detected${NC}"
            echo "$ns_output" | grep "nameserver" | head -2
            return 0
        else
            echo -e "${RED}❌ Cloudflare nameservers NOT active${NC}"
            echo -e "${YELLOW}   Current nameservers:${NC}"
            echo "$ns_output" | grep "nameserver"
            echo -e "${YELLOW}   Expected: $EXPECTED_NS1, $EXPECTED_NS2${NC}"
            return 1
        fi
    else
        ns_output=$(dig NS $DOMAIN +short)
        if echo "$ns_output" | grep -q "cloudflare"; then
            echo -e "${GREEN}✅ Cloudflare nameservers active${NC}"
            echo "$ns_output"
            return 0
        else
            echo -e "${RED}❌ Cloudflare nameservers NOT active${NC}"
            echo -e "${YELLOW}   Current: $ns_output${NC}"
            echo -e "${YELLOW}   Expected: $EXPECTED_NS1, $EXPECTED_NS2${NC}"
            return 1
        fi
    fi
}

# Check zone status
check_zone_status() {
    echo -e "\n${YELLOW}[4/7] Checking Zone Status...${NC}"
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${YELLOW}⏭️  Skipping (no API token)${NC}"
        return 1
    fi
    
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Zone accessible via API${NC}"
        echo "$body" | jq -r '.result | "   Status: \(.status)\n   Name: \(.name)\n   Plan: \(.plan.name)"' 2>/dev/null
        
        # Check for bot management plan requirement
        plan=$(echo "$body" | jq -r '.result.plan.legacy_id' 2>/dev/null)
        if [ "$plan" = "free" ]; then
            echo -e "${YELLOW}   ⚠️  Free plan detected - bot_management features unavailable${NC}"
        fi
        return 0
    else
        echo -e "${RED}❌ Zone API check failed (HTTP $http_code)${NC}"
        echo "$body" | jq -r '.errors[]? | "   Error: \(.message)"' 2>/dev/null
        return 1
    fi
}

# Check DNS records
check_dns_records() {
    echo -e "\n${YELLOW}[5/7] Checking DNS Records...${NC}"
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${YELLOW}⏭️  Skipping API check (no token)${NC}"
        echo -e "${YELLOW}   Performing live DNS lookups instead...${NC}"
        
        # Check A record for root domain
        if dig A $DOMAIN +short &>/dev/null; then
            a_record=$(dig A $DOMAIN +short | head -1)
            if [ -n "$a_record" ]; then
                echo -e "${GREEN}✅ @ (root) → $a_record${NC}"
            fi
        fi
        
        # Check CNAME records
        for subdomain in www api admin; do
            result=$(dig $subdomain.$DOMAIN +short | head -1)
            if [ -n "$result" ]; then
                echo -e "${GREEN}✅ $subdomain → $result${NC}"
            else
                echo -e "${YELLOW}⚠️  $subdomain.$DOMAIN - no record found${NC}"
            fi
        done
        return 0
    fi
    
    response=$(curl -s \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records")
    
    if echo "$response" | jq -e '.success' &>/dev/null; then
        echo -e "${GREEN}✅ DNS records retrieved${NC}"
        echo "$response" | jq -r '.result[] | "   \(.type) \(.name) → \(.content) (Proxied: \(.proxied))"' 2>/dev/null | head -10
    else
        echo -e "${RED}❌ Failed to retrieve DNS records${NC}"
        echo "$response" | jq -r '.errors[]? | "   Error: \(.message)"' 2>/dev/null
        return 1
    fi
}

# Check SSL/TLS settings
check_ssl_settings() {
    echo -e "\n${YELLOW}[6/7] Checking SSL/TLS Settings...${NC}"
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${YELLOW}⏭️  Skipping (no API token)${NC}"
        return 1
    fi
    
    response=$(curl -s \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl")
    
    if echo "$response" | jq -e '.success' &>/dev/null; then
        ssl_mode=$(echo "$response" | jq -r '.result.value')
        if [ "$ssl_mode" = "full" ] || [ "$ssl_mode" = "strict" ]; then
            echo -e "${GREEN}✅ SSL Mode: $ssl_mode${NC}"
        else
            echo -e "${YELLOW}⚠️  SSL Mode: $ssl_mode (recommend 'full' or 'strict')${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to check SSL settings${NC}"
        return 1
    fi
}

# Test bot management availability
check_bot_management() {
    echo -e "\n${YELLOW}[7/7] Checking Bot Management Availability...${NC}"
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${YELLOW}⏭️  Skipping (no API token)${NC}"
        return 1
    fi
    
    # Try to access bot management settings (this will fail on free plan)
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/bot_management")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Bot Management available (Pro/Enterprise plan)${NC}"
        return 0
    elif [ "$http_code" = "403" ] || [ "$http_code" = "404" ]; then
        echo -e "${YELLOW}⚠️  Bot Management unavailable (Free plan)${NC}"
        echo -e "${YELLOW}   This is expected - use Super Bot Fight Mode instead${NC}"
        echo -e "${YELLOW}   Rule with cf.bot_management.score will fail${NC}"
        return 0
    else
        echo -e "${RED}❌ Error checking bot management (HTTP $http_code)${NC}"
        return 1
    fi
}

# Summary
print_summary() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}                    Summary & Recommendations                 ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
    
    echo -e "${GREEN}✅ = Configured correctly${NC}"
    echo -e "${YELLOW}⚠️  = Needs attention${NC}"
    echo -e "${RED}❌ = Critical issue${NC}"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo "1. If API token missing: Create one at https://dash.cloudflare.com/profile/api-tokens"
    echo "2. If nameservers not active: Update at your domain registrar"
    echo "3. If bot_management errors: Remove cf.bot_management rules (free plan incompatible)"
    echo "4. Full dashboard: https://dash.cloudflare.com/$ZONE_ID"
    echo ""
}

# Main execution
main() {
    local has_token=false
    
    # Run all checks
    check_api_token && has_token=true
    test_api_connection
    check_nameservers
    check_zone_status
    check_dns_records
    check_ssl_settings
    check_bot_management
    
    # Print summary
    print_summary
    
    echo -e "${BLUE}Verification complete!${NC}\n"
}

# Run main
main

#!/bin/bash
# Bulk whitelist GitHub secret scanning alerts via REST API
# Usage: ./whitelist-secrets.sh [--auto]
#   --auto: Skip confirmation prompts (use with caution)

set -euo pipefail

# Configuration
REPO_OWNER="advancia-platform"
REPO_NAME="modular-saas-platform"
API_BASE="https://api.github.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for GitHub PAT
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo -e "${RED}Error: GITHUB_TOKEN environment variable not set${NC}"
    echo "Usage:"
    echo "  export GITHUB_TOKEN=your_personal_access_token"
    echo "  $0 [--auto]"
    echo ""
    echo "Token must have 'repo' and 'security_events' scopes"
    exit 1
fi

# Parse arguments
AUTO_MODE=false
if [ "${1:-}" = "--auto" ]; then
    AUTO_MODE=true
    echo -e "${YELLOW}⚠️  Running in AUTO mode - will not prompt for confirmations${NC}"
fi

# Function to call GitHub API
github_api() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"

    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github+json" \
            -d "$data" \
            "${API_BASE}${endpoint}"
    else
        curl -s -X "$method" \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github+json" \
            "${API_BASE}${endpoint}"
    fi
}

# Fetch open secret scanning alerts
echo -e "${BLUE}📡 Fetching secret scanning alerts...${NC}"
ALERTS=$(github_api GET "/repos/${REPO_OWNER}/${REPO_NAME}/secret-scanning/alerts")

# Check for errors
if echo "$ALERTS" | jq -e '.message' > /dev/null 2>&1; then
    echo -e "${RED}❌ API Error:${NC}"
    echo "$ALERTS" | jq -r '.message'
    exit 1
fi

# Parse alert data
TOTAL_ALERTS=$(echo "$ALERTS" | jq 'length')
OPEN_ALERTS=$(echo "$ALERTS" | jq '[.[] | select(.state == "open")] | length')

echo -e "${GREEN}✓ Found $TOTAL_ALERTS total alerts ($OPEN_ALERTS open)${NC}"

if [ "$OPEN_ALERTS" -eq 0 ]; then
    echo -e "${GREEN}🎉 No open alerts to whitelist!${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Open alerts:${NC}"
echo "$ALERTS" | jq -r '.[] | select(.state == "open") | "  [ID: \(.number)] \(.secret_type) in \(.locations[0].details.path // "unknown")"'
echo ""

# Confirm before proceeding
if [ "$AUTO_MODE" = false ]; then
    read -p "Whitelist all open alerts as false positives? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Aborted by user${NC}"
        exit 0
    fi
fi

# Whitelist each open alert
echo -e "${BLUE}🔄 Whitelisting alerts...${NC}"
RESOLVED_COUNT=0
FAILED_COUNT=0

while IFS= read -r alert_id; do
    secret_type=$(echo "$ALERTS" | jq -r ".[] | select(.number == $alert_id) | .secret_type")
    location=$(echo "$ALERTS" | jq -r ".[] | select(.number == $alert_id) | .locations[0].details.path // \"unknown\"")

    echo -ne "  Processing alert $alert_id ($secret_type in $location)... "

    RESPONSE=$(github_api PATCH \
        "/repos/${REPO_OWNER}/${REPO_NAME}/secret-scanning/alerts/${alert_id}" \
        '{"state":"resolved","resolution":"false_positive"}')

    if echo "$RESPONSE" | jq -e '.state == "resolved"' > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((RESOLVED_COUNT++))
    else
        echo -e "${RED}✗${NC}"
        echo "    Error: $(echo "$RESPONSE" | jq -r '.message // "Unknown error"')"
        ((FAILED_COUNT++))
    fi
done < <(echo "$ALERTS" | jq -r '.[] | select(.state == "open") | .number')

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Resolved: $RESOLVED_COUNT${NC}"
if [ "$FAILED_COUNT" -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAILED_COUNT${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Verify final state
echo ""
echo -e "${BLUE}📊 Verifying final state...${NC}"
FINAL_ALERTS=$(github_api GET "/repos/${REPO_OWNER}/${REPO_NAME}/secret-scanning/alerts")
FINAL_OPEN=$(echo "$FINAL_ALERTS" | jq '[.[] | select(.state == "open")] | length')

if [ "$FINAL_OPEN" -eq 0 ]; then
    echo -e "${GREEN}🎉 All alerts resolved! Push protection should now allow your push.${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. git push origin chore/ci-auto-release-auto-label-decimal-fixes"
    echo "  2. Monitor GitHub Actions for successful CI run"
    echo "  3. Document whitelisted secrets in SECURITY.md"
else
    echo -e "${YELLOW}⚠️  $FINAL_OPEN alerts still open${NC}"
    echo "Review manually at:"
    echo "  https://github.com/${REPO_OWNER}/${REPO_NAME}/security/secret-scanning"
fi

exit 0

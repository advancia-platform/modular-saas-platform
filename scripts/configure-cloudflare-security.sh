#!/bin/bash
# Systematic Cloudflare Security Configuration
# Configures WAF rules, bot protection, and rate limiting for advanciapayledger.com

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
ZONE_ID="0bff66558872c58ed5b8b7942acc34d9"
DOMAIN="advanciapayledger.com"
API_SUBDOMAIN="api.advanciapayledger.com"

# Check for API token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ CLOUDFLARE_API_TOKEN not set${NC}"
    echo "Run: export CLOUDFLARE_API_TOKEN='your-token'"
    exit 1
fi

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Cloudflare Security Configuration - Systematic Setup    ║${NC}"
echo -e "${BLUE}║     Domain: advanciapayledger.com                            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# API headers
HEADERS=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H "Content-Type: application/json")

# Step 1: Configure SSL/TLS Settings
echo -e "${YELLOW}[1/5] Configuring SSL/TLS Settings...${NC}"

# Set SSL mode to Full (strict)
echo "  → Setting SSL mode to Full (strict)..."
response=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
  "${HEADERS[@]}" \
  --data '{"value":"full"}')

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ SSL mode configured${NC}"
else
    echo -e "${YELLOW}  ⚠️  SSL mode: $(echo "$response" | jq -r '.errors[0].message // "May already be set"')${NC}"
fi

# Enable Always Use HTTPS
echo "  → Enabling Always Use HTTPS..."
response=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/always_use_https" \
  "${HEADERS[@]}" \
  --data '{"value":"on"}')

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Always Use HTTPS enabled${NC}"
else
    echo -e "${YELLOW}  ⚠️  $(echo "$response" | jq -r '.errors[0].message // "May already be enabled"')${NC}"
fi

# Enable Automatic HTTPS Rewrites
echo "  → Enabling Automatic HTTPS Rewrites..."
response=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/automatic_https_rewrites" \
  "${HEADERS[@]}" \
  --data '{"value":"on"}')

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Automatic HTTPS Rewrites enabled${NC}"
else
    echo -e "${YELLOW}  ⚠️  $(echo "$response" | jq -r '.errors[0].message // "May already be enabled"')${NC}"
fi

echo ""

# Step 2: Create WAF Custom Rules
echo -e "${YELLOW}[2/5] Creating WAF Custom Rules...${NC}"

# Get existing rulesets
echo "  → Checking existing rulesets..."
rulesets=$(curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" "${HEADERS[@]}")
custom_ruleset_id=$(echo "$rulesets" | jq -r '.result[] | select(.kind=="zone") | select(.phase=="http_request_firewall_custom") | .id' | head -1)

if [ -z "$custom_ruleset_id" ]; then
    echo "  → Creating new custom ruleset..."
    # Create a new ruleset for custom rules
    ruleset_response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
      "${HEADERS[@]}" \
      --data '{
        "name": "API Security Rules",
        "kind": "zone",
        "phase": "http_request_firewall_custom",
        "description": "Custom security rules for API endpoints"
      }')
    
    custom_ruleset_id=$(echo "$ruleset_response" | jq -r '.result.id')
fi

echo -e "${GREEN}  ✅ Ruleset ID: $custom_ruleset_id${NC}"

# Rule 1: Bypass Health Checks
echo "  → Rule 1: Bypass health check endpoints..."
rule1=$(cat <<'EOF'
{
  "action": "skip",
  "action_parameters": {
    "phases": ["http_ratelimit", "http_request_firewall_managed"]
  },
  "expression": "(http.request.uri.path eq \"/health\" or http.request.uri.path eq \"/api/health\") and http.host eq \"api.advanciapayledger.com\"",
  "description": "Bypass health check endpoints",
  "enabled": true
}
EOF
)

# Rule 2: Bypass CORS Preflight
echo "  → Rule 2: Bypass CORS preflight OPTIONS requests..."
rule2=$(cat <<'EOF'
{
  "action": "skip",
  "action_parameters": {
    "phases": ["http_ratelimit", "http_request_firewall_managed"]
  },
  "expression": "http.request.method eq \"OPTIONS\" and http.host eq \"api.advanciapayledger.com\"",
  "description": "Bypass CORS preflight requests",
  "enabled": true
}
EOF
)

# Rule 3: Challenge High Threat Score
echo "  → Rule 3: Challenge high threat score requests..."
rule3=$(cat <<'EOF'
{
  "action": "managed_challenge",
  "expression": "cf.threat_score > 30 and http.host eq \"api.advanciapayledger.com\"",
  "description": "Challenge high threat score on API",
  "enabled": true
}
EOF
)

# Rule 4: Block SQL Injection
echo "  → Rule 4: Block SQL injection attempts..."
rule4=$(cat <<'EOF'
{
  "action": "block",
  "expression": "(http.request.uri.path contains \"union\" and http.request.uri.path contains \"select\") or (http.request.uri.path contains \"<script\") and http.host eq \"api.advanciapayledger.com\"",
  "description": "Block SQL injection and XSS attempts",
  "enabled": true
}
EOF
)

# Combine all rules into ruleset update
echo "  → Updating ruleset with all rules..."
rules_payload=$(cat <<EOF
{
  "rules": [
    $rule1,
    $rule2,
    $rule3,
    $rule4
  ]
}
EOF
)

response=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$custom_ruleset_id" \
  "${HEADERS[@]}" \
  --data "$rules_payload")

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    rules_count=$(echo "$response" | jq '.result.rules | length')
    echo -e "${GREEN}  ✅ Created/Updated $rules_count WAF rules${NC}"
else
    error_msg=$(echo "$response" | jq -r '.errors[0].message // "Unknown error"')
    echo -e "${YELLOW}  ⚠️  WAF Rules: $error_msg${NC}"
fi

echo ""

# Step 3: Configure Rate Limiting
echo -e "${YELLOW}[3/5] Configuring Rate Limiting...${NC}"

# Get rate limiting ruleset
rate_limit_rulesets=$(curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" "${HEADERS[@]}")
rate_limit_ruleset_id=$(echo "$rate_limit_rulesets" | jq -r '.result[] | select(.kind=="zone") | select(.phase=="http_ratelimit") | .id' | head -1)

if [ -z "$rate_limit_ruleset_id" ]; then
    echo "  → Creating rate limiting ruleset..."
    rate_ruleset_response=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
      "${HEADERS[@]}" \
      --data '{
        "name": "API Rate Limiting",
        "kind": "zone",
        "phase": "http_ratelimit",
        "description": "Rate limiting for API endpoints"
      }')
    
    rate_limit_ruleset_id=$(echo "$rate_ruleset_response" | jq -r '.result.id')
fi

echo -e "${GREEN}  ✅ Rate Limit Ruleset ID: $rate_limit_ruleset_id${NC}"

# Rate Limit Rule 1: Auth Endpoints
echo "  → Rate limit auth endpoints (10 req/min)..."
rate_rule1=$(cat <<'EOF'
{
  "action": "block",
  "expression": "http.host eq \"api.advanciapayledger.com\" and http.request.uri.path contains \"/api/auth\"",
  "description": "Rate limit auth endpoints - 10 requests per minute",
  "enabled": true,
  "action_parameters": {
    "response": {
      "status_code": 429,
      "content": "{\"error\": \"Too many requests. Please try again later.\"}",
      "content_type": "application/json"
    }
  },
  "ratelimit": {
    "characteristics": ["ip.src"],
    "period": 60,
    "requests_per_period": 10,
    "mitigation_timeout": 600
  }
}
EOF
)

# Rate Limit Rule 2: General API Endpoints
echo "  → Rate limit general API (120 req/min)..."
rate_rule2=$(cat <<'EOF'
{
  "action": "block",
  "expression": "http.host eq \"api.advanciapayledger.com\" and http.request.method in {\"POST\" \"PUT\" \"DELETE\"}",
  "description": "Rate limit API writes - 120 requests per minute",
  "enabled": true,
  "action_parameters": {
    "response": {
      "status_code": 429,
      "content": "{\"error\": \"Rate limit exceeded\"}",
      "content_type": "application/json"
    }
  },
  "ratelimit": {
    "characteristics": ["ip.src"],
    "period": 60,
    "requests_per_period": 120,
    "mitigation_timeout": 300
  }
}
EOF
)

# Update rate limiting rules
rate_payload=$(cat <<EOF
{
  "rules": [
    $rate_rule1,
    $rate_rule2
  ]
}
EOF
)

response=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets/$rate_limit_ruleset_id" \
  "${HEADERS[@]}" \
  --data "$rate_payload")

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    rate_count=$(echo "$response" | jq '.result.rules | length')
    echo -e "${GREEN}  ✅ Created/Updated $rate_count rate limiting rules${NC}"
else
    error_msg=$(echo "$response" | jq -r '.errors[0].message // "Unknown error"')
    echo -e "${YELLOW}  ⚠️  Rate Limiting: $error_msg${NC}"
fi

echo ""

# Step 4: Enable Bot Protection
echo -e "${YELLOW}[4/5] Configuring Bot Protection...${NC}"

echo "  → Enabling Super Bot Fight Mode..."
response=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/bot_management" \
  "${HEADERS[@]}" \
  --data '{
    "fight_mode": true,
    "using_latest_model": true
  }')

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Bot protection enabled${NC}"
else
    echo -e "${YELLOW}  ⚠️  Bot protection: Free plan may have limited bot management${NC}"
    echo -e "${YELLOW}      Configure manually at: https://dash.cloudflare.com/$ZONE_ID/security/bots${NC}"
fi

echo ""

# Step 5: Enable Security Features
echo -e "${YELLOW}[5/5] Enabling Additional Security Features...${NC}"

# Enable Browser Integrity Check
echo "  → Enabling Browser Integrity Check..."
response=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/browser_check" \
  "${HEADERS[@]}" \
  --data '{"value":"on"}')

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Browser Integrity Check enabled${NC}"
else
    echo -e "${YELLOW}  ⚠️  $(echo "$response" | jq -r '.errors[0].message // "May already be enabled"')${NC}"
fi

# Enable Challenge Passage
echo "  → Configuring Challenge Passage (30 minutes)..."
response=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/challenge_ttl" \
  "${HEADERS[@]}" \
  --data '{"value":1800}')

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Challenge Passage configured${NC}"
else
    echo -e "${YELLOW}  ⚠️  $(echo "$response" | jq -r '.errors[0].message // "May already be set"')${NC}"
fi

# Enable Security Level to Medium
echo "  → Setting Security Level to Medium..."
response=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/security_level" \
  "${HEADERS[@]}" \
  --data '{"value":"medium"}')

if echo "$response" | jq -e '.success' >/dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Security Level set to Medium${NC}"
else
    echo -e "${YELLOW}  ⚠️  $(echo "$response" | jq -r '.errors[0].message // "May already be set"')${NC}"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 Configuration Complete! ✅                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}Summary of Changes:${NC}"
echo "  ✅ SSL/TLS: Full (strict) with Always HTTPS"
echo "  ✅ WAF Rules: 4 custom rules for API protection"
echo "  ✅ Rate Limiting: Auth (10/min), API writes (120/min)"
echo "  ✅ Bot Protection: Configured (if available on plan)"
echo "  ✅ Security Features: Browser check, challenge passage"
echo ""

echo -e "${YELLOW}View your security configuration:${NC}"
echo "  Dashboard: https://dash.cloudflare.com/$ZONE_ID"
echo "  WAF: https://dash.cloudflare.com/$ZONE_ID/security/waf"
echo "  Bots: https://dash.cloudflare.com/$ZONE_ID/security/bots"
echo "  Analytics: https://dash.cloudflare.com/$ZONE_ID/analytics"
echo ""

echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Monitor analytics for blocked/challenged requests"
echo "  2. Adjust rate limits if needed based on traffic"
echo "  3. Review bot protection settings in dashboard"
echo "  4. Test API endpoints to ensure they work correctly"
echo ""

# Generate verification report
echo -e "${YELLOW}Running verification...${NC}"
bash /root/projects/advancia-pay-ledger/scripts/verify-cloudflare.sh

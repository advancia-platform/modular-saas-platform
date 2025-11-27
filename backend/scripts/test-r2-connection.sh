#!/bin/bash
# Test Cloudflare R2 DNS connectivity and configuration

echo "🔍 Testing Cloudflare R2 Connection..."
echo ""

# Load environment variables
source ../.env 2>/dev/null || source .env 2>/dev/null

# Check required variables
echo "1. Checking environment variables..."
if [ -z "$CLOUDFLARE_R2_ENDPOINT" ]; then
    echo "❌ CLOUDFLARE_R2_ENDPOINT not set"
    exit 1
fi

if [ -z "$CLOUDFLARE_R2_ACCESS_KEY_ID" ]; then
    echo "❌ CLOUDFLARE_R2_ACCESS_KEY_ID not set"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Test DNS resolution
echo "2. Testing DNS resolution..."
R2_HOST=$(echo $CLOUDFLARE_R2_ENDPOINT | sed 's~https\?://~~g' | cut -d'/' -f1)
echo "   Resolving: $R2_HOST"

if nslookup $R2_HOST > /dev/null 2>&1; then
    echo "✅ DNS resolution successful"
    IP=$(nslookup $R2_HOST | grep -A1 "Name:" | tail -n1 | awk '{print $2}')
    echo "   IP Address: $IP"
else
    echo "❌ DNS resolution failed for $R2_HOST"
    exit 1
fi
echo ""

# Test HTTPS connectivity
echo "3. Testing HTTPS connectivity..."
if curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$CLOUDFLARE_R2_ENDPOINT" | grep -q "40[03]"; then
    echo "✅ HTTPS endpoint reachable (401/403 expected without auth)"
else
    echo "❌ Cannot reach HTTPS endpoint"
    exit 1
fi
echo ""

# Test bucket access via health endpoint
echo "4. Testing bucket access via API..."
cd ..
if curl -s http://localhost:4000/api/health/detailed | grep -q '"r2"'; then
    STATUS=$(curl -s http://localhost:4000/api/health/detailed | grep -o '"r2":{[^}]*}')
    echo "   R2 Status: $STATUS"

    if echo "$STATUS" | grep -q '"status":"connected"'; then
        echo "✅ R2 bucket access successful"
    else
        echo "⚠️  R2 bucket access issue - check credentials"
    fi
else
    echo "⚠️  Health endpoint not available - start backend first"
fi
echo ""

echo "✅ R2 Connection Test Complete"

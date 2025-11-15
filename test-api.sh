#!/bin/bash
# Advancia PayLedger API Testing Script
# Quick curl commands for testing authentication and lockout policy

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="http://localhost:4000"

echo -e "${BLUE}🧪 Advancia PayLedger API Tests${NC}"
echo ""

# 1. Health Check
echo -e "${YELLOW}1. Health Check${NC}"
curl -s -X GET "$BASE_URL/api/health" | jq '.'
echo ""

# 2. User Signup
echo -e "${YELLOW}2. User Signup${NC}"
curl -s -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }' | jq '.'
echo ""

# 3. User Login (Success)
echo -e "${YELLOW}3. User Login (Success)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }')
echo "$RESPONSE" | jq '.'
JWT_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
echo -e "${GREEN}JWT Token: $JWT_TOKEN${NC}"
echo ""

# 4. Failed Login Attempt
echo -e "${YELLOW}4. Failed Login Attempt (Wrong Password)${NC}"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrong_password"
  }' | jq '.'
echo ""

# 5. Multiple Failed Attempts (Trigger Lockout)
echo -e "${YELLOW}5. Testing Lockout Policy (5 Failed Attempts)${NC}"
for i in {1..5}; do
  echo -e "${BLUE}Attempt $i:${NC}"
  curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "lockout@example.com",
      "password": "wrong_password"
    }' | jq '.error, .remaining_attempts, .locked_until'
  echo ""
done

# 6. Try Login on Locked Account
echo -e "${YELLOW}6. Attempt Login on Locked Account${NC}"
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lockout@example.com",
    "password": "correct_password"
  }' | jq '.'
echo ""

# 7. Admin Login with TOTP
echo -e "${YELLOW}7. Admin Login (Password + TOTP)${NC}"
echo -e "${BLUE}Enter your TOTP token from Google Authenticator:${NC}"
read -p "TOTP Token: " TOTP_TOKEN

ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/admin-login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@advvancia.com\",
    \"password\": \"admin123\",
    \"token\": \"$TOTP_TOKEN\"
  }")
echo "$ADMIN_RESPONSE" | jq '.'
ADMIN_JWT=$(echo "$ADMIN_RESPONSE" | jq -r '.token')
echo -e "${GREEN}Admin JWT Token: $ADMIN_JWT${NC}"
echo ""

# 8. Test Protected Endpoint
echo -e "${YELLOW}8. Test Protected Endpoint${NC}"
curl -s -X GET "$BASE_URL/api/me" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'
echo ""

# 9. Test Admin Endpoint
echo -e "${YELLOW}9. Test Admin Endpoint${NC}"
curl -s -X GET "$BASE_URL/api/me" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq '.'
echo ""

echo -e "${GREEN}✅ API Tests Complete!${NC}"
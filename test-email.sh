#!/bin/bash

# Test Gmail SMTP Email Sending
# This uses your existing Gmail configuration

echo "Testing email with Gmail SMTP..."
echo ""

# Test 1: Check if email service is configured
echo "1. Checking email configuration..."
curl -X GET https://api.advanciapayledger.com/api/test/email/status \
  -H "Content-Type: application/json" \
  2>&1 | jq . || echo "Email status endpoint not found (might not be deployed yet)"

echo ""
echo "---"
echo ""

# Test 2: Try sending a test email
echo "2. Attempting to send test email..."
echo "Enter your email address to receive a test email:"
read EMAIL_ADDRESS

if [ -z "$EMAIL_ADDRESS" ]; then
  EMAIL_ADDRESS="advanciapayledger@gmail.com"
  echo "Using default: $EMAIL_ADDRESS"
fi

curl -X POST https://api.advanciapayledger.com/api/test/email/welcome \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL_ADDRESS\",\"username\":\"Test User\"}" \
  2>&1 | jq . || echo "Email test endpoint not found"

echo ""
echo "---"
echo ""
echo "If email endpoint is not found, it means Render hasn't deployed the latest code yet."
echo "Check Render dashboard: https://dashboard.render.com"
echo ""

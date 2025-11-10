#!/bin/bash

echo "🔍 Checking Backend Email Service Status..."
echo ""

# Check health
echo "1. Backend Health:"
curl -s https://api.advanciapayledger.com/api/health | grep -o '"uptime":[0-9.]*'
echo -e "\n"

# Check email endpoint
echo "2. Email Service Status:"
response=$(curl -s https://api.advanciapayledger.com/api/send-email/status)
echo "$response"
echo -e "\n"

if echo "$response" | grep -q '"success":true'; then
    echo "✅ Email service is READY!"
    echo ""
    echo "3. Sending test email..."
    curl -X POST https://api.advanciapayledger.com/api/send-email \
      -H "Content-Type: application/json" \
      -d '{
        "to": "jm5165487@gmail.com",
        "subject": "✅ Backend Email Test",
        "html": "<h1>🎉 Success!</h1><p>Backend email is working via Gmail SMTP!</p><p>Sent from Render backend at $(date)</p>"
      }'
    echo -e "\n\n✅ Check your email!"
elif echo "$response" | grep -q 'Route not found'; then
    echo "⏳ Deployment still in progress..."
    echo "   Wait 1-2 minutes and run this script again"
else
    echo "❌ Email service not ready yet"
    echo "   Response: $response"
fi

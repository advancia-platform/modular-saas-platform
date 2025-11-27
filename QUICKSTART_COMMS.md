# 🎯 Quick Start: Communication Services

Your business number **+1 (717) 469-5102** is ready for SMS, WhatsApp, and Telegram!

## ⚡ 3-Minute Setup Checklist

### 1. Twilio (SMS + WhatsApp) - 2 minutes

```bash
# 1. Login: https://console.twilio.com/
# 2. Copy from dashboard:
#    - Account SID
#    - Auth Token
# 3. Get a phone number or use existing
# 4. Add to backend/.env:

TWILIO_ACCOUNT_SID=AC1234...
TWILIO_AUTH_TOKEN=abc123...
TWILIO_PHONE_NUMBER=+15551234567
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**WhatsApp Sandbox**: Open WhatsApp → Send `join <code>` to `+1 (415) 523-8886`

### 2. Telegram (100% FREE) - 1 minute

```bash
# 1. Open Telegram → Search "@BotFather"
# 2. Send: /newbot
# 3. Name: "Advancia Pay Bot"
# 4. Username: "advancia_pay_bot"
# 5. Copy the token
# 6. Search "@userinfobot" → Get your Chat ID
# 7. Add to backend/.env:

TELEGRAM_BOT_TOKEN=1234567890:ABC...
TELEGRAM_ADMIN_CHAT_ID=123456789
```

### 3. Restart & Test

```bash
cd backend
npm run dev

# Test Telegram
curl http://localhost:4000/api/admin/telegram/me

# Test SMS (if Twilio configured)
curl -X POST http://localhost:4000/api/sms/test-send \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{"phoneNumber": "+17174695102", "message": "Test!"}'
```

## 📱 All Endpoints Ready

```text
✅ /api/sms/*               - SMS via Google Voice/Twilio
✅ /api/whatsapp/*          - WhatsApp via Twilio
✅ /api/admin/telegram/*    - Telegram Bot (FREE)
```

## 💡 Cost Summary

| Service      | Setup | Monthly | Per Message   |
| ------------ | ----- | ------- | ------------- |
| Telegram     | FREE  | FREE    | **FREE**      |
| SMS (Google) | FREE  | FREE    | FREE (manual) |
| SMS (Twilio) | FREE  | $1      | $0.0075       |
| WhatsApp     | FREE  | FREE    | $0.005        |

**Start with Telegram (free) while setting up Twilio!**

---

📖 **Full Guide**: See `COMMUNICATION_SETUP_COMPLETE.md`  
🚀 **Next**: Add credentials to `backend/.env` and test!

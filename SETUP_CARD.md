# 🎯 5-Minute Setup Card

## Your Business Number

```text
+1 (717) 469-5102
```

---

## Step 1: Twilio (2 min)

1. Login: <https://console.twilio.com/>
2. Copy: Account SID, Auth Token, Phone Number
3. Add to `backend/.env`:

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=abc...
TWILIO_PHONE_NUMBER=+1555...
```

---

## Step 2: WhatsApp (30 sec)

1. Open WhatsApp
2. Send to: **+1 (415) 523-8886**
3. Message: `join <code>` (Get code from Twilio console)

---

## Step 3: Telegram (1 min)

1. Search: **@BotFather** → `/newbot`
2. Name: `Advancia Pay Bot`
3. Search: **@userinfobot** → Get Chat ID
4. Add to `backend/.env`:

```bash
TELEGRAM_BOT_TOKEN=123:ABC...
TELEGRAM_ADMIN_CHAT_ID=123456789
```

---

## Step 4: Restart & Test (1 min)

```bash
cd backend
npm run dev

# Test
curl http://localhost:4000/api/admin/telegram/me
```

---

## Test Dashboard

```text
http://localhost:3000/test-comms
```

(Import UnifiedCommsTestDashboard component)

---

## Costs

- **Telegram**: FREE ✅
- **SMS (Google)**: FREE ✅
- **SMS (Twilio)**: $0.0075/msg
- **WhatsApp**: $0.005/msg

**Start with Telegram (free) while setting up Twilio!**

---

## Quick Links

- Twilio: <https://console.twilio.com/>
- @BotFather: <https://t.me/BotFather>
- @userinfobot: <https://t.me/userinfobot>

---

## Help

📖 Full guide: `COMMUNICATION_SETUP_COMPLETE.md`
⚡ Quick start: `QUICKSTART_COMMS.md`
📊 Summary: `INTEGRATION_SUMMARY.md`

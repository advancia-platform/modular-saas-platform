# WhatsApp Business Integration Guide

## ✅ Why WhatsApp Instead of Google Voice?

### WhatsApp Advantages

- ✅ **98% open rate** (vs 20% for SMS)
- ✅ **FREE for recipients** worldwide
- ✅ **Rich media** - Send images, buttons, documents
- ✅ **End-to-end encryption**
- ✅ **Better engagement** - Users prefer WhatsApp
- ✅ **Global reach** - 2+ billion users
- ✅ **No carrier restrictions**

### Google Voice Limitations

- ❌ US-only
- ❌ Doesn't support WhatsApp integration
- ❌ Manual messaging only
- ❌ Limited automation
- ❌ Carrier restrictions

---

## 🚀 Quick Setup (5 Minutes) - Twilio WhatsApp Sandbox

### Step 1: Sign Up for Twilio

1. Go to: <https://www.twilio.com/try-twilio>
2. Sign up (FREE - get $15 trial credit)
3. Verify your email and phone number

### Step 2: Enable WhatsApp Sandbox

1. Login to Twilio Console
2. Go to: **Messaging** → **Try it out** → **Send a WhatsApp message**
3. You'll see instructions like:

   ```text
   Send "join <your-code>" to +1 (415) 523-8886
   ```

4. Open WhatsApp on your phone
5. Send the join message to activate sandbox

### Step 3: Get Your Credentials

1. Go to Twilio Console dashboard
2. Copy your **Account SID** (starts with AC...)
3. Click "Show" and copy your **Auth Token**

### Step 4: Configure Backend

Add to your `backend/.env` file:

```env
# Twilio Account
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# WhatsApp Sandbox Number (for testing)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 5: Restart Backend

```bash
cd backend
npm run dev
```

### Step 6: Test It

```bash
# Test WhatsApp messaging
curl -X POST http://localhost:4000/api/whatsapp/test-send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to": "+17174695102"}'
```

Check your WhatsApp - you should receive a test message! 🎉

---

## 📱 Production Setup (1-3 Business Days)

Once you're ready for production (after testing with sandbox):

### Step 1: Request WhatsApp Business Profile

1. In Twilio Console, go to **Messaging** → **Senders** → **WhatsApp senders**
2. Click **Request to access WhatsApp**
3. Fill out business information form

### Step 2: Register Your Business Number

1. Register your business phone: **+1 (717) 469-5102**
2. Verify ownership (you'll receive a verification code)
3. Complete business profile

### Step 3: Submit Message Templates

1. Create message templates for:
   - Verification codes
   - Transaction notifications
   - 2FA codes
2. Submit for approval (usually approved within 24 hours)

### Step 4: Get Approved

- WhatsApp will review your application
- Approval typically takes 1-3 business days
- You'll receive email notification

### Step 5: Update Configuration

Update `backend/.env`:

```env
# Production WhatsApp Number
TWILIO_WHATSAPP_NUMBER=whatsapp:+17174695102
```

---

## 💰 Cost Comparison

### WhatsApp (via Twilio)

- **Testing (Sandbox):** FREE ✅
- **Production:** ~$0.005 per message (half a cent!)
- **Monthly:** No base fee, pay-per-message only

### SMS (via Twilio)

- **Cost:** $0.0075 per message
- **Monthly:** $1/month for phone number
- **More expensive** than WhatsApp

### Google Voice

- **Cost:** FREE
- **Limitation:** Manual only, no automation

**Winner:** WhatsApp is cheaper AND better! 🏆

---

## 📊 API Endpoints

| Method | Endpoint                          | Description                 |
| ------ | --------------------------------- | --------------------------- |
| GET    | `/api/whatsapp/setup-info`        | Get setup information       |
| GET    | `/api/whatsapp/quick-setup-guide` | Full setup guide            |
| POST   | `/api/whatsapp/send-verification` | Send verification code      |
| POST   | `/api/whatsapp/send-2fa`          | Send 2FA code               |
| POST   | `/api/whatsapp/send-custom`       | Send custom message (Admin) |
| POST   | `/api/whatsapp/test-send`         | Test messaging (Admin)      |

---

## 🧪 Testing Examples

### 1. Send Verification Code

```bash
curl -X POST http://localhost:4000/api/whatsapp/send-verification \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+17174695102",
    "code": "123456"
  }'
```

### 2. Send 2FA Code

```bash
curl -X POST http://localhost:4000/api/whatsapp/send-2fa \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+17174695102",
    "code": "987654"
  }'
```

### 3. Get Setup Info

```bash
curl http://localhost:4000/api/whatsapp/setup-info
```

---

## 🎯 Message Templates

### Verification Code Template

```text
🔐 *Advancia Pay Verification Code*

Your verification code is: *123456*

Valid for 10 minutes.

If you didn't request this, please ignore this message.
```

### 2FA Code Template

```text
🔒 *Advancia Pay 2FA Code*

Your 2FA code is: *654321*

Valid for 5 minutes.

⚠️ Never share this code with anyone.
```

### Transaction Alert Template

```text
💰 *Advancia Pay Transaction Alert*

*Type:* DEPOSIT
*Amount:* 100 USDT
*Status:* ✅ Processed Successfully

Check your account for details.
```

---

## 🔒 Security Best Practices

1. ✅ **Never share** Twilio Auth Token
2. ✅ **Use environment variables** for credentials
3. ✅ **Implement rate limiting** (already done)
4. ✅ **Validate phone numbers** before sending
5. ✅ **Log all message attempts** for audit
6. ✅ **Use message templates** in production
7. ✅ **Monitor delivery rates**
8. ✅ **Comply with WhatsApp Business policies**

---

## 🆚 SMS vs WhatsApp - Feature Comparison

| Feature          | SMS     | WhatsApp  |
| ---------------- | ------- | --------- |
| Open Rate        | 20%     | 98%       |
| Cost per message | $0.0075 | $0.005    |
| Rich media       | ❌      | ✅        |
| Encryption       | ❌      | ✅        |
| Global reach     | Limited | Worldwide |
| App required     | ❌      | ✅        |
| Read receipts    | ❌      | ✅        |
| Buttons/CTAs     | ❌      | ✅        |

**Recommendation:** Use **WhatsApp as primary**, SMS as fallback

---

## 🛠️ Integration Code Examples

### Send Verification via WhatsApp

```typescript
import whatsappService from "./services/whatsappService";

// Send verification code
const result = await whatsappService.sendWhatsAppVerificationCode("+17174695102", "123456");

if (result.success) {
  console.log("Verification sent!", result.messageId);
}
```

### Send with Fallback to SMS

```typescript
// Try WhatsApp first
let result = await whatsappService.sendWhatsAppVerificationCode(phone, code);

// Fallback to SMS if WhatsApp fails
if (!result.success) {
  result = await smsService.sendVerificationCode(phone, code);
}
```

---

## 📞 Alternative: WhatsApp Business App (Manual)

If you don't want to use Twilio API, you can use the WhatsApp Business App:

### Setup

1. Download **WhatsApp Business** from app store
2. Register with your number: **+1 (717) 469-5102**
3. Set up business profile
4. When user requests code, manually send via app

### Pros

- ✅ Completely FREE
- ✅ No API needed
- ✅ Quick setup

### Cons

- ❌ Manual process
- ❌ Not scalable
- ❌ Slower

---

## 🎓 Resources

- **Twilio WhatsApp Docs:** <https://www.twilio.com/docs/whatsapp>
- **WhatsApp Business API:** <https://developers.facebook.com/docs/whatsapp>
- **Message Templates:** <https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates>
- **Pricing:** <https://www.twilio.com/whatsapp/pricing>

---

## ✅ Setup Checklist

- [ ] Sign up for Twilio account
- [ ] Enable WhatsApp sandbox
- [ ] Join sandbox from your WhatsApp
- [ ] Copy Account SID and Auth Token
- [ ] Add credentials to backend/.env
- [ ] Restart backend server
- [ ] Test with `/api/whatsapp/test-send`
- [ ] Verify message received on WhatsApp
- [ ] (Optional) Apply for production access
- [ ] (Optional) Submit message templates
- [ ] (Optional) Register business number

---

**Status:** ✅ Ready to use with Twilio WhatsApp Sandbox!  
**Your Business Number:** +1 (717) 469-5102  
**Sandbox Number:** whatsapp:+14155238886

Get started in 5 minutes! 🚀

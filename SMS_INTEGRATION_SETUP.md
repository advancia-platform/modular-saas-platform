# SMS Integration Setup - Google Voice Number

## ✅ Your Business Phone Number

**Phone:** +1 (717) 469-5102  
**Provider:** Google Voice  
**Formatted for API:** +17174695102

---

## 🚀 Quick Setup (Add to backend/.env)

Add these lines to your `backend/.env` file:

```env
# ----- Business Phone Number (SMS Verification) -----
BUSINESS_PHONE_NUMBER=+17174695102
BUSINESS_PHONE_PROVIDER=Google Voice

# For automated SMS via Twilio (optional but recommended):
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# TWILIO_PHONE_NUMBER=+17174695102
```

---

## 📱 Current Capabilities

✅ **SMS Receiving** - Google Voice app on your phone  
✅ **Voice Calls** - Incoming/outgoing via Google Voice  
✅ **Voicemail** - With transcription  
⚠️ **Automated SMS** - Requires Twilio integration (see below)

---

## 🔄 SMS Workflow (Current Setup)

### Without Twilio (Manual)

1. User requests verification code
2. Backend logs the code and phone number
3. **You manually send SMS** via Google Voice app
4. User enters code in app
5. Verification complete

### With Twilio (Automated - Recommended)

1. User requests verification code
2. Backend automatically sends SMS via Twilio API
3. User receives SMS instantly
4. User enters code in app
5. Verification complete ✨

---

## 🎯 To Enable Automated SMS (Twilio Integration)

### Step 1: Sign Up for Twilio

1. Go to: <https://www.twilio.com/try-twilio>
2. Sign up (free trial gives $15 credit)
3. Verify your email and phone

### Step 2: Get Your Credentials

1. Go to: <https://console.twilio.com/>
2. Copy your **Account SID**
3. Copy your **Auth Token**
4. Buy a phone number OR port your Google Voice number (optional)

### Step 3: Configure Backend

Add to `backend/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+17174695102
```

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

### Step 5: Test SMS

```bash
# Call the test endpoint
curl -X POST http://localhost:4000/api/sms/test-send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📊 Cost Breakdown

### Google Voice (Current)

- **Cost:** FREE ✅
- **Limitations:** Manual sending only
- **Best for:** Testing, low volume

### Twilio (Automated)

- **Phone Number:** $1/month
- **SMS Sending:** $0.0075 per message (less than 1 cent!)
- **SMS Receiving:** $0.0075 per message
- **Free Trial:** $15 credit (enough for ~2,000 messages)
- **Best for:** Production, scalability

### Example Monthly Cost

- 100 verifications/month = $1 (number) + $0.75 (SMS) = **$1.75/month**
- 1,000 verifications/month = $1 + $7.50 = **$8.50/month**

---

## 🧪 Testing the Integration

### 1. Check Business Contact

```bash
GET http://localhost:4000/api/sms/business-contact
```

### 2. Validate Phone Format

```bash
POST http://localhost:4000/api/sms/validate-phone
{
  "phoneNumber": "+17174695102"
}
```

### 3. Send Test SMS

```bash
POST http://localhost:4000/api/sms/test-send
Authorization: Bearer YOUR_TOKEN
```

### 4. Send Verification Code

```bash
POST http://localhost:4000/api/sms/send-verification
Authorization: Bearer YOUR_TOKEN
{
  "phoneNumber": "+17174695102",
  "code": "123456"
}
```

---

## 🎨 Frontend Components

### SMS Test Dashboard

Located at: `frontend/src/components/SMSTestDashboard.tsx`

Features:

- ✅ Send test SMS
- ✅ Validate phone numbers
- ✅ Send verification codes
- ✅ View business contact info
- ✅ Setup guide link

### Usage in Your App

```tsx
import SMSTestDashboard from "@/components/SMSTestDashboard";

// In your page/component:
<SMSTestDashboard />;
```

---

## 🔐 Security Best Practices

1. **Never commit .env files** - Already in .gitignore
2. **Use environment variables** for all credentials
3. **Validate phone numbers** before sending SMS
4. **Rate limit SMS endpoints** - Already implemented
5. **Log all SMS attempts** for audit trail
6. **Implement opt-out mechanism** for marketing messages
7. **Comply with TCPA** (US regulations for SMS)

---

## 🛠️ API Endpoints

| Method | Endpoint                     | Auth  | Description             |
| ------ | ---------------------------- | ----- | ----------------------- |
| GET    | `/api/sms/business-contact`  | No    | Get business phone info |
| POST   | `/api/sms/send-verification` | Yes   | Send verification code  |
| POST   | `/api/sms/send-2fa`          | Yes   | Send 2FA code           |
| POST   | `/api/sms/send-custom`       | Admin | Send custom message     |
| POST   | `/api/sms/validate-phone`    | No    | Validate phone format   |
| POST   | `/api/sms/test-send`         | Admin | Send test SMS           |
| GET    | `/api/sms/setup-guide`       | No    | Get setup guide         |

---

## 📚 Additional Resources

- **Twilio Docs:** <https://www.twilio.com/docs/sms>
- **Google Voice:** <https://voice.google.com/>
- **E.164 Format:** <https://en.wikipedia.org/wiki/E.164>
- **TCPA Compliance:** <https://www.fcc.gov/general/telemarketing-and-robocalls>

---

## 🆘 Troubleshooting

### SMS not sending?

1. Check Twilio credentials in .env
2. Verify phone number format (+17174695102)
3. Check Twilio Console for errors
4. Ensure sufficient balance

### Phone validation failing?

1. Use E.164 format: `+[country][number]`
2. Example: +17174695102 (not 717-469-5102)

### Twilio errors?

1. Check Account SID and Auth Token
2. Verify phone number is purchased in Twilio
3. Check account status (trial vs paid)

---

## ✅ Next Steps

1. [ ] Add BUSINESS_PHONE_NUMBER to backend/.env
2. [ ] Restart backend server
3. [ ] Test SMS via dashboard component
4. [ ] (Optional) Sign up for Twilio for automation
5. [ ] (Optional) Port Google Voice number to Twilio

---

**Created:** November 27, 2025  
**Business Number:** +1 (717) 469-5102  
**Status:** ✅ Configured, Manual SMS (Twilio integration optional)

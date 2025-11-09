# Advancia Support Staff Training Guide

## Welcome to the Advancia Support Team

This guide will help you provide excellent customer support using our AI-powered knowledge base and platform tools.

---

## 📚 Essential Resources

### Primary Documents

1. **AI_KNOWLEDGE_BASE.md** - Complete conversation examples and responses
2. **AI_TRAINING_CONTEXT.md** - Technical platform details
3. **Admin Dashboard** - http://localhost:3001/admin (for live monitoring)

### Quick Access

- **Backend API**: <http://localhost:4000/api>
- **Frontend**: <http://localhost:3001>
- **AI Analytics**: <http://localhost:4000/api/ai-analytics>
- **Admin Chat Monitor**: <http://localhost:3001/admin/chat>

---

## 🎯 Support Team Responsibilities

### 1. Live Chat Support

- Monitor the Admin Chat Dashboard for incoming messages
- Respond within 5 minutes during business hours
- Use knowledge base templates for consistency
- Escalate complex technical issues

### 2. Support Ticket Management

- Review new tickets in Admin Dashboard
- Categorize by priority (High, Medium, Low)
- Respond within:
  - Critical (account locked): 2-4 hours
  - High (transaction issues): 4-8 hours
  - Medium (general questions): 8-24 hours
  - Low (feature requests): 24-48 hours

### 3. User Account Management

- Verify user identity before account changes
- Assist with 2FA setup and password resets
- Monitor for suspicious activity
- Report fraud attempts to security team

---

## 💬 Using the AI Knowledge Base

### Quick Response Templates

#### Balance Inquiries

**User asks:** "What's my balance?" or "How much money do I have?"

**Template Response:**

`	ext
To check your balance:
1. Navigate to your Dashboard
2. Your balances are displayed at the top:
   - USD Balance (for fiat transactions)
   - BTC Balance (Bitcoin holdings)
   - ETH Balance (Ethereum holdings)
   - USDT Balance (Tether stablecoin)

You can also view detailed transaction history in the Transactions section.
`	ext

#### Adding Funds

**User asks:** "How do I add money?" or "How to deposit?"

**Template Response:**

`	ext
To add funds to your Advancia account:

1. CRYPTO DEPOSIT:
   - Go to Crypto Trading → Deposit
   - Select your cryptocurrency (BTC/ETH/USDT)
   - Send to your unique wallet address
   - Funds appear after network confirmation

2. BANK TRANSFER (USD):
   - Navigate to Add Funds section
   - Select bank transfer option
   - Follow wire transfer instructions
   - Processing time: 1-3 business days

3. DEBIT/CREDIT CARD:
   - Use the Card Payment option
   - Enter card details
   - Instant credit to your account
   - 2.5% processing fee applies

Need additional help? I'm here!
`	ext

#### Transaction Issues

**User reports:** "My transaction failed"

**Template Response:**

`	ext
Let's troubleshoot your failed transaction:

COMMON CAUSES:
1. Insufficient Balance - Check you have enough USD/crypto
2. Network Issues - Try refreshing and attempting again
3. Authentication Expired - Re-login to refresh your session
4. Daily Limit Reached - Check your tier limits

WHAT TO DO:
1. Check your Transaction History for error details
2. Verify your balance covers the amount + fees
3. Ensure you're logged in (check top right corner)
4. Try a smaller amount to test

If issue persists, I can create a priority support ticket for you. Would you like me to do that?
`	ext

#### Crypto Trading

**User asks:** "How do I buy Bitcoin?"

**Template Response:**

`	ext
Buying Bitcoin on Advancia is simple:

STEP-BY-STEP:
1. Ensure you have USD balance in your account
2. Go to Crypto Trading → Buy Bitcoin
3. Enter amount in USD you want to spend
4. Review the BTC amount you'll receive
5. Check the current exchange rate
6. Click "Confirm Purchase"
7. BTC appears in your wallet instantly

FEES:
• Trading fee: 1.5% per transaction
• No withdrawal fees for amounts over $100

TIPS:
- Start small to familiarize yourself
- Monitor market trends in the Market Insights section
- Set price alerts for your target buy price

We also support Ethereum (ETH), Tether (USDT), and ADVANCIA Token!
`	ext

#### Med Beds Booking

**User asks:** "How do I book Med Beds?"

**Template Response:**

`	ext
Booking your Med Bed session is easy:

STEP-BY-STEP:
1. Navigate to Med Beds → Book Session
2. SELECT CHAMBER TYPE:
   □ Standard ($50) - General wellness & recovery
   □ Enhancement ($100) - Performance optimization
   □ Diagnostic ($75) - Comprehensive health scan

3. CHOOSE DATE & TIME:
   - Select from available slots
   - Sessions run every hour
   - Book up to 2 weeks in advance

4. PAYMENT:
   - Deducted from USD balance
   - Must have sufficient funds

5. CONFIRMATION:
   - Email confirmation sent immediately
   - Calendar reminder 24 hours before

CANCELLATION POLICY:
• Free cancellation 48+ hours before
• 50% refund 24-48 hours before
• No refund within 24 hours

Need help selecting the right chamber for your needs?
`	ext

#### Debit Card Requests

**User asks:** "How do I get a debit card?"

**Template Response:**

`	ext
Get your Advancia Virtual Debit Card instantly:

💳 CARD DETAILS:
• Price: $1,000 USD (one-time)
• Type: Virtual Visa Debit Card
• Instant issuance
• Integrated with your USD balance

HOW TO PURCHASE:
1. Go to Debit Card → Purchase Card
2. Ensure $1,000 USD in your balance
3. Review terms and conditions
4. Click "Purchase Card"
5. Card issued instantly!

USING YOUR CARD:
• Online: Enter card details at checkout
• In-Store: Add to Apple Pay / Google Pay
• Balance: Your card balance = Your USD balance

The card number, expiration, and CVV will be displayed immediately after purchase.
`	ext

#### 2FA Setup

**User asks:** "How do I enable 2FA?"

**Template Response:**

`	ext
Secure your account with Two-Factor Authentication:

SETUP PROCESS:
1. Go to Settings → Security
2. Click "Enable 2FA"
3. CHOOSE METHOD:

   A) TOTP AUTHENTICATOR APP (Recommended):
      - Download Google Authenticator or Authy
      - Scan QR code shown on screen
      - Enter 6-digit code to verify
      - Save backup codes (IMPORTANT!)

   B) EMAIL OTP:
      - Enter your email
      - Receive 6-digit code
      - Verify code
      - 2FA active on next login

⚠️ CRITICAL: Save your 8 backup codes
- Use if you lose your phone
- Each code works once
- Store securely offline

Enable 2FA now for maximum security!
`	ext

#### Password Reset

**User says:** "I forgot my password"

**Template Response:**

`	ext
Reset your Advancia password easily:

STEP-BY-STEP:
1. Go to Login Page
2. Click "Forgot Password?"
3. Enter your registered email
4. Check email for reset link (check spam folder)
5. Click link (valid for 1 hour)
6. Create new strong password
7. Login with new password

PASSWORD REQUIREMENTS:
✓ Minimum 8 characters
✓ Include uppercase and lowercase
✓ Include numbers
✓ Include special characters

EMAIL NOT RECEIVED?
• Check spam/junk folder
• Wait 5 minutes (processing time)
• Verify correct email address
• Request new reset link

If you still can't access your account, I can escalate this to our account recovery team.
`	ext

---

## 🚨 Escalation Procedures

### When to Escalate to Tier 2 Support

1. **Account Access Issues**

   - User locked out after multiple failed attempts
   - Lost access to 2FA device and backup codes
   - Suspected account compromise

2. **Large Transaction Disputes**

   - Disputes over $10,000
   - Suspected fraud or unauthorized transactions
   - Crypto withdrawal issues

3. **Technical Bugs**

   - System errors preventing core functionality
   - Data loss or corruption
   - Security vulnerabilities

4. **Legal/Compliance**

   - KYC verification problems
   - Regulatory questions
   - Legal document requests

5. **Platform Outages**
   - Multiple users reporting same issue
   - Service degradation
   - API failures

### How to Escalate

1. **Create Priority Ticket**

   - Mark as "HIGH" or "CRITICAL" priority
   - Include all relevant details
   - Attach screenshots if available
   - Tag appropriate team (Security, Technical, Legal)

2. **Notify Team Lead**

   - Immediate notification for critical issues
   - Include ticket ID and summary
   - Recommend immediate action if needed

3. **Update User**
   - Inform user of escalation
   - Provide ticket reference number
   - Set realistic expectations for response time

---

## 🔧 Admin Tools & Features

### Admin Dashboard Features

1. **User Management** (`/admin/users`)

   - Search and view user accounts
   - Check verification status
   - View balance and transaction history
   - Modify user tier (Bronze, Silver, Gold, Platinum)
   - Lock/unlock accounts

2. **Transaction Monitoring** (`/admin/transactions`)

   - View all platform transactions
   - Filter by date, amount, type
   - Check transaction status
   - Refund processing

3. **Support Tickets** (`/admin/support`)

   - View all open tickets
   - Assign tickets to team members
   - Update ticket status
   - Add internal notes
   - Close resolved tickets

4. **Live Chat Monitor** (`/admin/chat`)

   - View active chat sessions
   - Join conversations
   - Send replies to users
   - View chat history
   - See new ticket notifications

5. **IP Blocking** (`/admin/ip-blocks`)

   - View blocked IPs
   - Add new blocks
   - Unblock IPs
   - View block reasons

6. **Analytics** (`/admin/analytics`)
   - Platform usage statistics
   - User growth trends
   - Transaction volumes
   - Revenue metrics
   - Service utilization

### Using AI Analytics API

#### Check User Wallet

`	ext
GET /api/ai-analytics/wallet/:userId
Authorization: Bearer {admin_token}

Response: Crypto portfolio analysis, order history, recommendations
`	ext

#### Cash-Out Eligibility

`	ext
POST /api/ai-analytics/cashout/:userId
Authorization: Bearer {admin_token}
Body: { "requestedAmount": 5000 }

Response: Eligibility assessment, risk analysis, recommendations
`	ext

#### Product Recommendations

`	ext
GET /api/ai-analytics/recommendations/:userId
Authorization: Bearer {admin_token}

Response: Personalized service recommendations based on user activity
`	ext

#### Market Insights

`	ext
GET /api/ai-analytics/market-insights
Authorization: Bearer {admin_token}

Response: Platform-wide analytics and trends
`	ext

---

## ⚠️ Common Issues & Solutions

### Issue 1: "I can't log in"

**Troubleshooting Steps:**

1. Check if password is correct (case-sensitive)
2. Verify email address spelling
3. Check if 2FA is enabled and user has access to codes
4. Look for account lock (5 failed attempts = 15 min lock)
5. Check if account is suspended (Admin Dashboard)

**Solutions:**

- Password reset link
- 2FA recovery with backup codes
- Wait for auto-unlock or admin unlock
- Contact account recovery team

### Issue 2: "Transaction not showing"

**Troubleshooting Steps:**

1. Check transaction history for pending status
2. Verify network confirmations (for crypto)
3. Check if balance was actually deducted
4. Look for error messages in user's transaction log

**Solutions:**

- Wait for network confirmations (can take 30-60 min for crypto)
- Check with blockchain explorer using transaction hash
- Create investigation ticket if funds were deducted but not credited

### Issue 3: "Withdrawal taking too long"

**Troubleshooting Steps:**

1. Check withdrawal status (Pending, Processing, Approved, Completed)
2. Verify KYC status (required for large withdrawals)
3. Check if withdrawal amount exceeds tier limits
4. Look for admin approval requirement

**Solutions:**

- Explain normal processing times (1-24 hours)
- Verify user identity if KYC not complete
- Check with admin if approval is pending
- Create priority ticket if exceeding SLA

### Issue 4: "Med Beds booking failed"

**Troubleshooting Steps:**

1. Check USD balance sufficient for booking
2. Verify selected date/time is available
3. Check for system errors
4. Verify payment processing

**Solutions:**

- Guide user to add funds if insufficient
- Suggest alternative time slots
- Create technical ticket if system issue
- Manually process booking if payment went through

### Issue 5: "Debit card not working"

**Troubleshooting Steps:**

1. Verify card was successfully purchased
2. Check USD balance for transaction amount
3. Check if card is frozen/unfrozen
4. Verify merchant accepts Visa
5. Check for incorrect card details entry

**Solutions:**

- Remind user card balance = USD balance
- Unfreeze card if frozen
- Verify card details are correct
- Test with small transaction
- Issue new card if defective

---

## 📊 Performance Metrics

### Key Performance Indicators (KPIs)

1. **Response Time**

   - Target: < 5 minutes for initial response
   - Measured: Time from message received to first reply

2. **Resolution Time**

   - Target: < 24 hours for 80% of tickets
   - Measured: Time from ticket creation to closure

3. **Customer Satisfaction (CSAT)**

   - Target: > 90% satisfaction rate
   - Measured: Post-interaction survey

4. **First Contact Resolution (FCR)**

   - Target: > 70% resolved on first contact
   - Measured: Tickets resolved without escalation

5. **Ticket Volume**
   - Monitor daily ticket trends
   - Identify common issues for knowledge base updates

### Daily Checklist

- [ ] Check for overnight tickets (Priority: High first)
- [ ] Monitor live chat for active sessions
- [ ] Review open tickets and update status
- [ ] Check for system alerts or outages
- [ ] Update knowledge base with new solutions
- [ ] Report metrics to team lead
- [ ] Flag recurring issues for product team

---

## 🎓 Training Exercises

### Exercise 1: Balance Inquiry

**Scenario:** User asks "What's my balance and how do I check it?"

**Your Response:**
[Use template from Quick Response Templates section]

### Exercise 2: Failed Transaction

**Scenario:** User says "I tried to buy Bitcoin but it failed. I need help!"

**Your Response:**

1. Acknowledge the issue empathetically
2. Ask for transaction ID if available
3. Use troubleshooting template
4. Check their account in Admin Dashboard
5. Provide specific solution based on findings

### Exercise 3: Escalation Decision

**Scenario:** User reports their account was hacked and $50,000 in Bitcoin is missing.

**Action:**

1. Mark as CRITICAL priority
2. Lock account immediately (Admin Dashboard)
3. Create security incident ticket
4. Escalate to Security Team immediately
5. Inform user of investigation process
6. DO NOT promise specific outcomes

---

## 🔐 Security & Compliance

### Data Privacy

- Never ask for passwords
- Don't share other users' information
- Use secure channels for sensitive data
- Follow GDPR/privacy regulations

### Verification Procedures

Before making account changes:

1. Verify email address matches account
2. Ask security questions
3. Check recent account activity
4. For high-value changes, require additional verification

### Red Flags (Potential Fraud)

- Multiple account access attempts
- Sudden large withdrawals
- Unusual location access
- Requests to bypass security measures
- Pressure for immediate action
- Requests to send funds to "support" addresses

**Action:** Report immediately to security team

---

## 📞 Contact Information

### Internal Support

- **Team Lead:** [Insert contact]
- **Technical Support:** <tech@advanciapayledger.com>
- **Security Team:** <security@advanciapayledger.com>
- **Compliance:** <compliance@advanciapayledger.com>

### External Support (for users)

- **General Support:** <support@advanciapayledger.com>
- **Technical Issues:** <tech@advanciapayledger.com>
- **Billing Questions:** <billing@advanciapayledger.com>

### Emergency Escalation

- **Critical Security:** [Phone number]
- **System Outage:** [Phone number]
- **Legal/Compliance:** [Phone number]

---

## 💡 Pro Tips for Success

1. **Be Proactive**

   - Anticipate user needs
   - Offer additional help before they ask
   - Suggest relevant features they might not know about

2. **Use Positive Language**

   - "I can help you with that" instead of "I can't..."
   - "Let's fix this together" instead of "You need to..."
   - "This will be resolved soon" instead of "This might take a while"

3. **Personalize Responses**

   - Use user's name
   - Reference their specific situation
   - Show empathy and understanding

4. **Stay Updated**

   - Review knowledge base updates weekly
   - Attend team training sessions
   - Share learnings with the team

5. **Document Everything**
   - Add notes to tickets
   - Update knowledge base with new solutions
   - Track common issues for product improvements

---

## 📚 Additional Resources

### Learning Materials

1. Review AI_KNOWLEDGE_BASE.md daily
2. Study platform features in AI_TRAINING_CONTEXT.md
3. Practice with test accounts
4. Shadow experienced team members
5. Attend weekly training sessions

### Quick Reference Cards

- **Transaction Limits by Tier** (see Platform Policies section in AI_KNOWLEDGE_BASE.md)
- **Service Pricing** (Debit Card: $1000, Med Beds: $50-$100, Loans: Variable)
- **Processing Times** (Crypto: 30-60 min, Bank Transfer: 1-3 days, Cards: Instant)
- **Tier Requirements** (Bronze: Free, Silver: $500 volume, Gold: $5k, Platinum: $50k)

---

## ✅ Support Staff Onboarding Checklist

### Week 1: Foundation

- [ ] Read complete AI_TRAINING_CONTEXT.md
- [ ] Study AI_KNOWLEDGE_BASE.md conversation examples
- [ ] Get admin dashboard access
- [ ] Practice with test accounts
- [ ] Shadow 10 support interactions

### Week 2: Hands-On

- [ ] Handle supervised chat sessions
- [ ] Respond to low-priority tickets
- [ ] Learn admin tools (user lookup, transaction check)
- [ ] Complete training exercises
- [ ] Get feedback from team lead

### Week 3: Independence

- [ ] Handle tickets independently
- [ ] Participate in live chat support
- [ ] Escalate appropriately
- [ ] Contribute to knowledge base
- [ ] Achieve 85%+ CSAT score

### Week 4: Mastery

- [ ] Handle all ticket types
- [ ] Meet response time SLAs
- [ ] Mentor new team members
- [ ] Identify process improvements
- [ ] Achieve 90%+ CSAT score

---

## 🎖️ Support Excellence Standards

### Our Commitment

- **Fast Response:** < 5 minutes for live chat
- **Accurate Information:** Use verified knowledge base
- **Empathetic Service:** Understand user frustration
- **Complete Resolution:** Follow through until solved
- **Professional Demeanor:** Always courteous and helpful

### User Experience Goals

- Users feel heard and understood
- Issues are resolved efficiently
- Users learn to self-serve when possible
- Trust in Advancia platform is strengthened
- Users become advocates for the platform

---

---

**Welcome to the team!** You're now equipped to provide world-class support to Advancia users. Let's make every interaction count! 🚀

_Last Updated: October 28, 2025_  
_Version: 1.0_  
_For internal use only - Confidential_

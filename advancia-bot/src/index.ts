import * as bp from '.botpress'

const bot = new bp.Bot({
  actions: {},
})

// Welcome message when conversation starts
bot.event('conversation.started', async ({ client }) => {
  await client.createMessage({
    type: 'text',
    conversationId: client.conversationId,
    userId: client.botId,
    payload: {
      text: `👋 Welcome to **Advancia AI Assistant**!

I can help you with:
• 💰 **Transactions** - Check balances, transaction history
• 🪙 **Trump Coin** - Cash-out process, current rates
• 🛏️ **Med-Bed Analytics** - Health data insights
• 🔐 **OTP Authentication** - Login help, 2FA setup
• 👤 **Account Recovery** - Reset passwords, unlock accounts
• ❓ **General FAQ** - Platform features and support

What would you like to know about today?`
    }
  })
})

// Handle all user messages
bot.message('', async ({ message, client, ctx }) => {
  const userMessage = message.payload.text.toLowerCase()

  // OTP & Authentication Help
  if (userMessage.includes('otp') || userMessage.includes('2fa') || userMessage.includes('login')) {
    await client.createMessage({
      type: 'text',
      conversationId: client.conversationId,
      userId: client.botId,
      payload: {
        text: `🔐 **OTP Authentication Help**

**What is OTP?**
One-Time Password (OTP) is a 6-digit code sent to your email for secure login.

**How to Login with OTP:**
1. Go to the login page
2. Enter your email address
3. Click "Send OTP"
4. Check your email for the 6-digit code
5. Enter the code within 10 minutes
6. Click "Verify & Login"

**Troubleshooting:**
• ❌ **Not receiving OTP?** Check spam folder or request a new code
• ⏰ **Code expired?** OTP codes expire after 10 minutes
• 📧 **Wrong email?** Make sure you're using your registered email

**Need more help?** Type "support" to create a ticket!`
      }
    })
    return
  }

  // Trump Coin Queries
  if (userMessage.includes('trump') || userMessage.includes('coin') || userMessage.includes('cash') || userMessage.includes('crypto')) {
    await client.createMessage({
      type: 'text',
      conversationId: client.conversationId,
      userId: client.botId,
      payload: {
        text: `🪙 **Trump Coin Information**

**What is Trump Coin?**
Trump Coin is our premium cryptocurrency available for trading and cash-out on Advancia.

**How to Cash Out:**
1. Go to **Dashboard** → **Trump Coin**
2. Select amount to sell
3. Choose USD conversion
4. Confirm transaction
5. Funds added to your USD balance

**Current Features:**
• 💱 Instant USD conversion
• 📊 Real-time market rates
• 🔒 Secure transactions
• 📈 Trading analytics

**Check Your Holdings:**
Type "balance" to see your current Trump Coin balance.

**Want to Trade?** Visit your dashboard to start!`
      }
    })
    return
  }

  // Med-Bed Analytics
  if (userMessage.includes('med') || userMessage.includes('bed') || userMessage.includes('health') || userMessage.includes('analytics')) {
    await client.createMessage({
      type: 'text',
      conversationId: client.conversationId,
      userId: client.botId,
      payload: {
        text: `🛏️ **Med-Bed Analytics**

**What are Med-Beds?**
Advanced health monitoring and wellness analysis technology integrated into Advancia.

**Features:**
• 📊 **Health Metrics** - Track vital health indicators
• 🧬 **Wellness Score** - Comprehensive health assessment
• 📈 **Trend Analysis** - Monitor improvements over time
• 🎯 **Personalized Insights** - AI-driven health recommendations

**How to Access:**
1. Go to **Dashboard** → **Med-Bed Section**
2. View your health analytics
3. Review personalized recommendations
4. Track your wellness progress

**Understanding Your Data:**
• **Green indicators** = Optimal health metrics
• **Yellow indicators** = Areas for improvement
• **Red indicators** = Needs attention

**Pro Tip:** Regular monitoring helps optimize your wellness journey!

Want to see your health data? Visit your dashboard now!`
      }
    })
    return
  }

  // Transaction & Balance Queries
  if (userMessage.includes('balance') || userMessage.includes('transaction') || userMessage.includes('payment') || userMessage.includes('money')) {
    await client.createMessage({
      type: 'text',
      conversationId: client.conversationId,
      userId: client.botId,
      payload: {
        text: `💰 **Transaction & Balance Information**

**Check Your Balance:**
Visit **Dashboard** → **Balance Overview** to see:
• 💵 USD Balance
• 🪙 Trump Coin Holdings
• 📊 Total Portfolio Value

**Transaction History:**
View all your transactions in **Dashboard** → **Transactions**

**Transaction Types:**
• ✅ **Deposits** - Add funds to account
• ⬇️ **Withdrawals** - Cash out to bank
• 🔄 **Transfers** - Send to other users
• 💱 **Crypto Orders** - Buy/sell Trump Coin

**Need Help?**
• Type "deposit" for deposit instructions
• Type "withdraw" for withdrawal process
• Type "transfer" for transfer guide

Would you like to check your current balance? (I can fetch it if you're logged in)`
      }
    })
    return
  }

  // Account Recovery
  if (userMessage.includes('recover') || userMessage.includes('reset') || userMessage.includes('forgot') || userMessage.includes('locked')) {
    await client.createMessage({
      type: 'text',
      conversationId: client.conversationId,
      userId: client.botId,
      payload: {
        text: `👤 **Account Recovery Help**

**Forgot Password / Locked Account:**

**Step 1: Reset Your Password**
1. Go to login page
2. Click "Forgot Password?"
3. Enter your email
4. Check email for reset link
5. Create new password

**Account Locked?**
Accounts auto-lock after 5 failed login attempts.

**Unlock Process:**
1. Wait 30 minutes for auto-unlock, OR
2. Request password reset (unlocks immediately)

**Can't Access Email?**
If you can't access your registered email:
1. Type "support" to create a ticket
2. Our team will verify your identity
3. We'll help you regain access

**Security Tips:**
• ✅ Use a strong, unique password
• ✅ Enable OTP authentication
• ✅ Keep your email secure
• ✅ Don't share your credentials

**Still Having Issues?** Type "support" for personalized help!`
      }
    })
    return
  }

  // KYC Verification
  if (userMessage.includes('kyc') || userMessage.includes('verify') || userMessage.includes('verification') || userMessage.includes('identity')) {
    await client.createMessage({
      type: 'text',
      conversationId: client.conversationId,
      userId: client.botId,
      payload: {
        text: `✅ **KYC Verification Guide**

**What is KYC?**
Know Your Customer (KYC) verification ensures platform security and compliance.

**Why Verify?**
• 💰 Higher transaction limits
• 🚀 Access premium features
• 🔒 Enhanced account security
• 🌟 Priority support

**How to Verify:**
1. Go to **Settings** → **KYC Verification**
2. Upload government ID (passport, driver's license)
3. Take a selfie for identity confirmation
4. Submit documents
5. Wait 24-48 hours for review

**Required Documents:**
• Valid government-issued photo ID
• Clear, readable photos
• All four corners visible
• No glare or shadows

**Verification Status:**
• ⏳ **Pending** - Under review
• ✅ **Verified** - Approved
• ❌ **Rejected** - Resubmit with corrections

**Check Your Status:** Visit your profile settings!`
      }
    })
    return
  }

  // Support Ticket Creation
  if (userMessage.includes('support') || userMessage.includes('help') || userMessage.includes('ticket') || userMessage.includes('problem')) {
    await client.createMessage({
      type: 'text',
      conversationId: client.conversationId,
      userId: client.botId,
      payload: {
        text: `🎫 **Create Support Ticket**

I'll help you create a support ticket for personalized assistance.

**What's your issue?**
Please describe your problem, and I'll make sure our support team sees it:

• 📧 You'll receive a ticket confirmation
• ⏰ Average response time: 2-4 hours
• 🌟 Premium users get priority support

**Common Issues:**
• Transaction problems
• Account access
• Technical errors
• Feature requests
• Billing questions

Please type your issue details, and I'll create your ticket!`
      }
    })
    return
  }

  // FAQ / General Help
  if (userMessage.includes('faq') || userMessage.includes('what') || userMessage.includes('how')) {
    await client.createMessage({
      type: 'text',
      conversationId: client.conversationId,
      userId: client.botId,
      payload: {
        text: `❓ **Frequently Asked Questions**

**Quick Topics:**
• 🔐 Type "OTP" - Authentication help
• 🪙 Type "Trump Coin" - Crypto information
• 🛏️ Type "Med-Bed" - Health analytics
• 💰 Type "Balance" - Transaction info
• 👤 Type "Recovery" - Account help
• ✅ Type "KYC" - Verification guide
• 🎫 Type "Support" - Create ticket

**Platform Features:**
• Real-time transaction processing
• Secure OTP authentication
• Trump Coin trading
• Med-Bed health analytics
• Automated reporting
• 24/7 AI assistance

**Need More Help?**
Just ask me a question in plain English!

Examples:
• "How do I cash out Trump Coin?"
• "Why am I not receiving OTP codes?"
• "What are Med-Bed analytics?"
• "How do I check my balance?"`
      }
    })
    return
  }

  // Default response for unrecognized queries
  await client.createMessage({
    type: 'text',
    conversationId: client.conversationId,
    userId: client.botId,
    payload: {
      text: `I'm here to help! 😊

I can assist you with:
• 🔐 **OTP** - Authentication & login
• 🪙 **Trump Coin** - Trading & cash-out
• 🛏️ **Med-Bed** - Health analytics
• 💰 **Transactions** - Balances & payments
• 👤 **Account Recovery** - Password reset
• ✅ **KYC Verification** - Identity confirmation
• 🎫 **Support** - Create a ticket

Try typing one of these keywords, or ask me a specific question!

Example: "How do I withdraw funds?" or "What is Trump Coin?"`
    }
  })
})

export default bot


# Advancia AI Training Context

## Platform Overview

**Name:** Advancia Pay Ledger  
**Type:** Multi-Service Fintech Platform  
**Stack:** Node.js + Express + TypeScript (Backend), Next.js 14 (Frontend), PostgreSQL + Prisma ORM  
**Architecture:** Monorepo with separate backend/frontend services

---

## Core Services & Features

### 1. **Financial Services**

- **Transactions**: Credit/debit transaction management with real-time balance tracking
- **Crypto Trading**: BTC, ETH, USDT trading with USD conversion
- **Debit Cards**: Virtual debit card issuance and management
- **Personal Loans**: Loan application, approval, and repayment tracking
- **Withdrawals**: Crypto and fiat withdrawal processing

### 2. **Health & Wellness**

- **Med Beds Booking**: Advanced wellness chamber reservations (Standard, Enhancement, Diagnostic)
- **Health Readings**: Vital signs tracking and health analytics
- **Session Management**: Booking cost calculation, payment status tracking

### 3. **Cryptocurrency**

- **Token Wallet (ADVANCIA)**: Native platform token with staking rewards
- **Multi-Crypto Support**: Bitcoin, Ethereum, Tether (USDT)
- **Trump Coin Integration**: Specialized wallet for Trump-themed cryptocurrency
- **Order Management**: Buy/sell orders with status tracking

### 4. **User Management**

- **Authentication**: Email OTP, Password login, TOTP 2FA
- **User Tiers**: Bronze, Silver, Gold, Platinum with progressive benefits
- **Rewards System**: Activity-based reward points and bonuses
- **KYC/Verification**: Identity verification workflows

### 5. **Support & Communication**

- **Support Tickets**: Multi-category ticketing system (account, transaction, crypto, medbeds)
- **Live Chat**: Real-time user support via Socket.IO
- **Consultation Booking**: Professional consultation scheduling
- **Email Notifications**: Automated transactional emails via Gmail SMTP

### 6. **Admin & Analytics**

- **Admin Dashboard**: User management, transaction oversight, system monitoring
- **IP Blocking**: Security management for suspicious activity
- **Audit Logs**: Comprehensive activity tracking
- **Session Management**: Active session monitoring and control

---

## AI Analytics Capabilities (Rule-Based)

### Current AI Services (`aiAnalyticsService.ts`)

#### 1. **Wallet Analysis** (`analyzeTrumpCoinWallet`)

- Analyzes user crypto holdings and balances
- Provides insights on portfolio composition
- Tracks crypto order history
- Calculates total portfolio value

#### 2. **Cash-Out Eligibility** (`analyzeCashOutEligibility`)

- Evaluates user balance sufficiency
- Checks transaction history patterns
- Provides approval/denial recommendations
- Risk assessment based on user tier

#### 3. **Product Recommendations** (`generateProductRecommendations`)

- Personalized service suggestions based on user activity
- Recommends: Debit Cards, Med Beds, Personal Loans, Token Wallet, Crypto Trading
- Considers user tier, balances, and past behavior
- Smart cross-selling based on usage patterns

#### 4. **Market Insights** (`generateMarketInsights`)

- Platform-wide analytics and trends
- User engagement metrics (active users, growth trends)
- Crypto trading volume and sentiment analysis
- Lending portfolio health
- Med Beds utilization statistics
- Automated recommendations for platform optimization

### AI Endpoints (`/api/ai-analytics`)

- `GET /wallet/:userId` - Wallet analysis
- `POST /cashout/:userId` - Cash-out eligibility check
- `GET /recommendations/:userId` - Personalized product recommendations
- `GET /market-insights` - Platform market insights

---

## Database Schema (Key Models)

### Users & Authentication

- `User`: Core user data with balances (USD, BTC, ETH, USDT)
- `UserTier`: Tier-based benefits and limits
- `Reward`: User reward points and bonuses

### Financial Transactions

- `Transaction`: All financial movements (credit/debit)
- `Crypto_Orders`: Cryptocurrency buy/sell orders
- `TokenTransaction`: ADVANCIA token transfers
- `Loan`: Personal loan records
- `Withdrawal`: Withdrawal requests

### Health Services

- `MedBedsBooking`: Wellness chamber reservations
- `HealthReading`: User health metrics

### Support & Communication

- `SupportTicket`: User support requests
- `ChatMessage`: Live chat history
- `Notification`: Push notifications and emails

### Security & Monitoring

- `AuditLog`: All system activities
- `IPBlock`: Blocked IP addresses
- `ActiveSession`: User session tracking

---

## Real-Time Features (Socket.IO)

### Event Emissions

- `transaction-created` - New transaction notification
- `global-transaction` - Broadcast to all users
- `admin:transaction` - Admin dashboard updates
- `notification` - User-specific notifications
- `token:transaction` - Token transfer events
- `sessions:update` - Active session changes

### Room Structure

- `user-{userId}` - Individual user rooms
- `admins` - Admin-only broadcasts

---

## Authentication & Security

### Auth Methods

1. **Email OTP**: One-time password via email (Gmail SMTP)
2. **Password**: bcrypt hashed passwords
3. **2FA TOTP**: Time-based one-time passwords
4. **Backup Codes**: Recovery codes for account access

### Security Middleware

- `authenticateToken`: JWT validation
- `requireAdmin`: Admin role verification
- `allowRoles`: Role-based access control
- Rate limiting: 300 requests per minute per IP
- CORS: Restricted to allowed origins

### Security Headers

- Helmet.js for HTTP security headers
- Input validation on all endpoints
- SQL injection prevention via Prisma

---

## Payment Integration

### Stripe Integration

- Webhook endpoint: `/api/payments/webhook`
- Test mode keys configured
- Payment intent creation
- Subscription handling (future feature)

### Payment Types

- Debit card purchases ($1000 USD cards)
- Med Beds session payments
- Crypto order deposits
- Loan disbursements

---

## Configuration & Environment

### Required Environment Variables

```env
DATABASE_URL=postgresql://...
PORT=4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development|production
JWT_SECRET=...
EMAIL_USER=...
EMAIL_PASSWORD=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### CORS Origins

- `http://localhost:3000` (production build)
- `http://localhost:3001` (dev server with HMR)
- `https://advanciapayledger.com`
- `https://www.advanciapayledger.com`

---

## API Route Structure

### Public Routes

- `/api/health` - Health check
- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/otp` - OTP generation
- `/api/payments/webhook` - Stripe webhook (raw body)

### Authenticated Routes

- `/api/transactions/*` - Transaction management
- `/api/tokens/*` - Token wallet operations
- `/api/rewards/*` - Reward point management
- `/api/medbeds/*` - Med Beds booking
- `/api/support/*` - Support tickets
- `/api/ai-analytics/*` - AI-powered analytics
- `/api/withdrawals/*` - Withdrawal requests
- `/api/debit-card/*` - Card management

### Admin Routes

- `/api/admin/*` - User management
- `/api/admin/analytics/*` - Platform analytics
- `/api/admin/security/*` - Security settings
- `/api/admin/ip-blocks/*` - IP management
- `/api/sessions/*` - Session monitoring

---

## Frontend Structure (Next.js 14)

### Key Pages

- `/` - Landing page
- `/dashboard` - User dashboard
- `/admin/login` - Admin portal
- `/admin/users` - User management
- `/admin/analytics` - Analytics dashboard
- `/medbeds/book` - Med Beds booking
- `/transactions` - Transaction history
- `/tokens` - Token wallet
- `/support` - Support center

### Components

- `AuthProvider` - Authentication context
- `ChatbotWidget` - AI assistant
- `ErrorBoundary` - Error handling
- `SystemFeedbackBanner` - Status notifications
- `SilentModeProvider` - Notification controls

---

## Development Workflow

### Starting Servers

```powershell
# Backend (port 4000)
cd backend && npm run dev

# Frontend Dev (port 3001 - HMR)
cd frontend && npm run dev

# Frontend Production (port 3000)
cd frontend && npm run build && npm start

# All servers together
npm run start:all  # Via task script
```

### Database Operations

```powershell
cd backend
npx prisma migrate dev  # Run migrations
npx prisma studio       # Database GUI
npx prisma generate     # Regenerate client
```

### Testing

```powershell
# Backend tests
cd backend && npm test

# Frontend E2E tests
cd frontend && npx playwright test

# AI Analytics direct test
cd backend && tsx test-ai-service-direct.ts
```

---

## AI Training Objectives

### What the AI Should Understand

1. **User Intent Recognition**

   - Identify when users ask about transactions, balances, crypto, med beds, loans
   - Understand financial terminology (credit, debit, withdrawal, deposit)
   - Recognize health-related queries (booking, chambers, wellness)
   - Detect support requests (issues, problems, help needed)

2. **Context Awareness**

   - Know which services are available on the platform
   - Understand relationships between services (e.g., need balance for debit card)
   - Recognize user tier impacts on features
   - Understand authentication requirements for actions

3. **Response Patterns**

   - Provide accurate information about service availability
   - Guide users to correct endpoints/pages
   - Explain requirements for each service
   - Suggest relevant alternatives when primary request can't be fulfilled

4. **Technical Knowledge**

   - Understand the API structure and endpoint purposes
   - Know authentication requirements
   - Recognize error patterns and provide solutions
   - Understand database schema relationships

5. **Business Logic**
   - Know pricing for services (debit cards, med beds, loans)
   - Understand tier-based benefits
   - Recognize eligibility criteria for services
   - Know platform policies and limits

---

## Common User Queries & Responses

### Transaction Queries

**Q:** "How do I check my balance?"  
**A:** Navigate to your Dashboard to view your USD, BTC, ETH, and USDT balances. You can also use the `/api/transactions/balance/:userId` endpoint.

**Q:** "Can I send money to another user?"  
**A:** Yes, initiate a debit transaction through the Transactions page or use the Transfer feature in your Dashboard.

### Crypto Trading

**Q:** "How do I buy Bitcoin?"  
**A:** Go to the Crypto Trading section, select Bitcoin (BTC), enter the amount in USD, and confirm your order. Funds will be deducted from your USD balance.

**Q:** "What cryptocurrencies can I trade?"  
**A:** Currently supported: Bitcoin (BTC), Ethereum (ETH), Tether (USDT), and our native ADVANCIA token.

### Med Beds

**Q:** "What are Med Beds?"  
**A:** Advanced wellness chambers offering Standard recovery ($50), Enhancement therapy ($100), and Diagnostic scans ($75). Book through the Med Beds section in your dashboard.

**Q:** "How do I book a Med Beds session?"  
**A:** Navigate to `/medbeds/book`, select your chamber type, choose a date, and complete payment. Session confirmation will be sent via email.

### Debit Cards

**Q:** "How do I get a virtual debit card?"  
**A:** Purchase a card for $1000 USD through the Debit Card section. The card is issued instantly with your USD balance integrated.

### Support

**Q:** "How do I contact support?"  
**A:** Use the Support Ticket system in your dashboard, or access the live chat widget (bottom right). Response time is typically under 24 hours.

---

## Error Handling & Troubleshooting

### Common Errors

- **"Access token required"** - User needs to log in
- **"Insufficient balance"** - User doesn't have enough funds
- **"Route not found"** - Endpoint doesn't exist or misspelled
- **"Invalid or expired token"** - Session expired, re-login needed
- **"Forbidden"** - User lacks required permissions/role

### Solutions

- Authentication errors → Guide to `/api/auth/login`
- Balance errors → Suggest deposit or different amount
- Permission errors → Explain tier requirements or admin-only features
- Technical errors → Direct to support ticket system

---

## Future Enhancements

### Planned AI Features

1. **Natural Language Processing**: Enhanced query understanding
2. **Predictive Analytics**: Forecast user behavior and needs
3. **Fraud Detection**: AI-powered transaction monitoring
4. **Chatbot Integration**: Full conversational AI assistant
5. **Investment Recommendations**: Crypto portfolio optimization
6. **Health Insights**: Med Beds data analysis and trends

### Integration Opportunities

- OpenAI API for advanced NLP (currently rule-based)
- Machine learning models for fraud detection
- Sentiment analysis on support tickets
- Automated response generation for FAQs

---

## API Examples for AI Reference

### Check User Balance

```typescript
GET /api/transactions/balance/:userId
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "userId": "user-123",
  "balance_main": 1250.50,
  "earnings": 187.58,
  "referral": 0,
  "total": 1438.08
}
```

### Get AI Wallet Analysis

```typescript
GET /api/ai-analytics/wallet/:userId
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": {
    "walletSummary": {...},
    "cryptoOrders": [...],
    "recommendations": "..."
  }
}
```

### Create Transaction

```typescript
POST /api/transactions
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "amount": 100,
  "type": "credit",
  "source": "deposit"
}
```

### Book Med Beds Session

```typescript
POST /api/medbeds/book
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "chamberType": "Standard",
  "sessionDate": "2025-11-01",
  "notes": "First time booking"
}
```

---

## Performance Metrics

### Current System Stats (as of testing)

- Backend uptime: 427+ seconds stable
- Database: Connected and responsive
- Active endpoints: 50+ routes
- Average response time: <100ms
- Concurrent connections: Support for 1000+ users

### Monitoring

- Health check: `/api/health`
- Database status included in health response
- Socket.IO connection monitoring
- Real-time error logging to console

---

## Summary for AI Training

**Primary Goal:** Train AI to understand Advancia Pay Ledger as a comprehensive fintech platform offering:

1. Traditional banking (transactions, balances)
2. Cryptocurrency trading (BTC, ETH, USDT, tokens)
3. Health services (Med Beds)
4. Financial products (loans, debit cards)
5. Support services (tickets, chat, consultations)

**Key Understanding Points:**

- All services require authentication
- User tiers affect available features
- Real-time updates via Socket.IO
- Rule-based AI analytics already in place
- Security is paramount (JWT, 2FA, rate limiting)
- Multi-currency support (USD, BTC, ETH, USDT)

**AI Should Be Able To:**

- Answer questions about any platform feature
- Guide users to correct pages/endpoints
- Explain service requirements and pricing
- Provide personalized recommendations
- Troubleshoot common issues
- Direct complex issues to human support

---

## Contact & Support

**Admin Access:** http://localhost:3001/admin/login  
**User Dashboard:** http://localhost:3001/dashboard  
**API Base:** http://localhost:4000/api  
**Health Check:** http://localhost:4000/api/health

**Test Credentials:**

- Admin: admin@test.com / Admin123!@#
- User: user@test.com / User123!@#

---

_Last Updated: October 28, 2025_  
_AI Training Version: 1.0_  
_Platform Version: 1.0.0_

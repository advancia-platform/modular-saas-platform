# Trust & Reputation System Setup Guide

## Overview

ScamAdviser/Trustpilot-style trust scoring system with:

- User trust scores (0-100)
- Fraud detection indicators
- Community reviews (1-5 stars)
- Telegram bot integration
- Real-time risk assessment

## Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install node-telegram-bot-api
```

### 2. Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add-trust-system
```

This creates:

- `user_reviews` table (user reviews with ratings)
- `kycVerified` field on `users` table
- Relations between users, transactions, and reviews

### 3. Configure Telegram Bot (Optional)

#### Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow prompts to name your bot
4. Copy the **bot token** provided

#### Add to Environment Variables

Add to `backend/.env`:

```env
# Telegram Trust Bot (optional)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here  # Optional: for notifications
```

#### Telegram Bot Commands

Once configured, users can:

- `/trustscore <userId>` - Get AI trust score with risk assessment
- `/reputation <userId>` - Get full reputation report with verification status
- `/help` - Show available commands

## API Endpoints

### Trust Score Routes

All routes require authentication via JWT token.

#### 1. Get Current User's Trust Score

```http
GET /api/trust/score
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "trustScore": {
    "overall": 85,
    "riskLevel": "low",
    "transactionHistory": 22,
    "accountAge": 20,
    "verificationLevel": 25,
    "communityRating": 18,
    "fraudIndicators": []
  }
}
```

#### 2. Get Full Reputation Data

```http
GET /api/trust/reputation
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "reputation": {
    "userId": "abc123",
    "trustScore": {
      /* ... */
    },
    "totalTransactions": 47,
    "successfulTransactions": 45,
    "failedTransactions": 2,
    "averageTransactionAmount": "250.00",
    "accountAgeInDays": 180,
    "verificationStatus": {
      "email": true,
      "phone": true,
      "kyc": true,
      "twoFactor": true
    },
    "communityReviews": 12,
    "averageRating": 4.5,
    "lastUpdated": "2025-11-26T..."
  }
}
```

#### 3. Get Public Trust Score for Another User

```http
GET /api/trust/user/:userId
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "userId": "xyz789",
  "trustScore": {
    "overall": 72,
    "riskLevel": "medium"
  }
}
```

#### 4. Submit Review for Another User

```http
POST /api/trust/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "revieweeId": "user123",
  "rating": 5,
  "comment": "Great transaction, very reliable!",
  "category": "transaction",
  "transactionId": "txn456"  // Optional
}
```

**Response:**

```json
{
  "success": true,
  "review": {
    "id": "rev789",
    "rating": 5,
    "category": "transaction",
    "createdAt": "2025-11-26T..."
  }
}
```

#### 5. Get Reviews for a User

```http
GET /api/trust/reviews/:userId?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "reviews": [
    {
      "id": "rev123",
      "rating": 5,
      "comment": "Excellent service",
      "category": "support",
      "createdAt": "2025-11-26T...",
      "reviewer": {
        "id": "user456",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

## Trust Score Calculation

### Scoring Breakdown (0-100 points)

1. **Transaction History (0-25 points)**
   - Success rate: 20 points max
   - Transaction volume: 5 points max
   - Formula: `successRate * 20 + min(totalTxns/100, 1) * 5`

2. **Account Age (0-25 points)**
   - 365+ days: 25 points
   - 180-364 days: 20 points
   - 90-179 days: 15 points
   - 30-89 days: 10 points
   - 7-29 days: 5 points
   - < 7 days: 0 points

3. **Verification Level (0-25 points)**
   - Email verified: 5 points
   - Phone verified: 5 points
   - KYC completed: 10 points
   - 2FA enabled: 5 points

4. **Community Rating (0-25 points)**
   - Based on user reviews (1-5 stars)
   - No reviews: 12.5 points (neutral)
   - Formula: `(avgRating / 5) * 25`

### Risk Levels

- **Low Risk**: 80-100 points (🟢)
- **Medium Risk**: 60-79 points (🟡)
- **High Risk**: 40-59 points (🟠)
- **Critical Risk**: 0-39 points (🔴)

### Fraud Indicators

Automatically detected:

- ❌ Multiple failed login attempts (>5)
- ❌ High transaction failure rate (>50%)
- ❌ Unusually high transaction velocity (>20 in 7 days)
- ❌ Email not verified
- ❌ KYC verification pending

**Note:** If 3+ fraud indicators detected, risk level upgraded to Critical regardless of score.

## Frontend Integration

### React Component Usage

Add to your dashboard:

```tsx
import TrustScoreWidget from "@/components/TrustScoreWidget";

export default function Dashboard() {
  return (
    <div>
      <TrustScoreWidget />
      {/* Other dashboard components */}
    </div>
  );
}
```

The widget displays:

- Overall trust score with risk level badge
- Breakdown bars for each scoring category
- Fraud indicators (if any)
- Visual comparison to Trustpilot scoring

## Security & Compliance

### PCI-DSS Compliance

- ✅ PII protection: Email addresses not exposed in review listings
- ✅ Audit logging: All trust operations logged via Winston
- ✅ Rate limiting: API endpoints protected (10-20 req/min)
- ✅ Authorization: Reviews require transaction verification

### Rate Limits

- `/trust/score`: 10 requests/minute
- `/trust/reputation`: 10 requests/minute
- `/trust/user/:userId`: 20 requests/minute
- `/trust/review` (POST): 5 requests/hour
- `/trust/reviews/:userId`: 20 requests/minute

### Review Policies

- Users cannot review themselves
- Transaction-based reviews require proof of participation
- Reviews are permanent (no editing, only new reviews)
- Spam protection via rate limiting

## Testing

### Manual Testing with curl

```bash
# Get your trust score
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/trust/score

# Submit a review
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"revieweeId":"user123","rating":5,"category":"transaction"}' \
  http://localhost:4000/api/trust/review

# Get another user's public score
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/trust/user/xyz789
```

### Telegram Bot Testing

1. Start your bot in Telegram
2. Send `/trustscore <userId>` to test trust scoring
3. Send `/reputation <userId>` to test full reputation report
4. Send `/help` to verify commands

## Troubleshooting

### Database Connection Issues

```bash
# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test Prisma connection
cd backend
npx prisma db pull
```

### Telegram Bot Not Responding

```bash
# Verify environment variables
grep TELEGRAM_BOT_TOKEN backend/.env

# Check bot initialization logs
# Should see: "Telegram trust bot initialized"
```

### Trust Score Returns 0

- Check if user has transactions (minimum 1 required)
- Verify user account age (new accounts score lower)
- Check verification status (unverified = lower score)

### Reviews Not Saving

- Ensure `UserReview` model exists in Prisma schema
- Check `kycVerified` field added to `User` model
- Verify migration ran successfully

## Production Deployment

### Environment Variables

Required for production:

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=...

# Optional: Telegram Bot
TELEGRAM_BOT_TOKEN=your_production_bot_token
```

### Monitoring

Trust score calculations are logged:

```typescript
logger.info("Trust score calculated", {
  userId,
  overall,
  riskLevel,
  fraudIndicatorCount,
});
```

Check logs with:

```bash
tail -f backend/logs/combined.log | grep "Trust score"
```

## Next Steps

1. ✅ Install dependencies: `npm install node-telegram-bot-api`
2. ✅ Run migration: `npx prisma migrate dev`
3. ⚠️ Configure Telegram bot (optional)
4. ⚠️ Test API endpoints with Postman/curl
5. ⚠️ Add TrustScoreWidget to frontend dashboard
6. ⚠️ Monitor trust score calculations in production

## Support

- API Documentation: `/api/trust/*` routes in `backend/src/routes/trust.ts`
- Service Logic: `backend/src/services/trustScoreService.ts`
- Telegram Bot: `backend/src/services/telegramTrustBot.ts`
- Frontend Widget: `frontend/src/components/TrustScoreWidget.tsx`

For issues, check:

1. Backend logs: `backend/logs/combined.log`
2. Prisma schema: `backend/prisma/schema.prisma`
3. Environment variables: `backend/.env`

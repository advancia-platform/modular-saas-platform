# 📚 API Reference - Advancia Pay Ledger

**Version**: 1.0.0  
**Base URL**: `http://localhost:4000`  
**Authentication**: Bearer Token (JWT)

---

## 🔐 Authentication

All protected endpoints require an `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 📋 Table of Contents

1. [Health & Status](#health--status)
2. [Authentication](#auth-endpoints)
3. [Transactions](#transactions)
4. [Token Wallet](#token-wallet)
5. [Rewards & Tiers](#rewards--tiers)
6. [Users](#users)
7. [Payments (Stripe)](#payments)
8. [Admin](#admin)

---

## Health & Status

### GET `/health`
Check API health status

**Authentication**: None required

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-11-08T00:00:00.000Z",
  "service": "advancia-backend",
  "version": "1.0.0"
}
```

---

## Auth Endpoints

### POST `/api/auth/register`
Register new user

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response**: `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "token": "jwt-token-here"
}
```

### POST `/api/auth/login`
Login existing user

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response**: `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
  },
  "token": "jwt-token-here"
}
```

---

## Transactions

### POST `/api/transactions`
Create a new transaction

**Authentication**: Required

**Request Body**:
```json
{
  "userId": "user-uuid",
  "amount": 100.50,
  "type": "credit",
  "description": "Salary deposit",
  "category": "income"
}
```

**Response**: `201 Created`
```json
{
  "id": "transaction-uuid",
  "userId": "user-uuid",
  "amount": "100.50",
  "type": "credit",
  "status": "completed",
  "description": "Salary deposit",
  "category": "income",
  "createdAt": "2025-11-08T00:00:00.000Z"
}
```

### GET `/api/transactions/:userId`
Get all transactions for a user

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by type (credit|debit)
- `status` (optional): Filter by status

**Response**: `200 OK`
```json
{
  "transactions": [
    {
      "id": "uuid",
      "amount": "100.50",
      "type": "credit",
      "description": "Salary deposit",
      "createdAt": "2025-11-08T00:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### GET `/api/transactions/balance/:userId`
Get user balance

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "userId": "user-uuid",
  "balance": "1250.75",
  "currency": "USD"
}
```

---

## Token Wallet

### GET `/api/tokens/balance/:userId`
Get token wallet balance

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "id": "wallet-uuid",
  "userId": "user-uuid",
  "balance": "1500.50",
  "tokenType": "ADVANCIA",
  "lockedBalance": "50.00",
  "lifetimeEarned": "2000.00",
  "createdAt": "2025-11-01T00:00:00.000Z",
  "updatedAt": "2025-11-08T00:00:00.000Z"
}
```

### GET `/api/tokens/history/:userId`
Get token transaction history

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response**: `200 OK`
```json
{
  "transactions": [
    {
      "id": "tx-uuid",
      "walletId": "wallet-uuid",
      "amount": "100.00",
      "type": "earn",
      "status": "completed",
      "description": "Reward claimed",
      "createdAt": "2025-11-08T00:00:00.000Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

### POST `/api/tokens/transfer`
Transfer tokens between users

**Authentication**: Required

**Request Body**:
```json
{
  "fromUserId": "user1-uuid",
  "toUserId": "user2-uuid",
  "amount": 50.00,
  "description": "Payment for services"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "transactionId": "tx-uuid",
  "message": "Transfer completed successfully"
}
```

**Error Responses**:
- `400`: Insufficient balance
- `404`: User not found
- `500`: Transfer failed

### POST `/api/tokens/withdraw`
Withdraw tokens to blockchain address

**Authentication**: Required

**Request Body**:
```json
{
  "userId": "user-uuid",
  "amount": 100.00,
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "transactionId": "tx-uuid",
  "amount": "100.00",
  "toAddress": "0x742d35Cc...",
  "status": "pending",
  "message": "Withdrawal initiated. Processing..."
}
```

**Error Responses**:
- `400`: Invalid address format or insufficient balance
- `404`: Wallet not found
- `500`: Withdrawal failed

### POST `/api/tokens/cashout`
Convert tokens to USD

**Authentication**: Required

**Request Body**:
```json
{
  "userId": "user-uuid",
  "amount": 100.00
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "transactionId": "tx-uuid",
  "tokensSpent": "100.00",
  "usdReceived": "10.00",
  "message": "Successfully cashed out $10.00!"
}
```

**Conversion Rate**: 1 token = $0.10 USD

---

## Rewards & Tiers

### GET `/api/rewards/:userId`
Get user rewards

**Authentication**: Required

**Query Parameters**:
- `status` (optional): Filter by status (pending|claimed|expired)
- `type` (optional): Filter by reward type

**Response**: `200 OK`
```json
{
  "rewards": [
    {
      "id": "reward-uuid",
      "type": "achievement",
      "amount": "50.00",
      "status": "pending",
      "title": "First Transaction",
      "description": "Completed your first transaction",
      "createdAt": "2025-11-08T00:00:00.000Z",
      "expiresAt": "2025-12-08T00:00:00.000Z"
    }
  ],
  "summary": {
    "total": "500.00",
    "pending": 3,
    "claimed": 15,
    "expired": 1
  }
}
```

### POST `/api/rewards/claim/:rewardId`
Claim a pending reward

**Authentication**: Required

**Request Body**:
```json
{
  "userId": "user-uuid"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "reward": {
    "id": "reward-uuid",
    "amount": "50.00",
    "status": "claimed",
    "claimedAt": "2025-11-08T00:00:00.000Z"
  },
  "newBalance": "1550.50",
  "message": "Reward claimed successfully!"
}
```

**Error Responses**:
- `400`: Reward already claimed or expired
- `403`: Unauthorized (not your reward)
- `404`: Reward not found

### GET `/api/rewards/tier/:userId`
Get user tier information

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "tier": {
    "id": "tier-uuid",
    "userId": "user-uuid",
    "currentTier": "gold",
    "points": 7500,
    "lifetimePoints": 12000,
    "lifetimeRewards": "350.00",
    "streak": 15,
    "longestStreak": 30,
    "totalReferrals": 5,
    "referralCode": "JOHN2025"
  },
  "nextTier": "platinum",
  "pointsToNextTier": 7500,
  "progress": 50.0
}
```

**Tier Levels**:
- Bronze: 0-999 points
- Silver: 1,000-4,999 points
- Gold: 5,000-14,999 points
- Platinum: 15,000-49,999 points
- Diamond: 50,000+ points

### POST `/api/rewards/tier/points`
Add points to user tier

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "userId": "user-uuid",
  "points": 100
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "newPoints": 7600,
  "newTier": "gold",
  "tierChanged": false
}
```

### GET `/api/rewards/leaderboard`
Get top players leaderboard

**Authentication**: Optional

**Query Parameters**:
- `limit` (optional): Number of results (default: 10, max: 100)

**Response**: `200 OK`
```json
{
  "leaderboard": [
    {
      "userId": "user1-uuid",
      "points": 75000,
      "currentTier": "diamond",
      "rank": 1
    },
    {
      "userId": "user2-uuid",
      "points": 50000,
      "currentTier": "platinum",
      "rank": 2
    }
  ]
}
```

---

## Users

### GET `/api/users/:userId`
Get user profile

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "usdBalance": "1250.75",
  "active": true,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### PUT `/api/users/:userId`
Update user profile

**Authentication**: Required

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "newemail@example.com"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "newemail@example.com",
    "firstName": "John",
    "lastName": "Smith"
  }
}
```

---

## Payments

### POST `/api/payments/checkout-session`
Create Stripe checkout session

**Authentication**: Required

**Request Body**:
```json
{
  "amount": 49.99,
  "currency": "usd",
  "metadata": {
    "userId": "user-uuid",
    "email": "user@example.com"
  }
}
```

**Response**: `200 OK`
```json
{
  "id": "cs_test_a1b2c3...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
}
```

**Error Response**:
- `503`: Stripe not configured (STRIPE_SECRET_KEY missing)

---

## Admin

### GET `/api/admin/users`
Get all users (admin only)

**Authentication**: Required (Admin role)

**Query Parameters**:
- `limit` (optional): Results per page
- `offset` (optional): Pagination offset
- `search` (optional): Search by email/username

**Response**: `200 OK`
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "USER",
      "active": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

### GET `/api/admin/stats`
Get platform statistics (admin only)

**Authentication**: Required (Admin role)

**Response**: `200 OK`
```json
{
  "users": {
    "total": 1500,
    "active": 1200,
    "new_today": 15
  },
  "transactions": {
    "total": 50000,
    "volume": "1250000.00",
    "today": 350
  },
  "tokens": {
    "total_supply": "500000.00",
    "in_circulation": "350000.00"
  }
}
```

---

## Error Responses

All endpoints may return these error codes:

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

---

## Rate Limiting

**Current Status**: Not implemented  
**Planned**: Phase 3

---

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:4000', {
  auth: { token: 'your-jwt-token' }
});
```

### Join User Room
```javascript
socket.emit('join-room', userId);
```

### Events (Server → Client)

**Transaction Created**
```javascript
socket.on('transaction-created', (transaction) => {
  console.log('New transaction:', transaction);
});
```

**Token Transfer**
```javascript
socket.on('token:transfer', (data) => {
  // data: { type, amount, to/from, transactionId }
});
```

**Token Withdrawal**
```javascript
socket.on('token:withdrawn', (data) => {
  // data: { amount, toAddress, transactionId, status }
});
```

**Token Cashout**
```javascript
socket.on('token:cashout', (data) => {
  // data: { tokensSpent, usdReceived, transactionId }
});
```

---

## Testing

### Using cURL

**Health Check**:
```bash
curl http://localhost:4000/health
```

**Login**:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Get Token Balance** (with auth):
```bash
curl http://localhost:4000/api/tokens/balance/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

Import the collection:
1. Create new collection "Advancia API"
2. Set base URL: `http://localhost:4000`
3. Add authorization header with token variable
4. Import endpoints from this documentation

---

## Changelog

### v1.0.0 (2025-11-08)
- ✅ Initial API documentation
- ✅ Token Wallet endpoints documented
- ✅ Rewards & Tier endpoints documented
- ✅ WebSocket events documented

---

**Documentation Version**: 1.0.0  
**Last Updated**: November 8, 2025  
**Maintained By**: Development Team

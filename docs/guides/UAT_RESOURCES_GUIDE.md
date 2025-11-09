# UAT Resources & Reference Guide

**Platform**: Advancia Pay Ledger  
**Date**: October 26, 2025  
**Document**: Complete UAT resource guide with all testing materials

---

## 📋 UAT Document Inventory

### Main Testing Documents

1. **UAT_TEST_PLAN.md** - Complete testing plan with all test cases

   - Scope & objectives
   - 4 new API endpoints
   - 3 frontend components
   - Real-time features
   - End-to-end flows

2. **UAT_EXECUTION_GUIDE.md** - Step-by-step testing procedures

   - Quick start (5 min health check)
   - Day 1-5 test schedules
   - Failure procedures
   - Go-live checklist
   - Rollback procedures

3. **FRONTEND_COMPONENT_UAT_CHECKLIST.md** - Detailed frontend test checklist

   - TokenWallet component tests
   - RewardsDashboard component tests
   - MedBeds component tests
   - Real-time functionality tests
   - Cross-browser testing
   - Accessibility testing

4. **Advancia_PAY_UAT_API_Tests.postman_collection.json** - Postman API test collection

   - Ready-to-import collection
   - All 4 new endpoints
   - Positive & negative test cases
   - Authentication setup

5. **backend/tests/uat-api-tests.ts** - Automated API tests (Jest)
   - 50+ test cases
   - Full coverage of new endpoints
   - Performance assertions
   - Integration tests

---

## 🎯 Testing Environment

### Production Endpoints

**Frontend**: https://advancia.pay  
**API Base**: https://api.advancia.pay (or Render domain)  
**WebSocket**: wss://api.advancia.pay/socket.io

### Local Development (if testing locally)

**Frontend**: http://localhost:3000  
**API Base**: http://localhost:4000  
**WebSocket**: ws://localhost:4000/socket.io

---

## 🔐 Test Account Setup

### Creating Test Accounts

1. **Admin Account** (for full access):

   - Email: `admin@advancia.pay`
   - Password: [Provided separately]
   - Role: Super Admin

2. **Test User 1** (standard user):

   - Email: `user1@advancia.pay`
   - Password: [Provided separately]
   - Tokens: 1000 (for testing)

3. **Test User 2** (standard user):

   - Email: `user2@advancia.pay`
   - Password: [Provided separately]
   - Tokens: 500 (for testing)

4. **High Balance User** (for stress testing):
   - Email: `whale@advancia.pay`
   - Password: [Provided separately]
   - Tokens: 10000 (for performance testing)

### Creating Custom Test Accounts

Via Frontend:

```
1. Visit https://advancia.pay/register
2. Enter email, password
3. Submit registration
4. Verify email
5. Login
```

Via API:

```bash
curl -X POST https://api.advancia.pay/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@advancia.pay",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

---

## 🧪 Testing Tools & Setup

### Required Tools

1. **Postman** (API Testing)

   - Download: https://www.postman.com/downloads/
   - Import collection: `Advancia_PAY_UAT_API_Tests.postman_collection.json`
   - Set up variables for your environment

2. **Browser Developer Tools** (Already available)

   - Chrome DevTools: F12 or Ctrl+Shift+I
   - Firefox Developer: F12
   - Safari Web Inspector: Cmd+Option+I

3. **curl** (Command-line API testing)

   ```bash
   # On Windows PowerShell: curl is available natively
   # On Mac/Linux: curl pre-installed
   ```

4. **Node.js** (for running Jest tests)

   ```bash
   # Check if installed
   node --version

   # Install if needed: https://nodejs.org/
   ```

### Optional Tools

- **k6** (Load testing) - https://k6.io/
- **Apache JMeter** (Performance testing) - https://jmeter.apache.org/
- **Charles Proxy** (Network debugging) - https://www.charlesproxy.com/

---

## 🚀 Quick Test Execution

### Run All API Tests (Jest)

```bash
cd backend
npm test -- tests/uat-api-tests.ts
```

Expected output:

```
PASS  tests/uat-api-tests.ts
  UAT: New API Endpoints
    POST /api/tokens/withdraw
      ✓ should withdraw tokens to valid Ethereum address
      ✓ should reject invalid Ethereum address
      ...
    POST /api/tokens/cashout
      ✓ should convert tokens to USD at $0.10/token
      ...
    GET /api/rewards/pending/:userId
      ✓ should return pending non-expired rewards
      ...
    GET /api/rewards/leaderboard
      ✓ should return top users ranked by rewards
      ...

Tests: 50+ passed
```

### Quick API Test (curl)

```bash
# Get leaderboard (5 seconds response time test)
time curl -s -H "Authorization: Bearer $TOKEN" \
  https://api.advancia.pay/api/rewards/leaderboard?limit=10 | jq '.leaderboard | length'

# Expected: response < 500ms
```

### Browser Console Test

```javascript
// Test WebSocket connection
io("wss://api.advancia.pay", { transports: ["websocket"] })
  .on("connect", () => console.log("✓ Connected"))
  .on("error", (e) => console.error("✗ Error:", e))
  .on("user-${userId}", (data) => console.log("✓ Event received:", data));
```

---

## 📊 Test Data Reference

### Ethereum Test Addresses

**Valid Addresses** (for testing withdrawals):

```
0x742d35Cc6634C0532925a3b844Bc91e8e1a81aB5  (Example 1)
0x8ba1f109551bD432803012645Ac136ddd64DBA72  (Example 2)
0x1234567890123456789012345678901234567890  (Example 3)
```

**Invalid Addresses** (for negative tests):

```
invalid-address
0x12345  (too short)
12345678901234567890123456789012345678901  (too long)
0xZZZ...  (invalid characters)
```

### Test Transaction Amounts

**Normal Amounts**:

- Withdraw: 100 tokens, 50 tokens, 25 tokens
- Cashout: 50 tokens ($5), 25 tokens ($2.50), 10 tokens ($1)

**Edge Cases**:

- Zero: 0 tokens (should fail)
- Negative: -50 tokens (should fail)
- Large: 10000 tokens (performance test)
- Fractional: 0.5 tokens (if supported)

### Sample Responses

#### Successful Withdraw

```json
{
  "status": 200,
  "data": {
    "transactionHash": "0xabcd1234...",
    "amount": 100,
    "ethAddress": "0x742d35Cc...",
    "status": "pending",
    "createdAt": "2025-10-26T12:00:00Z"
  }
}
```

#### Successful Cashout

```json
{
  "status": 200,
  "data": {
    "transactionId": "txn_abc123",
    "tokenAmount": 50,
    "usdAmount": 5.0,
    "status": "completed",
    "createdAt": "2025-10-26T12:00:00Z"
  }
}
```

#### Leaderboard Response

```json
{
  "status": 200,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "userId": "user_123",
        "userName": "John Doe",
        "totalRewards": 5000,
        "tier": "Platinum"
      },
      {
        "rank": 2,
        "userId": "user_456",
        "userName": "Jane Smith",
        "totalRewards": 4500,
        "tier": "Gold"
      }
    ],
    "total": 1000
  }
}
```

---

## 🔍 Debugging & Troubleshooting

### API Response Status Codes

| Code | Meaning                        | Action                  |
| ---- | ------------------------------ | ----------------------- |
| 200  | OK - Success                   | ✅ Test passed          |
| 400  | Bad Request - Invalid input    | Check input validation  |
| 401  | Unauthorized - No token        | Add auth token          |
| 403  | Forbidden - Insufficient perms | Check user role         |
| 404  | Not Found - Resource missing   | Check endpoint/ID       |
| 429  | Rate Limited                   | Wait & retry            |
| 500  | Server Error                   | Check backend logs      |
| 503  | Service Unavailable            | Check deployment status |

### Common Issues & Solutions

**Issue**: "Invalid auth token"

```bash
Solution:
1. Get new token via login endpoint
2. Copy exactly (no extra spaces)
3. Format: Authorization: Bearer TOKEN
```

**Issue**: "CORS error in browser"

```bash
Solution:
1. Check backend CORS config
2. Verify frontend URL in allowedOrigins
3. Restart backend: npm run dev
```

**Issue**: "WebSocket connection failed"

```bash
Solution:
1. Check firewall/proxy
2. Verify WSS (secure WebSocket) enabled
3. Check Socket.IO configuration
```

**Issue**: "Real-time updates not working"

```bash
Solution:
1. Verify Socket.IO connected (check DevTools)
2. Join room: io.emit('join-room', 'user-${userId}')
3. Check console for error messages
4. Restart backend
```

**Issue**: "Leaderboard query timeout"

```bash
Solution:
1. Reduce limit parameter: ?limit=10
2. Check database query performance
3. Verify indexes on leaderboard query
4. Check backend logs for slow queries
```

### Viewing Backend Logs

```bash
# Real-time logs from Render
gh run logs $(gh run list -L 1 --json databaseId | jq -r '.[0].databaseId')

# Filter for errors
gh run logs <run-id> | grep -i "error"

# Filter for specific endpoint
gh run logs <run-id> | grep -i "rewards/leaderboard"

# Last 100 lines
gh run logs <run-id> --limit 100
```

### Viewing Frontend Logs

Browser Console (F12 → Console tab):

```javascript
// See all logs
console.log("Current app state")

// See Socket.IO events
io.on('*', (event, ...args) => console.log(event, args))

// Monitor API calls
fetch(...).then(r => console.log('Response:', r))
```

---

## 📈 Performance Benchmarks

### Expected Response Times

| Endpoint                     | Target SLA | p95      | p99      |
| ---------------------------- | ---------- | -------- | -------- |
| POST /api/tokens/withdraw    | < 2000ms   | < 2500ms | < 3000ms |
| POST /api/tokens/cashout     | < 2000ms   | < 2500ms | < 3000ms |
| GET /api/rewards/pending     | < 500ms    | < 750ms  | < 1000ms |
| GET /api/rewards/leaderboard | < 500ms    | < 750ms  | < 1000ms |

### Page Load Times

| Page              | Target | Acceptable |
| ----------------- | ------ | ---------- |
| Frontend home     | < 3s   | < 4s       |
| Token wallet      | < 2s   | < 3s       |
| Rewards dashboard | < 2s   | < 3s       |
| MedBeds booking   | < 2s   | < 3s       |

### Real-Time Update Latency

| Update Type         | Target | Acceptable |
| ------------------- | ------ | ---------- |
| Balance update      | < 1s   | < 2s       |
| Leaderboard refresh | < 5s   | < 10s      |
| Reward notification | < 2s   | < 5s       |

---

## 📞 Support & Escalation

### Test Failures: Who to Contact

**API Failures**:

- Contact: Engineering Lead / Backend Developer
- Escalation: DevOps
- Time: Immediate if critical

**Frontend Failures**:

- Contact: Frontend Lead / UI Developer
- Escalation: Engineering Lead
- Time: Same day

**Real-Time Failures**:

- Contact: Backend Lead / DevOps
- Escalation: CTO
- Time: Immediate if impacting core feature

**Performance Issues**:

- Contact: DevOps / Database Admin
- Escalation: CTO
- Time: Within 1 hour

### Emergency Contact

**Incident Hotline**: [TBD]  
**Slack Channel**: #uat-testing  
**Email**: [TBD]

---

## ✅ Pre-Testing Checklist

Before starting UAT:

- [ ] All documents downloaded and reviewed
- [ ] Postman collection imported
- [ ] Test accounts created
- [ ] Network/VPN configured (if needed)
- [ ] Browser console understanding confirmed
- [ ] API tools available (curl, Postman)
- [ ] Backup of production data taken
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Rollback procedure documented

---

## 📋 Daily UAT Standup Template

```
Date: [Date]
Duration: 15 minutes
Attendees: [Names]

✅ Completed Today:
- [Test item 1]
- [Test item 2]

🚧 In Progress:
- [Test item 3]

⚠️ Blocked By:
- [Blocker description - if any]

📊 Metrics:
- Tests Passed: [X/Y]
- Tests Failed: [X/Y]
- Blocking Issues: [X]

👥 Next Steps:
- [Tomorrow's focus]
```

---

## 🎓 Quick Training

### For QA Testers

1. **Understanding API Requests**

   - What is REST API?
   - HTTP methods: GET, POST, PUT, DELETE
   - Request headers and body
   - Response codes and format

2. **Using Postman**

   - Variables and environment setup
   - Writing pre-request scripts
   - Testing response data
   - Batch running requests

3. **Browser Developer Tools**

   - Network tab: monitor API calls
   - Console tab: see errors
   - WebSocket tab: monitor real-time
   - Performance tab: measure load times

4. **Reporting Issues**
   - Clear description
   - Steps to reproduce
   - Expected vs actual result
   - Screenshots/video
   - Error messages from console

---

## 📚 Additional Resources

### Documentation

- **Backend API Docs**: `backend/README.md`
- **Frontend Docs**: `frontend/README.md`
- **Database Schema**: `backend/prisma/schema.prisma`
- **Deployment Guide**: Render dashboard

### Code References

- **New Endpoints**: `backend/src/routes/tokens.ts`, `backend/src/routes/rewards.ts`
- **Frontend Components**: `frontend/src/app/tokens/wallet.tsx`, `frontend/src/app/rewards/dashboard.tsx`
- **Socket.IO Setup**: `backend/src/index.ts` (search for "Socket.IO")
- **Database Queries**: `backend/src/services/`

### External Resources

- **Postman Docs**: https://learning.postman.com/
- **REST API Guide**: https://restfulapi.net/
- **Socket.IO Docs**: https://socket.io/docs/
- **Jest Testing**: https://jestjs.io/docs/getting-started

---

## 🎉 UAT Success Criteria

### Minimum Requirements

- ✅ 100% of API test cases pass
- ✅ 100% of frontend components render correctly
- ✅ 0 critical bugs in production
- ✅ Performance meets SLAs
- ✅ Real-time updates working
- ✅ RPA automation verified
- ✅ Product Owner sign-off obtained

### Nice to Have

- ✅ Cross-browser compatibility verified
- ✅ Mobile responsiveness tested
- ✅ Load testing completed
- ✅ Security testing passed
- ✅ Accessibility standards met

---

**Version**: 1.0  
**Last Updated**: October 26, 2025  
**Status**: READY FOR USE ✅

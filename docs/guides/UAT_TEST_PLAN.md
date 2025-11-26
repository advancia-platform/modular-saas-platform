# Advancia Pay Ledger - User Acceptance Testing (UAT) Plan

**Date**: October 26, 2025  
**Platform**: Production (Render)  
**Status**: Ready for UAT

---

## 1. Overview

This document outlines the comprehensive User Acceptance Testing (UAT) plan for the Advancia Pay Ledger platform, focusing on verifying that all newly implemented features work correctly in the production environment.

### Test Scope

- ✅ 4 new backend API endpoints
- ✅ 3 frontend components (TokenWallet, RewardsDashboard, MedBeds)
- ✅ Real-time updates (Socket.IO)
- ✅ RPA automation workflows
- ✅ End-to-end user flows
- ✅ System performance under load

### Out of Scope

- Infrastructure provisioning
- Security audits (covered separately)
- Compliance certification (SOC2, etc.)

---

## 2. New Features Being Tested

### 2.1 Backend Endpoints

| Endpoint                       | Method | Purpose                             | Status         |
| ------------------------------ | ------ | ----------------------------------- | -------------- |
| `/api/tokens/withdraw`         | POST   | Withdraw tokens to Ethereum address | ✅ Implemented |
| `/api/tokens/cashout`          | POST   | Convert tokens to USD               | ✅ Implemented |
| `/api/rewards/pending/:userId` | GET    | Fetch non-expired pending rewards   | ✅ Implemented |
| `/api/rewards/leaderboard`     | GET    | Fetch user rankings with tiers      | ✅ Implemented |

### 2.2 Frontend Components

| Component        | File                                     | Purpose                       | Status                   |
| ---------------- | ---------------------------------------- | ----------------------------- | ------------------------ |
| TokenWallet      | `frontend/src/app/tokens/wallet.tsx`     | Crypto wallet management      | ✅ Wired (5/5 endpoints) |
| RewardsDashboard | `frontend/src/app/rewards/dashboard.tsx` | Rewards display & progression | ✅ Wired (4/4 endpoints) |
| MedBeds          | `frontend/src/app/medbeds/book/page.tsx` | Health chamber booking        | ✅ Complete              |

### 2.3 Real-Time Features

- Socket.IO balance updates
- Reward notifications
- Leaderboard rank changes
- Transaction confirmations

---

## 3. Test Cases & Acceptance Criteria

### Category 1: API Endpoint Testing

#### 3.1.1 POST `/api/tokens/withdraw`

**Description**: Withdraw tokens to Ethereum address  
**Preconditions**: User authenticated, has token balance > 0  
**Test Steps**:

1. Send POST request with valid ETH address
2. Verify 200 response with transaction hash
3. Check token balance decreased
4. Verify Ethereum transaction pending

**Expected Results**:

- ✅ Response time < 2 seconds
- ✅ Balance updated in real-time
- ✅ Socket.IO event emitted to user room
- ✅ Transaction logged in audit trail

**Acceptance Criteria**:

- [ ] Withdrawal successful
- [ ] Blockchain transaction initiated
- [ ] Balance reflects immediately
- [ ] No duplicate transactions
- [ ] Error handling for invalid addresses

---

#### 3.1.2 POST `/api/tokens/cashout`

**Description**: Convert tokens to USD ($0.10/token)  
**Preconditions**: User authenticated, has token balance > 0  
**Test Steps**:

1. Send POST request with token amount
2. Verify 200 response with USD amount
3. Check token balance decreased
4. Verify USD credited to account

**Expected Results**:

- ✅ Response time < 2 seconds
- ✅ Calculation correct ($0.10 × token count)
- ✅ USD immediately credited
- ✅ Transaction recorded

**Acceptance Criteria**:

- [ ] Cashout successful
- [ ] Correct USD amount calculated
- [ ] Tokens removed from wallet
- [ ] USD balance updated
- [ ] Transaction receipt generated

---

#### 3.1.3 GET `/api/rewards/pending/:userId`

**Description**: Fetch non-expired pending rewards  
**Preconditions**: User has reward entries  
**Test Steps**:

1. Send GET request with valid user ID
2. Verify 200 response with reward array
3. Check expiration filtering
4. Verify amount calculations

**Expected Results**:

- ✅ Response time < 500ms
- ✅ Only non-expired rewards included
- ✅ Correct total amount calculated
- ✅ Proper sorting (by expiration date)

**Acceptance Criteria**:

- [ ] All non-expired rewards returned
- [ ] No expired rewards included
- [ ] Amounts correctly calculated
- [ ] Response properly formatted
- [ ] Pagination works if applicable

---

#### 3.1.4 GET `/api/rewards/leaderboard?limit=10`

**Description**: Fetch global user rankings  
**Preconditions**: Multiple users with rewards  
**Test Steps**:

1. Send GET request with limit parameter
2. Verify 200 response with user array
3. Check sorting (highest rewards first)
4. Verify tier badges included

**Expected Results**:

- ✅ Response time < 500ms
- ✅ Top 10 users returned (by default)
- ✅ Correct rank ordering
- ✅ Tier information included

**Acceptance Criteria**:

- [ ] Correct ranking order
- [ ] Tier badges accurate
- [ ] User names displayed
- [ ] Reward amounts correct
- [ ] Limit parameter respected

---

### Category 2: Frontend Component Testing

#### 3.2.1 TokenWallet Component

**Purpose**: Verify all wallet functionality works correctly

**Test Cases**:

- [ ] Display current balance correctly
- [ ] Show transaction history
- [ ] Execute transfer to another user
- [ ] Execute withdrawal to Ethereum
- [ ] Execute cashout to USD
- [ ] All endpoints connected
- [ ] Error messages display properly
- [ ] Real-time balance updates work

**Acceptance Criteria**:

- Balance always matches backend
- All 5 endpoints functional
- Loading states visible
- Error handling appropriate
- Socket.IO updates within 1 second

---

#### 3.2.2 RewardsDashboard Component

**Purpose**: Verify rewards display and progression

**Test Cases**:

- [ ] Display all non-expired pending rewards
- [ ] Show current tier and progress to next
- [ ] Display streak counter (if applicable)
- [ ] Show leaderboard rankings
- [ ] Claim reward button works
- [ ] Tier badge displays correctly
- [ ] Real-time rank updates

**Acceptance Criteria**:

- Pending rewards accurate
- Tier progression visible
- Leaderboard ordered correctly
- All 4 endpoints functional
- Socket.IO updates within 1 second

---

#### 3.2.3 MedBeds Component

**Purpose**: Verify booking interface

**Test Cases**:

- [ ] Date/time picker works
- [ ] Submit booking request
- [ ] Validation messages display
- [ ] Success confirmation shown
- [ ] Booking appears in dashboard

**Acceptance Criteria**:

- Form validation working
- Bookings saved to database
- User receives confirmation
- Real-time sync with backend

---

### Category 3: Real-Time Functionality

#### 3.3.1 Balance Updates

**Test Steps**:

1. Open 2 browser windows for same user
2. Execute withdraw in first window
3. Verify balance updates in second window within 1 second

**Acceptance Criteria**:

- [ ] Socket.IO event received
- [ ] DOM updated immediately
- [ ] No page refresh needed
- [ ] Both windows synchronized

---

#### 3.3.2 Reward Notifications

**Test Steps**:

1. Trigger reward earning event
2. Verify notification sent
3. Check socket broadcast to user room
4. Verify email sent (if configured)

**Acceptance Criteria**:

- [ ] Socket notification received
- [ ] Email sent
- [ ] Notification appears in UI
- [ ] User can dismiss/acknowledge

---

#### 3.3.3 Leaderboard Updates

**Test Steps**:

1. Execute action that changes rewards
2. Verify leaderboard refreshes
3. Check rank recalculation

**Acceptance Criteria**:

- [ ] Rankings updated within 5 seconds
- [ ] User position reflects correctly
- [ ] Top 10 recalculated accurately

---

### Category 4: RPA Automation

#### 3.4.1 Issue Auto-Triage

**Test Steps**:

1. Create new GitHub issue
2. Wait for automation
3. Verify label applied

**Expected Results**:

- [ ] Issue labeled within 1 second
- [ ] Correct category assigned
- [ ] Auto-response sent (if configured)

---

#### 3.4.2 Auto-Deploy Workflow

**Test Steps**:

1. Commit code to main
2. Wait for deployment
3. Verify live on Render

**Expected Results**:

- [ ] Deployment triggered automatically
- [ ] Tests pass
- [ ] Frontend deployed to Render
- [ ] Backend ready
- [ ] No manual intervention needed

---

#### 3.4.3 Health Checks

**Test Steps**:

1. Observe RPA auto-manager workflow
2. Check every 4-hour health check

**Expected Results**:

- [ ] Health check runs on schedule
- [ ] All services report healthy
- [ ] Alerts triggered if issues found

---

### Category 5: End-to-End User Flows

#### 3.5.1 Complete User Journey

**Flow**: Signup → Transfer Tokens → Earn Rewards → Check Leaderboard → Cashout

**Test Steps**:

1. Create new test user account
2. Login and navigate to TokenWallet
3. Perform token transfer
4. Navigate to RewardsDashboard
5. View pending rewards
6. Check leaderboard ranking
7. Execute cashout to USD
8. Verify all balances updated

**Acceptance Criteria**:

- [ ] All steps complete without errors
- [ ] Balances always accurate
- [ ] Real-time updates throughout
- [ ] No data inconsistencies
- [ ] User experience smooth

---

#### 3.5.2 Mobile User Flow

**Platform**: iOS & Android

**Test Steps**:

1. Access app on mobile device
2. Complete wallet transaction
3. Verify responsive design
4. Check touch interactions

**Acceptance Criteria**:

- [ ] App renders correctly
- [ ] All features accessible
- [ ] Touch events work properly
- [ ] No horizontal scrolling
- [ ] Performance acceptable on mobile

---

### Category 6: Performance & Load Testing

#### 3.6.1 Response Time SLAs

**Test**: Measure endpoint response times under normal load

| Endpoint                         | Target SLA | Tool          |
| -------------------------------- | ---------- | ------------- |
| GET /api/rewards/leaderboard     | < 500ms    | k6 or Postman |
| GET /api/rewards/pending/:userId | < 500ms    | k6 or Postman |
| POST /api/tokens/withdraw        | < 2s       | k6 or Postman |
| POST /api/tokens/cashout         | < 2s       | k6 or Postman |

**Acceptance Criteria**:

- [ ] 95th percentile < SLA
- [ ] 99th percentile < 2 × SLA
- [ ] No timeouts
- [ ] Consistent performance

---

#### 3.6.2 Concurrent Users Test

**Test**: 50 concurrent users executing transactions

**Expected Results**:

- [ ] All requests succeed
- [ ] No errors or timeouts
- [ ] Response times acceptable
- [ ] Database stable

---

#### 3.6.3 Leaderboard Query Performance

**Test**: Query 1000+ users for leaderboard

**Expected Results**:

- [ ] Response time < 1 second
- [ ] All data returned correctly
- [ ] Pagination working (if applicable)

---

### Category 7: Error Handling & Edge Cases

#### 3.7.1 Invalid Input Handling

**Test Cases**:

- [ ] Invalid Ethereum address in withdraw
- [ ] Negative token amount in cashout
- [ ] Invalid user ID in GET requests
- [ ] Missing required parameters

**Acceptance Criteria**:

- [ ] 400 Bad Request returned
- [ ] Error message descriptive
- [ ] No system errors logged
- [ ] State remains consistent

---

#### 3.7.2 Insufficient Balance

**Test Steps**:

1. User with 0 token balance attempts withdraw
2. Verify error response

**Acceptance Criteria**:

- [ ] 400 or 422 response
- [ ] Clear error message
- [ ] No transaction created
- [ ] Balance unchanged

---

#### 3.7.3 Database Connection Loss

**Test**: Simulate brief database connectivity issue

**Expected Results**:

- [ ] Error handled gracefully
- [ ] User sees retry option
- [ ] No data corruption
- [ ] Automatic reconnection

---

---

## 4. Test Environment

### 4.1 Production Endpoints

- **API Base**: `https://api.advancia.pay` (or current Render URL)
- **Frontend**: `https://advancia.pay` (or current Render URL)
- **WebSocket**: `wss://api.advancia.pay` (Socket.IO)

### 4.2 Test Accounts

- **Admin Account**: (provided separately)
- **Test User 1**: (create during testing)
- **Test User 2**: (create during testing)
- **High-Balance User**: (for performance testing)

### 4.3 Tools Required

- **API Testing**: Postman or curl
- **Load Testing**: k6 or Apache JMeter
- **Browser Testing**: Chrome, Firefox, Safari
- **Mobile Testing**: iOS Safari, Android Chrome
- **Monitoring**: Render dashboard, GitHub Actions

---

## 5. Test Execution Schedule

| Phase               | Duration | Dates     | Tester        |
| ------------------- | -------- | --------- | ------------- |
| Smoke Testing       | 1 day    | Oct 26-27 | QA Lead       |
| Functional Testing  | 2 days   | Oct 27-29 | QA Team       |
| Real-time Testing   | 1 day    | Oct 29    | QA + Dev      |
| Performance Testing | 1 day    | Oct 30    | DevOps + QA   |
| UAT Sign-off        | 1 day    | Oct 31    | Product Owner |

---

## 6. Success Criteria

### 6.1 Overall Success Metrics

- ✅ 100% of test cases passed
- ✅ 0 critical bugs found
- ✅ 0 high-severity bugs found
- ✅ Response times meet SLAs
- ✅ All components functional in production
- ✅ Real-time updates working correctly
- ✅ RPA automation verified operational

### 6.2 Defect Classification

- **Critical**: System down, data loss, security issue → Fix before UAT sign-off
- **High**: Feature broken, user data at risk → Fix before sign-off
- **Medium**: Feature partially working, workaround exists → Can defer to next release
- **Low**: Minor UI issue, cosmetic → Can defer to next release

---

## 7. Reporting & Sign-Off

### 7.1 Test Results Template

```
Test Case: [Name]
Status: [PASS/FAIL]
Severity: [If FAIL: Critical/High/Medium/Low]
Notes: [Details]
Screenshot: [If FAIL: Attach screenshot]
```

### 7.2 Final UAT Report

- Executive summary
- Test coverage (% of test cases)
- Defects by severity
- Recommendations
- Sign-off approval

### 7.3 Sign-Off Requirements

- [ ] All test cases executed
- [ ] All critical bugs fixed
- [ ] All high-severity bugs fixed
- [ ] Performance SLAs met
- [ ] Product Owner approves
- [ ] Go-live approved

---

## 8. Go-Live Checklist

- [ ] All UAT test cases passed
- [ ] Performance validated
- [ ] Backup procedures tested
- [ ] Rollback plan documented
- [ ] Support team trained
- [ ] Monitoring alerts configured
- [ ] Incident response plan ready
- [ ] Stakeholders notified

---

## 9. Post-UAT Monitoring

### 9.1 First Week Monitoring

- Real-time error rate tracking
- Response time monitoring
- User feedback collection
- RPA workflow verification

### 9.2 Metrics to Track

- API response times (p50, p95, p99)
- Error rates by endpoint
- User transaction volume
- System uptime %
- RPA automation success rate

### 9.3 Support Escalation

- Critical: Immediate escalation to DevOps
- High: Escalate to engineering
- Medium: Log for next sprint
- Low: Log for backlog

---

## 10. Contact & Escalation

| Role             | Name  | Email | Phone |
| ---------------- | ----- | ----- | ----- |
| QA Lead          | [TBD] | [TBD] | [TBD] |
| Product Owner    | [TBD] | [TBD] | [TBD] |
| DevOps Lead      | [TBD] | [TBD] | [TBD] |
| Engineering Lead | [TBD] | [TBD] | [TBD] |

---

## Appendix: Monitoring Commands

### Check API Health

```bash
curl -X GET https://api.advancia.pay/api/health
```

### View Recent Deployments

```bash
gh run list --limit 10
```

### Check RPA Workflows

```bash
gh run list --workflow "Advancia Auto Manager" --limit 5
```

### Monitor Real-Time Events

```
Connect to WebSocket: wss://api.advancia.pay/socket.io
Join room: user-${userId}
Listen for events: balance-update, reward-earned, rank-changed
```

---

## Document History

| Version | Date         | Author   | Changes                  |
| ------- | ------------ | -------- | ------------------------ |
| 1.0     | Oct 26, 2025 | AI Agent | Initial UAT plan created |

---

**Status: READY FOR TESTING** ✅

Next steps: Begin smoke testing with API endpoints.

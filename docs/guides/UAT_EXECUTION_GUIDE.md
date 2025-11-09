# UAT Execution Guide - Step by Step

**Document Date**: October 26, 2025  
**Platform**: Advancia Pay Ledger (Production)  
**Environment**: Render

---

## Quick Start - 5 Minute Health Check

### Step 1: Verify API is Running

```bash
curl https://api.advancia.pay/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-26T12:00:00Z",
  "uptime": 3600
}
```

### Step 2: Test Frontend Access

Open in browser:

```
https://advancia.pay
```

Expected: Frontend loads with no console errors

### Step 3: Quick WebSocket Test

Open browser DevTools → Network → WS

Create test account → Balance should update within 1 second

**If all three pass**: ✅ System is operational

---

## Day 1: Smoke Testing (4 Hours)

### Phase 1A: API Smoke Tests (45 min)

#### Setup

1. Download Postman collection: `Advancia_PAY_UAT_API_Tests.postman_collection.json`
2. Import into Postman
3. Set variables:
   - `api_url`: Your API endpoint (e.g., https://api.advancia.pay)
   - `auth_token`: Get from login endpoint
   - `user_id`: Get from login response

#### Test Sequence

**1. Authentication (5 min)**

```
POST /api/auth/register
POST /api/auth/login
Expected: 200 OK with auth token
```

**2. Token Withdraw (10 min)**

```
POST /api/tokens/withdraw (valid)
Expected: 200 OK, transactionHash, status: "pending"

POST /api/tokens/withdraw (invalid address)
Expected: 400 Bad Request with error

POST /api/tokens/withdraw (negative amount)
Expected: 400 Bad Request
```

**3. Token Cashout (10 min)**

```
POST /api/tokens/cashout (valid: 50 tokens)
Expected: 200 OK, usdAmount: 5.0, tokensSpent: 50

POST /api/tokens/cashout (zero amount)
Expected: 400 Bad Request

POST /api/tokens/cashout (negative amount)
Expected: 400 Bad Request
```

**4. Rewards Pending (10 min)**

```
GET /api/rewards/pending/{userId} (valid user)
Expected: 200 OK, array of rewards, totalAmount

GET /api/rewards/pending/{userId} (invalid user)
Expected: 404 Not Found
```

**5. Leaderboard (10 min)**

```
GET /api/rewards/leaderboard (default)
Expected: 200 OK, array of users sorted by rewards

GET /api/rewards/leaderboard?limit=5
Expected: 200 OK, max 5 users

GET /api/rewards/leaderboard?limit=100&offset=10
Expected: 200 OK, pagination working
```

### Phase 1B: Frontend Smoke Tests (45 min)

#### Access & Navigation

1. Open https://advancia.pay in Chrome
2. Create test account
3. Verify no console errors (F12)
4. Navigate to each main page:
   - [ ] Dashboard - loads without error
   - [ ] Wallet - displays balance
   - [ ] Rewards - displays rewards
   - [ ] Leaderboard - displays users
   - [ ] Bookings (MedBeds) - displays form

#### Component Visibility

- [ ] TokenWallet component renders
- [ ] RewardsDashboard component renders
- [ ] MedBeds booking form renders
- [ ] All buttons visible and clickable

#### Response Time Check

Use Chrome DevTools Network tab:

- [ ] Page load < 3 seconds
- [ ] API calls < 500ms (rewards/leaderboard)
- [ ] WebSocket connects < 2 seconds

**Smoke Test Report** - If any failures, STOP and escalate to engineering

---

## Day 2-3: Functional Testing (2 Days)

### Phase 2A: TokenWallet Functional Tests (4 Hours)

#### Test 1: Display & Balance

```
1. Login as test user
2. Navigate to Wallet
3. Check:
   - [ ] Current balance displays
   - [ ] Transaction history loads
   - [ ] Loading states appear
   - [ ] No JavaScript errors
```

**Expected**: All items checked, no errors

#### Test 2: Transfer Functionality

```
1. Click "Transfer Tokens" button
2. Enter valid recipient address
3. Enter amount (10 tokens)
4. Click Submit
5. Check:
   - [ ] Form validates input
   - [ ] Submit button loads
   - [ ] Success message appears
   - [ ] Balance decreases
   - [ ] Transaction in history
```

**Expected**: Transaction successful, balance updated

#### Test 3: Withdraw Functionality

```
1. Click "Withdraw" button
2. Enter valid ETH address (0x742d35Cc6634C0532925a3b844Bc91e8e1a81aB5)
3. Enter amount (50 tokens)
4. Click Submit
5. Check:
   - [ ] Form accepts ETH address
   - [ ] Amount validated
   - [ ] Submit triggers API
   - [ ] Loading shown
   - [ ] Success with tx hash
   - [ ] Balance updated
   - [ ] Real-time update (< 1 sec)
```

**Expected**: Withdrawal successful, balance reflects

#### Test 4: Cashout Functionality

```
1. Click "Cashout" button
2. Enter token amount (25 tokens)
3. Verify USD amount shows (should be $2.50)
4. Click Submit
5. Check:
   - [ ] USD calculation correct
   - [ ] Token balance decreases by 25
   - [ ] USD balance increases by 2.50
   - [ ] Transaction recorded
   - [ ] Success confirmation
```

**Expected**: Cashout successful, balances updated

#### Test 5: Real-Time Sync

```
1. Open wallet in 2 browser windows (same user)
2. Execute withdraw in window 1
3. Check window 2:
   - [ ] Balance updates within 1 second
   - [ ] No page refresh needed
   - [ ] Transaction appears
```

**Expected**: Real-time sync working

### Phase 2B: RewardsDashboard Functional Tests (4 Hours)

#### Test 1: Display & Rendering

```
1. Login and navigate to Rewards
2. Check:
   - [ ] Pending rewards display
   - [ ] Total amount calculated
   - [ ] Tier badge shows
   - [ ] Progress bar visible
   - [ ] Leaderboard loads
   - [ ] No errors
```

**Expected**: All components render correctly

#### Test 2: Pending Rewards

```
1. View pending rewards section
2. Check each reward:
   - [ ] Amount correct
   - [ ] Expiration date shown
   - [ ] Countdown timer accurate
   - [ ] Non-expired rewards only
3. Calculate total:
   - [ ] Total = sum of all rewards
```

**Expected**: Correct rewards displayed, accurate totals

#### Test 3: Claim Rewards

```
1. Click claim button on a reward
2. Check:
   - [ ] API call made
   - [ ] Loading state shown
   - [ ] Success notification
   - [ ] Reward removed from list
   - [ ] Balance updated
```

**Expected**: Reward claimed successfully

#### Test 4: Tier Progression

```
1. View tier section
2. Check:
   - [ ] Current tier displayed
   - [ ] Tier icon shows
   - [ ] Progress bar accurate
   - [ ] Amount to next tier shown
   - [ ] Percentage complete correct
```

**Expected**: Tier information accurate

#### Test 5: Leaderboard

```
1. View leaderboard section
2. Check:
   - [ ] Top 10 users display
   - [ ] Sorted by rewards (highest first)
   - [ ] User names visible
   - [ ] Tier badges show
   - [ ] Current user highlighted
   - [ ] Expand shows more users
```

**Expected**: Leaderboard correct and ordered

#### Test 6: Real-Time Leaderboard

```
1. Open leaderboard in 2 windows
2. Execute reward action in window 1
3. Check window 2:
   - [ ] Rankings update
   - [ ] Position changes reflected
   - [ ] Updates within 5 seconds
```

**Expected**: Real-time rank updates

### Phase 2C: MedBeds Functional Tests (2 Hours)

#### Test 1: Form Display

```
1. Navigate to MedBeds booking
2. Check:
   - [ ] Booking form visible
   - [ ] Date picker works
   - [ ] Time picker works
   - [ ] Duration selector works
   - [ ] Chamber options visible
   - [ ] Price displays
```

**Expected**: All form elements functional

#### Test 2: Booking Creation

```
1. Select future date
2. Select available time
3. Select duration (60 min)
4. Select chamber
5. Click Submit
6. Confirm booking details
7. Click Confirm
8. Check:
   - [ ] Success message
   - [ ] Booking reference
   - [ ] Booking in history
   - [ ] Confirmation email (if enabled)
```

**Expected**: Booking created successfully

#### Test 3: Availability

```
1. Check time slots
2. Book a slot
3. Refresh page
4. Check:
   - [ ] Booked slot now unavailable
   - [ ] Status shows "booked"
   - [ ] Cannot double-book
```

**Expected**: Availability accurate, no double-bookings

---

## Day 4: Performance Testing (4 Hours)

### Load Testing with k6 (if available) or Manual

#### Test 1: Endpoint Response Times

```bash
# Test leaderboard response time
time curl -H "Authorization: Bearer $TOKEN" \
  https://api.advancia.pay/api/rewards/leaderboard?limit=100
```

Expected:

- Withdraw: < 2 seconds
- Cashout: < 2 seconds
- Pending Rewards: < 500ms
- Leaderboard: < 500ms

#### Test 2: Concurrent Users

```
1. Create 5 test accounts
2. Have all login simultaneously
3. Check:
   - [ ] All logins succeed
   - [ ] No errors
   - [ ] Performance acceptable
```

Expected: All succeed without errors

#### Test 3: Real-Time Load

```
1. Have 3 users in dashboard
2. Execute 3 withdrawals simultaneously
3. Check:
   - [ ] All succeed
   - [ ] All balances update
   - [ ] Real-time sync works
```

Expected: No dropped updates or errors

#### Test 4: Large Leaderboard Query

```
1. Query leaderboard with limit=1000
2. Measure response time
3. Check:
   - [ ] Response < 1 second
   - [ ] All data returned
   - [ ] Properly formatted
```

Expected: Fast query, complete results

---

## Day 5: Integration & Automation (4 Hours)

### Phase 5A: End-to-End User Flow

#### Complete User Journey

```
1. Register new account
2. Add initial tokens (via admin or test mechanism)
3. Navigate to TokenWallet
4. Execute transfer (10 tokens to another user)
5. Navigate to RewardsDashboard
6. Claim pending reward
7. Check leaderboard ranking
8. Execute cashout (5 tokens = $0.50)
9. Verify final balances

Verify:
   - [ ] All steps complete
   - [ ] Balances always accurate
   - [ ] Real-time updates work
   - [ ] No data inconsistencies
   - [ ] User experience smooth
```

**Expected**: Seamless user journey, all features work

#### Mobile User Flow

```
On iOS Safari or Android Chrome:
1. Access https://advancia.pay
2. Create account
3. Execute withdraw
4. Check:
   - [ ] Responsive layout
   - [ ] Touch events work
   - [ ] Forms easy to fill
   - [ ] Performance acceptable
```

**Expected**: Mobile experience acceptable

### Phase 5B: RPA Automation Verification

#### Issue Auto-Triage

```
1. Create test GitHub issue
2. Wait 2 seconds
3. Check issue:
   - [ ] Label applied
   - [ ] Category correct
   - [ ] Auto-response (if enabled)
```

**Expected**: Automation triggered correctly

#### Auto-Deploy Workflow

```
1. Commit test change to main
2. Watch GitHub Actions
3. Verify:
   - [ ] Tests run
   - [ ] Build succeeds
   - [ ] Deployment triggered
   - [ ] Frontend updated on Render
```

**Expected**: Auto-deployment works

#### Health Checks

```
1. Check RPA manager workflow runs every 4 hours
2. Verify:
   - [ ] Health checks execute
   - [ ] All services healthy
   - [ ] No critical errors
```

**Expected**: Health checks passing

---

## Test Failure Procedures

### If API Test Fails

1. Check error message
2. Verify endpoint exists:
   ```bash
   curl -v https://api.advancia.pay/api/tokens/withdraw
   ```
3. Check backend logs:
   ```bash
   gh run logs <run-id> --limit 1000
   ```
4. If code issue: Fix → Push → Re-run
5. If configuration issue: Update env vars → Redeploy

### If Frontend Test Fails

1. Check browser console (F12)
2. Check Network tab for failed requests
3. If API call fails: Check API logs
4. If component error: Check VS Code for TypeScript errors
5. Clear cache: Ctrl+Shift+Delete
6. Test in incognito mode

### If Real-Time Test Fails

1. Check WebSocket connection (DevTools → Network → WS)
2. Verify Socket.IO connecting:
   ```
   Check console for "Socket connected" message
   ```
3. Check for firewall/proxy issues
4. Verify server Socket.IO enabled:
   ```bash
   gh run logs <backend-deploy> | grep -i "socket"
   ```

### Escalation

**Critical Issues** (system down, data loss):

- Immediate escalation to Engineering Lead
- Stop UAT
- Wait for fix

**High Issues** (feature broken):

- Log in Jira/GitHub
- Escalate to Engineering
- Can continue other tests

**Medium Issues** (workaround exists):

- Document
- Continue testing
- Fix in next iteration

**Low Issues** (cosmetic):

- Document
- Can defer
- Note for next release

---

## Sign-Off Checklist

Before marking UAT complete:

- [ ] **Day 1**: Smoke tests 100% passed
- [ ] **Day 2**: TokenWallet tests 100% passed
- [ ] **Day 3**: RewardsDashboard & MedBeds 100% passed
- [ ] **Day 4**: Performance tests met SLAs
- [ ] **Day 5**: End-to-end flows successful
- [ ] **RPA**: All automation verified working
- [ ] **Security**: No vulnerabilities found
- [ ] **Cross-browser**: Tested on Chrome, Firefox, Safari
- [ ] **Mobile**: Tested on iOS and Android
- [ ] **0 Critical bugs**: All fixed or waived
- [ ] **0 High bugs**: All fixed or waived
- [ ] **Product Owner**: Approves go-live

### Final Approval

**QA Lead Sign-Off**:

- Name: ********\_******** Date: **\_\_\_**
- Status: [ ] APPROVED [ ] APPROVED WITH WAIVERS [ ] REJECTED

**Product Owner Sign-Off**:

- Name: ********\_******** Date: **\_\_\_**
- Status: [ ] GO-LIVE [ ] HOLD [ ] ROLLBACK

---

## Go-Live Procedure

### 1 Hour Before Go-Live

```bash
# Verify deployments
gh run list --limit 5

# Check health
curl https://api.advancia.pay/api/health

# Verify database
gh run logs <latest-deploy> | grep -i "database.*ok"
```

### At Go-Live

1. Announce to support team
2. Monitor error rates
3. Watch user transactions
4. Be ready to rollback

### First 24 Hours

```bash
# Monitor API response times
watch -n 60 'curl -o /dev/null -s -w "%{time_total}\n" https://api.advancia.pay/api/health'

# Check error logs
gh run logs $(gh run list -L 1 --json databaseId | jq -r '.[0].databaseId')

# Monitor RPA workflows
gh run list --workflow "Advancia Auto Manager" --limit 5

# Track user issues
# (from support ticket system)
```

### First Week

- Daily health checks
- Monitor user feedback
- Track error rates
- Verify RPA automation
- Collect metrics

---

## Rollback Procedure (If Needed)

```bash
# Get last known good commit
git log --oneline | head -5

# Revert if critical issue
git revert HEAD --no-edit
git push

# Trigger deployment
# (Automatic via GitHub Actions)

# Verify rollback
curl https://api.advancia.pay/api/health
```

---

## Success Metrics

After 1 week of go-live:

- ✅ Error rate < 0.1%
- ✅ API response times meeting SLAs
- ✅ 0 critical production issues
- ✅ User adoption > 50% of test users
- ✅ RPA automation success rate > 99%
- ✅ No data inconsistencies
- ✅ Positive user feedback

If all met: **🎉 Launch successful!**

---

## Contact & Escalation

| Role        | Name  | Email | Slack |
| ----------- | ----- | ----- | ----- |
| QA Lead     | [TBD] | [TBD] | [TBD] |
| Engineering | [TBD] | [TBD] | [TBD] |
| DevOps      | [TBD] | [TBD] | [TBD] |
| Product     | [TBD] | [TBD] | [TBD] |

**Incident Hotline**: [TBD]

---

**Document Version**: 1.0  
**Last Updated**: October 26, 2025  
**Status**: READY FOR TESTING ✅

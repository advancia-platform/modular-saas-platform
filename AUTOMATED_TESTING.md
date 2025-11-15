# 🧪 Automated Alert Flow Testing - CI/CD Integration

## Overview

The `test-alert-flow.js` script provides **automated end-to-end testing** of the alert system. It can be run locally for manual testing or integrated into CI/CD pipelines for continuous verification.

---

## 🎯 What It Tests

The test validates the complete alert flow:

1. ✅ **Rate limit enforcement** - Backend returns HTTP 429 after threshold
2. ✅ **Alert sending** - Alerts triggered via configured channels
3. ✅ **Redis cooldowns** - Cooldown keys prevent duplicate alerts
4. ✅ **Duplicate suppression** - Additional requests during cooldown suppressed
5. ✅ **Audit log integrity** - Hash chain verification (tamper-evident)
6. ✅ **Environment configuration** - Required variables present

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis running (`redis-server`)
- Backend running (`npm run dev`)
- Environment variables configured (`.env`)

---

### Run Test Locally

```bash
cd backend

# Run test
node test-alert-flow.js
```

**Expected output**:

```
╔════════════════════════════════════════════════════╗
║  🚨 Alert Flow Integration Test                   ║
╚════════════════════════════════════════════════════╝

⚙️  Step 6: Checking environment configuration...
  ✓ Required variables configured
  ✓ Optional channels configured: 3/4
    - TWILIO_ACCOUNT_SID
    - SLACK_WEBHOOK_URL
    - SENTRY_DSN
  ✅ Environment check complete

📊 Step 1: Triggering rate limits...
  → Sent 3/12 requests...
  → Sent 6/12 requests...
  → Sent 9/12 requests...
  ✓ Rate limit hit at request 11 (HTTP 429)
  ✅ Rate limit enforced successfully

🔑 Step 2: Checking Redis cooldown keys...
  ✓ Found 1 cooldown key(s):
    - alert:cooldown:auth:test@example.com
  ✅ Redis cooldowns active

📋 Step 3: Checking alert history...
  ✓ Found 1 alert history key(s):
    - alert_history:auth: 1 alert(s)
  ✅ Alert history stored

🔒 Step 4: Testing duplicate alert suppression...
  → Triggering additional requests during cooldown...
  ✓ 5/5 requests rate-limited
  ℹ️  Cooldown should prevent duplicate alerts
  ✅ Duplicate suppression logic working

🔐 Step 5: Verifying audit log integrity...
  ✓ Audit log integrity verified (47 entries)
  ✅ Hash chain intact

╔════════════════════════════════════════════════════╗
║  ✅ ALERT FLOW TEST PASSED                        ║
╚════════════════════════════════════════════════════╝

🎉 All tests passed in 3.42s

📊 Test Results:
  ✅ rate Limit Triggered
  ✅ cooldowns Active
  ✅ alert History Stored
  ✅ duplicates Suppressed
  ✅ audit Integrity Valid
  ✅ environment Configured

✅ Alert system is production-ready!
   - Rate limiting enforced
   - Alerts sent via configured channels
   - Cooldowns prevent duplicate alerts
   - Audit logs tamper-evident
```

---

## 🔧 Configuration

### Environment Variables

The test checks for these variables:

**Required**:

- `EMAIL_USER` - SMTP username
- `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
- `REDIS_URL` - Redis connection string

**Optional** (for multi-channel alerts):

- `TWILIO_ACCOUNT_SID` - Twilio SMS
- `SLACK_WEBHOOK_URL` - Slack alerts
- `TEAMS_WEBHOOK_URL` - Teams alerts
- `SENTRY_DSN` - Sentry error tracking

---

### Test Configuration

Edit `test-alert-flow.js` to customize:

```javascript
// Configuration
const API_BASE = process.env.API_BASE || "http://localhost:4000";
const TEST_ENDPOINT = "/api/auth/login";
const THRESHOLD = 10; // Auth route group threshold
const TEST_REQUESTS = 12; // Exceeds threshold
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
```

**Variables**:

- `API_BASE`: Backend URL (default: `http://localhost:4000`)
- `TEST_ENDPOINT`: Route to test (default: `/api/auth/login`)
- `THRESHOLD`: Rate limit threshold (must match policy)
- `TEST_REQUESTS`: Number of requests to send (must exceed threshold)
- `COOLDOWN_MS`: Cooldown duration (must match policy)

---

## 🎨 CI/CD Integration

### GitHub Actions

Create `.github/workflows/test-alerts.yml`:

```yaml
name: Alert System Integration Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM UTC

jobs:
  test-alerts:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      postgres:
        image: postgres:14-alpine
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install backend dependencies
        working-directory: backend
        run: npm ci

      - name: Run database migrations
        working-directory: backend
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/testdb
        run: |
          npx prisma migrate deploy
          npx ts-node prisma/seed-alert-policies.ts

      - name: Start backend server (background)
        working-directory: backend
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
          EMAIL_USER: test@example.com
          SMTP_HOST: smtp.gmail.com
          NODE_ENV: test
        run: |
          npm run dev &
          echo $! > backend.pid
          sleep 10  # Wait for server to start

      - name: Run alert flow test
        working-directory: backend
        env:
          API_BASE: http://localhost:4000
        run: node test-alert-flow.js

      - name: Stop backend server
        if: always()
        run: |
          if [ -f backend/backend.pid ]; then
            kill $(cat backend/backend.pid) || true
          fi

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-logs
          path: backend/logs/
```

---

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test

test-alerts:
  stage: test
  image: node:18-alpine
  services:
    - redis:7-alpine
    - postgres:14-alpine
  variables:
    REDIS_URL: redis://redis:6379
    DATABASE_URL: postgresql://postgres:testpassword@postgres:5432/testdb
    POSTGRES_PASSWORD: testpassword
    POSTGRES_DB: testdb
    EMAIL_USER: test@example.com
    SMTP_HOST: smtp.gmail.com
  script:
    - cd backend
    - npm ci
    - npx prisma migrate deploy
    - npx ts-node prisma/seed-alert-policies.ts
    - npm run dev &
    - sleep 10
    - node test-alert-flow.js
  only:
    - main
    - develop
    - merge_requests
  artifacts:
    when: on_failure
    paths:
      - backend/logs/
```

---

### Jenkins Pipeline

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any

    environment {
        REDIS_URL = 'redis://localhost:6379'
        DATABASE_URL = 'postgresql://postgres:testpassword@localhost:5432/testdb'
        EMAIL_USER = 'test@example.com'
        SMTP_HOST = 'smtp.gmail.com'
    }

    stages {
        stage('Setup') {
            steps {
                sh 'docker run -d --name redis-test -p 6379:6379 redis:7-alpine'
                sh 'docker run -d --name postgres-test -e POSTGRES_PASSWORD=testpassword -e POSTGRES_DB=testdb -p 5432:5432 postgres:14-alpine'
                sh 'sleep 10'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Database Migration') {
            steps {
                dir('backend') {
                    sh 'npx prisma migrate deploy'
                    sh 'npx ts-node prisma/seed-alert-policies.ts'
                }
            }
        }

        stage('Start Backend') {
            steps {
                dir('backend') {
                    sh 'npm run dev &'
                    sh 'sleep 10'
                }
            }
        }

        stage('Run Alert Test') {
            steps {
                dir('backend') {
                    sh 'node test-alert-flow.js'
                }
            }
        }
    }

    post {
        always {
            sh 'docker stop redis-test postgres-test || true'
            sh 'docker rm redis-test postgres-test || true'
        }
        failure {
            archiveArtifacts artifacts: 'backend/logs/**', allowEmptyArchive: true
        }
    }
}
```

---

## 🐛 Troubleshooting

### Test Fails: "Rate limit was not triggered"

**Cause**: Threshold not exceeded or rate limiter not configured.

**Fix**:

1. Check `TEST_REQUESTS > THRESHOLD` in test config
2. Verify policy threshold in database:
   ```sql
   SELECT * FROM alert_policies WHERE route_group = 'auth';
   ```
3. Ensure rate limiter middleware applied to test endpoint

---

### Test Fails: "No cooldown keys found"

**Cause**: Redis not running or alerts not sent.

**Fix**:

1. Check Redis is running: `redis-cli ping` (should return `PONG`)
2. Check backend logs for alert sending errors
3. Verify environment variables for alert channels

---

### Test Fails: "Audit log integrity check failed"

**Cause**: Hash chain broken (tampering or migration issue).

**Fix**:

1. Re-run migration: `npx prisma migrate dev`
2. Clear existing logs (test environment only):
   ```sql
   TRUNCATE TABLE policy_audit_logs;
   ```
3. Re-seed policies: `npx ts-node prisma/seed-alert-policies.ts`

---

### CI/CD Fails: "Backend server not responding"

**Cause**: Server startup timeout too short.

**Fix**:

1. Increase sleep duration after starting backend (e.g., `sleep 20`)
2. Add health check loop:
   ```bash
   for i in {1..30}; do
     curl -f http://localhost:4000/api/health && break
     sleep 1
   done
   ```

---

## 📊 Test Metrics

### Performance Benchmarks

**Expected durations** (local):

- Rate limit triggering: ~1-2 seconds
- Redis checks: ~0.1 seconds
- Duplicate suppression: ~0.5 seconds
- Integrity verification: ~0.2 seconds
- **Total**: 3-5 seconds

**Expected durations** (CI/CD):

- Setup (Redis + Postgres): ~10-15 seconds
- Dependencies: ~20-30 seconds
- Migration + seeding: ~5 seconds
- Backend startup: ~10 seconds
- Test execution: ~5 seconds
- **Total**: 50-65 seconds

---

### Success Rate

**Target**: ≥99% success rate over 30 days

**Monitoring**:

```bash
# Check CI/CD success rate (GitHub Actions)
gh run list --workflow test-alerts.yml --limit 100 --json conclusion | jq '[.[] | select(.conclusion=="success")] | length'
```

---

## ✅ Best Practices

### Local Development

- ✅ Run test before pushing commits
- ✅ Test against local Redis/Postgres
- ✅ Check logs for detailed error info

### CI/CD Integration

- ✅ Run on every PR (pre-merge validation)
- ✅ Run nightly (catch environmental issues)
- ✅ Fail fast (stop pipeline on test failure)
- ✅ Archive logs on failure (for debugging)

### Production Monitoring

- ✅ Run weekly in staging (smoke test)
- ✅ Alert on consecutive failures (>3)
- ✅ Track metrics (duration, success rate)

---

## 🎯 Next Steps

1. **Integrate into CI/CD**: Add workflow file for your platform
2. **Set up monitoring**: Track test metrics in Grafana/Datadog
3. **Customize tests**: Add tests for specific channels (SMS, Slack)
4. **Expand coverage**: Test more route groups (admin, payments, crypto)

---

## 📚 Related Documentation

- [ALERT_POLICY_SETUP.md](./ALERT_POLICY_SETUP.md) - Initial setup guide
- [ALERT_POLICY_MANAGEMENT.md](./ALERT_POLICY_MANAGEMENT.md) - Full system docs
- [AUDIT_LOG_INTEGRITY.md](./AUDIT_LOG_INTEGRITY.md) - Hash chain verification
- [SECURITY_HARDENING.md](./SECURITY_HARDENING.md) - Security controls

---

**Last Updated**: 2025-01-15  
**Next Review**: 2025-04-15 (Quarterly)

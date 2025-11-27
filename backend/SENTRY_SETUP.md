# Sentry Error Tracking - Setup Guide

Complete guide to implementing Sentry error tracking for production-grade error monitoring.

---

## 🎯 Overview

Sentry provides real-time error tracking with:

- **Stack traces** - See exactly where errors occur
- **Request context** - HTTP headers, body, user info
- **Release tracking** - Know which version caused errors
- **Performance monitoring** - Identify slow endpoints
- **Breadcrumbs** - Debug trail leading to errors
- **Slack/Email alerts** - Get notified immediately

---

## 📦 Installation

Already installed! Dependencies added:

```bash
npm install @sentry/node @sentry/tracing @sentry/profiling-node
```

**Packages:**

- `@sentry/node` - Core Sentry SDK
- `@sentry/tracing` - Performance monitoring
- `@sentry/profiling-node` - CPU profiling

---

## 🔧 Configuration

### Step 1: Get Sentry DSN

1. **Create free account**: <https://sentry.io/signup/>
2. **Create new project**: Choose "Node.js" platform
3. **Copy DSN**: Format: `https://xxxxx@o123456.ingest.sentry.io/7654321`

### Step 2: Add DSN to Environment

**Development (.env):**

```bash
# Optional - Sentry disabled if not set
SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/7654321
NODE_ENV=development
APP_VERSION=1.0.0
```

**Production (Render/Heroku/etc):**
Add environment variable in hosting platform:

- Key: `SENTRY_DSN`
- Value: Your DSN from Sentry dashboard

### Step 3: Verify Integration

**Backend already configured!** Integration added to `src/index.js`:

```javascript
import {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
} from "./utils/sentry.js";

// Initialize Sentry FIRST
initSentry();

// Add middleware
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

// ... your routes ...

// Error handler (before other error handlers)
app.use(sentryErrorHandler());
```

---

## 🚀 Usage

### Automatic Error Capture

Sentry automatically captures:

- ✅ Uncaught exceptions
- ✅ Unhandled promise rejections
- ✅ Express route errors
- ✅ Middleware errors

**No code changes needed!** Just deploy and errors will appear in Sentry.

### Manual Error Capture

**In route handlers:**

```javascript
import { captureError } from "../utils/sentry.js";

app.post("/api/payment", async (req, res) => {
  try {
    const payment = await processPayment(req.body);
    res.json({ success: true, payment });
  } catch (error) {
    // Capture with context
    captureError(error, {
      tags: { feature: "payment", method: "stripe" },
      extra: { amount: req.body.amount, userId: req.user.id },
      user: { id: req.user.id, email: req.user.email },
      level: "error",
    });
    res.status(500).json({ error: "Payment failed" });
  }
});
```

**Capture messages (non-errors):**

```javascript
import { captureMessage } from "../utils/sentry.js";

// Log important events
captureMessage("Large transaction processed", "warning");
captureMessage("User upgrade successful", "info");
```

**Add debugging breadcrumbs:**

```javascript
import { addBreadcrumb } from "../utils/sentry.js";

app.post("/api/checkout", async (req, res) => {
  addBreadcrumb("Checkout started", { cartValue: req.body.total });

  await validateCart(req.body.items);
  addBreadcrumb("Cart validated", { itemCount: req.body.items.length });

  await processPayment(req.body.payment);
  addBreadcrumb("Payment processed", { method: req.body.payment.method });

  res.json({ success: true });
});
```

**Track user context:**

```javascript
import { setUser, clearUser } from "../utils/sentry.js";

// On login
app.post("/api/auth/login", async (req, res) => {
  const user = await authenticate(req.body);

  // Associate errors with this user
  setUser({ id: user.id, email: user.email, username: user.username });

  res.json({ token: generateToken(user) });
});

// On logout
app.post("/api/auth/logout", (req, res) => {
  clearUser();
  res.json({ success: true });
});
```

---

## 🔔 Slack Alerts Setup

### Step 1: Connect Slack

1. Go to **Sentry Project → Settings → Integrations**
2. Find **Slack** → Click **Add to Slack**
3. Authorize Sentry to access your workspace
4. Choose channel (e.g., `#backend-alerts`)

### Step 2: Create Alert Rules

**Navigate to:** Project → Alerts → Create Alert Rule

#### Example Rule 1: High Error Rate

```
Name: High Error Rate Alert
Conditions:
  - Error count > 10 in 1 minute
Actions:
  - Send Slack notification to #backend-alerts
  - Send email to team@advancia.com
```

#### Example Rule 2: Critical Errors Only

```
Name: Critical Errors Alert
Conditions:
  - Error level is "fatal" OR "critical"
  - Environment is "production"
Actions:
  - Send Slack notification to #backend-alerts
  - Create PagerDuty incident (optional)
```

#### Example Rule 3: New Error Types

```
Name: New Error Detected
Conditions:
  - An error is first seen
  - Environment is "production"
Actions:
  - Send Slack notification to #backend-alerts
```

#### Example Rule 4: User Impact

```
Name: High User Impact
Conditions:
  - More than 50 users affected in 5 minutes
Actions:
  - Send Slack notification to #backend-alerts
  - Send email to engineering@advancia.com
```

### Step 3: Configure Alert Frequency

**Project Settings → Alerts → General:**

- **Minimum interval**: 5 minutes (prevents spam)
- **Digest frequency**: Daily summary at 9 AM
- **Resolve notifications**: Yes (notify when fixed)

---

## 🎯 Alert Rules Best Practices

### ✅ DO: Smart Alerting

**Rate-based alerts:**

```
If error count > 5 in 1 minute → Alert
If error count > 20 in 5 minutes → Alert
```

**User impact alerts:**

```
If > 10 unique users affected → Alert
```

**Environment filtering:**

```
Only production errors → Slack alerts
Development errors → Sentry dashboard only
```

**Error severity:**

```
Fatal/Critical → Immediate Slack alert
Error → Slack if > 5 occurrences
Warning → Daily digest only
```

### ❌ DON'T: Noisy Alerting

**Avoid:**

- Alerting on every single error
- Alerting on expected errors (validation failures)
- Alerting on test environments
- Alerting on health check failures

**Example: Filter out noise**

```javascript
// In src/utils/sentry.js
beforeSend(event, hint) {
  // Ignore health checks
  if (event.request?.url?.includes("/api/health")) {
    return null;
  }

  // Ignore client disconnects
  if (hint.originalException?.message?.includes("ECONNRESET")) {
    return null;
  }

  // Ignore validation errors (handle these in app)
  if (hint.originalException?.name === "ValidationError") {
    return null;
  }

  return event;
}
```

---

## 📊 Sentry Dashboard

### Key Metrics

**Issues Tab:**

- Active errors grouped by type
- Error frequency over time
- User impact (how many users affected)
- First seen / Last seen timestamps

**Performance Tab:**

- Slowest endpoints
- Average response time
- Throughput (requests/sec)
- Database query performance

**Releases Tab:**

- Which version introduced errors
- Error trends by release
- Deployment impact analysis

### Useful Filters

**Filter by environment:**

```
environment:production
```

**Filter by user:**

```
user.email:admin@advancia.com
```

**Filter by error type:**

```
error.type:DatabaseError
```

**Filter by URL:**

```
url:*/api/payment/*
```

**Combine filters:**

```
environment:production AND error.type:TypeError
```

---

## 🔍 Debugging with Sentry

### Example Error Event

**What Sentry captures:**

```json
{
  "error": {
    "type": "TypeError",
    "value": "Cannot read property 'amount' of undefined",
    "stacktrace": [
      "at processPayment (payment.js:45)",
      "at async POST /api/payment (routes.js:123)"
    ]
  },
  "request": {
    "url": "https://api.advancia.com/api/payment",
    "method": "POST",
    "headers": {
      "authorization": "Bearer xxx",
      "content-type": "application/json"
    },
    "data": {
      "amount": 100,
      "currency": "USD"
    }
  },
  "user": {
    "id": "user_123",
    "email": "customer@example.com",
    "username": "johndoe"
  },
  "tags": {
    "environment": "production",
    "feature": "payment",
    "method": "stripe"
  },
  "breadcrumbs": [
    { "message": "User logged in", "timestamp": "2025-11-14T10:00:00Z" },
    { "message": "Cart validated", "timestamp": "2025-11-14T10:00:05Z" },
    { "message": "Payment started", "timestamp": "2025-11-14T10:00:10Z" }
  ]
}
```

**This tells you:**

- ✅ Exact error type and message
- ✅ Full stack trace with line numbers
- ✅ Request details (URL, method, headers, body)
- ✅ Which user experienced it
- ✅ Context tags (feature, environment)
- ✅ Actions leading up to error

---

## 🚦 Integration with Monitoring Stack

### Layer 1: PM2 (Process Management)

```
PM2 keeps backend alive
└── Auto-restarts on crashes
└── Memory management
└── Health checks
```

### Layer 2: Watchdog (Availability Monitoring)

```
Watchdog monitors /api/health
└── Detects downtime
└── Slack/Email alerts
└── Restart triggers
```

### Layer 3: Sentry (Error Tracking) ← NEW

```
Sentry captures errors with context
└── Stack traces
└── User information
└── Performance metrics
└── Slack alerts on high error rates
```

### Layer 4: Logs (Historical Analysis)

```
parse-watchdog.ps1 analyzes trends
└── Daily summaries
└── Uptime statistics
└── CSV reports
```

---

## 📈 Sentry Free Tier Limits

**Free Plan Includes:**

- ✅ 5,000 errors/month
- ✅ 10,000 performance events/month
- ✅ 1 team member
- ✅ 30-day data retention
- ✅ All integrations (Slack, email, webhooks)

**Paid Plans:**

- **Developer**: $26/month - 50K errors
- **Team**: $80/month - 100K errors + advanced features
- **Business**: Custom pricing - unlimited errors

**For MVP**: Free tier is plenty! 5K errors/month = 166/day = 7/hour.

---

## 🎯 Recommended Setup Timeline

### Now (MVP Stage) ✅ COMPLETED

- ✅ Install Sentry SDK
- ✅ Add DSN to environment
- ✅ Integrate in `src/index.js`
- ✅ Create `src/utils/sentry.js`

### Before Launch (Pre-Production)

- 📦 Create Sentry project
- 📦 Add production DSN to hosting
- 📦 Connect Slack workspace
- 📦 Create 2-3 basic alert rules

### After Launch (Production)

- 🔔 Monitor Sentry dashboard daily
- 🔔 Adjust alert thresholds based on traffic
- 🔔 Add user context in auth routes
- 🔔 Add breadcrumbs to critical flows

### Scaling (6-12 months)

- 📊 Enable performance monitoring
- 📊 Track custom metrics
- 📊 Create release tracking workflow
- 📊 Upgrade to paid plan if needed

---

## 🧪 Testing Sentry Integration

### Test 1: Trigger Test Error

**Add test route:**

```javascript
// In src/index.js (remove after testing)
app.get("/api/test-sentry", (req, res) => {
  throw new Error("Test error for Sentry!");
});
```

**Trigger:**

```bash
curl http://localhost:4000/api/test-sentry
```

**Check:** Error should appear in Sentry dashboard within seconds.

### Test 2: Verify Context Capture

```javascript
app.get("/api/test-sentry-context", (req, res) => {
  captureError(new Error("Test with context"), {
    tags: { test: true, feature: "testing" },
    extra: { timestamp: Date.now(), request: req.path },
    user: { id: "test_user", email: "test@example.com" },
  });
  res.json({ message: "Error sent to Sentry" });
});
```

**Check:** Error in Sentry should have tags, extra data, and user info.

### Test 3: Test Slack Alerts

1. Create alert rule: "If any error occurs"
2. Trigger test error
3. Check Slack channel within 1 minute

---

## 📚 Quick Commands

```bash
# Check Sentry integration
curl http://localhost:4000/api/test-sentry

# View backend logs
pm2 logs advancia-backend

# Check if Sentry is initialized
pm2 logs advancia-backend | grep "Sentry"
# Expected: "Sentry initialized for production environment"

# Monitor errors in real-time
# Open: https://sentry.io/organizations/YOUR_ORG/issues/
```

---

## 🔧 Configuration Reference

### Environment Variables

```bash
# Required for Sentry to work
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/7654321

# Optional - defaults to "development"
NODE_ENV=production

# Optional - for release tracking
APP_VERSION=1.0.0
```

### Sentry Config Options

**In `src/utils/sentry.js`:**

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sample 10% of transactions in production (reduce cost)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Sample 10% of profiles in production
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Release version
  release: process.env.APP_VERSION || "1.0.0",

  // Filter events before sending
  beforeSend(event, hint) {
    // Custom filtering logic
    return event;
  },
});
```

---

## ✅ Summary

**What You Have Now:**

- ✅ Sentry SDK installed
- ✅ Integration in `src/index.js`
- ✅ Utility functions in `src/utils/sentry.js`
- ✅ Automatic error capture
- ✅ Global error handlers
- ✅ Request context capture
- ✅ Ready for Slack alerts

**What You Need:**

- 📦 Sentry account (free)
- 📦 DSN added to `.env`
- 📦 Slack integration (5 minutes)
- 📦 Alert rules (10 minutes)

**Benefits:**

- 🎯 Never miss critical errors
- 🎯 Debug with full context
- 🎯 Alert team on high error rates
- 🎯 Track errors by release version
- 🎯 Monitor performance automatically

---

## 📞 Resources

- **Sentry Docs**: <https://docs.sentry.io/platforms/node/>
- **Alert Rules**: <https://docs.sentry.io/product/alerts/>
- **Slack Integration**: <https://docs.sentry.io/product/integrations/slack/>
- **Best Practices**: <https://docs.sentry.io/product/best-practices/>

---

**Ready to deploy! Backend now has enterprise-grade error tracking. 🚀**

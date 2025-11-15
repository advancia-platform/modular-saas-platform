# 🚨 Multi-Channel Alert System

Complete guide to the alert notification system for rate limit abuse monitoring.

## 📋 Overview

The alert system provides proactive notifications when rate limit thresholds are exceeded. It supports multiple notification channels and integrates seamlessly with the rate limiter, Sentry monitoring, and WebSocket real-time updates.

### Key Features

- **Multi-Channel Notifications**: Email, SMS, Slack, Teams, WebSocket, Sentry
- **Configurable Policies**: Different thresholds and channels per route group
- **Alert Cooldowns**: Prevents alert spam with configurable cooldown periods
- **Alert History**: Stores alerts in Redis for forensic analysis
- **Severity Levels**: Critical, High, Medium, Low classification
- **Real-Time Dashboard**: View alerts and trends in admin panel

---

## 🏗️ Architecture

### Components

1. **Alert Policy Configuration** (`backend/src/config/alertPolicy.ts`)

   - Defines thresholds, channels, and severity per route group
   - Configurable cooldown periods to prevent spam
   - Easy to extend with new route groups

2. **Alert Service** (`backend/src/services/alertService.ts`)

   - Multi-channel delivery (email, SMS, Slack, Teams, Sentry)
   - Alert history tracking in Redis
   - Cooldown management
   - Error handling with Sentry fallback

3. **Rate Limiter Integration** (`backend/src/middleware/rateLimiterRedis.ts`)

   - Automatic alert triggering based on policies
   - Threshold checking independent of rate limits
   - WebSocket broadcasting for real-time updates

4. **API Endpoints** (`backend/src/routes/users.ts`)
   - `/api/admin/alert-history` - Retrieve alert history
   - `/api/admin/rate-limits` - View offenders
   - `/api/admin/rate-limit-trends` - Trend data
   - `/api/admin/global-trends` - System-wide patterns

---

## ⚙️ Configuration

### Alert Policies

Edit `backend/src/config/alertPolicy.ts` to customize:

```typescript
export const alertPolicies: AlertPolicies = {
  auth: {
    threshold: 10, // Trigger after 10 requests
    channels: ["email", "sms", "slack", "websocket", "sentry"],
    cooldown: 5 * 60 * 1000, // 5 minutes
    severity: "critical",
  },
  admin: {
    threshold: 20,
    channels: ["email", "sms", "slack", "websocket", "sentry"],
    cooldown: 10 * 60 * 1000, // 10 minutes
    severity: "high",
  },
  // ... more policies
};
```

### Environment Variables

Required for alert channels:

```bash
# Email Alerts (via SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ALERT_EMAIL=admin@yourcompany.com
ALERT_FROM_EMAIL=alerts@yourcompany.com

# SMS Alerts (via Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
ALERT_FROM_PHONE=+1234567890
ALERT_TO_PHONE=+1987654321

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Teams Alerts
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/YOUR/WEBHOOK/URL

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Redis (for alert history)
REDIS_URL=redis://localhost:6379
```

---

## 📧 Notification Channels

### 1. Email Alerts

- **Provider**: SMTP (Gmail, SendGrid, etc.)
- **Format**: HTML with severity color coding
- **Content**: Identifier, group, count, severity, path, timestamp
- **Fallback**: Sentry logs failures

**Example Email**:

```
Subject: 🚨 [Rate Limit Alert] AUTH - CRITICAL

🚨 Rate Limit Alert
Threshold Exceeded

Route Group: auth
Identifier: 192.168.1.100
Request Count: 15
Severity: CRITICAL
Path: /api/auth/login
Timestamp: 2025-11-15T14:30:00.000Z

This alert was triggered because the request count exceeded
the configured threshold for the auth route group.
```

### 2. SMS Alerts

- **Provider**: Twilio
- **Format**: Concise text message
- **Content**: Identifier, group, count, severity
- **Fallback**: Sentry logs failures

**Example SMS**:

```
🚨 ALERT: 192.168.1.100 exceeded threshold in auth
with 15 requests (CRITICAL)
```

### 3. Slack Alerts

- **Provider**: Slack Incoming Webhooks
- **Format**: Rich blocks with color coding
- **Content**: Header, fields, context
- **Features**: Clickable links, timestamps

**Example Slack Message**:

```
🚨 Rate Limit Alert - AUTH

Identifier: 192.168.1.100
Request Count: 15
Route Group: auth
Severity: CRITICAL

Timestamp: Nov 15, 2025 2:30 PM
```

### 4. Teams Alerts

- **Provider**: Teams Incoming Webhooks
- **Format**: Adaptive Cards
- **Content**: Title, fact set
- **Features**: Formatted, collapsible

### 5. WebSocket Real-Time

- **Event**: `rateEvent`
- **Payload**: `{ group, identifier, count, exceeded, timestamp }`
- **Usage**: Real-time dashboard updates
- **No Configuration Required**

### 6. Sentry Logging

- **Level**: Based on severity (fatal, error, warning)
- **Tags**: `type: security`, `event: rate_limit_alert`, `routeGroup`
- **Extra**: Full alert context
- **Features**: Stack traces, breadcrumbs, user context

---

## 🎯 Usage Examples

### Viewing Alert History

```bash
# Get alerts for auth group
GET /api/admin/alert-history?group=auth&limit=50

Response:
{
  "success": true,
  "group": "auth",
  "alerts": [
    {
      "identifier": "192.168.1.100",
      "group": "auth",
      "count": 15,
      "path": "/api/auth/login",
      "method": "POST",
      "timestamp": 1700056200000
    }
  ],
  "total": 1
}
```

### Monitoring Trends

```bash
# Get offender trends
GET /api/admin/rate-limit-trends?group=auth&identifier=192.168.1.100&minutesBack=60

# Get global trends
GET /api/admin/global-trends?group=auth&minutesBack=60
```

### Clearing Rate Limits

```bash
POST /api/admin/rate-limits/clear
Body: {
  "group": "auth",
  "identifier": "192.168.1.100"
}
```

---

## 🔍 Alert Policy Reference

### Route Groups

| Group          | Threshold | Cooldown | Severity | Channels                        |
| -------------- | --------- | -------- | -------- | ------------------------------- |
| `auth`         | 10        | 5 min    | Critical | All                             |
| `auth-strict`  | 8         | 3 min    | Critical | All                             |
| `admin`        | 20        | 10 min   | High     | All except Teams                |
| `payments`     | 15        | 5 min    | Critical | All                             |
| `crypto`       | 15        | 10 min   | High     | Email, Slack, WebSocket, Sentry |
| `transactions` | 30        | 15 min   | Medium   | Email, Slack, WebSocket, Sentry |
| `users`        | 50        | 15 min   | Medium   | Email, WebSocket, Sentry        |
| `api`          | 100       | 30 min   | Low      | Email, WebSocket, Sentry        |
| `general`      | 80        | 30 min   | Low      | Email, Sentry                   |

### Severity Levels

- **Critical**: 💀 Immediate threat (brute force, financial abuse)
- **High**: 🔴 Serious concern (admin access attempts)
- **Medium**: 🚨 Moderate issue (API abuse)
- **Low**: ⚠️ Minor concern (general traffic)

---

## 🎨 Dashboard Integration

### Real-Time Monitoring

The admin dashboard at `/admin/rate-limits` shows:

1. **Statistics Cards**

   - Total violations
   - Unique offenders
   - User accounts
   - IP addresses

2. **Route Group Filter**

   - Click groups to view specific data
   - Badge shows offender count

3. **Offenders Table**

   - Type (user/IP)
   - Identifier
   - Violation count
   - Clear action button

4. **Trend Charts** (coming soon)
   - Global traffic over time
   - Per-offender patterns
   - Real-time WebSocket updates

### Alert Notifications

When an alert is triggered:

1. All configured channels receive notification
2. Dashboard shows real-time toast notification (if admin is online)
3. WebSocket event updates charts immediately
4. Alert stored in Redis history (24-hour retention)
5. Sentry logs event for forensic analysis

---

## 🛠️ Troubleshooting

### Email Alerts Not Working

1. Check SMTP credentials:

   ```bash
   EMAIL_USER=correct-email@gmail.com
   EMAIL_PASSWORD=app-specific-password
   ```

2. For Gmail, enable "App Passwords":

   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"

3. Check logs:
   ```bash
   # Backend logs show email delivery attempts
   ✓ Email alert sent for 192.168.1.100 in auth
   # Or errors:
   ✗ Failed to send email alert: Authentication failed
   ```

### SMS Alerts Not Working

1. Verify Twilio credentials:

   ```bash
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   ALERT_FROM_PHONE=+1234567890  # Must be Twilio number
   ALERT_TO_PHONE=+1987654321    # Verified number
   ```

2. Check Twilio console for errors

3. If not configured, alerts skip SMS gracefully:
   ```
   ⚠️ Twilio not configured, skipping SMS alert
   ```

### Slack/Teams Webhooks

1. Create incoming webhook:

   - **Slack**: Workspace Settings → Apps → Incoming Webhooks
   - **Teams**: Channel → Connectors → Incoming Webhook

2. Set environment variable:

   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
   ```

3. Test with curl:
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"Test alert"}'
   ```

### Alert Cooldown Issues

If alerts are being suppressed:

1. Check policy cooldown setting
2. Cooldowns are per `group:identifier` combination
3. Clear cooldown by restarting server (in-memory map)
4. Adjust cooldown in `alertPolicy.ts`

### Redis Connection

If alert history not working:

1. Verify Redis is running:

   ```bash
   redis-cli ping  # Should return PONG
   ```

2. Check connection string:

   ```bash
   REDIS_URL=redis://localhost:6379
   ```

3. Test manually:
   ```bash
   redis-cli
   > LRANGE alert_history:auth 0 -1
   ```

---

## 📊 Monitoring Queries

### Sentry Dashboard Queries

```
# All rate limit alerts
event.type:rate_limit_alert

# Critical alerts only
event.type:rate_limit_alert severity:critical

# Alerts by route group
event.type:rate_limit_alert routeGroup:auth

# Recent alerts (last hour)
event.type:rate_limit_alert timestamp:>now-1h
```

### Redis Queries

```bash
# View alert history for auth group
redis-cli LRANGE alert_history:auth 0 49

# Count alerts
redis-cli LLEN alert_history:auth

# View offenders
redis-cli ZREVRANGE offenders:auth 0 9 WITHSCORES

# View trends
redis-cli HGETALL global_trends:auth
```

---

## 🚀 Extending the System

### Adding New Channels

1. Edit `alertPolicy.ts`:

   ```typescript
   export type AlertChannel =
     | "email"
     | "sms"
     | "slack"
     | "teams"
     | "discord"
     | "pagerduty";
   ```

2. Add handler in `alertService.ts`:

   ```typescript
   async function sendDiscordAlert(data: AlertData): Promise<void> {
     // Implementation
   }
   ```

3. Update `sendAlert` function:
   ```typescript
   case 'discord':
     promises.push(sendDiscordAlert(data));
     break;
   ```

### Custom Alert Policies

```typescript
// Add new route group
'custom-api': {
  threshold: 25,
  channels: ['email', 'slack'],
  cooldown: 10 * 60 * 1000,
  severity: 'medium',
}
```

### Alert Webhooks

For custom integrations, create webhook endpoint:

```typescript
// backend/src/routes/alerts.ts
router.post("/webhooks/alert", async (req, res) => {
  const { group, identifier, count } = req.body;
  // Custom handling
  res.json({ received: true });
});
```

---

## 📖 Best Practices

### 1. Channel Selection

- **Critical**: Use all channels (email + SMS + Slack/Teams)
- **High**: Email + SMS + Slack
- **Medium**: Email + Slack
- **Low**: Email + Sentry

### 2. Threshold Tuning

- Start conservative (low thresholds)
- Monitor for false positives
- Adjust based on actual traffic patterns
- Different thresholds for different subsystems

### 3. Cooldown Periods

- Shorter for critical routes (3-5 minutes)
- Longer for general traffic (15-30 minutes)
- Prevents alert fatigue
- Balances awareness vs spam

### 4. Alert Response

When alert received:

1. Check dashboard for context
2. Review Sentry for full details
3. Investigate offender (user ID or IP)
4. Take action:
   - Clear rate limit if legitimate
   - Block IP if malicious
   - Contact user if account compromised
   - Adjust policy if false positive

### 5. Regular Reviews

- Weekly: Review alert history
- Monthly: Adjust thresholds and policies
- Quarterly: Analyze patterns and trends
- Update documentation as system evolves

---

## 🔐 Security Considerations

1. **Sensitive Data**: Alert emails may contain IP addresses and user IDs
2. **Webhook URLs**: Keep webhook URLs secret (environment variables)
3. **SMS Costs**: Twilio charges per SMS; use judiciously
4. **Rate Limiting**: Alert system itself is not rate limited (by design)
5. **Redis Security**: Secure Redis with password and firewall rules

---

## 📚 Related Documentation

- [Rate Limiting Guide](./REDIS_RATE_LIMITING_GUIDE.md)
- [Admin User Filters](./ADMIN_USER_FILTERS.md)
- [Sentry Setup](./backend/SENTRY_SETUP.md)
- [Environment Configuration](./backend/.env.example)

---

## 🆘 Support

For issues or questions:

1. Check logs: `backend/logs/` or console output
2. Review Sentry: Dashboard → Issues
3. Test channels individually
4. Verify environment variables
5. Check Redis connection
6. Review alert policies

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0

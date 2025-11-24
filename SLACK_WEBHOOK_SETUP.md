# 🛠 Slack Webhook Setup Guide

Complete guide for setting up Slack webhooks to receive automated alerts from Advancia's monitoring system.

---

## 📋 Prerequisites

- **Slack Workspace** with admin access
- **Target Channel** created (e.g., `#ops-alerts`, `#status`, `#monitoring`)
- **5 minutes** to complete setup

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create a Slack App

1. Go to **[Slack API: Your Apps](https://api.slack.com/apps)**
2. Click **Create New App**
3. Choose **From Scratch**
4. Configure:
   - **App Name:** `Advancia Alerts` (or your preferred name)
   - **Workspace:** Select your workspace from dropdown
5. Click **Create App**

![Create Slack App](https://a.slack-edge.com/80588/img/api/articles/app_creation_modal.png)

---

### Step 2: Enable Incoming Webhooks

1. In your app settings, navigate to **Features → Incoming Webhooks**
2. Toggle **Activate Incoming Webhooks** to **On**
3. Scroll down and click **Add New Webhook to Workspace**

![Enable Webhooks](https://a.slack-edge.com/80588/img/api/articles/incoming_webhooks_activate.png)

---

### Step 3: Choose a Channel

1. Select the Slack channel where alerts should appear:
   - **Recommended:** `#ops-alerts` or `#monitoring`
   - **Alternative:** `#general` (for testing only)
2. Click **Allow** to authorize the app

**Pro Tip:** Create a dedicated channel for alerts to avoid noise in general channels.

---

### Step 4: Copy Webhook URL

1. Slack will generate a **Webhook URL** that looks like:

   ```
   https://hooks.slack.com/services/YOUR/WORKSPACE/TOKEN
   ```

2. Copy this URL (click the **Copy** button)

3. Add to your `.env` file:

   ```env
   # ─── Slack Webhook (Alerting) ─────────────────
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WORKSPACE/TOKEN
   ```

**⚠️ Security Note:** Keep this URL secret! Anyone with this URL can post to your channel.

---

### Step 5: Test the Webhook

#### Option A: Using curl (Linux/Mac/WSL)

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"✅ Advancia alerts connected!"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### Option B: Using PowerShell (Windows)

```powershell
$webhook = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
$body = @{ text = "✅ Advancia alerts connected!" } | ConvertTo-Json

Invoke-RestMethod -Uri $webhook -Method Post -Body $body -ContentType 'application/json'
```

#### Option C: Using Node.js (Recommended)

```javascript
const https = require("https");

const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const data = JSON.stringify({ text: "✅ Advancia alerts connected!" });

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = https.request(webhookUrl, options, (res) => {
  console.log(`✅ Slack responded with: ${res.statusCode}`);
});

req.on("error", (error) => {
  console.error(`❌ Error sending to Slack: ${error}`);
});

req.write(data);
req.end();
```

**Expected Result:** You should see "✅ Advancia alerts connected!" in your Slack channel.

---

## 🎨 Customizing Alert Messages

### Basic Text Message

```javascript
{
  "text": "🚨 Alert: System uptime dropped to 97%"
}
```

### Rich Formatted Message

```javascript
{
  "text": "🚨 *Advancia Alert: Low Uptime*",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 Low Uptime Alert"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Current Uptime:*\n97.3%"
        },
        {
          "type": "mrkdwn",
          "text": "*Threshold:*\n99.0%"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Actions Needed:*\n• Check PM2 processes\n• Review error logs\n• Check system resources"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Status Page"
          },
          "url": "https://status.advanciapayledger.com"
        }
      ]
    }
  ]
}
```

### Alert with User Mentions

```javascript
{
  "text": "<!channel> 🚨 Critical incident detected!",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "🚨 *Critical Incident*\n<@U0123456789> please investigate ASAP!"
      }
    }
  ]
}
```

**Pro Tip:** Use `<!channel>`, `<!here>`, or `<@USER_ID>` to mention users/channels.

---

## 🔧 Integration with Status Generator

Your `status-generator.mjs` already includes the webhook integration:

```javascript
// In status-generator.mjs
import https from "https";

async function sendSlackAlert(message) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("⚠️ SLACK_WEBHOOK_URL not set, skipping alert");
    return;
  }

  const data = JSON.stringify({
    text: message,
    username: "Advancia Monitor",
    icon_emoji: ":robot_face:",
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = https.request(webhookUrl, options, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ Slack alert sent successfully`);
        resolve();
      } else {
        console.error(`❌ Slack responded with: ${res.statusCode}`);
        reject(new Error(`Slack error: ${res.statusCode}`));
      }
    });

    req.on("error", (error) => {
      console.error(`❌ Error sending to Slack: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}
```

---

## 📊 Alert Types & Examples

### 1. Low Uptime Alert

```javascript
const message = `🚨 *Advancia Alert: Low Uptime*

Backend uptime dropped to ${uptime24h}% in the last 24 hours.
Threshold: ${ALERT_UPTIME_THRESHOLD}%

*Actions Needed:*
• Check PM2 processes: \`pm2 list\`
• Review error logs: \`pm2 logs advancia-backend --err\`
• Check system resources: \`top\`, \`df -h\`

View status: https://status.advanciapayledger.com`;
```

### 2. High Error Rate Alert

```javascript
const message = `⚠️ *Advancia Alert: High Error Rate*

Detected ${totalErrors24h} errors in the last 24 hours.
Threshold: ${ALERT_ERROR_THRESHOLD} errors

*Top Sources:*
• Check PM2 logs: \`pm2 logs --err --lines 100\`
• Review Sentry: https://sentry.io/organizations/advancia
• Check database connections

View status: https://status.advanciapayledger.com`;
```

### 3. Frequent Restarts Alert

```javascript
const message = `🔄 *Advancia Alert: Frequent Restarts*

Detected ${totalRestarts24h} restarts in the last 24 hours.
Threshold: ${ALERT_RESTART_THRESHOLD} restarts

*Possible Causes:*
• Memory leaks: \`pm2 monit\`
• Uncaught exceptions: Check error logs
• System resources: \`free -h\`, \`df -h\`

View status: https://status.advanciapayledger.com`;
```

### 4. Critical Incident Alert

```javascript
const message = `🚨 *Advancia Alert: Critical Incident*

*Title:* ${incident.title}
*Component:* ${incident.component}
*Started:* ${timeAgo(incident.timestamp)}
*Severity:* ${incident.severity}
*Impacted Users:* ~${incident.impactedUsers}

*Description:* ${incident.description}

*Immediate Actions:*
• Restart backend: \`pm2 restart advancia-backend\`
• Check logs: \`pm2 logs --err\`
• Monitor recovery: \`pm2 monit\`

View status: https://status.advanciapayledger.com`;
```

---

## 🔒 Security Best Practices

### 1. Keep Webhook URL Secret

```bash
# ❌ NEVER commit to Git
git add .env  # Bad!

# ✅ Add to .gitignore
echo ".env" >> .gitignore
```

### 2. Use Environment Variables

```javascript
// ✅ Good: Read from environment
const webhookUrl = process.env.SLACK_WEBHOOK_URL;

// ❌ Bad: Hardcoded in code
const webhookUrl = "https://hooks.slack.com/services/...";
```

### 3. Rotate Webhooks Periodically

- Every 6 months, regenerate the webhook URL
- Update `.env` file with new URL
- Test before deploying

### 4. Limit Webhook Scope

- Create separate webhooks for different alert types
- Use different channels for different severities:
  - `#critical-alerts` → outages, downtime
  - `#warnings` → high errors, restarts
  - `#monitoring` → routine status updates

---

## 🧪 Testing Checklist

### Initial Setup

- [ ] Webhook URL generated
- [ ] Added to `.env` file
- [ ] Test message sent via curl/PowerShell
- [ ] Message appears in Slack channel
- [ ] Webhook URL kept secure (not in Git)

### Integration Testing

- [ ] `status-generator.mjs` can access webhook URL
- [ ] Alert triggers when threshold breached
- [ ] Alert message is formatted correctly
- [ ] Alert appears in correct Slack channel
- [ ] No duplicate alerts (cooldown working)

### Production Validation

- [ ] Alerts sent within 5 minutes of issue
- [ ] Ops team receives notifications
- [ ] Alert state persisted in `alert-state.json`
- [ ] Cooldown prevents alert spam (1 hour)
- [ ] Multiple alert types working (uptime, errors, restarts, incidents)

---

## 🛠 Troubleshooting

### Issue 1: "SLACK_WEBHOOK_URL not set"

**Cause:** Environment variable not loaded

**Solution:**

```bash
# Verify .env file exists
ls -lh backend/.env

# Check variable is set
echo $SLACK_WEBHOOK_URL

# Load manually if needed
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Or load with dotenv
node -r dotenv/config backend/scripts/status-generator.mjs
```

### Issue 2: "404 Not Found" Response

**Cause:** Invalid webhook URL

**Solution:**

```bash
# Verify URL format (should have 3 segments)
# Correct: https://hooks.slack.com/services/T00/B00/XXX
# Wrong: https://hooks.slack.com/services/T00/B00

# Regenerate webhook:
# 1. Go to Slack App settings
# 2. Incoming Webhooks → Add New Webhook
# 3. Copy new URL
# 4. Update .env file
```

### Issue 3: Messages Not Appearing

**Cause:** Channel permissions or deleted webhook

**Solution:**

```bash
# Check webhook status in Slack
# Go to: Your Apps → Advancia Alerts → Incoming Webhooks
# Verify webhook is still active

# Test with simple message
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test"}'

# If fails, regenerate webhook
```

### Issue 4: Rate Limited (429 Response)

**Cause:** Too many messages sent

**Solution:**

```javascript
// Add rate limiting to alert function
let lastAlertTime = 0;
const RATE_LIMIT_MS = 60000; // 1 minute

async function sendSlackAlert(message) {
  const now = Date.now();
  if (now - lastAlertTime < RATE_LIMIT_MS) {
    console.log("⏳ Rate limited, skipping alert");
    return;
  }

  lastAlertTime = now;
  // ... send alert
}
```

---

## 📈 Advanced Features

### 1. Multiple Webhooks for Different Channels

```env
# .env
SLACK_CRITICAL_WEBHOOK=https://hooks.slack.com/services/.../critical
SLACK_WARNINGS_WEBHOOK=https://hooks.slack.com/services/.../warnings
SLACK_INFO_WEBHOOK=https://hooks.slack.com/services/.../info
```

```javascript
// status-generator.mjs
async function sendAlert(severity, message) {
  let webhook;

  switch (severity) {
    case "critical":
      webhook = process.env.SLACK_CRITICAL_WEBHOOK;
      break;
    case "warning":
      webhook = process.env.SLACK_WARNINGS_WEBHOOK;
      break;
    default:
      webhook = process.env.SLACK_INFO_WEBHOOK;
  }

  // ... send to appropriate webhook
}
```

### 2. Rich Message Formatting

```javascript
async function sendRichAlert(incident) {
  const data = JSON.stringify({
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚨 ${incident.title}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Component:*\n${incident.component}`,
          },
          {
            type: "mrkdwn",
            text: `*Severity:*\n${incident.severity}`,
          },
          {
            type: "mrkdwn",
            text: `*Started:*\n${incident.timestamp}`,
          },
          {
            type: "mrkdwn",
            text: `*Impacted:*\n~${incident.impactedUsers} users`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Description:*\n${incident.description}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Status Page",
            },
            url: "https://status.advanciapayledger.com",
            style: "primary",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Check Logs",
            },
            url: "https://sentry.io/organizations/advancia",
          },
        ],
      },
    ],
  });

  // ... send data
}
```

### 3. Alert Aggregation

```javascript
// Aggregate multiple issues into single message
async function sendDailySummary(issues) {
  const message = `📊 *Daily Status Summary*

*Total Incidents:* ${issues.length}
*Uptime:* ${calculateUptime()}%
*Error Rate:* ${calculateErrorRate()} errors/hour

*Top Issues:*
${issues
  .slice(0, 5)
  .map((issue, i) => `${i + 1}. ${issue.title} (${issue.severity})`)
  .join("\n")}

View full report: https://status.advanciapayledger.com`;

  await sendSlackAlert(message);
}
```

---

## 🎯 Best Practices

### 1. Alert Fatigue Prevention

- ✅ Use 1-hour cooldown between duplicate alerts
- ✅ Aggregate low-priority alerts into summaries
- ✅ Only alert on actionable issues
- ❌ Don't alert on every minor event

### 2. Clear Action Items

- ✅ Include specific commands to run
- ✅ Link to relevant dashboards/logs
- ✅ Provide context (thresholds, baselines)
- ❌ Don't send vague "something's wrong" alerts

### 3. Channel Organization

```
#critical-alerts  → Outages, P0 incidents (mention @channel)
#warnings         → Degraded performance, P1 issues
#monitoring       → Routine status updates, P2 issues
#deployments      → CI/CD notifications
```

### 4. Testing in Development

```bash
# Use different webhook for dev/prod
# .env.development
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/.../dev-alerts

# .env.production
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/.../prod-alerts
```

---

## ✅ Outcome

After completing this setup:

- ✅ **Ops team** receives real-time alerts in Slack
- ✅ **Proactive monitoring** catches issues before users notice
- ✅ **Clear action items** enable fast response
- ✅ **Public status page** maintains transparency
- ✅ **Private alerts** keep internal issues internal

Your monitoring system now has **dual channels**:

- **Public:** Status page for users/investors
- **Private:** Slack alerts for ops team

---

## 📚 Additional Resources

- **Slack API Docs:** <https://api.slack.com/messaging/webhooks>
- **Block Kit Builder:** <https://app.slack.com/block-kit-builder> (design rich messages)
- **Incoming Webhooks Guide:** <https://api.slack.com/messaging/webhooks>
- **Rate Limits:** <https://api.slack.com/docs/rate-limits>

---

**Last Updated:** 2024-11-14  
**Version:** 1.0  
**Maintainer:** Advancia Engineering Team

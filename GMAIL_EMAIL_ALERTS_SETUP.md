# 🛠 Gmail + Nodemailer Email Alerting Setup Guide

Complete guide for setting up email alerts via Gmail and Nodemailer to complement your Slack notifications in Advancia's monitoring system.

---

## 📋 Prerequisites

- **Gmail Account** (recommended: dedicated account for alerts)
- **Node.js** with npm (for Nodemailer package)
- **2-Step Verification** enabled on Gmail account
- **5 minutes** to complete setup

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create a Dedicated Gmail Account

**Why a dedicated account?**

- Isolates credentials from personal accounts
- Easier to manage and rotate credentials
- Clearer audit trail for automated emails
- No risk of personal data exposure

**Recommended naming:**

```
advancia.alerts@gmail.com
advancia.monitoring@gmail.com
ops-alerts@advanciapayledger.com
```

**Setup:**

1. Go to [accounts.google.com](https://accounts.google.com/signup)
2. Create new account with strong password
3. Set recovery email to team lead's email
4. Skip phone verification if possible (or use team phone)

---

### Step 2: Enable 2-Step Verification

**Required for App Passwords** (Google security requirement)

1. Log into your new Gmail account
2. Go to **[Google Account Settings](https://myaccount.google.com/)**
3. Navigate to **Security** in left sidebar
4. Under **Signing in to Google**, find **2-Step Verification**
5. Click **Get Started**
6. Follow prompts:
   - Verify phone number
   - Choose verification method (text, call, or authenticator app)
   - Complete verification
7. Click **Turn On** to enable 2-Step Verification

**✅ Success:** You'll see "2-Step Verification is on"

---

### Step 3: Generate App Password

**App Passwords** allow apps to access Gmail without your main password.

1. Still in **Google Account → Security**
2. Under **Signing in to Google**, find **App Passwords**
   - If you don't see it, ensure 2-Step Verification is enabled
3. Click **App Passwords**
4. You may need to re-enter your Gmail password
5. Select app dropdown:
   - Choose **Mail**
6. Select device dropdown:
   - Choose **Other (Custom name)**
   - Enter: "Advancia Monitoring System"
7. Click **Generate**
8. Copy the **16-character password** displayed
   - Format: `xxxx xxxx xxxx xxxx`
   - **Important:** This appears only once!

**Example App Password:**

```
abcd efgh ijkl mnop
```

**⚠️ Security Note:** Store this securely. If lost, generate a new one.

---

### Step 4: Configure Environment Variables

Add to your `backend/.env` file:

```env
# ─── Email Alerts (Gmail + Nodemailer) ─────────
# Gmail account dedicated to sending alerts
ALERT_EMAIL=advancia.alerts@gmail.com

# Gmail App Password (16 characters, no spaces)
ALERT_EMAIL_PASS=abcdefghijklmnop

# SMTP Configuration (Gmail defaults)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Recipient email addresses (comma-separated)
ALERT_RECIPIENTS=team@advanciapayledger.com,ops@advanciapayledger.com

# Optional: Alert sender display name
ALERT_FROM_NAME=Advancia Monitor
```

**Multiple Recipients:**

```env
# Single recipient
ALERT_RECIPIENTS=ops@advanciapayledger.com

# Multiple recipients
ALERT_RECIPIENTS=ops@advanciapayledger.com,cto@advanciapayledger.com,devops@advanciapayledger.com

# With display names (Nodemailer format)
ALERT_RECIPIENTS="Ops Team <ops@advanciapayledger.com>, CTO <cto@advanciapayledger.com>"
```

---

### Step 5: Install Nodemailer

```bash
# In backend directory
cd backend
npm install nodemailer

# Or add to package.json and install
npm install
```

**package.json:**

```json
{
  "dependencies": {
    "nodemailer": "^6.9.7"
  }
}
```

---

## 📧 Implementation Code

### Basic Email Function

Add to `backend/scripts/status-generator.mjs`:

```javascript
import nodemailer from "nodemailer";

/**
 * Send email alert via Gmail SMTP
 * @param {string} subject - Email subject line
 * @param {string} body - Plain text email body
 * @param {string} html - Optional HTML email body
 */
async function sendEmailAlert(subject, body, html = null) {
  // Skip if email not configured
  if (!process.env.ALERT_EMAIL || !process.env.ALERT_EMAIL_PASS) {
    console.warn("⚠️ Email alerts not configured, skipping");
    return;
  }

  try {
    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
      auth: {
        user: process.env.ALERT_EMAIL,
        pass: process.env.ALERT_EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: `"${process.env.ALERT_FROM_NAME || "Advancia Monitor"}" <${
        process.env.ALERT_EMAIL
      }>`,
      to: process.env.ALERT_RECIPIENTS,
      subject: subject,
      text: body,
    };

    // Add HTML version if provided
    if (html) {
      mailOptions.html = html;
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email alert sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    throw error;
  }
}
```

---

## 🎨 Email Templates

### 1. Low Uptime Alert

```javascript
async function sendLowUptimeAlert(uptime, threshold) {
  const subject = `🚨 Advancia Alert: Low Uptime (${uptime}%)`;

  const body = `
ADVANCIA SYSTEM ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alert Type: Low Uptime
Current Uptime: ${uptime}%
Threshold: ${threshold}%
Status: DEGRADED
Time: ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIONS NEEDED:
1. Check PM2 processes: pm2 list
2. Review error logs: pm2 logs advancia-backend --err
3. Check system resources: top, df -h
4. Verify database connections
5. Check external service health

QUICK LINKS:
• Status Page: https://status.advanciapayledger.com
• Sentry Dashboard: https://sentry.io/organizations/advancia
• Server Logs: ssh root@droplet-ip

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated alert from Advancia Monitoring System.
To stop receiving these alerts, update ALERT_RECIPIENTS in .env
`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚨 Low Uptime Alert</h1>
      </div>
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>Alert Type:</strong></td>
            <td style="padding: 8px 0; color: #dc2626;">Low Uptime</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Current Uptime:</strong></td>
            <td style="padding: 8px 0; font-size: 20px; color: #dc2626;"><strong>${uptime}%</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Threshold:</strong></td>
            <td style="padding: 8px 0;">${threshold}%</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Status:</strong></td>
            <td style="padding: 8px 0;"><span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px;">DEGRADED</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Time:</strong></td>
            <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
          </tr>
        </table>
      </div>
      <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Actions Needed:</h2>
        <ol style="color: #374151; line-height: 1.8;">
          <li>Check PM2 processes: <code>pm2 list</code></li>
          <li>Review error logs: <code>pm2 logs advancia-backend --err</code></li>
          <li>Check system resources: <code>top</code>, <code>df -h</code></li>
          <li>Verify database connections</li>
          <li>Check external service health</li>
        </ol>
        <h2 style="color: #111827; font-size: 18px;">Quick Links:</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 8px 0;">
            <a href="https://status.advanciapayledger.com" style="color: #2563eb; text-decoration: none;">📊 Status Page</a>
          </li>
          <li style="margin: 8px 0;">
            <a href="https://sentry.io/organizations/advancia" style="color: #2563eb; text-decoration: none;">🔍 Sentry Dashboard</a>
          </li>
        </ul>
      </div>
      <div style="background: #f9fafb; padding: 12px 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; text-align: center; color: #6b7280; font-size: 12px;">
        Automated alert from Advancia Monitoring System
      </div>
    </div>
  `;

  await sendEmailAlert(subject, body, html);
}
```

### 2. High Error Rate Alert

```javascript
async function sendHighErrorRateAlert(errorCount, threshold) {
  const subject = `⚠️ Advancia Alert: High Error Rate (${errorCount} errors)`;

  const body = `
ADVANCIA SYSTEM ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alert Type: High Error Rate
Error Count: ${errorCount} in last 24 hours
Threshold: ${threshold} errors
Status: WARNING
Time: ${new Date().toISOString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIONS NEEDED:
1. Check PM2 error logs: pm2 logs --err --lines 100
2. Review Sentry errors: https://sentry.io/organizations/advancia
3. Check database query performance
4. Verify external API connections
5. Review recent deployments

QUICK DIAGNOSTICS:
• PM2 Status: pm2 list
• Recent Errors: tail -100 /opt/advancia/backend/logs/advancia-backend-error.log
• System Health: pm2 monit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated alert from Advancia Monitoring System.
`;

  await sendEmailAlert(subject, body);
}
```

### 3. Critical Incident Alert

```javascript
async function sendCriticalIncidentAlert(incident) {
  const subject = `🚨 CRITICAL: ${incident.title}`;

  const body = `
ADVANCIA CRITICAL INCIDENT ALERT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INCIDENT DETAILS:
Title: ${incident.title}
Component: ${incident.component}
Severity: ${incident.severity.toUpperCase()}
Started: ${incident.timestamp}
Duration: ${incident.duration || "Ongoing"}
Impacted Users: ~${incident.impactedUsers || "Unknown"}

DESCRIPTION:
${incident.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMMEDIATE ACTIONS REQUIRED:
1. Restart backend: pm2 restart advancia-backend
2. Check error logs: pm2 logs --err
3. Monitor recovery: pm2 monit
4. Update status page: https://status.advanciapayledger.com
5. Notify stakeholders if prolonged

INCIDENT RESPONSE:
• SSH to server: ssh root@${process.env.DO_HOST || "droplet-ip"}
• Check PM2: pm2 list && pm2 logs advancia-backend --lines 50
• Database health: Check connection pool, query performance
• External services: Verify Stripe, payment gateways, email service

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reply to this email with incident resolution details.
`;

  await sendEmailAlert(subject, body);
}
```

---

## 🔧 Integration with Status Generator

Update `checkAndSendAlerts()` in `status-generator.mjs`:

```javascript
async function checkAndSendAlerts(status) {
  const alerts = [];
  const state = loadAlertState();

  // 1. Low Uptime Alert
  const uptime24h =
    status.components.find((c) => c.id === "backend-api")?.uptime24h || 100;
  if (
    uptime24h < ALERT_UPTIME_THRESHOLD &&
    shouldSendAlert("low-uptime", state)
  ) {
    const slackMsg = `🚨 *Advancia Alert: Low Uptime*\n\nBackend uptime dropped to ${uptime24h}%...`;
    alerts.push(sendSlackAlert(slackMsg));
    alerts.push(sendLowUptimeAlert(uptime24h, ALERT_UPTIME_THRESHOLD));
    state.lastAlerts["low-uptime"] = new Date().toISOString();
  }

  // 2. High Error Rate Alert
  const errorCount = status.metrics.totalErrors24h || 0;
  if (
    errorCount > ALERT_ERROR_THRESHOLD &&
    shouldSendAlert("high-errors", state)
  ) {
    const slackMsg = `⚠️ *Advancia Alert: High Error Rate*\n\nDetected ${errorCount} errors...`;
    alerts.push(sendSlackAlert(slackMsg));
    alerts.push(sendHighErrorRateAlert(errorCount, ALERT_ERROR_THRESHOLD));
    state.lastAlerts["high-errors"] = new Date().toISOString();
  }

  // 3. Critical Incidents
  const criticalIncidents = status.incidents.filter(
    (i) => i.severity === "outage" && i.status !== "resolved"
  );

  for (const incident of criticalIncidents) {
    const alertKey = `incident-${incident.id}`;
    if (shouldSendAlert(alertKey, state)) {
      const slackMsg = `🚨 *Advancia Alert: Critical Incident*\n\n*${incident.title}*...`;
      alerts.push(sendSlackAlert(slackMsg));
      alerts.push(sendCriticalIncidentAlert(incident));
      state.lastAlerts[alertKey] = new Date().toISOString();
    }
  }

  // Send all alerts in parallel
  await Promise.all(alerts);

  // Save alert state
  saveAlertState(state);

  console.log(`✅ Sent ${alerts.length} alerts (Slack + Email)`);
  return alerts.length;
}
```

---

## 🧪 Testing

### Test Script

Create `backend/scripts/test-email-alerts.mjs`:

```javascript
import "dotenv/config";
import nodemailer from "nodemailer";

async function testEmailSetup() {
  console.log("🧪 Testing email alert configuration...\n");

  // Check environment variables
  console.log("Environment Variables:");
  console.log(`✓ ALERT_EMAIL: ${process.env.ALERT_EMAIL || "❌ Not set"}`);
  console.log(
    `✓ ALERT_EMAIL_PASS: ${
      process.env.ALERT_EMAIL_PASS ? "****** (set)" : "❌ Not set"
    }`
  );
  console.log(
    `✓ ALERT_RECIPIENTS: ${process.env.ALERT_RECIPIENTS || "❌ Not set"}`
  );
  console.log(
    `✓ SMTP_HOST: ${process.env.SMTP_HOST || "smtp.gmail.com (default)"}`
  );
  console.log(`✓ SMTP_PORT: ${process.env.SMTP_PORT || "587 (default)"}\n`);

  if (!process.env.ALERT_EMAIL || !process.env.ALERT_EMAIL_PASS) {
    console.error("❌ Missing required environment variables");
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_EMAIL_PASS,
    },
  });

  // Verify connection
  console.log("🔌 Testing SMTP connection...");
  try {
    await transporter.verify();
    console.log("✅ SMTP connection successful\n");
  } catch (error) {
    console.error(`❌ SMTP connection failed: ${error.message}`);
    process.exit(1);
  }

  // Send test email
  console.log("📧 Sending test email...");
  try {
    const info = await transporter.sendMail({
      from: `"Advancia Monitor" <${process.env.ALERT_EMAIL}>`,
      to: process.env.ALERT_RECIPIENTS,
      subject: "✅ Advancia Email Alerts Connected",
      text: `
This is a test email from your Advancia monitoring system.

Your email alerts are now configured and working correctly!

Test Details:
• Sent from: ${process.env.ALERT_EMAIL}
• Sent to: ${process.env.ALERT_RECIPIENTS}
• Time: ${new Date().toISOString()}
• SMTP Host: ${process.env.SMTP_HOST || "smtp.gmail.com"}

Next time you receive an email, it will be a real alert about your system health.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Advancia Monitoring System
https://status.advanciapayledger.com
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">✅ Email Alerts Connected</h1>
          </div>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb;">
            <p>This is a test email from your <strong>Advancia monitoring system</strong>.</p>
            <p>Your email alerts are now configured and working correctly! 🎉</p>
            <h3>Test Details:</h3>
            <ul style="color: #374151;">
              <li><strong>Sent from:</strong> ${process.env.ALERT_EMAIL}</li>
              <li><strong>Sent to:</strong> ${process.env.ALERT_RECIPIENTS}</li>
              <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>SMTP Host:</strong> ${
                process.env.SMTP_HOST || "smtp.gmail.com"
              }</li>
            </ul>
            <p style="color: #6b7280; font-style: italic;">
              Next time you receive an email, it will be a real alert about your system health.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 12px 20px; border-radius: 0 0 8px 8px; text-align: center; color: #6b7280; font-size: 12px;">
            Advancia Monitoring System • <a href="https://status.advanciapayledger.com" style="color: #2563eb;">Status Page</a>
          </div>
        </div>
      `,
    });

    console.log(`✅ Test email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`\n📬 Check your inbox at: ${process.env.ALERT_RECIPIENTS}`);
  } catch (error) {
    console.error(`❌ Failed to send test email: ${error.message}`);
    process.exit(1);
  }
}

testEmailSetup();
```

### Run Test

```bash
cd backend
node scripts/test-email-alerts.mjs
```

**Expected Output:**

```
🧪 Testing email alert configuration...

Environment Variables:
✓ ALERT_EMAIL: advancia.alerts@gmail.com
✓ ALERT_EMAIL_PASS: ****** (set)
✓ ALERT_RECIPIENTS: ops@advanciapayledger.com
✓ SMTP_HOST: smtp.gmail.com (default)
✓ SMTP_PORT: 587 (default)

🔌 Testing SMTP connection...
✅ SMTP connection successful

📧 Sending test email...
✅ Test email sent successfully!
   Message ID: <abc123@gmail.com>

📬 Check your inbox at: ops@advanciapayledger.com
```

---

## 🔒 Security Best Practices

### 1. Protect App Passwords

```bash
# ❌ NEVER commit .env to Git
echo ".env" >> .gitignore

# ✅ Use environment variables
export ALERT_EMAIL_PASS="your_app_password"

# ✅ Use secrets management in production
# GitHub Secrets, AWS Secrets Manager, etc.
```

### 2. Rotate Credentials Regularly

```bash
# Every 6 months:
# 1. Generate new Gmail App Password
# 2. Update .env file
# 3. Test with test-email-alerts.mjs
# 4. Update production environment
# 5. Revoke old App Password in Google Account
```

### 3. Limit Recipients

```env
# ✅ Only send to necessary people
ALERT_RECIPIENTS=ops-lead@advancia.com,cto@advancia.com

# ❌ Don't send to entire company
ALERT_RECIPIENTS=all@advancia.com,everyone@advancia.com
```

### 4. Use Dedicated Account

- ✅ Create `advancia.alerts@gmail.com`
- ✅ Separate from personal email
- ✅ Easier to audit and manage
- ❌ Don't use personal Gmail account

---

## 🛠 Troubleshooting

### Issue 1: "Invalid login" Error

**Cause:** App Password not generated or incorrect

**Solution:**

```bash
# 1. Verify 2-Step Verification is enabled
# 2. Generate new App Password in Google Account → Security
# 3. Copy password without spaces: abcdefghijklmnop
# 4. Update .env file
# 5. Test again
```

### Issue 2: "Connection timeout"

**Cause:** Firewall or wrong SMTP port

**Solution:**

```env
# Try different port
SMTP_PORT=465  # SSL/TLS
SMTP_SECURE=true

# Or keep default
SMTP_PORT=587  # STARTTLS
SMTP_SECURE=false
```

### Issue 3: "Rate limit exceeded"

**Cause:** Sending too many emails

**Solution:**

```javascript
// Add rate limiting
const EMAIL_RATE_LIMIT = 10; // Max 10 emails per hour
let emailCount = 0;
let resetTime = Date.now() + 3600000; // 1 hour

async function sendEmailAlert(subject, body, html) {
  if (Date.now() > resetTime) {
    emailCount = 0;
    resetTime = Date.now() + 3600000;
  }

  if (emailCount >= EMAIL_RATE_LIMIT) {
    console.warn("⚠️ Email rate limit reached, skipping");
    return;
  }

  emailCount++;
  // ... send email
}
```

### Issue 4: Emails going to spam

**Solution:**

```javascript
// Improve email headers
const mailOptions = {
  from: `"Advancia Monitor" <${process.env.ALERT_EMAIL}>`,
  to: process.env.ALERT_RECIPIENTS,
  subject: subject,
  text: body,
  html: html,
  headers: {
    "X-Priority": "1", // High priority
    "X-MSMail-Priority": "High",
    Importance: "high",
  },
};

// Add recipients to contacts/whitelist
// Mark first test email as "Not Spam"
```

---

## 📊 Dual-Channel Alerting Strategy

### When to Use Each Channel

**Slack (Real-time, conversational):**

- ✅ Routine alerts
- ✅ Team discussions
- ✅ Quick acknowledgments
- ✅ Ongoing incidents (threaded updates)

**Email (Persistent, formal):**

- ✅ Critical incidents (paper trail)
- ✅ Audit logs
- ✅ Compliance requirements
- ✅ After-hours alerts (email notifications work offline)

### Redundancy Strategy

```javascript
async function sendDualAlert(alertType, details) {
  const alerts = [];

  // Always send both
  alerts.push(sendSlackAlert(formatSlackMessage(alertType, details)));
  alerts.push(
    sendEmailAlert(
      formatEmailSubject(alertType, details),
      formatEmailBody(alertType, details),
      formatEmailHTML(alertType, details)
    )
  );

  // Send in parallel
  const results = await Promise.allSettled(alerts);

  // Log results
  results.forEach((result, index) => {
    const channel = index === 0 ? "Slack" : "Email";
    if (result.status === "fulfilled") {
      console.log(`✅ ${channel} alert sent`);
    } else {
      console.error(`❌ ${channel} alert failed: ${result.reason}`);
    }
  });

  // Return success if at least one succeeded
  return results.some((r) => r.status === "fulfilled");
}
```

---

## ✅ Outcome

After completing this setup:

- ✅ **Slack + Email redundancy** - No single point of failure
- ✅ **Persistent audit trail** - Email archive for compliance
- ✅ **Offline notifications** - Email works when Slack is down
- ✅ **Flexible routing** - Different recipients per channel
- ✅ **Professional formatting** - HTML emails with branding

Your monitoring system now has **enterprise-grade alerting** with multiple notification channels! 🚀

---

## 📚 Additional Resources

- **Nodemailer Docs:** https://nodemailer.com/about/
- **Gmail SMTP Settings:** https://support.google.com/mail/answer/7126229
- **App Passwords Guide:** https://support.google.com/accounts/answer/185833
- **Email HTML Best Practices:** https://www.campaignmonitor.com/css/

---

**Last Updated:** 2024-11-14  
**Version:** 1.0  
**Maintainer:** Advancia Engineering Team

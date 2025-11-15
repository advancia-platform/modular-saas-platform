# 📅 Status Page Cron Configuration Guide

Complete guide for setting up automated status page updates using system cron jobs.

---

## 🎯 Overview

This guide shows two methods for automating status page updates:

1. **PM2 Cron** (recommended) - Managed by PM2 process manager
2. **System Cron** - Traditional Linux cron jobs

**Choose ONE method** - do not run both simultaneously.

---

## 🔹 Method 1: PM2 Cron (Recommended)

### Why PM2 Cron?

- ✅ Integrated with PM2 process management
- ✅ Automatic restart on failure
- ✅ Logs managed by PM2
- ✅ Easy monitoring with `pm2 logs`
- ✅ Survives reboots (with `pm2 startup`)

### Setup PM2 Cron

```bash
# Navigate to backend
cd /opt/advancia/backend

# Start status updater with PM2
pm2 start ecosystem-status.config.cjs

# Save PM2 configuration
pm2 save

# View status
pm2 list

# Check logs
pm2 logs status-updater
```

### PM2 Configuration File

**File:** `backend/ecosystem-status.config.cjs`

```javascript
module.exports = {
  apps: [
    {
      name: "status-updater",
      script: "./scripts/status-generator.mjs",
      cron_restart: "*/5 * * * *", // Every 5 minutes
      watch: false,
      autorestart: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "production",
        TZ: "UTC",
      },
      error_file: "./logs/status-updater-error.log",
      out_file: "./logs/status-updater-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      min_uptime: "10s",
    },
  ],
};
```

### PM2 Cron Schedule Examples

```javascript
// Every 5 minutes (default)
cron_restart: "*/5 * * * *";

// Every 10 minutes
cron_restart: "*/10 * * * *";

// Every 15 minutes
cron_restart: "*/15 * * * *";

// Every hour
cron_restart: "0 * * * *";

// Every 30 minutes
cron_restart: "*/30 * * * *";

// Every 2 minutes (aggressive, not recommended)
cron_restart: "*/2 * * * *";
```

### PM2 Useful Commands

```bash
# Start status updater
pm2 start ecosystem-status.config.cjs

# Stop status updater
pm2 stop status-updater

# Restart status updater
pm2 restart status-updater

# Delete status updater
pm2 delete status-updater

# View logs (real-time)
pm2 logs status-updater

# View logs (last 50 lines)
pm2 logs status-updater --lines 50

# Monitor all processes
pm2 monit

# Check status
pm2 describe status-updater
```

---

## 🔹 Method 2: System Cron

### Why System Cron?

- ✅ Simple, no dependencies
- ✅ Native Linux feature
- ✅ Works without PM2
- ⚠️ Manual log management required
- ⚠️ No automatic restart on failure

### Quick Setup with Script

```bash
# Download and run setup script
cd /opt/advancia
chmod +x setup-status-cron.sh
sudo bash setup-status-cron.sh
```

### Manual Cron Setup

```bash
# Open crontab editor
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * cd /opt/advancia/backend && /usr/bin/node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1
```

### Cron Schedule Examples

```bash
# Every 5 minutes
*/5 * * * * cd /opt/advancia/backend && node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1

# Every 10 minutes
*/10 * * * * cd /opt/advancia/backend && node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1

# Every 15 minutes
*/15 * * * * cd /opt/advancia/backend && node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1

# Every hour at minute 0
0 * * * * cd /opt/advancia/backend && node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1

# Every 30 minutes
0,30 * * * * cd /opt/advancia/backend && node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1

# Every day at 3 AM
0 3 * * * cd /opt/advancia/backend && node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1
```

### Cron Syntax Reference

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday=0)
│ │ │ │ │
│ │ │ │ │
* * * * * command to execute
```

### Cron Useful Commands

```bash
# View current cron jobs
crontab -l

# Edit cron jobs
crontab -e

# Remove all cron jobs
crontab -r

# View cron logs (Ubuntu/Debian)
grep CRON /var/log/syslog

# View cron logs (CentOS/RHEL)
grep CRON /var/log/cron

# Test cron job manually
cd /opt/advancia/backend && node scripts/status-generator.mjs

# Watch for file updates
watch -n 10 'ls -lh /opt/advancia/backend/public/status.json'

# View last 20 log lines
tail -20 /opt/advancia/logs/status-cron.log

# Follow logs in real-time
tail -f /opt/advancia/logs/status-cron.log
```

---

## 🔧 File Locations

### Key Paths

| Path                                                 | Purpose                          |
| ---------------------------------------------------- | -------------------------------- |
| `/opt/advancia/backend/scripts/status-generator.mjs` | Status generator script          |
| `/opt/advancia/backend/public/status.json`           | Generated status data            |
| `/opt/advancia/backend/logs/backend-watchdog.log`    | Watchdog health checks           |
| `/opt/advancia/backend/logs/err.log`                 | PM2 error logs                   |
| `/opt/advancia/backend/logs/out.log`                 | PM2 output logs                  |
| `/opt/advancia/logs/status-cron.log`                 | Cron execution logs              |
| `/var/www/status/status.json`                        | Nginx serves from here (symlink) |

### Create Symlink for Nginx

```bash
# Create symlink so Nginx can serve status.json
sudo ln -sf /opt/advancia/backend/public/status.json /var/www/status/status.json

# Verify symlink
ls -lh /var/www/status/status.json
```

---

## 🐛 Troubleshooting

### Cron Job Not Running

```bash
# Check cron service status
systemctl status cron

# Restart cron service
sudo systemctl restart cron

# Check cron is enabled
systemctl is-enabled cron

# Enable cron at boot
sudo systemctl enable cron

# Check for cron errors
grep CRON /var/log/syslog | tail -20
```

### status.json Not Updating

```bash
# Check file age (should be < 5 minutes old)
ls -lh /opt/advancia/backend/public/status.json

# Check file permissions
ls -la /opt/advancia/backend/public/status.json

# Fix permissions
chmod 644 /opt/advancia/backend/public/status.json
chown www-data:www-data /opt/advancia/backend/public/status.json

# Run script manually to see errors
cd /opt/advancia/backend
node scripts/status-generator.mjs

# Check cron logs
tail -50 /opt/advancia/logs/status-cron.log
```

### PM2 Cron Not Firing

```bash
# Check PM2 version (cron requires 2.0+)
pm2 --version

# Verify cron_restart setting
pm2 describe status-updater | grep cron_restart

# Check PM2 logs
pm2 logs status-updater --lines 50

# Restart PM2 process
pm2 restart status-updater

# Delete and recreate
pm2 delete status-updater
pm2 start ecosystem-status.config.cjs
pm2 save
```

### Logs Not Being Written

```bash
# Create log directory
mkdir -p /opt/advancia/logs

# Fix permissions
chmod 755 /opt/advancia/logs
chown -R $USER:$USER /opt/advancia/logs

# Test log writing
echo "Test" >> /opt/advancia/logs/status-cron.log

# Check disk space
df -h
```

### Node Command Not Found in Cron

```bash
# Find Node.js path
which node
# Usually: /usr/bin/node or /usr/local/bin/node

# Use full path in crontab
*/5 * * * * cd /opt/advancia/backend && /usr/bin/node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1

# Add PATH to crontab
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
*/5 * * * * cd /opt/advancia/backend && node scripts/status-generator.mjs >> /opt/advancia/logs/status-cron.log 2>&1
```

---

## ✅ Verification Checklist

### Initial Setup

- [ ] Status generator script exists: `backend/scripts/status-generator.mjs`
- [ ] Output directory exists: `backend/public/`
- [ ] Log directory exists: `/opt/advancia/logs/`
- [ ] Cron job added (system cron OR PM2 cron, not both)
- [ ] Test run successful: `node scripts/status-generator.mjs`
- [ ] status.json created: `backend/public/status.json`

### After 5 Minutes

- [ ] status.json updated (check file timestamp)
- [ ] Logs show successful execution
- [ ] No errors in logs
- [ ] File size reasonable (10-50 KB)
- [ ] JSON is valid: `cat status.json | jq .`

### Frontend Integration

- [ ] Frontend can fetch `/api/status.json`
- [ ] Status page displays correct data
- [ ] Metrics match log data
- [ ] Auto-refresh working (every 30s)
- [ ] No console errors in browser

---

## 🎯 Recommended Configuration

### For Production

**Use PM2 Cron** with these settings:

```javascript
// backend/ecosystem-status.config.cjs
module.exports = {
  apps: [
    {
      name: "status-updater",
      script: "./scripts/status-generator.mjs",
      cron_restart: "*/5 * * * *", // Every 5 minutes
      autorestart: false, // Don't restart on crash (cron handles it)
      max_memory_restart: "200M",
    },
  ],
};
```

### Why These Settings?

- **Every 5 minutes** - Balances freshness with server load
- **autorestart: false** - Cron already handles scheduling
- **max_memory_restart: 200M** - Prevents memory leaks

---

## 📊 Monitoring

### Check Status Updates

```bash
# Watch file for changes (updates every 5 min)
watch -n 10 'ls -lh /opt/advancia/backend/public/status.json'

# View last update time
stat /opt/advancia/backend/public/status.json

# Check file age
find /opt/advancia/backend/public/status.json -mmin -5
# If no output, file is older than 5 minutes (problem!)

# View current status
cat /opt/advancia/backend/public/status.json | jq .overallStatus
```

### Alert on Failures

```bash
# Create monitoring script
cat > /opt/advancia/scripts/check-status-updates.sh << 'EOF'
#!/bin/bash
FILE="/opt/advancia/backend/public/status.json"
MAX_AGE=600  # 10 minutes in seconds

if [ ! -f "$FILE" ]; then
    echo "ERROR: status.json not found"
    exit 1
fi

AGE=$(($(date +%s) - $(stat -c %Y "$FILE")))

if [ $AGE -gt $MAX_AGE ]; then
    echo "WARNING: status.json is $AGE seconds old (max: $MAX_AGE)"
    exit 1
fi

echo "OK: status.json is $AGE seconds old"
EOF

chmod +x /opt/advancia/scripts/check-status-updates.sh

# Run check
/opt/advancia/scripts/check-status-updates.sh
```

---

## 📚 Related Documentation

- [STATUS_PAGE_AUTOMATION_GUIDE.md](./STATUS_PAGE_AUTOMATION_GUIDE.md) - Complete automation guide
- [FILE_STRUCTURE_STATUS_PAGE.md](./FILE_STRUCTURE_STATUS_PAGE.md) - File structure reference
- [DAY1_LAUNCH_CHECKLIST.md](./DAY1_LAUNCH_CHECKLIST.md) - Pre-launch checklist
- [backend/PM2_GUIDE.md](./backend/PM2_GUIDE.md) - PM2 process management

---

**Last Updated:** 2024-11-14  
**Recommended Method:** PM2 Cron for production environments

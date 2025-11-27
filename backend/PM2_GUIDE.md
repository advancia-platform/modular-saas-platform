# PM2 Production Process Manager - Complete Guide

PM2 keeps your backend alive with auto-restarts, memory management, and comprehensive logging.

---

## 📋 Quick Start

### Development Mode

```bash
cd backend
pm2 start ecosystem.config.cjs --env development
```

### Production Mode

```bash
cd backend
pm2 start ecosystem.config.cjs --env production
```

### Check Status

```bash
pm2 status
pm2 logs advancia-backend
pm2 monit
```

---

## ⚙️ Configuration (`ecosystem.config.cjs`)

```javascript
module.exports = {
  apps: [
    {
      name: "advancia-backend",
      script: "src/index.js",
      instances: 1, // or "max" for multi-core
      exec_mode: "fork", // or "cluster"
      watch: true, // dev: auto-restart on file changes
      max_memory_restart: "500M", // restart if memory exceeds
      restart_delay: 5000, // 5s delay after crash
      autorestart: true,

      env_development: {
        NODE_ENV: "development",
        PORT: 4000,
      },

      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },

      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
```

**Note**: File is `.cjs` (CommonJS) because backend uses `"type": "module"` in package.json.

---

## 🚀 Essential Commands

### Starting & Stopping

```bash
# Start
pm2 start ecosystem.config.cjs --env development
pm2 start ecosystem.config.cjs --env production

# Stop
pm2 stop advancia-backend

# Restart
pm2 restart advancia-backend

# Reload (zero-downtime restart)
pm2 reload advancia-backend

# Delete from PM2
pm2 delete advancia-backend
```

### Monitoring

```bash
# Status overview
pm2 status

# Live logs (tail -f style)
pm2 logs advancia-backend

# Last 100 lines
pm2 logs advancia-backend --lines 100

# Monitor CPU/Memory in real-time
pm2 monit

# Detailed info
pm2 describe advancia-backend

# Process list as JSON
pm2 jlist
```

### Log Management

```bash
# View logs
pm2 logs advancia-backend

# Clear logs
pm2 flush

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🛡️ Resilience Features

### 1. Auto-Restart on Crash

```javascript
autorestart: true;
restart_delay: 5000; // Wait 5s before restarting
```

Backend automatically restarts if it crashes. 5-second delay prevents restart loops.

### 2. Memory Management

```javascript
max_memory_restart: "500M";
```

Auto-restarts if memory usage exceeds 500MB, preventing memory leaks from taking down the server.

### 3. Watch Mode (Development)

```javascript
watch: true; // Only in development
```

Auto-restarts when you save files. Disabled in production for stability.

### 4. Cluster Mode (Optional)

```javascript
instances: "max",     // Use all CPU cores
exec_mode: "cluster"  // Enable load balancing
```

For production, scale across multiple CPU cores with built-in load balancing.

---

## 📊 Log Files

### Location

```
backend/logs/
├── err.log      # Error output (stderr)
├── out.log      # Standard output (stdout)
└── combined.log # Application logs (Winston)
```

### Viewing Logs

```bash
# PM2 logs (live)
pm2 logs advancia-backend

# Direct file access
tail -f logs/err.log
tail -f logs/out.log

# Search logs
grep "error" logs/err.log
grep "restart" logs/out.log

# PowerShell
Get-Content logs\err.log -Tail 20
Get-Content logs\out.log -Wait
```

---

## 🔄 Startup on Boot

Make PM2 start your backend automatically when server reboots:

### Linux/Mac

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save

# Test: reboot and check
sudo reboot
pm2 status  # After reboot
```

### Windows

```powershell
# Install pm2-windows-startup
npm install pm2-windows-startup -g
pm2-startup install

# Save current process list
pm2 save
```

---

## 🎯 Production Deployment Workflow

### Initial Setup

```bash
# 1. Install PM2 globally on server
npm install -g pm2

# 2. Deploy code
git pull origin main
cd backend
npm install

# 3. Start with PM2
pm2 start ecosystem.config.cjs --env production

# 4. Enable startup
pm2 startup
pm2 save
```

### Updates (Zero-Downtime)

```bash
# 1. Pull latest code
git pull origin main
cd backend
npm install

# 2. Reload without downtime
pm2 reload advancia-backend

# Or restart (brief downtime)
pm2 restart advancia-backend
```

### Monitoring

```bash
# Quick health check
pm2 status

# Detailed metrics
pm2 monit

# View recent errors
pm2 logs advancia-backend --err --lines 50

# Check restart count
pm2 describe advancia-backend | grep "restarts"
```

---

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check PM2 logs
pm2 logs advancia-backend --lines 100

# Check error log directly
cat logs/err.log

# Verify config syntax
node -c ecosystem.config.cjs

# Try manual start to see errors
node src/index.js
```

### High Memory Usage

```bash
# Monitor memory
pm2 monit

# Check memory limit
pm2 describe advancia-backend | grep "max_memory"

# Increase limit if needed
# Edit ecosystem.config.cjs: max_memory_restart: "1G"
pm2 restart advancia-backend
```

### Frequent Restarts

```bash
# Check restart count
pm2 status

# View logs for crash reasons
pm2 logs advancia-backend --err --lines 100

# Disable auto-restart temporarily
pm2 stop advancia-backend
node src/index.js  # Debug manually
```

### Port Already in Use

```bash
# Find process on port 4000
# Linux/Mac
lsof -i :4000

# Windows
netstat -ano | findstr :4000

# Kill the process or stop PM2
pm2 delete advancia-backend
```

### ES Module Issues

**Error**: `module is not defined in ES module scope`

**Solution**: Ecosystem config must be `.cjs` when package.json has `"type": "module"`.

```bash
mv ecosystem.config.js ecosystem.config.cjs
```

---

## 🔧 Advanced Configuration

### Cluster Mode (Production)

```javascript
{
  name: "advancia-backend",
  script: "src/index.js",
  instances: "max",      // Use all CPU cores
  exec_mode: "cluster",  // Enable clustering
  max_memory_restart: "1G",
  env_production: {
    NODE_ENV: "production",
    PORT: 4000
  }
}
```

### Environment-Specific Settings

```javascript
{
  watch: process.env.NODE_ENV !== 'production',
  max_memory_restart: process.env.NODE_ENV === 'production' ? '1G' : '500M',
  instances: process.env.NODE_ENV === 'production' ? 'max' : 1
}
```

### Multiple Apps

```javascript
module.exports = {
  apps: [
    {
      name: "advancia-backend",
      script: "src/index.js",
      env_production: { PORT: 4000 },
    },
    {
      name: "advancia-worker",
      script: "src/worker.js",
      instances: 2,
    },
  ],
};
```

---

## 📈 Monitoring Integration

### PM2 Plus (Keymetrics)

Advanced monitoring dashboard (optional paid service):

```bash
pm2 plus
# Follow prompts to link your server
```

Features:

- Real-time metrics dashboard
- Exception tracking
- Custom alerts
- Performance profiling

### Custom Monitoring

```bash
# Export metrics to JSON
pm2 jlist > /var/log/pm2-metrics.json

# Send to monitoring service
curl -X POST https://monitoring.example.com/metrics \
  -H "Content-Type: application/json" \
  -d @/var/log/pm2-metrics.json
```

---

## 🎯 Integration with Watchdog Scripts

PM2 works alongside your watchdog monitoring:

### 1. **PM2** - Process management and auto-restart

```bash
pm2 start ecosystem.config.cjs --env production
```

### 2. **simple-watchdog.ps1** - Health monitoring

```powershell
.\simple-watchdog.ps1 -Action watchdog -Interval 60
```

### 3. **parse-watchdog.ps1** - Log analysis

```powershell
.\parse-watchdog.ps1 -Days 7
```

**Why both?**

- **PM2**: Handles crashes and restarts instantly
- **Watchdog**: Monitors API health and sends alerts
- **Parse-watchdog**: Provides historical analysis and trends

---

## 📚 Common Scenarios

### Scenario 1: Development

```bash
# Start with watch mode
pm2 start ecosystem.config.cjs --env development

# Monitor logs
pm2 logs advancia-backend

# Make code changes (auto-restarts)

# Stop when done
pm2 stop advancia-backend
```

### Scenario 2: Production Deployment

```bash
# Initial deployment
pm2 start ecosystem.config.cjs --env production
pm2 startup
pm2 save

# Future updates (zero-downtime)
git pull
npm install
pm2 reload advancia-backend
```

### Scenario 3: Debugging Production Issues

```bash
# Check status
pm2 status

# View recent errors
pm2 logs advancia-backend --err --lines 200

# Check restart count
pm2 describe advancia-backend

# Analyze patterns
cd .. && .\parse-watchdog.ps1 -ShowDetails
```

### Scenario 4: Memory Leak Investigation

```bash
# Monitor memory in real-time
pm2 monit

# Check restart history (memory restarts)
pm2 describe advancia-backend | grep "restart"

# Increase limit temporarily for investigation
# Edit ecosystem.config.cjs: max_memory_restart: "2G"
pm2 reload advancia-backend

# Profile with Node.js inspector
pm2 delete advancia-backend
node --inspect src/index.js
```

---

## ✅ Best Practices

### 1. Development vs Production

- **Dev**: `watch: true`, single instance, lower memory limit
- **Prod**: `watch: false`, multiple instances (cluster), higher memory limit

### 2. Log Management

- Enable log rotation: `pm2 install pm2-logrotate`
- Set max file size: `pm2 set pm2-logrotate:max_size 10M`
- Retain logs: `pm2 set pm2-logrotate:retain 7` (7 days)

### 3. Monitoring

- Check `pm2 status` daily
- Set up alerts for high restart counts
- Use `parse-watchdog.ps1` for weekly analysis

### 4. Updates

- Use `pm2 reload` for zero-downtime updates
- Always run `npm install` before reloading
- Test in staging before production

### 5. Backups

- Save PM2 process list: `pm2 save`
- Backup ecosystem.config.cjs with code
- Document environment variables

---

## 🎉 Summary

**What PM2 Gives You:**

- ✅ Automatic restart on crashes
- ✅ Memory management (auto-restart on high usage)
- ✅ Zero-downtime reloads
- ✅ Cluster mode for multi-core scaling
- ✅ Comprehensive logging
- ✅ Startup on boot
- ✅ Real-time monitoring

**Quick Commands:**

```bash
pm2 start ecosystem.config.cjs --env production  # Start
pm2 status                                       # Check status
pm2 logs advancia-backend                       # View logs
pm2 monit                                        # Monitor metrics
pm2 reload advancia-backend                     # Zero-downtime restart
pm2 stop advancia-backend                       # Stop
```

**Integration:**

- PM2 handles process management
- Watchdog scripts monitor API health
- parse-watchdog.ps1 analyzes historical data
- All work together for maximum reliability

---

## 📞 Support

- **PM2 Docs**: <https://pm2.keymetrics.io/docs/usage/quick-start/>
- **Cluster Mode**: <https://pm2.keymetrics.io/docs/usage/cluster-mode/>
- **Log Rotation**: <https://github.com/keymetrics/pm2-logrotate>
- **PM2 Plus**: <https://pm2.io/>

---

**Ready to use! Backend now has enterprise-grade process management. 🚀**

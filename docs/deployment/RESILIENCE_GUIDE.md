# 🛡️ High Availability & Resilience Guide

This guide explains how Advancia Pay Ledger maintains 99.9% uptime with automatic recovery and user-friendly error handling.

## 🎯 Key Features

### ✅ **Always-On Architecture**
- **Auto-restart on crash**: Both frontend and backend restart automatically within 5 seconds
- **Graceful shutdown**: Ongoing requests complete before restart (15-30 seconds grace period)
- **Health monitoring**: Services self-heal when database connection drops
- **Zero-downtime deploys**: Render health checks prevent traffic to unhealthy instances

### 💙 **User-Friendly Error Experience**
- **Charming maintenance page**: Friendly, reassuring UI instead of technical errors
- **Error boundaries**: React catches crashes and shows "We'll Be Right Back" instead of white screen
- **Auto-recovery countdown**: Page checks backend health every 15 seconds automatically
- **Support contact**: Always visible support email and chat options

---

## 🚀 Production Setup (Render)

### Health Checks (Already Configured)

**Backend:**
```yaml
healthCheckPath: /api/health
healthCheckInterval: 30        # Check every 30 seconds
healthCheckTimeout: 5          # Fail if no response in 5 seconds
numHealthChecks: 3             # Restart after 3 consecutive failures
maxShutdownDelaySeconds: 30    # Allow 30s for graceful shutdown
```

**Frontend:**
```yaml
healthCheckPath: /
healthCheckInterval: 30
healthCheckTimeout: 5
numHealthChecks: 3
maxShutdownDelaySeconds: 15
```

### Environment Variables

#### Backend
- `ENABLE_GRACEFUL_SHUTDOWN=true` - Handles SIGTERM/SIGINT gracefully
- `MAINTENANCE_MODE=false` - Set to `true` to show maintenance message

#### Frontend
- `MAINTENANCE_MODE=false` - Redirect all traffic to `/maintenance` when `true`
- `NEXT_PUBLIC_API_URL` - Backend URL for health checks

---

## 🖥️ Local Development

### Option 1: Auto-Restart Scripts (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\start-resilient.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/start-resilient.sh
./scripts/start-resilient.sh
```

**Features:**
- ✅ Automatically restarts on crash
- ✅ Health checks after each start
- ✅ Logs to `logs/` directory with timestamps
- ✅ Ctrl+C stops all services gracefully

### Option 2: PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start both services
pm2 start ecosystem.config.json

# Monitor
pm2 monit

# View logs
pm2 logs

# Stop
pm2 stop all
```

**PM2 Features:**
- ✅ 2 backend instances (cluster mode)
- ✅ Auto-restart on crash (max 10 restarts)
- ✅ Memory limit: 500MB backend, 300MB frontend
- ✅ Exponential backoff on rapid restarts
- ✅ Built-in health checks

---

## 📄 Error Handling

### Frontend Error Boundary

**Location:** `frontend/src/components/ErrorBoundary.tsx`

**What it does:**
- Catches React component crashes
- Shows friendly "Oops! Taking a Quick Break" page
- Provides "Try Again" and "Go to Dashboard" buttons
- Displays technical details in development mode only

**Already integrated in:** `frontend/src/app/layout.tsx`

### Backend Resilience Middleware

**Location:** `backend/src/middleware/resilience.ts`

**Features:**
1. **Maintenance Mode**: Returns 503 with friendly JSON when `MAINTENANCE_MODE=true`
2. **Error Handler**: Catches all errors, logs them, but keeps server running
3. **404 Handler**: Returns JSON instead of crashing

**Usage:**
```typescript
// In backend/src/index.ts
import { maintenanceMode, resilientErrorHandler, notFoundHandler } from './middleware/resilience';

app.use(maintenanceMode);           // Check for maintenance mode first
// ... your routes ...
app.use(notFoundHandler);            // Catch 404s
app.use(resilientErrorHandler);      // Catch all errors
```

### Graceful Shutdown

**Location:** `backend/src/utils/gracefulShutdown.ts`

**Handles:**
- SIGTERM (Render/Docker stop)
- SIGINT (Ctrl+C)
- Uncaught exceptions
- Unhandled promise rejections

**What happens:**
1. Stop accepting new connections
2. Emit `server-shutdown` socket event to clients
3. Wait up to 15 seconds for ongoing requests
4. Disconnect database gracefully
5. Exit cleanly

---

## 🎨 Maintenance Page

### Trigger Maintenance Mode

**Option 1: Environment Variable (Recommended)**
```bash
# In Render Dashboard or .env
MAINTENANCE_MODE=true
```

**Option 2: Direct Access**
Users can access `/maintenance` page directly to see status

### Maintenance Page Features
- 🎨 Beautiful animated design with rotating gear icon
- ⏱️ Auto-countdown (checks health every 15 seconds)
- 🔄 "Check Status Now" button
- 📧 Support contact info
- 🌐 Link to status page
- 💬 Reassuring messaging: "We'll Be Right Back! 🚀"

---

## 📊 Monitoring & Alerts

### Health Endpoints

**Backend:**
- `GET /api/health` - Full health check (database + memory)
- `GET /api/health/live` - Lightweight liveness probe
- `GET /api/health/ready` - Readiness check (database only)
- `GET /api/health/startup` - Startup check (10 second warmup)

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T12:00:00Z",
  "uptime": 3600,
  "environment": "production",
  "database": "connected",
  "services": {
    "database": "healthy",
    "api": "healthy",
    "memory": "healthy"
  }
}
```

### Set Up Alerts

**Recommended monitoring tools:**
1. **UptimeRobot** - Free, checks health endpoint every 5 minutes
2. **Better Uptime** - Email/SMS alerts
3. **StatusCake** - Free tier available
4. **Render Dashboard** - Built-in uptime tracking

**Alert thresholds:**
- ⚠️ **Warning**: Response time > 2 seconds
- 🚨 **Critical**: Health check fails 3+ times (90 seconds)
- 🔥 **Emergency**: Down for 5+ minutes

---

## 🔧 Troubleshooting

### Service Won't Stay Up

1. **Check logs:**
   ```bash
   # Render Dashboard
   https://dashboard.render.com → Select service → Logs
   
   # Local PM2
   pm2 logs --err
   
   # Local scripts
   ls logs/
   cat logs/backend-*.log
   ```

2. **Common issues:**
   - Database connection string wrong → Check `DATABASE_URL`
   - Port already in use → Kill process: `lsof -ti:4000 | xargs kill -9`
   - Memory limit exceeded → Check `pm2 list` memory column

### Maintenance Mode Stuck

```bash
# Turn off maintenance mode
# In Render: Set MAINTENANCE_MODE=false → Manual Deploy
# Or via CLI:
render env-vars set MAINTENANCE_MODE=false --service=advancia-backend
```

### Health Check Always Failing

1. Verify endpoint works:
   ```bash
   curl https://api.advanciapayledger.com/api/health
   ```

2. Check database connection:
   ```bash
   # In backend directory
   npx prisma studio
   ```

3. Increase timeout in `render.yaml`:
   ```yaml
   healthCheckTimeout: 10  # Increase from 5 to 10
   ```

---

## 📈 Performance Tuning

### PM2 Cluster Mode (Local/VPS)

```json
// ecosystem.config.json
{
  "instances": "max",  // Use all CPU cores
  "exec_mode": "cluster"
}
```

### Memory Optimization

```json
// Increase limits if needed
{
  "max_memory_restart": "1G",  // Restart if exceeds 1GB
  "max_restarts": 20           // Allow more restarts
}
```

### Render Performance

**Upgrade to Starter Plan ($7/month):**
- Persistent disk (logs don't disappear)
- No cold starts (always warm)
- More CPU/memory
- Custom domains included

---

## 🎯 Best Practices

### ✅ DO:
- Monitor health endpoints with external service
- Set up email alerts for downtime
- Test maintenance mode in staging first
- Keep logs for at least 7 days
- Use PM2 for local development
- Set `MAINTENANCE_MODE=true` before risky deploys

### ❌ DON'T:
- Don't use `process.exit()` in code (use graceful shutdown)
- Don't ignore uncaught exceptions (they're logged)
- Don't disable health checks
- Don't set restart limits too low
- Don't forget to test error boundaries

---

## 📚 Files Reference

### Core Files Created
```
backend/
  src/
    routes/health.ts                  # Health check endpoints
    middleware/resilience.ts          # Error handling middleware
    utils/gracefulShutdown.ts         # Shutdown handlers

frontend/
  src/
    app/maintenance/page.tsx          # Maintenance mode UI
    components/ErrorBoundary.tsx      # React error boundary
    middleware.ts                     # Next.js middleware (maintenance redirect)

Root/
  ecosystem.config.json               # PM2 configuration
  render.yaml                         # Render.com deployment config
  scripts/
    start-resilient.sh                # Linux/Mac auto-restart script
    start-resilient.ps1               # Windows auto-restart script
```

---

## 🆘 Support

**Having issues?**
- 📧 Email: support@advanciapayledger.com
- 💬 Live chat: Available on dashboard
- 📖 Docs: Check `/docs` page when live
- 🐛 Issues: Open GitHub issue with logs

---

**Last Updated:** October 26, 2025  
**Status:** ✅ Production Ready  
**Uptime Target:** 99.9%  
**Auto-Recovery:** Enabled  
**User Experience:** Charming & Reassuring 💙

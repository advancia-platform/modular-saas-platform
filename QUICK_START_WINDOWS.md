# 🚀 Quick Start Guide - Windows Setup

## ⚡ ONE-CLICK SETUP

### Option 1: PowerShell (Recommended)

```powershell
# Right-click PowerShell → Run as Administrator
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
.\setup-and-start.ps1
```

### Option 2: Command Prompt

```cmd
# Right-click CMD → Run as Administrator
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
setup-and-start.bat
```

## 📋 What the Scripts Do

1. ✅ Install frontend dependencies
2. ✅ Build frontend (Next.js)
3. ✅ Install PM2 globally (if not installed)
4. ✅ Start backend + frontend + worker with PM2
5. ✅ Save PM2 configuration
6. ✅ Setup auto-restart on reboot

## 🌐 Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api-docs

## 📊 PM2 Management Commands

```bash
# View all processes
pm2 status

# View logs (live)
pm2 logs

# View specific service logs
pm2 logs advancia-backend
pm2 logs advancia-frontend
pm2 logs advancia-worker

# Monitor (interactive dashboard)
pm2 monit

# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# Delete all processes
pm2 delete all
```

## 🔄 Manual Commands (if scripts fail)

```powershell
# 1. Install dependencies
cd frontend
npm install

# 2. Build
npm run build
cd ..

# 3. Install PM2
npm install -g pm2

# 4. Start services
npm run pm2:start:prod

# 5. Check status
pm2 status

# 6. Save & setup auto-start
pm2 save
pm2 startup
```

## ⚠️ Troubleshooting

### PM2 Commands Not Found

```powershell
# Install PM2 globally
npm install -g pm2

# Add to PATH (PowerShell)
$env:Path += ";$env:APPDATA\npm"
```

### Port Already in Use

```bash
# Find process using port 3000 or 4000
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Kill process by PID
taskkill /PID <PID> /F
```

### Permission Errors

- Run PowerShell/CMD as **Administrator**
- Check antivirus isn't blocking npm/node

## 📦 Build Status

✅ **Backend**: `backend/dist/index.js` (41KB) - BUILT
❌ **Frontend**: Needs `npm install` + `npm run build`

## 🎯 Current Commit

```
3071f1ff - feat: add Windows setup scripts for PM2
```

Pushed to: `github.com/advancia-platform/modular-saas-platform`

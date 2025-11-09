# 🎯 Quick Start - Advancia Pay Ledger in WSL

## One-Time Setup

### Step 1: Open PowerShell as Administrator

```powershell
# Navigate to project directory
cd C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform
```

### Step 2: Run Setup

```powershell
# Option A: Using PowerShell launcher (Recommended)
.\wsl-launcher.ps1 setup

# Option B: Manual WSL setup
wsl
chmod +x wsl-setup.sh
./wsl-setup.sh
```

⏱️ **Setup time: 10-15 minutes**

### Step 3: Configure Environment

```bash
# Edit backend .env
nano ~/advancia-pay-ledger/backend/.env

# Edit frontend .env.local
nano ~/advancia-pay-ledger/frontend/.env.local
```

## Daily Usage

### Start Application

```powershell
# From Windows PowerShell
.\wsl-launcher.ps1 start
```

**OR** from WSL:

```bash
wsl
cd ~/advancia-pay-ledger
pm2 start ecosystem.config.js
```

### Check Status

```powershell
.\wsl-launcher.ps1 status
```

### View Logs

```powershell
.\wsl-launcher.ps1 logs
```

### Stop Application

```powershell
.\wsl-launcher.ps1 stop
```

## Access Points

- **Frontend:** <http://localhost:3000>
- **Backend API:** <http://localhost:4000>
- **Admin Panel:** <http://localhost:3000/admin/login>
- **API Health:** <http://localhost:4000/api/health>

## Common Tasks

### Open WSL Shell

```powershell
.\wsl-launcher.ps1 shell
```

### Database Management

```bash
# Open Prisma Studio
cd ~/advancia-pay-ledger/backend
npx prisma studio

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

### Restart Services

```bash
pm2 restart all
```

### View Specific Logs

```bash
pm2 logs advancia-backend
pm2 logs advancia-frontend
```

## Troubleshooting

### Services Won't Start

```bash
# Check PostgreSQL
sudo service postgresql status
sudo service postgresql start

# Check Redis
sudo service redis-server status
sudo service redis-server start
```

### Port Already in Use

```bash
# Kill process on port
lsof -i :4000
kill -9 <PID>
```

### Clear and Reinstall

```bash
# Backend
cd ~/advancia-pay-ledger/backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ~/advancia-pay-ledger/frontend
rm -rf node_modules package-lock.json .next
npm install
```

## Quick Commands Cheat Sheet

| Task        | Command                         |
| ----------- | ------------------------------- |
| Start all   | `pm2 start ecosystem.config.js` |
| Stop all    | `pm2 stop all`                  |
| Restart all | `pm2 restart all`               |
| View status | `pm2 status`                    |
| View logs   | `pm2 logs`                      |
| Monitor     | `pm2 monit`                     |
| Clear logs  | `pm2 flush`                     |
| Delete all  | `pm2 delete all`                |

## File Locations (WSL)

- Project: `~/advancia-pay-ledger/`
- Backend: `~/advancia-pay-ledger/backend/`
- Frontend: `~/advancia-pay-ledger/frontend/`
- Logs: `~/advancia-pay-ledger/logs/`
- Backend .env: `~/advancia-pay-ledger/backend/.env`
- Frontend .env: `~/advancia-pay-ledger/frontend/.env.local`

## Windows ↔ WSL Paths

- Windows project: `C:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform`
- WSL equivalent: `/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform`
- WSL home: `~/` or `/home/<username>/`

## Need Help?

1. Check logs: `pm2 logs`
2. Check status: `pm2 status`
3. Review WSL-SETUP-GUIDE.md for detailed troubleshooting
4. Verify services: `sudo service postgresql status`, `sudo service redis-server status`

---

**🚀 Happy Development!**

# Advancia Pay Ledger - Development Setup Guide

## 🚀 Quick Start (Choose Your Method)

Based on the split-terminal setup shown in your screenshot, here are three ways to run both backend and frontend simultaneously:

---

## Method 1: **tmux Split Panes** (RECOMMENDED) ⭐

This creates the exact layout from your screenshot - backend on left, frontend on right, side-by-side.

```bash
./scripts/start-dev-tmux.sh
```

**What it does:**

- ✅ Opens backend (port 4000) in **left pane**
- ✅ Opens frontend (port 3001) in **right pane**
- ✅ Both servers run in the same terminal window
- ✅ See live output from both servers simultaneously

**tmux Navigation:**

- `Ctrl+B` then `→` or `←` - Switch between panes
- `Ctrl+B` then `D` - Detach (servers keep running in background)
- `tmux attach -t advancia-dev` - Re-attach to session
- `Ctrl+B` then `&` - Kill entire session

**Install tmux (if needed):**

```bash
sudo apt install tmux
```

---

## Method 2: **Split Terminal Windows** (Graphical)

Opens separate terminal tabs/windows for backend and frontend.

```bash
./scripts/start-dev-split.sh
```

**What it does:**

- ✅ Automatically detects your terminal (gnome-terminal, konsole, xterm, etc.)
- ✅ Opens backend in one tab/window
- ✅ Opens frontend in another tab/window
- ✅ Requires graphical environment (X11 or Wayland)

---

## Method 3: **Background Mode** (Headless)

Runs both servers in background with log files.

```bash
./scripts/start-dev.sh
```

**What it does:**

- ✅ Runs backend and frontend in background
- ✅ Logs to `/tmp/advancia-backend.log` and `/tmp/advancia-frontend.log`
- ✅ Press `Ctrl+C` to stop all servers

**View logs:**

```bash
# Watch backend logs
tail -f /tmp/advancia-backend.log

# Watch frontend logs
tail -f /tmp/advancia-frontend.log

# Watch both logs simultaneously
tail -f /tmp/advancia-*.log
```

---

## 🌐 Access Points

Once servers are running:

| Service          | URL                               |
| ---------------- | --------------------------------- |
| **Backend API**  | http://localhost:4000             |
| **Frontend Dev** | http://localhost:3001             |
| **Admin Login**  | http://localhost:3001/admin/login |
| **API Health**   | http://localhost:4000/api/health  |

---

## 🧪 Testing All Features

### 1. Authentication & Admin

```bash
# Admin login
http://localhost:3001/admin/login
# Default: admin@advancia.com / Admin@123

# Test OTP email
curl -X POST http://localhost:4000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{"email":"admin@advancia.com"}'
```

### 2. Payments & Crypto

```bash
# Test Stripe webhook
curl -X POST http://localhost:4000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment_intent.succeeded"}'

# Check crypto payments
curl http://localhost:4000/api/crypto/payments \
  -H "x-api-key: your_api_key" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Real-time Features (Socket.IO)

- Open browser console at http://localhost:3001
- Check WebSocket connection to `ws://localhost:4000`
- Test notifications, live transactions, chat

### 4. Database (Prisma Studio)

```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

---

## 🐛 Troubleshooting

### Ports Already in Use

```bash
# Find and kill process on port 4000 (backend)
sudo lsof -ti:4000 | xargs kill -9

# Find and kill process on port 3001 (frontend)
sudo lsof -ti:3001 | xargs kill -9
```

### Reset Database

```bash
cd backend
npx prisma migrate reset --force
npx prisma db push
npm run db:seed
```

### Clean Install

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json .next
npm install
```

### Environment Variables Missing

```bash
# Check if .env exists
ls -la backend/.env

# Required variables:
# - DATABASE_URL
# - JWT_SECRET
# - API_KEY
# - STRIPE_SECRET_KEY
# - EMAIL_USER
# - EMAIL_PASSWORD
```

---

## 📚 Additional Commands

### Build Both Projects

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Run Tests

```bash
# Backend tests
cd backend && npm test

# Frontend E2E tests
cd frontend && npx playwright test
```

### Type Checking

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx tsc --noEmit
```

### Linting

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

---

## 🎯 VS Code Tasks (Alternative)

If you prefer using VS Code's built-in tasks:

Press `Ctrl+Shift+P` → `Tasks: Run Task` → Select:

- **🚀 Start Development Servers** - Starts both servers
- **🗄️ Database Tools** - Opens Prisma Studio
- **🧪 Run Tests** - Runs all tests

---

## 💡 Pro Tips

1. **Use tmux for the best experience** - matches your screenshot exactly
2. **Keep Prisma Studio open** - monitor database changes in real-time
3. **Check both server logs** - many issues show up in console output
4. **Use browser DevTools** - inspect API calls and WebSocket events
5. **Test with real data** - run `npm run db:seed` in backend

---

## 🆘 Need Help?

- Check logs: `/tmp/advancia-backend.log` and `/tmp/advancia-frontend.log`
- Health check: `curl http://localhost:4000/api/health`
- Database status: `cd backend && npx prisma migrate status`
- Socket.IO: Check browser console for connection errors

---

**Created:** November 9, 2025  
**For:** Advancia Pay Ledger Development Setup

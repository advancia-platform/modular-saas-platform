# 🧹 Project Cleanup & Setup Guide

**Date**: November 8, 2025  
**Goal**: Eliminate duplicates, establish single source of truth

---

## 📁 Current State Analysis

### **Projects Identified**:

1. **`~/projects/advancia-pay-ledger/`** ✅ MAIN (USE THIS)
   - Full monorepo with backend + frontend
   - Complete documentation
   - Most recent updates (Oct 28, 2025)
   - Workspace configuration

2. **`~/projects/advancia-backend-run/`** ⚠️ DUPLICATE (ARCHIVE)
   - Standalone backend only
   - Older version (Oct 23, 2025)
   - Merge any unique features into main

3. **`~/projects/advanciapayledger-local/`** ⚠️ DUPLICATE (DELETE)
   - Local development copy
   - Contains only log files
   - Replace with Docker setup

---

## 🎯 Cleanup Actions

### **Step 1: Archive Duplicate Projects**

```bash
# Create archive directory
mkdir -p ~/archives/$(date +%Y%m%d)

# Move duplicates to archive
mv ~/projects/advancia-backend-run ~/archives/$(date +%Y%m%d)/
mv ~/projects/advanciapayledger-local ~/archives/$(date +%Y%m%d)/

# Verify main project only
ls ~/projects/
# Should show only: advancia-pay-ledger
```

### **Step 2: Review for Unique Code**

**Check if backend-run has anything missing from main**:

```bash
# Compare package.json dependencies
diff ~/archives/*/advancia-backend-run/package.json \
     ~/projects/advancia-pay-ledger/backend/package.json

# Check for unique source files
diff -rq ~/archives/*/advancia-backend-run/src \
        ~/projects/advancia-pay-ledger/backend/src
```

**If unique code found**:
- Copy specific files to main project
- Update with proper paths
- Test functionality

---

## 🚀 Development Environment Setup

### **Prerequisites**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
node --version    # Should be v18+
npm --version     # Should be v9+
docker --version
docker-compose --version
```

---

### **Project Setup**

```bash
# Navigate to main project
cd ~/projects/advancia-pay-ledger

# Install all dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Verify workspaces
npm run prisma:generate
```

---

### **Database Setup (Docker)**

```bash
# Start PostgreSQL container
docker run --name advancia-postgres \
  -e POSTGRES_USER=dev_user \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=advancia_ledger \
  -p 5432:5432 \
  -v advancia-pgdata:/var/lib/postgresql/data \
  -d postgres:14-alpine

# Verify container is running
docker ps | grep advancia-postgres

# Create .env file for backend
cd backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/advancia_ledger?schema=public"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development
JWT_SECRET="your-secret-key-change-in-production"
SESSION_SECRET="your-session-secret-change-in-production"

# Optional: Stripe (for payment features)
# STRIPE_SECRET_KEY="sk_test_..."
# STRIPE_WEBHOOK_SECRET="whsec_..."

# Optional: Twilio (for SMS OTP)
# TWILIO_ACCOUNT_SID="your-account-sid"
# TWILIO_AUTH_TOKEN="your-auth-token"
# TWILIO_PHONE_NUMBER="+1234567890"
EOF

# Run database migrations
npx prisma migrate dev --name init

# Verify database
npx prisma studio
# Opens http://localhost:5555
```

---

### **Frontend Environment**

```bash
# Create .env.local for frontend
cd ../frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NODE_ENV=development
EOF
```

---

### **Start Development Servers**

**Terminal 1 - Backend**:
```bash
cd ~/projects/advancia-pay-ledger/backend
npm run dev
# Should start on http://localhost:4000
```

**Terminal 2 - Frontend**:
```bash
cd ~/projects/advancia-pay-ledger/frontend
npm run dev
# Should start on http://localhost:3000
```

**Terminal 3 - Logs** (optional):
```bash
# Monitor both logs
tail -f ~/projects/advancia-pay-ledger/backend/*.log
```

---

### **Verify Setup**

**Test Backend**:
```bash
# Health check
curl http://localhost:4000/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":...}
```

**Test Frontend**:
- Open browser: `http://localhost:3000`
- Should see login/dashboard page
- No console errors

**Test WebSocket**:
- Login to dashboard
- Open DevTools > Network > WS
- Should see WebSocket connection established

---

## 🧪 Testing Commands

```bash
# From project root
cd ~/projects/advancia-pay-ledger

# Run all tests
npm test

# Backend tests only
cd backend && npm test

# Frontend tests only
cd frontend && npm test

# Check for TypeScript errors
npm run lint

# Build production (verify no errors)
npm run build:backend
npm run build:frontend
```

---

## 📂 Final Project Structure

```
~/
├── projects/
│   └── advancia-pay-ledger/        ← ONLY THIS ONE
│       ├── backend/
│       ├── frontend/
│       ├── docs/
│       ├── scripts/
│       ├── ROADMAP.md             ← Development plan
│       ├── CLIENT_DELIVERABLES.md ← What client gets
│       ├── SETUP.md               ← This file
│       ├── README.md
│       └── package.json
│
├── archives/
│   └── 20251108/                   ← Old projects
│       ├── advancia-backend-run/
│       └── advanciapayledger-local/
│
├── scripts/                        ← Keep utility scripts
│   └── wsl-setup.sh
│
└── certificates/                   ← SSL certs
    └── certs/
```

---

## ✅ Cleanup Checklist

Before starting development:

- [ ] Archive duplicate projects to `~/archives/`
- [ ] Install Node.js 18+
- [ ] Install Docker & Docker Compose
- [ ] Install all npm dependencies
- [ ] Start PostgreSQL container
- [ ] Create `.env` files (backend & frontend)
- [ ] Run database migrations
- [ ] Generate Prisma client
- [ ] Test backend server starts
- [ ] Test frontend server starts
- [ ] Verify health endpoint works
- [ ] Open Prisma Studio successfully
- [ ] WebSocket connection works
- [ ] No TypeScript errors
- [ ] Git status clean

---

## 🔧 Common Issues & Solutions

### **Port Already in Use**
```bash
# Find process using port 4000
lsof -i :4000
# Kill it
kill -9 <PID>
```

### **Database Connection Failed**
```bash
# Check if container is running
docker ps | grep postgres

# Check container logs
docker logs advancia-postgres

# Restart container
docker restart advancia-postgres
```

### **Prisma Client Not Generated**
```bash
cd ~/projects/advancia-pay-ledger/backend
npx prisma generate
```

### **Node Modules Missing**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Next Steps After Setup

1. **Read ROADMAP.md** - Understand project timeline
2. **Review CLIENT_DELIVERABLES.md** - Know what to deliver
3. **Start Phase 2 Development** - Token wallet implementation
4. **Set up Git branches** - Create feature branches
5. **Daily commits** - Keep track of progress

---

## 🤝 Git Workflow

```bash
# Check current status
git status

# Create feature branch
git checkout -b feature/token-wallet

# Make changes, then commit
git add .
git commit -m "feat: implement token balance API"

# Push to remote
git push origin feature/token-wallet

# Merge when ready
git checkout main
git merge feature/token-wallet
```

---

**Setup Complete! 🎉**

Run this to verify everything:
```bash
cd ~/projects/advancia-pay-ledger && \
npm run prisma:generate && \
echo "✅ Setup verified!"
```

# Development Scripts

Quick reference for all development helper scripts.

## 🚀 Main Launchers

### Interactive Launcher (Easiest)

```bash
./scripts/dev.sh
```

Choose your preferred setup method interactively.

### tmux Split Panes (Recommended)

```bash
./scripts/start-dev-tmux.sh
```

Backend (left) | Frontend (right) - exactly like the screenshot.

### Separate Windows

```bash
./scripts/start-dev-split.sh
```

Opens backend and frontend in separate terminal windows/tabs.

### Background Mode

```bash
./scripts/start-dev.sh
```

Runs both servers in background with log files.

---

## 📋 All Available Scripts

| Script                   | Description                                |
| ------------------------ | ------------------------------------------ |
| `dev.sh`                 | Interactive launcher - choose your method  |
| `start-dev-tmux.sh`      | tmux split panes (RECOMMENDED)             |
| `start-dev-split.sh`     | Separate terminal windows                  |
| `start-dev.sh`           | Background mode with logs                  |
| `start-local.ps1`        | PowerShell: backend + frontend (port 3000) |
| `start-frontend-dev.ps1` | PowerShell: frontend only (port 3001)      |
| `run-backend-tsx.ps1`    | PowerShell: backend with tsx               |

---

## 🛠️ Database Scripts

```bash
cd backend

# Open Prisma Studio (GUI)
npx prisma studio

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset --force

# Check migration status
npx prisma migrate status

# Seed admin user
npm run db:seed
```

---

## 🧪 Testing Scripts

```bash
# Backend tests
cd backend && npm test

# Frontend E2E tests
cd frontend && npx playwright test

# Frontend E2E with UI
cd frontend && npm run test:e2e:ui
```

---

## 🚢 Deployment Scripts

| Script                     | Purpose                    |
| -------------------------- | -------------------------- |
| `ADVANCIA-FULL-DEPLOY.ps1` | Full production deployment |
| `deploy.sh`                | Linux deployment script    |
| `STAGING-DEPLOY-TEST.ps1`  | Staging environment deploy |

---

See [DEV_SETUP_GUIDE.md](../DEV_SETUP_GUIDE.md) for detailed instructions.

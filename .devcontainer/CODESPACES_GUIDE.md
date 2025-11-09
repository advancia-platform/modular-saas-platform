# Codespaces Quick Start Guide

## 🚀 Quick Start in Codespaces

### 1. Create a Codespace

- Go to: https://github.com/pdtribe181-prog/-modular-saas-platform
- Click **Code** → **Codespaces** → **Create codespace on main**

### 2. Automatic Setup

The Codespace will automatically:

- ✅ Install Node.js 18 and dependencies
- ✅ Start PostgreSQL and Redis containers
- ✅ Run Prisma migrations
- ✅ Generate Prisma client
- ✅ Configure VS Code extensions

### 3. Start Development Servers

#### Terminal 1 - Backend:

```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend:

```bash
cd frontend
npm run dev
```

### 4. Access Your Apps

- **Frontend**: Port 3000 (auto-forwarded)
- **Backend API**: Port 4000 (auto-forwarded)
- **Database**: Port 5432 (available internally)
- **Redis**: Port 6379 (available internally)

## 🔐 Environment Variables

Create `.env` files in `backend/` and `frontend/`:

### Backend `.env`:

```bash
DATABASE_URL="postgresql://postgres:password@db:5432/saas_platform_dev"
REDIS_URL="redis://:devpassword@redis:6379"
JWT_SECRET="your-jwt-secret-here"
NODE_ENV="development"
FRONTEND_URL="https://${CODESPACE_NAME}-3000.preview.app.github.dev"
```

### Frontend `.env.local`:

```bash
NEXT_PUBLIC_API_URL="https://${CODESPACE_NAME}-4000.preview.app.github.dev"
```

## 🛠️ Useful Commands

### Database:

```bash
# Run migrations
cd backend && npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Testing:

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
cd frontend && npx playwright test
```

### Docker:

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f db redis

# Restart services
docker-compose restart
```

## 🤖 RPA Automation

All GitHub Actions workflows work seamlessly with Codespaces commits:

- Auto-validation on PRs
- Auto-deployment to Render
- Self-healing monitoring

## 📚 Pre-installed VS Code Extensions

- ✅ ESLint & Prettier
- ✅ GitHub Copilot
- ✅ Playwright Test Runner
- ✅ Jest Runner
- ✅ Docker & Kubernetes Tools
- ✅ Prisma
- ✅ Thunder Client (API testing)
- ✅ Git Graph

## 🔄 Codespace Management

### Stop Codespace:

- Closes automatically after 30min of inactivity
- Manually: **Codespaces** menu → **Stop Current Codespace**

### Delete Codespace:

- GitHub → **Codespaces** → **Manage** → Delete unused ones

### Rebuild Container:

- **Cmd/Ctrl + Shift + P** → **Rebuild Container**

## 💡 Tips

1. **Ports**: All development ports are auto-forwarded with HTTPS
2. **Secrets**: GitHub secrets are automatically available in Codespaces
3. **Performance**: Use prebuild to speed up creation (configured)
4. **Storage**: Each Codespace has 32GB disk space
5. **Persistence**: Files persist even when Codespace is stopped

## 🆘 Troubleshooting

### Database connection issues:

```bash
docker-compose restart db
cd backend && npx prisma migrate deploy
```

### Port already in use:

```bash
# Kill process on port 4000
npx kill-port 4000

# Kill process on port 3000
npx kill-port 3000
```

### Dependencies out of sync:

```bash
rm -rf node_modules package-lock.json
npm install
```

## 🌐 Accessing Your App

Your Codespace URLs follow this pattern:

```
Frontend: https://${CODESPACE_NAME}-3000.preview.app.github.dev
Backend:  https://${CODESPACE_NAME}-4000.preview.app.github.dev
```

URLs are automatically generated and shared via the **Ports** tab.

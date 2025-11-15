# 👋 Welcome to Advancia Pay Ledger!

## 🚀 Developer Onboarding Checklist

This guide will get you from zero to running tests in under 10 minutes.

---

### ✅ Prerequisites (5 minutes)

Install these tools if you don't have them:

- [ ] **Git** - Version control

  ```bash
  # Check if installed
  git --version

  # Install (if needed)
  # Ubuntu/Debian: sudo apt-get install git
  # macOS: brew install git
  # Windows: https://git-scm.com/download/win
  ```

- [ ] **Docker** - Container runtime

  ```bash
  # Check if installed
  docker --version

  # Install: https://docs.docker.com/get-docker/
  ```

- [ ] **Docker Compose** - Multi-container orchestration

  ```bash
  # Check if installed
  docker-compose --version

  # Usually comes with Docker Desktop
  ```

- [ ] **Node.js 18+** - JavaScript runtime

  ```bash
  # Check version
  node --version

  # Install: https://nodejs.org/ (choose LTS)
  ```

- [ ] **Make** - Build automation (optional but recommended)

  ```bash
  # Check if installed
  make --version

  # Ubuntu/Debian: sudo apt-get install build-essential
  # macOS: Already installed with Xcode Command Line Tools
  # Windows: Use WSL, Git Bash, or install via Chocolatey
  ```

---

### 📥 1. Clone the Repository (1 minute)

```bash
# Clone the repo
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git

# Navigate to project directory
cd -modular-saas-platform

# Check current branch
git branch
```

**Expected output:** You should be on the `main` branch.

---

### ⚙️ 2. Environment Setup (2 minutes)

#### Option A: Using provided template (recommended)

```bash
# Backend environment
cd backend
cat .env.test

# Verify TEST_DATABASE_URL is set:
# TEST_DATABASE_URL=postgres://test_user:test_pass@localhost:5432/advancia_test
```

The `.env.test` file is already configured with sensible defaults for testing.

#### Option B: Create local override (if needed)

```bash
# Create personal override (gitignored)
cat > backend/.env.test.local <<EOF
# Personal test database configuration
TEST_DATABASE_URL=postgres://myuser:mypass@localhost:5432/advancia_test
ENABLE_TEST_LOGGING=true
TEST_TIMEOUT=60000
EOF
```

---

### 🐳 3. Run Tests with Docker (2 minutes)

The fastest way to verify everything works:

```bash
# Return to root directory
cd ..

# Run tests in Docker containers
make docker-test
```

**What happens:**

1. ✅ Spins up PostgreSQL test database
2. ✅ Spins up Redis cache
3. ✅ Builds backend Docker image
4. ✅ Runs migrations
5. ✅ Seeds test data
6. ✅ Runs all tests
7. ✅ Exits and stops containers

**Expected output:**

```
Test Suites: X passed, X total
Tests:       X passed, X total
Snapshots:   0 total
Time:        XX.XXXs
```

---

### 🧪 4. Run Tests Locally (Alternative)

If you prefer running tests without Docker:

```bash
# Install dependencies
cd backend
npm install

# Setup test database (one-time)
make db-setup
# or: npm run db:setup:test

# Run tests
npm test

# Or with coverage
npm run test:coverage
```

---

### 🔑 5. Test Credentials

After running `make db-setup` or `npm run seed:test`, these accounts are created:

| Role      | Email               | Password      | Description          |
| --------- | ------------------- | ------------- | -------------------- |
| **Admin** | admin@advancia.test | TestAdmin123! | Full system access   |
| **User**  | user@advancia.test  | TestUser123!  | Regular user account |
| **Agent** | agent@advancia.test | TestAgent123! | Support agent        |

**Test these credentials:**

```bash
# Start backend dev server
cd backend
npm run dev

# In another terminal, test login
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@advancia.test","password":"TestUser123!"}'
```

---

### 📊 6. Verify Test Data (Optional)

Check what data was seeded:

```bash
# Open Prisma Studio (database GUI)
cd backend
npm run prisma:studio:test

# Or use psql directly
docker-compose -f docker-compose.test.yml exec postgres \
  psql -U test_user -d advancia_test

# List users
SELECT email, role FROM "User";

# List wallets
SELECT "userId", balance, currency FROM "TokenWallet";
```

**Expected data:**

- ✅ 3 Users (admin, user, agent)
- ✅ 2 Token Wallets (admin: 10,000 ADVP, user: 1,000 ADVP)
- ✅ 1 Crypto Wallet (user: 100 USDT)
- ✅ 2 Transactions
- ✅ 2 Support Tickets
- ✅ 2 Notifications

---

### 🛠️ 7. Common Development Commands

```bash
# ─── Testing ─────────────────────────────────
make test              # Run all tests
make test-watch        # Run tests in watch mode
make test-coverage     # Run with coverage report
make quick-test        # Setup DB + run tests (most common)

# ─── Database ────────────────────────────────
make db-setup          # Create + migrate + seed
make db-migrate        # Run migrations only
make db-seed           # Seed data only
make db-reset          # Reset database (drop + recreate)
make db-studio         # Open Prisma Studio GUI

# ─── Docker ──────────────────────────────────
make docker-up         # Start all services
make docker-down       # Stop all services
make docker-logs       # View logs
make docker-clean      # Remove containers + volumes

# ─── Development ─────────────────────────────
make dev-backend       # Start backend dev server
make dev-frontend      # Start frontend dev server
make install           # Install all dependencies

# ─── Help ────────────────────────────────────
make help              # Show all available commands
```

---

### 🚦 8. Verify Everything Works

Run this quick verification:

```bash
# 1. Run tests
make test

# 2. Check Docker services
make docker-up
make status

# 3. View logs
make docker-logs-backend

# 4. Stop services
make docker-down
```

**Expected results:**

- ✅ All tests pass
- ✅ PostgreSQL is healthy
- ✅ Redis is healthy
- ✅ Backend responds to health checks

---

### 🏗️ 9. Project Structure

```
-modular-saas-platform/
├── backend/
│   ├── src/
│   │   ├── __tests__/          # Test files
│   │   │   ├── setup.js        # Test setup
│   │   │   └── integration/    # Integration tests
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Express middleware
│   │   └── index.js            # Entry point
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── scripts/
│   │   ├── seed-test-data.js   # Seed script
│   │   └── setup-test-db.js    # Setup script
│   ├── .env.test               # Test environment
│   ├── jest.config.js          # Jest configuration
│   └── package.json            # Dependencies + scripts
├── frontend/
│   └── ...
├── docker-compose.test.yml     # Docker test setup
├── Makefile                     # Development shortcuts
└── README.md                    # This file!
```

---

### 📚 10. Next Steps

Now that you're set up, explore these resources:

1. **[TEST_DATABASE_SETUP.md](TEST_DATABASE_SETUP.md)**  
   Complete guide to test database setup and strategies

2. **[TEST_DATABASE_QUICK_REFERENCE.md](TEST_DATABASE_QUICK_REFERENCE.md)**  
   Quick commands and troubleshooting

3. **[COMPLETE_ALERTING_OPERATIONS_GUIDE.md](COMPLETE_ALERTING_OPERATIONS_GUIDE.md)**  
   Production operations manual

4. **[PROMETHEUS_SETUP_GUIDE.md](PROMETHEUS_SETUP_GUIDE.md)**  
   Monitoring stack setup

5. **Write your first test:**

   ```bash
   # Create a new test file
   cat > backend/src/__tests__/integration/my-feature.test.js <<EOF
   describe('My Feature', () => {
     test('should work', async () => {
       expect(true).toBe(true);
     });
   });
   EOF

   # Run your test
   npm test -- my-feature.test.js
   ```

---

### 🐛 Troubleshooting

#### "Cannot connect to test database"

```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.test.yml ps

# View PostgreSQL logs
make docker-logs-postgres

# Restart services
make docker-down
make docker-up
```

#### "Port 5432 already in use"

```bash
# Check what's using the port
lsof -i :5432
# or on Windows
netstat -ano | findstr :5432

# Stop conflicting service
sudo systemctl stop postgresql
# or kill the process
kill -9 <PID>
```

#### "Tests hanging"

```bash
# Increase timeout in .env.test
TEST_TIMEOUT=60000

# Or kill hung processes
docker-compose -f docker-compose.test.yml down
```

#### Need help?

- Check logs: `make docker-logs`
- View status: `make status`
- See all commands: `make help`
- Read [TEST_DATABASE_SETUP.md](TEST_DATABASE_SETUP.md) for detailed troubleshooting

---

### ✅ Onboarding Complete!

You're now ready to:

- ✅ Run tests locally and in Docker
- ✅ Use test credentials for authentication
- ✅ Access test database via Prisma Studio
- ✅ Use Make shortcuts for common tasks
- ✅ Contribute to the codebase

**Welcome to the team! 🎉**

---

### 🤝 Contributing

Before submitting a PR:

```bash
# 1. Run tests
make test

# 2. Check coverage (aim for >80%)
make test-coverage

# 3. Lint code
make lint

# 4. Simulate CI pipeline
make ci-test

# 5. Create PR with clear description
git checkout -b feature/my-feature
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

---

**Questions?** Open an issue or ask in the team chat!

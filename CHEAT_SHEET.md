# ⚡ Advancia Day-1 Cheat Sheet

## Commands Only (No Explanations)

```bash
# Clone repo
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
cd -modular-saas-platform

# Copy env file
cp backend/.env.test.example backend/.env.test

# Run tests (Docker Compose)
make docker-test

# Start local dev services
make docker-up

# Stop services
make docker-down

# Clean containers + volumes
make docker-clean

# View logs
make docker-logs

# View backend logs only
make docker-logs-backend

# View PostgreSQL logs only
make docker-logs-postgres

# Open shell in backend container
make docker-shell-backend

# Open PostgreSQL shell
make docker-shell-postgres

# Show service status
make status

# Check health of all services
make health

# Run tests locally (without Docker)
make test

# Run tests with coverage
make test-coverage

# Run tests in watch mode
make test-watch

# Setup test database
make db-setup

# Reset test database
make db-reset

# Seed test database
make db-seed

# Open Prisma Studio
make db-studio

# Run migrations
make db-migrate

# Install dependencies
make install

# Start backend dev server
make dev-backend

# Start frontend dev server
make dev-frontend

# Lint code
make lint

# Format code
make format

# Show all available commands
make help

# Quick setup + test
make quick-test

# Reset and test
make reset-and-test

# Simulate CI pipeline
make ci-test

# Clean coverage reports
make clean-coverage

# Clean log files
make clean-logs

# Clean everything
make clean-all

# Full CI pipeline
make full-ci
```

---

## Test Credentials

| Role  | Email               | Password      |
| ----- | ------------------- | ------------- |
| Admin | admin@advancia.test | TestAdmin123! |
| User  | user@advancia.test  | TestUser123!  |
| Agent | agent@advancia.test | TestAgent123! |

---

## Key Files

- `DEVELOPER_ONBOARDING.md` - Complete onboarding guide
- `TEST_DATABASE_SETUP.md` - Test database setup
- `TEST_DATABASE_QUICK_REFERENCE.md` - Quick troubleshooting
- `docker-compose.test.yml` - Docker test setup
- `Makefile` - All commands
- `backend/.env.test` - Test environment
- `backend/jest.config.js` - Jest configuration

---

## Need Help?

```bash
# Show all commands with descriptions
make help

# Check service status
make status

# View logs
make docker-logs
```

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0

# Contributing to Advancia Pay Ledger 🚀

We're excited that you want to contribute! This guide will help you set up your environment, follow our standards, and submit high‑quality contributions to our fintech platform.

---

## 🛠 Getting Started

1. **Fork the repository**  
   Click the "Fork" button at the top right of this repo.

2. **Clone your fork**

   ```bash
   git clone https://github.com/<YOUR_USERNAME>/modular-saas-platform.git
   cd modular-saas-platform
   ```

3. **Set up development environment**

   ```bash
   # Backend setup
   cd backend
   npm install

   # Python test dependencies
   pip install -r requirements-test.txt

   # Frontend setup
   cd ../frontend
   npm install

   # Environment variables
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**

   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

---

## 🧪 Running Tests

### Backend API Tests

```bash
cd backend

# Run all tests with coverage
python run_tests.py --coverage-threshold 80

# Run specific test categories
python run_tests.py -m "rbac"           # RBAC tests only
python run_tests.py -m "notification"   # Notification tests only
python run_tests.py -m "not slow"       # Exclude performance tests

# Run with security checks
python run_tests.py --full-check
```

### Frontend Tests

```bash
cd frontend
npm test                    # Run Jest tests
npm run test:coverage       # Run with coverage
npm run test:e2e           # Run Playwright E2E tests
```

### Critical Test Requirements

- **All RBAC tests must pass**: Admin/Auditor can save preferences, Viewer read-only access
- **Coverage threshold**: Minimum 80% for backend, 75% for frontend
- **Security tests**: No vulnerabilities in dependencies
- **Integration tests**: Multi-service notification workflows

---

## 📖 Documentation

- We use **MkDocs** for comprehensive documentation
- To preview locally:

  ```bash
  cd docs
  pip install mkdocs-material
  mkdocs serve
  ```

- **All new features must include**:
  - API documentation updates
  - RBAC permission documentation
  - Integration examples
  - Security considerations

---

## 🔎 Code Style & Quality

### Backend (Node.js + TypeScript)

```bash
cd backend
npm run lint              # ESLint checking
npm run lint:fix          # Auto-fix issues
npm run format            # Prettier formatting
npm run type-check        # TypeScript validation
```

### Frontend (Next.js + TypeScript)

```bash
cd frontend
npm run lint              # ESLint + Next.js rules
npm run lint:fix          # Auto-fix issues
npm run type-check        # TypeScript validation
```

### Python (Test Suite)

```bash
cd backend
flake8 tests/             # PEP8 compliance
black tests/ --check      # Code formatting
isort tests/ --check-only # Import sorting
mypy tests/               # Type checking
```

---

## 🔒 Security & Compliance

### Critical Security Rules

- **Never commit secrets** (API keys, JWT secrets, database URLs)
- **Use environment variables** and GitHub Secrets for sensitive data
- **All preference changes** must be logged in AdminAuditTrail
- **RBAC permissions** must be preserved in all modifications
- **Input validation** required for all API endpoints

### Security Checks

```bash
# Backend security scan
npm audit
bandit -r src/

# Frontend security scan
npm audit

# Python dependencies
safety check
pip-audit
```

---

## 📦 Submitting Changes

### 1. Create Feature Branch

```bash
git checkout -b feature/notification-preferences-enhancement
git checkout -b fix/rbac-permission-bug
git checkout -b docs/api-integration-guide
```

### 2. Commit with Clear Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(notifications): add digest frequency preferences"
git commit -m "fix(auth): resolve viewer role permission escalation"
git commit -m "docs(api): add Resend integration examples"
git commit -m "test(rbac): add cross-role preference isolation tests"
```

### 3. Push and Open Pull Request

```bash
git push origin feature/my-feature
```

### 4. PR Requirements Checklist

- [ ] **Passes all CI/CD checks** (tests + coverage ≥ 80%)
- [ ] **Security scan passes** (no critical vulnerabilities)
- [ ] **RBAC tests pass** (role permissions maintained)
- [ ] **Documentation updated** (API docs, integration guides)
- [ ] **Audit logging preserved** (preference changes tracked)
- [ ] **At least one reviewer approval** from maintainers
- [ ] **Conventional commit messages** for automatic changelog

---

## 🏗 Architecture Guidelines

### Backend Structure

- **Routes**: Express routers in `src/routes/`
- **Services**: Business logic in `src/services/`
- **Middleware**: Authentication, validation in `src/middleware/`
- **Database**: Prisma ORM with PostgreSQL
- **Real-time**: Socket.IO with user-specific rooms

### Frontend Structure

- **Components**: Reusable UI in `components/`
- **Pages**: Next.js App Router in `app/`
- **Hooks**: Custom React hooks in `hooks/`
- **Types**: TypeScript definitions in `types/`

### Integration Patterns

- **Notification Services**: Unified interface in `notificationService.ts`
- **Error Handling**: Consistent error responses with audit logging
- **Authentication**: JWT with role-based permissions
- **Database**: Decimal serialization for financial data

---

## 🤝 Code of Conduct

By contributing, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).  
Respectful collaboration and inclusive communication are expected at all times.

---

## 🆘 Getting Help

- **Documentation**: Check `docs/` directory and MkDocs site
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Email <security@advancia.com> for vulnerabilities

---

## 🚀 Thank You

Your contributions help make Advancia Pay Ledger a world-class fintech platform!  
Every PR, issue report, and documentation improvement makes a difference.

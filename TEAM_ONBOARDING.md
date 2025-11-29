# Team Onboarding Guide

Welcome to the Advancia Pay Ledger development team! This guide will help you get set up quickly.

## 1. Prerequisites

Before starting, ensure you have:

- [ ] GitHub account with 2FA enabled
- [ ] Access to the GitHub organization
- [ ] VS Code installed with recommended extensions
- [ ] Node.js 18+ and npm 9+
- [ ] Docker Desktop (for local database)
- [ ] Git configured with GPG signing (recommended)

## 2. Repository Access

### 2.1 Clone the Repository

```bash
git clone https://github.com/your-org/modular-saas-platform.git
cd modular-saas-platform
```

### 2.2 Team Membership

Request access to the appropriate GitHub team based on your role:

| Team              | Permissions                  | Responsibilities                         |
| ----------------- | ---------------------------- | ---------------------------------------- |
| @docs-team        | Write (docs/)                | Documentation updates                    |
| @security-team    | Admin (security files)       | Security reviews, vulnerability response |
| @compliance-team  | Write (docs/)                | Compliance documentation                 |
| @product-team     | Write (docs/)                | Roadmap, feature specifications          |
| @backend-team     | Write (backend/)             | Backend development                      |
| @devops-team      | Admin (terraform/, .github/) | Infrastructure, CI/CD                    |
| @automation-team  | Write (scripts/)             | Scripts, tooling                         |
| @repo-maintainers | Admin (\*)                   | Full repository access                   |

### 2.3 Branch Protection

The `main` branch is protected:

- Pull requests required
- At least 1 review from CODEOWNERS
- Status checks must pass
- Force push disabled

## 3. Development Setup

### 3.1 Quick Start

```powershell
# Run the automated setup script
./scripts/setup-dev.ps1
```

Or manually:

```bash
# Install dependencies
npm install

# Generate Prisma client
cd backend && npx prisma generate

# Start Docker services
docker-compose up -d

# Run database migrations
cd backend && npx prisma migrate dev

# Start development servers
npm run dev
```

### 3.2 Environment Variables

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Required variables (get from team lead):

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe API key (test mode)
- `SENTRY_DSN` - Sentry project DSN

## 4. Project Structure

```
modular-saas-platform/
├── backend/                 # Express + TypeScript API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation, logging
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers (decimal, password)
│   │   └── prismaClient.ts # Database client (singleton!)
│   └── prisma/
│       └── schema.prisma   # Database schema
├── frontend/               # Next.js 14 App Router
│   ├── app/               # Page routes
│   ├── components/        # React components
│   └── lib/               # Utilities
├── scripts/               # Automation scripts
├── .github/
│   ├── workflows/         # CI/CD pipelines
│   └── instructions/      # AI assistant rules
└── docs/                  # Documentation
```

## 5. Key Conventions

### 5.1 Code Style

- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Run `npm run check` before committing

### 5.2 Database

- Always use `backend/src/prismaClient.ts` (singleton)
- Use `serializeDecimal()` for Decimal fields in API responses
- Run `npx prisma migrate dev` for schema changes

### 5.3 Authentication

- Use `authenticateToken` middleware for protected routes
- Use `requireAdmin` for admin-only endpoints
- JWT tokens expire in 15 minutes (use refresh tokens)

### 5.4 Error Handling

- Use Winston logger (`backend/src/logger.ts`)
- Return `{ error: string }` on failures
- Capture exceptions with Sentry

## 6. Development Workflow

### 6.1 Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push and create PR
git push -u origin feature/your-feature-name
```

### 6.2 Commit Message Format

Follow Conventional Commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `refactor:` - Code restructuring
- `test:` - Test additions
- `chore:` - Maintenance tasks

### 6.3 Pull Request Checklist

Before submitting a PR:

- [ ] Code passes `npm run check`
- [ ] Tests added for new features
- [ ] Documentation updated if needed
- [ ] No secrets in code
- [ ] Decimal fields use serialization helpers

## 7. Useful Commands

```bash
# Development
npm run dev              # Start both frontend/backend
npm run dev:backend      # Backend only (port 4000)
npm run dev:frontend     # Frontend only (port 3000)

# Testing
npm run test             # Run all tests
npm run test:coverage    # With coverage report

# Database
cd backend
npx prisma studio        # Visual DB browser
npx prisma migrate dev   # Create/apply migrations
npx prisma generate      # Regenerate client

# Quality
npm run check            # Type-check + lint + test
npm run fix              # Auto-fix lint issues
```

## 8. Getting Help

### 8.1 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [SECURITY.md](./SECURITY.md) - Security policies
- [API docs](./docs/api/) - API reference

### 8.2 Contacts

| Question Type     | Contact        |
| ----------------- | -------------- |
| Technical issues  | @backend-team  |
| Security concerns | @security-team |
| Infrastructure    | @devops-team   |
| Feature requests  | @product-team  |
| Documentation     | @docs-team     |

### 8.3 Slack Channels

- #dev-general - General development discussions
- #dev-backend - Backend specific questions
- #dev-frontend - Frontend specific questions
- #security-alerts - Security notifications
- #deployments - Deployment status updates

## 9. Security Reminders

⚠️ **Critical Security Rules**

1. **Never commit secrets** - Use environment variables
2. **No raw Prisma Decimals** - Always serialize
3. **Validate all inputs** - Use `validateInput` middleware
4. **Log securely** - Don't log PII or tokens
5. **Review admin actions** - Use audit logging

Read [SECURITY.md](./SECURITY.md) for complete security guidelines.

## 10. Onboarding Checklist

Complete these tasks in your first week:

- [ ] Set up local development environment
- [ ] Run the full test suite successfully
- [ ] Review ARCHITECTURE.md
- [ ] Review SECURITY.md
- [ ] Join relevant Slack channels
- [ ] Make a small documentation fix (practice PR)
- [ ] Shadow a code review
- [ ] Complete security awareness training

---

_Welcome to the team! 🚀_

---
applyTo: "**"
---

## Advancia Pay Ledger — AI agent working guide

Purpose: give AI coding agents the minimum, specific context to be productive in this repo without guesswork.

### Architecture and boundaries

- **Backend**: Node.js + Express + TypeScript, Prisma ORM, Socket.IO. Entry: `backend/src/index.ts`.
- **Frontend**: Next.js 14 (App Router) with Turbopack in `frontend/` consuming `/api/**` from backend.
- **Database**: PostgreSQL via Prisma with extensive models (see `backend/prisma/schema.prisma`). Use `backend/src/prismaClient.ts` for singleton PrismaClient.
- **Realtime**: Socket.IO on the same HTTP server. Clients join per-user rooms: `join-room` → room `user-${userId}`. Server emits domain-specific events (transactions, notifications).
- **Notifications**: Multi-channel (web push + email + socket) in `backend/src/services/notificationService.ts`. Socket instance injected via `setSocketIO(io)` from `index.ts`.
- **Monitoring**: Prometheus metrics + Sentry error tracking initialized early in `backend/src/index.ts` with custom metrics for HTTP requests and business operations.

### Critical runtime behaviors

- **Rate limiting**: Applied to all `/api/**` routes via middleware in `backend/src/index.ts`.
- **Stripe webhooks**: Requires raw body on `/api/payments/webhook` BEFORE `express.json()`. Never reorder middleware.
- **Authentication**: Dual-mode JWT system with `authenticateToken` (legacy) and `authenticateTokenWithSession` (new) in `backend/src/middleware/auth.ts`. Use role gates: `allowRoles/requireAdmin`.
- **Decimal handling**: Prisma Decimal fields MUST be serialized as strings. Always use `backend/src/utils/decimal.ts` helpers: `serializeDecimal()`, `serializeDecimalFields()`, `serializeDecimalArray()`.
- **Session management**: Enhanced auth uses `sessionManager` from `backend/src/auth/sessionManager.ts` with activity tracking.
- **Sentry integration**: Automatic error capturing with route grouping and security event logging in auth middleware.

### Route architecture and patterns

- **Route files**: 80+ routers in `backend/src/routes/*.ts`, each exports Express router. Major ones: `auth.ts`, `tokens.ts`, `withdrawals.ts`, `cryptomus.ts`, `payments.ts`, `admin/`.
- **Registration**: Wire routers in `backend/src/index.ts` "Registering routes" section as `/api/<name>`. Keep Stripe webhook raw-body line before `express.json()`.
- **Validation**: Use `backend/src/middleware/security.ts` - `validateInput`, `securityHeaders` for consistent input handling.
- **Auth patterns**: Most routes use `authenticateToken` → check `req.user.role` for authorization. Admin routes stack `requireAdmin` middleware.

### Data model essentials (Prisma)

- **Financial core**: `User`, `Transaction`, `TokenWallet` (with Decimal fields), `CryptoPayments`, `CryptoWithdrawal`, `Reward`, `UserTier`.
- **Business logic**: `RPAWorkflow`, `RPAExecution` for automation, extensive audit/logging models, notification preferences.
- **Schema changes**: `backend/prisma/schema.prisma` → `npx prisma migrate dev` → `npm run prisma:generate` → verify with `npx prisma studio`.
- **Migration pattern**: Always backup before schema changes. Use descriptive migration names.

### Realtime and notifications

- To emit to a specific user: join room `user-${userId}` then `io.to(`user-${userId}`).emit('event', payload)`.
- Notification service sends socket, push (web-push), and email (nodemailer). Environment keys: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `EMAIL_USER`, `EMAIL_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`.
- Admin broadcasts: Emit to `admins` room for admin-only notifications.

### External integrations and services

- **Authentication**: Multi-method with email OTP (Gmail SMTP), password + bcrypt, TOTP 2FA. Session-based JWT with activity tracking.
- **Payment processors**: 
  - Stripe for fiat (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
  - Cryptomus for crypto (`CRYPTOMUS_API_KEY`, `CRYPTOMUS_MERCHANT_ID`)
  - Support for BTC/ETH/USDT with real-time status tracking
- **Email stack**: Gmail SMTP (transactional), Resend (templates), SendGrid (bulk). Multiple providers for reliability.
- **Blockchain**: ethers v5 (backend), ethers v6 (frontend). Crypto address validation via `crypto-address-validator`.
- **Infrastructure**: Sentry (errors), Prometheus (metrics), Redis (caching), AWS S3 (backups), Digital Ocean Spaces (automated backups).

### Development workflows (npm workspaces)

- **Quick start**: `npm run dev` (both frontend/backend), or `npm run dev:safe` (with failure recovery).
- **Individual**: `npm run dev:frontend` (Next.js on :3000), `npm run dev:backend` (Express on :4000).
- **Database**: `docker-compose up -d` for local Postgres+Redis, then `npx prisma migrate dev` in `backend/`.
- **Debugging**: `npm run dev:debug` includes log tailing. Use VS Code launch configs for Node inspector.
- **Testing**: `npm run check` (type-check + lint + test), `npm test` (all workspaces), `npm run test:coverage`.
- **Prisma Studio**: `cd backend && npx prisma studio` for visual DB management.

### CI/CD and deployment workflows

- **GitHub Actions**: Multiple workflows in `.github/workflows/`:
  - `ci.yml`: Build/test on push/PR
  - `ci-pnpm.yml`: Type checking and linting with pnpm
  - `backup-and-migrate.yml`: Nightly DB backups to Digital Ocean Spaces
  - `integration-tests.yml`: End-to-end testing
- **Deployment**:
  - **Backend**: Render (Node.js Web Service + PostgreSQL) - auto-deploys on push to `main`
  - **Frontend**: Vercel (Next.js) - auto-deploys on push to `main`
  - **CDN/DNS**: Cloudflare
  - **Backups**: Digital Ocean Spaces (S3-compatible, automated nightly)
- **Environment management**: Configure via Render dashboard (backend) and Vercel dashboard (frontend).
- **Branch protection**: Automated via `apply-branch-protection.yml`.

### Debugging patterns

- Node inspector: `node --inspect=9229 -r ts-node/register backend/src/index.ts` or launch via VS Code.
- Next.js inspector: `node --inspect=9230 node_modules/next/dist/bin/next dev`.
- VS Code launch config: Attach to port 9229 for backend debugging.
- Use `debugger` in route handlers; set breakpoints in async functions.
- Winston logging: Use `backend/src/logger.ts` for structured logging (replaces console.log in production).

### Project-specific patterns and conventions

- **Workspace structure**: npm workspaces with shared scripts. Use `npm run <script> --workspaces` for bulk operations.
- **Frontend performance**: Next.js 14 with Turbopack, aggressive bundle optimization in `next.config.js`. Image optimization with WebP/AVIF.
- **Security headers**: CSP, HSTS, and security headers configured in Next.js and Express middleware.
- **Git workflow**: Automated branch protection, PR labeling, and release drafting via GitHub Actions. 40+ workflow files in `.github/workflows/`.
- **Deployment**: Auto-deploy to Render (backend) + Vercel (frontend) on `main` push. Blue-green and canary deployment workflows available.
- **Testing strategy**: Jest (unit/integration), Playwright (e2e), security evaluation with Python scripts in `backend/security-tests/`.
- **Code quality**: ESLint + Prettier with automatic fixes on save. Husky pre-commit hooks with type checking.
- Integration tests: `npm run test:integration` for API endpoint testing.
- Error formats: Throw `Error` with descriptive messages; routes return `{ error: string }` on 400/500.

### Error handling and logging

- Use Winston logger (`backend/src/logger.ts`) for structured logging with levels (error, warn, info, debug).
- Error handler middleware (`backend/src/middleware/errorHandler.ts`): Production shows generic messages, development shows stack traces.
- Routes: Catch async errors with try/catch; return `{ success: false, error: string }` on failures.
- Frontend: Handle API errors in `useEffect` or hooks; display user-friendly messages via react-hot-toast.
- Common patterns: Validate inputs early; use `backend/src/middleware/security.ts` for sanitization.

### Implementation tips specific to this repo

- Always import Prisma via `backend/src/prismaClient.ts` to avoid multiple clients.
- Convert Prisma Decimal to string in responses using `backend/src/utils/decimal.ts` helpers.
- When adding a new route that emits events, inject `io` via helper (see `setSocketIO` in notification service or `setTokenSocketIO` in `routes/tokens.ts`).
- Respect CORS policy: add new dev origins in `backend/src/config/index.ts` so the middleware allows them.
- Keep `/api/payments/webhook` raw-body middleware before any JSON parser.
- Crypto operations: Use ethers v5 in backend routes, ethers v6 in frontend components.
- Email templates: Use React Email components in `backend/src/emails/` for HTML templates.
- Database backups: Automated nightly via GitHub Actions; manual via `npm run db:backup`.

### Files to read first for context

- `backend/src/index.ts` (server, middleware order, route wiring, Socket.IO, cron)
- `backend/src/config/index.ts` (origins, ports, env derivation)
- `backend/src/services/notificationService.ts` (push/email/socket pattern)
- `backend/src/utils/decimal.ts` (Decimal serialization helpers)
- `backend/prisma/schema.prisma` (entities & relations)
- `backend/src/routes/cryptomus.ts` (crypto payment integration)
- `backend/src/logger.ts` (logging patterns)
- `frontend/README.md` and `backend/README.md` (commands and structure)
- `DEPLOYMENT_GUIDE.md` (production setup and workflows)

If anything here is unclear or you need deeper conventions (tests, logging fields, error formats), ask and we'll refine this guide. Review and update this file quarterly to match repo evolution.

- `backend/src/index.ts` (server, middleware order, route wiring, Socket.IO, cron)
- `backend/src/config/index.ts` (origins, ports, env derivation)
- `backend/src/services/notificationService.ts` (push/email/socket pattern)
- `backend/src/utils/decimal.ts` (Decimal serialization helpers)
- `backend/prisma/schema.prisma` (entities & relations)
- `frontend/README.md` and `backend/README.md` (commands and structure)

If anything here is unclear or you need deeper conventions (tests, logging fields, error formats), ask and we'll refine this guide. Review and update this file quarterly to match repo evolution.

### Quick reference commands

```bash
# Fresh setup
npm run setup:quick                    # Install all deps + docs tooling
npm run dev                           # Start both frontend/backend
docker-compose up -d                  # Start Postgres + Redis

# Development
npm run prisma:generate               # Generate Prisma client
npx prisma studio                     # Database GUI (in backend/)
npm run check                        # Full validation (type + lint + test)
npm run fix                          # Auto-fix linting + formatting

# Deployment & CI
npm run build                        # Build all workspaces
npm run backup                       # Database backup script
npm run deploy                       # Deploy via bash script
```

### Common gotchas and debugging

- **Decimal serialization**: Always use `serializeDecimal*()` helpers - raw Prisma Decimal breaks JSON.stringify.
- **Auth middleware**: `authenticateTokenWithSession` is newer, `authenticateToken` is legacy. Both valid.
- **Route registration order**: Stripe webhook `/api/payments/webhook` must be registered before `express.json()`.
- **Socket.IO rooms**: Use `user-${userId}` pattern. Inject `io` via setter functions in services.
- **Prisma client**: Always import from `backend/src/prismaClient.ts` (singleton), never direct from `@prisma/client`.
- **Environment variables**: Backend loads from `.env` file, frontend from `process.env.NEXT_PUBLIC_*`.

### Files to examine for context

- `backend/src/index.ts` - Server setup, middleware order, route registration
- `backend/src/middleware/auth.ts` - Authentication patterns and security
- `backend/src/utils/decimal.ts` - Financial data serialization
- `backend/prisma/schema.prisma` - Complete data model
- `package.json` - Workspace structure and available scripts
- `.github/workflows/` - CI/CD automation patterns

---

*Updated: Nov 2025 - Reflects current architecture with enhanced auth, Prometheus monitoring, and npm workspace patterns*

---

## Security and Compliance Instructions for GitHub Copilot (Self‑Hosted Fintech)

Use these rules to guide code suggestions. Favor clarity, minimal dependencies, and auditability.

### Secure Coding Practices

- Validate and sanitize all inputs at boundaries (API, DB, external services).
- Never hardcode secrets; use env vars or secret stores. Do not print secrets in logs.
- Enforce authentication and authorization consistently via `authenticateToken` and `requireAdmin`.
- Prefer well‑maintained libraries; avoid deprecated/vulnerable packages.
- Handle errors centrally with `errorHandler`; return safe messages in production.

### Monetary and Data Handling

- Represent money with Prisma `Decimal`; serialize using `serializeDecimal*` helpers.
- Avoid floating‑point math for financial values.
- Log business‑relevant events, not PII/secrets; keep auditability in mind.
- Respect data retention and privacy (GDPR). Avoid storing unnecessary personal data.

### Vulnerability Prevention

- Guard against SQLi (Prisma ORM), XSS (sanitize outputs), and CSRF (enable when sessions/forms are used).
- Rate‑limit sensitive routes using `rateLimiter`.
- Use Helmet for security headers; keep CORS origins restricted via `config.allowedOrigins`.

### Payments and Webhooks

- Stripe: Keep raw body for `/api/payments/webhook`. Verify signatures with `STRIPE_WEBHOOK_SECRET`.
- Cryptomus: Validate payloads and verify expected fields before processing.
- On failures, prefer idempotent handling and clear error logging without leaking credentials.

### Observability and Testing

- Use Sentry for exceptions; avoid sensitive data in breadcrumbs.
- Add unit/integration tests for: auth, payments intents, transactions serialization.
- Prefer small, testable modules with explicit types and exhaustive error handling.

### Performance and Operations

- Reuse the singleton Prisma client. Avoid N+1 queries; use `select`/`include` deliberately.
- Emit Socket.IO events only after DB commits. Target `user-<id>` rooms for user‑scoped events.
- Background jobs should be idempotent and observable.

### Copilot Generation Guardrails

- Suggest tests alongside new endpoints or database mutations.
- Prefer minimal, readable code over cleverness. Explain security implications in comments where non‑obvious.
- Do not scaffold integrations to external financial services unless explicitly requested.
- Flag sections that require manual security review with a TODO comment.

### Compliance Notes

- Aim for PCI‑DSS friendly patterns: do not store raw card data; rely on Stripe tokens.
- Ensure audit logs exist for critical actions (auth changes, payment state changes, admin operations).
- Document assumptions and data flows that impact compliance in PR descriptions.

---

## Optional Automation: Keep Instructions Fresh

Consider a scheduled GitHub Action that regenerates/updates this file from a canonical template and opens a PR for review (security team approval recommended). Keep the instructions versioned and auditable.

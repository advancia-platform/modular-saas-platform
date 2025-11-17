## Advancia Pay Ledger — AI agent working guide

Purpose: give AI coding agents the minimum, specific context to be productive in this repo without guesswork.

### Architecture and boundaries

- Backend: Node.js + Express + TypeScript, Prisma ORM, Socket.IO. Entry: `backend/src/index.ts`.
- Frontend: Next.js 14 (App Router) in `frontend/` consuming `/api/**` from backend.
- Database: PostgreSQL via Prisma with many models (see `backend/prisma/schema.prisma`). Use `backend/src/prismaClient.ts` to import a singleton PrismaClient.
- Realtime: Socket.IO on the same HTTP server. Clients join per-user rooms: `join-room` → room `user-${userId}`. Server emits domain-specific events (transactions, notifications).
- Notifications: web push + email + socket broadcast in `backend/src/services/notificationService.ts`. Socket instance is injected via `setSocketIO(io)` from `index.ts`.
- Config/CORS: `backend/src/config/index.ts` computes `allowedOrigins` and other runtime config. CORS uses this list; add new origins there.

### Key runtime behaviors and cross-cutting concerns

- Rate limiting applies to all `/api/**` (see `rateLimit` middleware in `backend/src/index.ts`).
- Stripe webhook requires raw body on `/api/payments/webhook` before `express.json()`. Don't move middleware order.
- AuthN/AuthZ: JWT with `authenticateToken` and role gates via `allowRoles/requireAdmin` (see `backend/src/middleware/auth.ts` and usages in `backend/src/routes/users.ts`, `backend/src/routes/support.ts`). Some routes also check an `x-api-key` header in development-friendly way (see `routes/auth.ts`).
- Decimals: Prisma Decimal fields should be serialized as strings in JSON responses. Use `backend/src/utils/decimal.ts` helpers: `serializeDecimal()`, `serializeDecimalFields()`, `serializeDecimalArray()`.
- Background jobs: `node-cron` schedules notification fallback emails in `index.ts`.
- Crypto payments: Cryptomus integration for BTC/ETH/USDT payments (see `routes/cryptomus.ts`, `routes/cryptoEnhanced.ts`).
- Email systems: Multiple providers - Gmail SMTP for OTP, Resend for templates, SendGrid for bulk (see `routes/emails.ts`, `routes/email.ts`, `routes/send-email.ts`).
- Monitoring: Sentry for error tracking and performance monitoring (initialized in `backend/src/utils/sentry.ts`).

### Route conventions and wiring

- Routers live in `backend/src/routes/*.ts`. Each exports an Express router:
  - Example: `tokens.ts`, `rewards.ts`, `auth.ts`, `system.ts`, `users.ts`, `support.ts`, `cryptomus.ts`, `cryptoEnhanced.ts`.
- Register routers in `backend/src/index.ts` under `/api/<name>` in the "Registering routes" section. Keep the Stripe webhook raw-body line before `express.json()`.
- Input validation and security headers live in `backend/src/middleware/security.ts`; reuse `validateInput`, `securityHeaders` if adding endpoints.

### Data model hot spots (Prisma)

- Core models: `User`, `Transaction`, `TokenWallet`, `TokenTransaction`, `Reward`, `UserTier`, `AuditLog`, crypto orders/withdrawals, notifications, support, and Ethereum activity.
- Crypto models: `CryptoWallet`, `CryptoWithdrawal` for managing user crypto balances and transactions.
- When you add or change schema:
  - Update `backend/prisma/schema.prisma` → run `npx prisma migrate dev` in `backend`.
  - Regenerate client if needed: `npm run prisma:generate`.
  - Verify with `npx prisma studio`.

### Realtime and notifications

- To emit to a specific user: join room `user-${userId}` then `io.to(`user-${userId}`).emit('event', payload)`.
- Notification service sends socket, push (web-push), and email (nodemailer). Environment keys: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `EMAIL_USER`, `EMAIL_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`.
- Admin broadcasts: Emit to `admins` room for admin-only notifications.

### External integrations

- **Authentication (Email-Only OTP)**: Email OTP via Gmail SMTP (free) - see `routes/auth.ts`. Password login with bcrypt hashing. TOTP 2FA. Required env vars: `EMAIL_USER`, `EMAIL_PASSWORD`, `SMTP_HOST` (smtp.gmail.com), `SMTP_PORT` (587).
- **Crypto Payments**: Cryptomus API for crypto invoices/payments. Env vars: `CRYPTOMUS_API_KEY`, `CRYPTOMUS_MERCHANT_ID`.
- **Fiat Payments**: Stripe payments webhook in `routes/payments.ts`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- **Email Services**: 
  - Gmail SMTP for transactional emails (OTP, notifications)
  - Resend for HTML templates and marketing emails
  - SendGrid for bulk communications
- **Ethereum gateway**: ethers v5 on backend; ethers v6 on frontend.
- **Monitoring**: Sentry for error tracking (`SENTRY_DSN` env var).
- **Storage**: AWS S3 for backups and file uploads (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BACKUPS_BUCKET`).

### Local dev workflows (Linux/bash)

- Backend: `cd backend && npm install && npm run dev` (starts on port 4000).
- Frontend: `cd frontend && npm install && npm run dev` (starts on port 3000).
- Database: run Postgres locally or Docker; set `DATABASE_URL` in `backend/.env`. First time: `npx prisma migrate dev`.
- Full stack with Docker: `docker-compose up -d` (includes Postgres + Redis).
- Prisma Studio: `cd backend && npx prisma studio`.

### CI/CD and deployment workflows

- **GitHub Actions**: Multiple workflows in `.github/workflows/`:
  - `ci.yml`: Build/test on push/PR
  - `ci-pnpm.yml`: Type checking and linting with pnpm
  - `backup-and-migrate.yml`: Nightly DB backups to S3
  - `integration-tests.yml`: End-to-end testing
- **Deployment**: Digital Ocean (backend + DB) + Vercel (frontend) + Cloudflare (DNS/CDN).
- **Environment management**: Encrypted secrets with custom scripts (`scripts/secrets/encrypt-env.ts`).
- **Branch protection**: Automated via `apply-branch-protection.yml`.

### Debugging patterns

- Node inspector: `node --inspect=9229 -r ts-node/register backend/src/index.ts` or launch via VS Code.
- Next.js inspector: `node --inspect=9230 node_modules/next/dist/bin/next dev`.
- VS Code launch config: Attach to port 9229 for backend debugging.
- Use `debugger` in route handlers; set breakpoints in async functions.
- Winston logging: Use `backend/src/logger.ts` for structured logging (replaces console.log in production).

### Testing conventions

- Use Jest for unit/integration tests in `backend/` and `frontend/`.
- Backend tests: Run `npm test` in `backend/` (covers routes, services, utils). Place tests in `__tests__/` subdirs.
- Frontend tests: Run `npm test` in `frontend/` (covers components, API calls). Use React Testing Library.
- Mock Prisma with `@prisma/client` in-memory or test DB. Avoid real DB in unit tests.
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

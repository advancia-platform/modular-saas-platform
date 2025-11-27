# Backend Route Registration Guide

## Critical Middleware Order

The order of middleware registration is **crucial** for proper application functionality:

### 1. Stripe Webhook (RAW BODY) - MUST BE FIRST

```typescript
// CRITICAL: Stripe webhook needs raw body BEFORE express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);
```

### 2. JSON Parser and Common Middleware

```typescript
// JSON parser and common middlewares AFTER webhook
app.use(express.json());
app.use(helmetMiddleware());
app.use(sanitizeInput);
app.use(dataMasker.createResponseSanitizer());
app.use(validateInput);
app.use(activityLogger);
app.use("/api", rateLimit({ windowMs: 60_000, maxRequests: 300 }));
```

## Registered Routes (in order)

### Health & Monitoring

- `GET /` - Root health check
- `GET /health` - Detailed health check with metrics
- `GET /metrics` - Prometheus metrics endpoint
- `GET /api-docs` - Swagger API documentation
- `/api` - Health router

### Authentication Routes

- `/api/auth` - Token refresh (legacy)
- `/api/auth` - Main auth routes (login, register, etc.)
- `/api/auth/v2` - Modern JWT-based auth with RBAC
- `/api/auth/secure` - Secure auth with bcrypt and password reset
- `/api/auth/admin` - Admin authentication
- `/api/auth/2fa` - Two-factor authentication
- `/api/auth` - Email magic link signup

### Payment Routes

- `POST /api/payments/webhook` - Stripe webhook (raw body)
- `/api/payments` - Payment intents & methods (paymentsEnhancedRouter)
- `/api/nowpayments` - NOWPayments crypto integration

### User & Account Management

- `/api/support` - Customer support tickets
- `/api/subscriptions` - Subscription management
- `/api/sessions` - User session management
- `/api/email` - Email verification with Resend

### Transaction & Finance

- `/api/transactions` - Transaction history
- `/api/withdrawals` - Withdrawal requests
- `/api/tokens` - Token wallet operations
- `/api/prices` - Multi-provider price service

### Admin Routes (Protected with requireAdmin)

- `/api/admin` - Admin dashboard
- `/api/admin` - General admin operations
- `/api/admin/telegram` - Telegram bot management
- `/api/admin/wallets` - Admin wallet operations
- `/api/admin` - Notification logs
- `/api/compliance` - Compliance monitoring

### Project Management

- `/api/teams` - Team management
- `/api/projects` - Project management
- `/api/tasks` - Task tracking
- `/api/milestones` - Milestone tracking

### Notifications & Preferences

- `/api/notifications` - User notifications (authenticated)
- `/api/notification-preferences` - Notification settings (authenticated)
- `/api/resend` - Resend email service (authenticated)
- `/api/preferences` - User preferences (authenticated)

### Security & Trust

- `/api/trust` - Scam Adviser & trust verification
- `/api/security` - Breach monitoring & IP protection
- `/api/gitops` - GitOps integration

### Other Services

- `/api/system` - System operations
- `/api/subscribers` - Newsletter subscribers
- `/api/analytics` - Analytics dashboard
- `/api/storage` - Cloudflare R2 object storage
- `/api/test` - Demo routes for permission-based access

## Important Notes

### Missing Routes

The following routes are **NOT REGISTERED** (tests will fail):

- `/api/users` - No users router exists
- `/api/users/profile` - Profile endpoint not available

### Commented Out Routes

Many routes are currently disabled in index.ts:

- `/api/debit-cards` - Debit card management
- `/api/chat` - Chat functionality
- `/api/crypto` - Crypto charts & swap
- `/api/rewards` - Reward system
- `/api/invoices` - Invoice management
- `/api/ai-analytics` - AI-powered analytics

### Route Registration Order Best Practices

1. **Webhook routes with raw body FIRST** (before express.json())
2. **Public health checks** (/, /health, /metrics)
3. **Authentication routes** (public access)
4. **Protected user routes** (with authenticateToken)
5. **Admin routes** (with authenticateToken + requireAdmin)
6. **Socket.IO connection handler** (after all HTTP routes)

## Testing Implications

### Working Test Endpoints

✅ `/api/auth/login` - Login endpoint (with rate limiting)
✅ `/api/auth/register` - Registration endpoint
✅ `/api/payments/webhook` - Stripe webhook (raw body)
✅ `/api/payments` - Payment intents (paymentsEnhancedRouter)

### Failing Test Endpoints

❌ `/api/users/profile` - Route not registered (no users router)
❌ `/api/payments/create-intent` - May not exist in paymentsEnhancedRouter

### Rate Limiting Configuration

- Global: 300 requests per 60 seconds on `/api/*`
- Auth-specific: Defined in individual route files

## References

- Main server file: `backend/src/index.ts`
- Payment webhook: `backend/src/routes/paymentsWebhook.ts`
- Enhanced payments: `backend/src/routes/paymentsEnhanced.ts`
- Auth routes: `backend/src/routes/auth.ts`

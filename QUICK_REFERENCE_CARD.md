# 🚀 Advancia Quick Reference Card

## ⚡ Essential Commands

| Command            | Description                       | Windows Alternative                                                              |
| ------------------ | --------------------------------- | -------------------------------------------------------------------------------- |
| `make docker-test` | Run tests in Docker (recommended) | `docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit` |
| `make docker-up`   | Start services in background      | `docker-compose -f docker-compose.test.yml up -d`                                |
| `make docker-down` | Stop services                     | `docker-compose -f docker-compose.test.yml down`                                 |
| `make docker-logs` | View logs                         | `docker-compose -f docker-compose.test.yml logs -f`                              |
| `make status`      | Show service status               | `docker-compose -f docker-compose.test.yml ps`                                   |
| `make help`        | Show all commands                 | See Makefile directly                                                            |

**Note:** Makefile commands require Unix-like systems. Windows users use Docker Compose directly.

## 🔑 Test Credentials

| Role  | Email               | Password      |
| ----- | ------------------- | ------------- |
| Admin | admin@advancia.test | TestAdmin123! |
| User  | user@advancia.test  | TestUser123!  |
| Agent | agent@advancia.test | TestAgent123! |

## 📁 Key Files

- `DEVELOPER_ONBOARDING.md` - Complete setup guide
- `TEST_DATABASE_SETUP.md` - Database configuration
- `TEST_DATABASE_QUICK_REFERENCE.md` - Quick troubleshooting
- `CRYPTOMUS_WEBHOOK_SETUP.md` - Webhook configuration
- `CRYPTOMUS_WEBHOOK_TESTING.md` - Test payloads & scripts
- `UNIFIED_PAYMENT_INTEGRATION.md` - Payment system integration
- `backend/generateSignature.js` - Generate webhook signatures
- `backend/testCryptomusWebhook.js` - Test Cryptomus webhooks
- `backend/testStripeWebhook.js` - Test Stripe webhooks
- `backend/testUnifiedWebhook.js` - Test both providers
- `backend/src/services/transactionService.js` - Payment service layer
- `frontend/src/components/PaymentButton.tsx` - Unified payment component
- `frontend/src/components/PaymentExample.tsx` - Payment integration examples
- `FRONTEND_PAYMENT_INTEGRATION.md` - Frontend integration guide
- `docker-compose.test.yml` - Docker services
- `Makefile` - All available commands
- `backend/.env.test` - Test environment variables

## 🐳 Docker Services

| Service    | Port | Description         |
| ---------- | ---- | ------------------- |
| PostgreSQL | 5432 | Test database       |
| Redis      | 6379 | Cache/session store |
| Backend    | 4001 | API server          |
| Frontend   | 3001 | Web app             |
| Mailhog    | 8025 | Email testing UI    |

## 🔗 Webhook Testing

| Script                    | Purpose                      | Command                                      |
| ------------------------- | ---------------------------- | -------------------------------------------- |
| `generateSignature.js`    | Generate HMAC signatures     | `cd backend && node generateSignature.js`    |
| `testCryptomusWebhook.js` | Test Cryptomus webhooks      | `cd backend && node testCryptomusWebhook.js` |
| `testStripeWebhook.js`    | Test Stripe webhooks         | `cd backend && node testStripeWebhook.js`    |
| `testUnifiedWebhook.js`   | Test both providers together | `cd backend && node testUnifiedWebhook.js`   |

**Environment Variables:**

- `CRYPTOMUS_API_KEY` - Your Cryptomus API key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `WEBHOOK_URL` - Single webhook endpoint (default: localhost:4000)
- `CRYPTOMUS_WEBHOOK_URL` - Cryptomus-specific endpoint
- `STRIPE_WEBHOOK_URL` - Stripe-specific endpoint

## 🧪 Test Data (Auto-Seeded)

- 3 Users (admin, user, agent)
- 2 Token wallets (10k + 1k ADVP)
- 1 Crypto wallet (100 USDT)
- 2 Transactions (deposit/withdrawal)
- 2 Support tickets (open/resolved)
- 2 Notifications (read/unread)

## 🚨 Common Issues

| Problem           | Solution                                |
| ----------------- | --------------------------------------- |
| Port 5432 in use  | `sudo systemctl stop postgresql`        |
| Tests hanging     | `make docker-down && make docker-clean` |
| Permission denied | Check `.env.test` DATABASE_URL          |
| Cannot connect    | `make status` to check services         |

## 📊 CI/CD Status

- ✅ GitHub Actions workflow
- ✅ PostgreSQL + Redis containers
- ✅ Automatic migrations
- ✅ Test data seeding
- ✅ Coverage reporting
- ✅ Codecov integration

## 🎯 Quick Start (3 Steps)

```bash
git clone <repo-url>
cd -modular-saas-platform
make docker-test
```

**That's it!** 🎉

---

## 📚 Documentation

- [DEVELOPER_ONBOARDING.md](DEVELOPER_ONBOARDING.md) - Complete guide
- [TEST_DATABASE_SETUP.md](TEST_DATABASE_SETUP.md) - Database setup
- [TEST_DATABASE_QUICK_REFERENCE.md](TEST_DATABASE_QUICK_REFERENCE.md) - Quick help
- [CHEAT_SHEET.md](CHEAT_SHEET.md) - All commands
- [CHEAT_SHEET_POSTER.md](CHEAT_SHEET_POSTER.md) - Wall poster
- [SLACK_CHEAT_SHEET.md](SLACK_CHEAT_SHEET.md) - Slack-ready snippet
- [CRYPTOMUS_WEBHOOK_SETUP.md](CRYPTOMUS_WEBHOOK_SETUP.md) - Webhook configuration
- [CRYPTOMUS_WEBHOOK_TESTING.md](CRYPTOMUS_WEBHOOK_TESTING.md) - Test payloads & scripts
- [UNIFIED_PAYMENT_INTEGRATION.md](UNIFIED_PAYMENT_INTEGRATION.md) - Payment system integration
- [FRONTEND_PAYMENT_INTEGRATION.md](FRONTEND_PAYMENT_INTEGRATION.md) - Frontend integration guide
- [USER_TRANSACTIONS_DASHBOARD.md](USER_TRANSACTIONS_DASHBOARD.md) - User transaction history
- [ADMIN_DASHBOARD_ENHANCED.md](ADMIN_DASHBOARD_ENHANCED.md) - Admin wallet & transaction management
- [RBAC_SECURITY.md](RBAC_SECURITY.md) - Role-based access control for admin routes
- [ADMIN_USER_FILTERS.md](ADMIN_USER_FILTERS.md) - Quick role filter buttons for user management

---

**Last Updated:** 2025-11-15
**Version:** 1.0.3

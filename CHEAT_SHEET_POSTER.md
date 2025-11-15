# 🖼️ Advancia Wall-Poster Cheat Sheet

```
╔════════════════════════════════════════════════════════════╗
║                  ⚡ ADVANCIA COMMANDS ⚡                    ║
╠════════════════════════════════════════════════════════════╣
║ 📂 Repo Setup                                              ║
║   git clone https://github.com/muchaeljohn739337-cloud/   ║
║     -modular-saas-platform.git                            ║
║   cd -modular-saas-platform                                ║
║   cp backend/.env.test.example backend/.env.test           ║
╠════════════════════════════════════════════════════════════╣
║ 🧪 Testing (Docker + Make)                                 ║
║   make docker-test  → Run tests (Postgres + app)           ║
║   make test         → Run tests locally                    ║
║   make test-coverage → Run with coverage                   ║
║   make test-watch   → Run in watch mode                    ║
╠════════════════════════════════════════════════════════════╣
║ 💻 Local Development                                       ║
║   make docker-up    → Start services in background         ║
║   make docker-down  → Stop services                        ║
║   make docker-clean → Remove containers + volumes          ║
║   make docker-logs  → Tail logs                            ║
║   make status       → Show service status                  ║
║   make health       → Check health of services             ║
╠════════════════════════════════════════════════════════════╣
║ 🗄️ Database Management                                     ║
║   make db-setup     → Setup test database                  ║
║   make db-reset     → Reset test database                  ║
║   make db-seed      → Seed test data                        ║
║   make db-studio    → Open Prisma Studio                    ║
║   make db-migrate   → Run migrations                       ║
╠════════════════════════════════════════════════════════════╣
║ 🛠️ Development Tools                                       ║
║   make install      → Install dependencies                 ║
║   make dev-backend  → Start backend dev server             ║
║   make dev-frontend → Start frontend dev server            ║
║   make lint         → Lint code                             ║
║   make format       → Format code                           ║
╠════════════════════════════════════════════════════════════╣
║ 🔔 Alerts & Monitoring                                     ║
║   Slack + Email fire in test mode (check logs)             ║
║   make docker-logs-backend → View backend logs             ║
║   make docker-logs-postgres → View database logs           ║
╠════════════════════════════════════════════════════════════╣
║ 🆘 Help & Troubleshooting                                   ║
║   make help         → Show all commands with descriptions  ║
║   make docker-shell-backend → Open backend shell           ║
║   make docker-shell-postgres → Open database shell         ║
╠════════════════════════════════════════════════════════════╣
║ 🔑 Test Credentials                                         ║
║   Admin: admin@advancia.test / TestAdmin123!                ║
║   User:  user@advancia.test / TestUser123!                  ║
║   Agent: agent@advancia.test / TestAgent123!                ║
╚════════════════════════════════════════════════════════════╝
```

---

## Quick Start (3 Commands)

```bash
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
cd -modular-saas-platform
make docker-test
```

---

## Essential Files

- `DEVELOPER_ONBOARDING.md` - Complete guide
- `TEST_DATABASE_SETUP.md` - Database setup
- `TEST_DATABASE_QUICK_REFERENCE.md` - Quick help
- `docker-compose.test.yml` - Docker config
- `Makefile` - All commands
- `backend/.env.test` - Environment
- `backend/jest.config.js` - Test config

---

## Print This Poster

1. Copy the ASCII art above
2. Paste into a document
3. Print at 11x17 or larger
4. Hang in the office!

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0

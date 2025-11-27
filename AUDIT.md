# Audit Guide 🕵️‍♂️

This document provides auditors with a clear checklist to verify compliance and governance for the Advancia Pay Ledger project.

---

## 🔒 Security & Compliance

- **SECURITY.md** exists and defines vulnerability reporting process
- Secrets are managed via **GitHub Secrets**, not hardcoded
- RBAC enforcement tested:
  - Admin → full access to all resources
  - Auditor → read access with specific write permissions
  - Viewer → read-only access (403 on unauthorized operations)
- Audit logging enabled for all financial transactions and user actions
- PCI-DSS friendly patterns: no raw card data storage, Stripe tokens used

---

## 💰 Financial Security

- Monetary values use Prisma **Decimal** fields (no floating-point)
- Decimal serialization helpers used for JSON responses
- Stripe webhook signatures verified with `STRIPE_WEBHOOK_SECRET`
- Cryptomus payment validation implemented
- Rate limiting enforced on payment endpoints
- Background jobs are idempotent with proper error handling

---

## 🧪 Testing & Coverage

- CI/CD pipeline runs **pytest** with coverage enforcement
- Coverage threshold: **≥80%** (`--cov-fail-under=80`)
- Coverage reports uploaded to **Codecov**
- Badge in README shows current coverage %
- RBAC tests validate role restrictions
- Payment integration tests with proper mocking

---

## 🚀 CI/CD & Governance

- GitHub Actions workflows enforce:
  - ✅ Tests passing
  - ✅ Coverage ≥80%
  - ✅ Reviewer approval before merge
  - ✅ Security scanning (Bandit, Safety)
- Branch protection rules:
  - Require PR reviews (≥1 approval)
  - Require status checks to pass
  - Restrict direct pushes to `main`
- Release Drafter automates semantic versioning (`major`, `minor`, `patch`)
- CHANGELOG.md synced with GitHub Releases

---

## 📖 Documentation

- **CONTRIBUTING.md** → contributor setup, testing, and PR workflow
- **CODE_OF_CONDUCT.md** → community standards
- **SECURITY.md** → vulnerability reporting
- **CHANGELOG.md** → release history
- **GOVERNANCE.md** → project governance model
- **README.md** → badges for build, coverage, issues, PRs, license

---

## 🏗️ Architecture Compliance

- Singleton Prisma client usage (prevents connection leaks)
- Socket.IO events emitted only after DB commits
- Error handling with central error handler middleware
- Input validation and sanitization at API boundaries
- CORS origins restricted via `config.allowedOrigins`

---

## 📊 Audit Checklist

- [ ] Verify RBAC tests pass in CI/CD
- [ ] Confirm coverage ≥80% in Codecov dashboard
- [ ] Check CHANGELOG.md for latest release notes
- [ ] Ensure branch protection rules are active on `main`
- [ ] Review SECURITY.md for vulnerability reporting process
- [ ] Confirm audit logging is enabled in backend
- [ ] Validate monetary operations use Decimal fields
- [ ] Verify Stripe webhook signature validation
- [ ] Check rate limiting on payment endpoints
- [ ] Confirm secrets are not hardcoded
- [ ] Validate governance cycle (quarterly reviews)

---

## ✅ Audit Outcome

If all boxes are checked, the project is **compliant** with governance, security, and fintech standards.

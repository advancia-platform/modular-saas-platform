# 🚀 Advancia Pay Ledger - Modular SaaS Platform

[![Build Status](https://github.com/advancia-platform/modular-saas-platform/actions/workflows/api-tests-coverage.yml/badge.svg)](https://github.com/advancia-platform/modular-saas-platform/actions)
[![codecov](https://codecov.io/gh/advancia-platform/modular-saas-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/advancia-platform/modular-saas-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Node.js](https://img.shields.io/badge/node.js-18.x-green.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
[![GitHub issues](https://img.shields.io/github/issues/advancia-platform/modular-saas-platform.svg)](https://github.com/advancia-platform/modular-saas-platform/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/advancia-platform/modular-saas-platform.svg)](https://github.com/advancia-platform/modular-saas-platform/pulls)

---

## 📖 Overview

Advancia Pay Ledger is a **production-ready fintech platform** implementing comprehensive notification preferences management with granular categories across multiple integration services:

- **Resend** for transactional emails, alerts, and compliance reports
- **Cryptomus** for crypto payment notifications and transaction alerts
- **Telegram** for real-time critical notifications and admin alerts
- **NOWPayments** for advanced cryptocurrency payments (150+ currencies, instant settlements)

The backend features **enterprise-grade RBAC enforcement** with comprehensive audit logging. The platform provides seamless preference management across user roles with real-time Socket.IO updates.

---

## 🛠 Features

- ✅ **Granular notification categories** (transactions, security, compliance, marketing)
- ✅ **Multi-role access control** (Admin, Auditor, Viewer, User)
- ✅ **Real-time notifications** via Socket.IO with user-specific rooms
- ✅ **Comprehensive audit logging** for compliance and security
- ✅ **Multi-provider integrations** (Resend, Cryptomus, Telegram, NOWPayments 150+ crypto)
- ✅ **Advanced crypto payments** with NOWPayments (instant settlements, 0.5% fees)
- ✅ **Enterprise payment security** with webhook verification and audit trails
- ✅ **Automated API testing** with 80%+ coverage enforcement
- ✅ **CI/CD pipeline** with security scanning and quality gates
- ✅ **Production deployment** on Render (backend) and Vercel (frontend)

---

## 📊 Project Health

- **Build Status** → CI/CD pipeline runs on every push with comprehensive testing
- **Coverage** → minimum 80% enforced, tracked via Codecov with detailed reporting
- **Security** → Automated security scanning with Bandit and Safety
- **Issues & PRs** → Live activity indicators and automated quality checks
- **License & Runtime** → MIT licensed, Node.js 18.x and Python 3.11 supported

---

## 🎯 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL
- VS Code (recommended)

### 1. Open Workspace

```bash
cd modular-saas-platform
code modular-saas-platform.code-workspace
```

### 2. Local Development

```bash
# Start all services
docker-compose up -d

# Backend development
cd backend && npm install && npm run dev

# Frontend development
cd frontend && npm install && npm run dev
```

### 3. No-Config Debugging ⚡

**Just press F5!** Our smart debugger auto-detects what you want to debug:

```bash
# Auto-detect debugging (recommended)
npm run debug

# Or specific targets
npm run debug:backend    # Debug Express server
npm run debug:frontend   # Debug Next.js app
npm run debug:test       # Debug Jest tests
```

**VS Code Integration:**

- Press **F5** → Select "🚀 Smart Debug (Auto-Detect)"
- Automatically detects test files, frontend components, or backend services
- Zero configuration needed!

📖 [Complete Debugging Guide](./NO_CONFIG_DEBUGGING.md)

### 4. Access Applications

- 🌐 Frontend: <http://localhost:3000>
- 🔧 Backend API: <http://localhost:4000>
- 📊 Prisma Studio: <http://localhost:5555>

## 🚀 GitOps Deployment

### Development

```bash
cd infra/gitops/kustomize/overlays/development
kustomize build . | kubectl apply -f -
```

### Production

```bash
cd infra/gitops/kustomize/overlays/production
kustomize build . | kubectl apply -f -
```

## 🌟 NOWPayments Integration

Advancia Pay Ledger features a **production-ready NOWPayments integration** supporting 150+ cryptocurrencies with enterprise-grade security:

### 🚀 Key Features

- **150+ Cryptocurrencies** → Bitcoin, Ethereum, Tether, Binance Coin, Cardano, Polkadot, and more
- **Instant Settlements** → Real-time payment processing with automatic currency conversion
- **Low Fees** → Industry-leading rates starting from 0.5% with transparent pricing
- **Enterprise Security** → HMAC-SHA512 webhook verification, non-custodial architecture
- **Global Reach** → Worldwide cryptocurrency acceptance with regulatory compliance

### 💻 Components

- **Backend API**: `/api/nowpayments/*` - Complete payment processing API
- **React Widget**: `NOWPaymentsWidget.tsx` - Advanced payment interface
- **Payment Buttons**: Enhanced `PaymentButton.tsx` with NOWPayments support
- **Demo Page**: `PaymentDemo.tsx` - Interactive payment showcase

### 🔧 Environment Configuration

```bash
# NOWPayments API Configuration
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_webhook_secret

# Optional: Sandbox mode for testing
NODE_ENV=development  # Enables sandbox mode
```

### 📊 API Endpoints

```bash
# Get supported cryptocurrencies
GET /api/nowpayments/currencies

# Get minimum payment amount
GET /api/nowpayments/min-amount/:currency

# Get payment estimate
POST /api/nowpayments/estimate

# Create payment invoice
POST /api/nowpayments/create-invoice

# Payment status webhook
POST /api/nowpayments/webhook
```

### 📦 Usage Example

```tsx
import NOWPaymentsWidget from "@/components/NOWPaymentsWidget";

<NOWPaymentsWidget amount={100} currency="USD" orderId="order_123" onSuccess={(data) => console.log("Payment successful:", data)} onError={(error) => console.error("Payment failed:", error)} />;
```

---

- ✅ **Multi-tenant SaaS architecture**
- ✅ **GitOps deployment pipeline**
- ✅ **Performance optimized frontend**
- ✅ **Microservices backend**
- ✅ **Comprehensive monitoring**
- ✅ **Enterprise security**

---

## 🔗 Quick Links

- **Production Deploy**: `DEPLOY_CHECKLIST_PRODUCTION.md`
- **GitOps Setup**: `GITOPS_DEPLOYMENT_GUIDE.md`
- **Compliance Monitoring**: `COMPLIANCE_MONITORING_INTEGRATION.md`
- **AI Foundation**: `AI_AGENT_FOUNDATION.md`
- **Backup workflow**: `.github/workflows/BACKUP_WORKFLOW.md`
- **DNS cutover plan**: `CLOUDFLARE_DNS_PLAN.md`
- **Cloudflare DNS**: `cloudflare/DNS_RECORDS.template.yml`
- **Render blueprint**: `render.yaml`
- **Frontend config**: `frontend/next.config.mjs`

---

## 🚀 Deployment

**Production Stack:**

- **Backend**: Render (Web Service + PostgreSQL)
- **Frontend**: Vercel (Next.js)
- **Backups**: Cloudflare R2 (automated nightly via GitHub Actions)
- **CDN**: Cloudflare

**Quick Deploy:**

1. **Backend**: Push to `main` branch → Render auto-deploys
2. **Frontend**: Push to `main` branch → Vercel auto-deploys
3. **Environment Variables**: Configure in Render & Vercel dashboards

See detailed guide: `deploy-vercel.ps1` for frontend,
`scripts/trigger-render-deploy.sh` for backend

---

## ⚡ Quick Start (Local Dev)

````bashbash
# Backend (Terminal 1)
cd backend
npm install
npx prisma generate
npm run dev

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```bash

**Access:**

-   Frontend: <http://localhost:3000>
-   Backend API: <http://localhost:4000/api/health>
-   Prisma Studio: `cd backend && npx prisma studio`

Environment variables are stored in `.env` files for backend and frontend.
See `backend/.env.example` for required keys (JWT_SECRET, STRIPE keys, DATABASE_URL).

---

## 🚀 GitOps & Kubernetes Deployment

**Enterprise GitOps Pipeline:**

```bash
# Deploy to Kubernetes with ArgoCD
./scripts/deploy-enterprise-gitops.ps1

# Validate compliance monitoring
./scripts/validate-compliance-monitoring.ps1

# Check GitOps deployment status
./scripts/validate-gitops-deployment.ps1
```

**Components:**

-   🏗️ **Infrastructure**: Kubernetes manifests in `ai-agent-k8s/`
-   🤖 **AI DevOps Agent**: Automated deployment in `ai-agent/`
-   📊 **Compliance Dashboard**: Real-time monitoring at `/compliance`
-   🔄 **ArgoCD**: GitOps continuous deployment
-   📈 **Monitoring**: Prometheus, Grafana, ELK stack integration

See `GITOPS_DEPLOYMENT_GUIDE.md` for detailed setup instructions.

---

## 📊 Features

-   🔐 **Authentication** → Email OTP (Gmail SMTP), JWT, 2FA/TOTP, password recovery
-   💳 **Fiat Payments** → Stripe integration (cards, webhooks)
-   ₿ **Crypto Payments** → Cryptomus (BTC, ETH, USDT), custodial HD wallets
-   🌟 **NOWPayments** → 150+ cryptocurrencies, instant settlements, low fees
-   🔐 **Multi-Provider Security** → Webhook verification, signature validation, audit trails
-   💰 **Multi-Currency** → USD, BTC, ETH, USDT balances per user
-   🎁 **Rewards System** → Token distribution, user tiers
-   📈 **Dashboard** → Real-time charts, transaction history, analytics
-   🔔 **Notifications** → Web Push, Email, Socket.IO real-time updates
-   ⚙️ **Backend** → RESTful API, Prisma ORM, Socket.IO, rate limiting
-   🔒 **Security** → Cloudflare WAF, Sentry monitoring, audit logs
-   📦 **DevOps** → GitHub Actions CI/CD, automated DB backups
-   🤖 **GitOps** → ArgoCD enterprise deployment, Kubernetes manifests
-   📊 **Compliance** → Real-time monitoring, regulatory framework tracking
-   🛡️ **AI Security** → Automated threat detection, policy enforcement
-   📈 **Observability** → Prometheus metrics, ELK stack integration

---

## 🧩 CI/CD Pipeline

**Automated Workflows:**

-   **Tests**: Run on every PR (see `.github/workflows/ci.yml`)
-   **Backups**: Nightly database backups to Cloudflare R2
-   **Deployments**: Auto-deploy to Render (backend) and Vercel (frontend) on push to `main`

**Key Scripts:**

-   `deploy-vercel.ps1` - Deploy frontend to Vercel
-   `scripts/trigger-render-deploy.sh` - Trigger backend deploy on Render
-   `scripts/render-smoke.ps1` - Test deployed backend health

---

## 🤖 Copilot Chat Instructions

This repo includes `.github/copilot-instructions.md` with auto-apply front matter so Copilot Chat loads our repo guidance by default.

Enable in VS Code:

-   Open Settings and enable `GitHub Copilot Chat › Experimental: Prompt Files`.
-   In the Chat gear menu, ensure `Instructions` shows the file as active.

Optional debug:

-   Run `Developer: Set Log Level...` → Trace.
-   Run `Developer: Show Logs...` → Window, then confirm log lines mentioning `[InstructionsContextComputer]` show 1 Copilot instructions file added.

Note: Some organizations disable prompt files; if you do not see the setting, it may be restricted.

---

## 💰 Cost Breakdown (Production)

| Service             | Plan      | Monthly Cost  |
| ------------------- | --------- | ------------- |
| Render PostgreSQL   | Starter   | $7            |
| Render Web Service  | Starter   | $7            |
| Vercel              | Hobby     | $0            |
| Cloudflare          | Free      | $0            |
| Sentry              | Developer | $0            |
| DO Spaces (Backups) | Standard  | $5            |
| **Total**           |           | **$19/month** |

---

## 📜 License

MIT License — free to use and modify with attribution.
````

# System Architecture 🏗️

This document describes the architecture of the Advancia Pay Ledger, including backend services, integrations, RBAC enforcement, and CI/CD pipelines.

---

## 🖥️ Backend Overview

- **Framework**: Node.js + Express + TypeScript
- **ORM**: Prisma with PostgreSQL for structured data storage
- **Authentication**: JWT-based authentication with role-based access control (RBAC)
- **Real-time**: Socket.IO for live transaction updates and notifications
- **Audit Logging**: Every transaction and user action logged with timestamp, user, and action details

---

## 🗄️ Database Architecture

- **PostgreSQL**: Primary database for transactional data
- **Prisma ORM**: Type-safe database operations with migration management
- **Decimal Fields**: All monetary values use Prisma Decimal to avoid floating-point errors
- **Indexes**: Optimized indexes for user queries, transaction lookups, and audit trails
- **Backup Strategy**: Automated nightly backups to Digital Ocean Spaces

---

## 🔐 Authentication & Authorization

- **JWT Tokens**: Stateless authentication with configurable expiration
- **RBAC System**:
  - **Admin**: Full system access, user management, financial operations
  - **Auditor**: Read access with specific audit permissions
  - **Viewer**: Read-only access to own data and public information
- **Middleware**: `authenticateToken` and role-based guards (`requireAdmin`, `allowRoles`)
- **Security**: Rate limiting, input validation, CORS protection

---

## 💰 Payment Processing

### Fiat Payments (Stripe)

- Webhook signature verification with `STRIPE_WEBHOOK_SECRET`
- Raw body handling for webhook payload validation
- Idempotent payment processing with status tracking
- Automatic retry logic for failed payments

### Cryptocurrency (Cryptomus)

- BTC, ETH, USDT payment support
- Secure API integration with payload validation
- Real-time payment status updates
- Automated wallet balance synchronization

---

## 🔗 External Integrations

### Email Services

- **Gmail SMTP**: Transactional emails and OTP delivery
- **Resend**: HTML email templates and marketing communications
- **SendGrid**: Bulk email campaigns and notifications

### Blockchain Integration

- **Ethers.js v5**: Backend blockchain operations
- **Ethers.js v6**: Frontend wallet connections
- **Token Operations**: ERC-20 token transfers and balance queries
- **Wallet Management**: Secure private key handling and transaction signing

### Monitoring & Observability

- **Sentry**: Error tracking and performance monitoring
- **Winston**: Structured logging with multiple transports
- **Socket.IO**: Real-time event tracking and user activity monitoring

---

## 🌐 Frontend Architecture

- **Framework**: Next.js 14 with App Router
- **State Management**: React hooks and context for global state
- **UI Components**: Custom component library with consistent styling
- **Real-time**: Socket.IO client for live updates
- **Authentication**: JWT token management with automatic refresh

---

## 🔄 Real-time Communications

- **Socket.IO Server**: Attached to Express HTTP server
- **Room Management**: Users join `user-${userId}` rooms for targeted messaging
- **Event Types**: Transaction updates, notifications, system alerts
- **Scaling**: Redis adapter for multi-instance Socket.IO clustering

---

## 🧪 Testing Architecture

- **Backend Testing**: Jest with Supertest for API integration tests
- **Frontend Testing**: React Testing Library with Jest
- **Coverage**: 80%+ enforcement with HTML/XML reporting
- **RBAC Testing**: Dedicated test suites for role-based access validation
- **Payment Testing**: Mock integrations for Stripe and Cryptomus

---

## 🚀 Deployment Architecture

### Production Environment

- **Backend**: Render (Node.js Web Service)
- **Frontend**: Vercel (Next.js deployment)
- **Database**: Render PostgreSQL (production tier)
- **CDN**: Cloudflare for global content delivery
- **Monitoring**: Sentry for error tracking and performance

### CI/CD Pipeline

- **GitHub Actions**: Automated testing, building, and deployment
- **Quality Gates**: Test coverage, linting, security scanning
- **Deployment**: Automatic deployment on `main` branch push
- **Rollback**: Git-based rollback with database migration handling

---

## 🔒 Security Architecture

- **Input Validation**: Joi/Zod schemas for request validation
- **Rate Limiting**: Express rate limiter on API endpoints
- **CORS**: Restricted origins configuration
- **Secrets Management**: Environment variables with GitHub Secrets
- **Audit Trails**: Comprehensive logging for compliance
- **Security Headers**: Helmet middleware for HTTP security

---

## 📊 Data Flow Diagrams

### Payment Processing Flow

```
User Request → Authentication → Validation → Payment Provider → Database → Audit Log → Real-time Update
```

### Notification Flow

```
Trigger Event → Notification Service → Email/Push/Socket → Delivery Confirmation → Audit Log
```

### RBAC Flow

```
API Request → JWT Validation → Role Extraction → Permission Check → Resource Access/Denial
```

---

## 🔧 Configuration Management

- **Environment Variables**: Centralized configuration via `.env` files
- **Runtime Config**: `backend/src/config/index.ts` for computed values
- **CORS Origins**: Dynamic origin configuration for development/production
- **Database URLs**: Separate configurations for development/testing/production

---

## 📈 Performance Considerations

- **Database**: Connection pooling with Prisma
- **Caching**: Redis for session storage and frequent queries
- **API**: Response compression and pagination
- **Frontend**: Next.js optimization with static generation where possible
- **Real-time**: Efficient Socket.IO room management

---

## 🔮 Future Architecture Plans

- **Microservices**: Service decomposition for better scalability
- **Event Sourcing**: Event-driven architecture for audit trails
- **CQRS**: Command Query Responsibility Segregation for read/write optimization
- **Kubernetes**: Container orchestration for cloud-native deployment
- **API Gateway**: Centralized API management and routing

---

_This architecture documentation is maintained alongside code changes and reviewed quarterly._

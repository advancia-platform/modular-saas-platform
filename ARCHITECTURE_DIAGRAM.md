# 🏗️ Advancia Pay Ledger - Architecture Diagram

Visual representation of the complete system architecture with security layers and data flow.

---

## 📊 System Architecture Flow

```
┌─────────────────────────────────────────────┐
│          🌐 User Browser                    │
│     (https://advanciapayledger.com)         │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTPS Request
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              🔰 Cloudflare Edge Network                      │
│               (Global CDN + Security)                        │
├─────────────────────────────────────────────────────────────┤
│  • DNS Resolution                                            │
│  • SSL Termination (Full Strict Mode)                       │
│  • WAF (SQLi/XSS protection)                                │
│  • Rate Limiting:                                            │
│    - /api/login: 10 req/min                                 │
│    - /api/register: 5 req/hour                              │
│    - /api/transactions: 100 req/min                         │
│  • Bot Protection (Challenge suspicious traffic)            │
│  • CDN Caching (Static assets, 200+ edge locations)        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Clean Traffic Only
                   ▼
┌─────────────────────────────────────────────────────────────┐
│        🖥️  DigitalOcean Droplet (Ubuntu 22.04/24.04)       │
│              IP: 157.245.8.131 (example)                    │
├─────────────────────────────────────────────────────────────┤
│  🔥 UFW Firewall                                            │
│  ├─ Allow: SSH (22), HTTP (80), HTTPS (443)                │
│  └─ Deny: Direct access to ports 3000, 4000                │
│                                                              │
│  🌐 Nginx Reverse Proxy (Port 80/443)                      │
│  ├─ SSL Certificates: Let's Encrypt (Auto-renewal)         │
│  ├─ HTTP → HTTPS redirect (301)                            │
│  ├─ Security Headers (HSTS, X-Frame-Options, etc.)         │
│  └─ Request Routing:                                        │
│      ├── /api/* → Backend (localhost:4000)                 │
│      ├── /socket.io/* → Backend WebSocket (localhost:4000) │
│      └── /* → Frontend (localhost:3000)                    │
│                                                              │
│  ⚙️  Backend API (Node.js/Express, Port 4000)              │
│  ├─ PM2 Process Manager (Cluster mode: 2 instances)        │
│  ├─ JWT Authentication                                      │
│  ├─ Stripe Payment Integration                             │
│  ├─ Cryptomus Crypto Payments                              │
│  ├─ Socket.IO Real-time Updates                            │
│  └─ Connected to:                                           │
│      ├── PostgreSQL 15 (localhost:5432)                    │
│      └── Redis 7 (localhost:6379)                          │
│                                                              │
│  🎨 Frontend UI (Next.js 14, Port 3000)                    │
│  ├─ PM2 Process Manager (1 instance)                       │
│  ├─ Server-Side Rendering (SSR)                            │
│  ├─ React 18 + Tailwind CSS                                │
│  ├─ Framer Motion Animations                               │
│  └─ Socket.IO Client (Real-time updates)                   │
│                                                              │
│  🗄️  PostgreSQL 15 Database                                │
│  ├─ Database: advancia_payledger                           │
│  ├─ Models: User, Transaction, TokenWallet, Reward,        │
│  │           AuditLog, CryptoWallet                         │
│  ├─ Daily Automated Backups (7-day retention)              │
│  └─ Encrypted Connections                                   │
│                                                              │
│  📦 Redis 7 Cache                                           │
│  ├─ Session Storage                                         │
│  ├─ Rate Limiting Counters                                 │
│  ├─ Caching Layer                                           │
│  └─ Password Protected (localhost only)                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ External API Calls
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              🌍 External Services                            │
├─────────────────────────────────────────────────────────────┤
│  💳 Stripe - Payment processing, webhooks                   │
│  🪙 Cryptomus - Crypto payments (BTC, ETH, USDT)           │
│  📧 Gmail/SendGrid - Transactional emails, OTP             │
│  📱 Twilio - SMS OTP, notifications                         │
│  🔔 Web Push - Browser notifications (VAPID)                │
│  🐛 Sentry - Error tracking & monitoring                    │
│  📊 Mixpanel - User analytics & events                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              📊 Monitoring & Logging                         │
├─────────────────────────────────────────────────────────────┤
│  📈 Cloudflare Analytics                                    │
│     ├─ Traffic patterns & threats blocked                   │
│     ├─ WAF events & bot detection                          │
│     └─ Cache hit ratio & response times                    │
│                                                              │
│  🖥️  DigitalOcean Monitoring                               │
│     ├─ CPU usage (alert if >80%)                           │
│     ├─ Memory usage (alert if >85%)                        │
│     ├─ Disk usage (alert if >90%)                          │
│     └─ Network bandwidth                                    │
│                                                              │
│  🐛 Sentry/Datadog                                          │
│     ├─ Application errors & exceptions                      │
│     ├─ Performance metrics & APM                            │
│     ├─ User session tracking                                │
│     └─ Release health monitoring                            │
│                                                              │
│  🔄 PM2 Monitoring                                          │
│     ├─ Process uptime & restarts                           │
│     ├─ Memory consumption per process                       │
│     ├─ CPU usage per process                               │
│     └─ Log aggregation & rotation                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Layers

### Layer 1: Cloudflare WAF (Edge)

- Blocks SQLi, XSS, path traversal attacks
- OWASP Core Ruleset + Custom rules
- Rate limiting (10 req/min on login)
- Bot protection & CAPTCHA challenges

### Layer 2: UFW Firewall (Network)

- Port-level access control
- SSH key-based authentication only
- Blocks direct access to app ports (3000, 4000)

### Layer 3: Nginx (Gateway)

- SSL/TLS encryption (Let's Encrypt)
- Security headers injection
- Request validation & routing
- HTTP → HTTPS enforcement

### Layer 4: PM2 Process Manager

- Auto-restart on crashes
- Memory limit enforcement (500MB)
- Cluster mode for load distribution
- Health monitoring

---

## ✅ Benefits

### 🚀 Scalable

- Vertical: Resize droplet (2GB → 4GB → 8GB RAM)
- Horizontal: Add droplets behind load balancer
- CDN: Static assets cached globally
- Database: Migrate to managed PostgreSQL when needed

### 🔒 Secure

- Multi-layered security (5 layers)
- PCI DSS & SOC2 compliance-ready
- Audit logging for all transactions
- Zero Trust access for admin routes

### ✅ Compliant

- GDPR: Data encryption, user consent
- PCI DSS: Secure payment processing
- SOC2: Audit logs, access controls
- HIPAA-ready: Encrypted data storage

### ⚡ Performant

- CDN: <50ms response for static assets
- HTTP/2: Multiplexed connections
- PM2 Clustering: Multi-core CPU usage
- Database Indexing: <10ms queries

---

## 💰 Monthly Cost Estimate

| Component                  | Cost              |
| -------------------------- | ----------------- |
| DigitalOcean Droplet (2GB) | $12-18            |
| Cloudflare Pro Plan        | $20               |
| Backups (20% of droplet)   | $2-4              |
| Domain (.com)              | $1/month          |
| **Total Base Cost**        | **~$35-43/month** |

**Optional Add-ons:**

- Sentry Team: +$26/month
- Mixpanel: $0-25/month
- SendGrid: $0-20/month
- Twilio SMS: ~$10/month

**Full Stack Total**: $70-125/month

---

## 📐 Deployment Time

- **Initial Setup**: 1-2 hours (manual)
- **Automated Setup**: 30 minutes (using scripts)
- **CI/CD Deployment**: 3-5 minutes (zero downtime)

---

## 🔗 Related Documentation

- [Complete Architecture Guide](./ARCHITECTURE.md) - Detailed technical specs
- [DigitalOcean Deployment](./DIGITALOCEAN_DROPLET_DEPLOYMENT.md) - Step-by-step setup
- [Cloudflare Security](./CLOUDFLARE_SECURITY_GUIDE.md) - WAF & rate limiting
- [Nginx Configuration](./NGINX_CONFIG_REFERENCE.md) - Reverse proxy setup
- [Environment Variables](./ENV_SETUP_GUIDE.md) - Configuration guide

---

**Your fintech platform is built as a layered fortress!** 🏰

Cloudflare protects at the edge → Nginx guards the gateway → Apps run securely inside the droplet.

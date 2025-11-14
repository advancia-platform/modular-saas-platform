# 🏗️ Advancia Pay Ledger - System Architecture

Complete architecture overview of the production fintech SaaS platform with DigitalOcean, Cloudflare, and enterprise security.

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          👤 USER BROWSER                                 │
│                    (advanciapayledger.com)                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ HTTPS Request
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ☁️  CLOUDFLARE EDGE NETWORK                          │
│                         (Global CDN + Security)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  🔒 Security Layer 1:                                                    │
│  ├─ DNS Resolution (A records → Droplet IP)                            │
│  ├─ SSL/TLS Termination (Full Strict Mode)                             │
│  ├─ DDoS Protection (Automatic mitigation)                              │
│  ├─ WAF Managed Rules:                                                  │
│  │   ├─ OWASP Core Ruleset (SQLi, XSS, Path Traversal)                │
│  │   ├─ Cloudflare Managed Ruleset (CVE protection)                    │
│  │   └─ Custom Rules (Login/Admin protection)                          │
│  ├─ Rate Limiting:                                                      │
│  │   ├─ /api/auth/login: 10 req/min → Block 15 min                    │
│  │   ├─ /api/register: 5 req/hour → Block 1 hour                      │
│  │   ├─ /api/transactions: 100 req/min → Challenge                     │
│  │   └─ Global API: 1000 req/hour → JS Challenge                      │
│  ├─ Bot Protection:                                                     │
│  │   ├─ Bot Fight Mode (blocks known bad bots)                         │
│  │   ├─ Challenge suspicious traffic (CAPTCHA)                         │
│  │   └─ Allow verified bots (Google, Bing)                            │
│  ├─ Zero Trust Access:                                                  │
│  │   ├─ /admin/* → SSO + MFA required                                 │
│  │   └─ /api/admin/* → IP whitelist + authentication                  │
│  └─ Analytics & Logging (30-day retention)                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Clean Traffic Only
                                 │ (SSL/TLS encrypted)
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│             🖥️  DIGITALOCEAN DROPLET (Ubuntu 22.04/24.04)              │
│                    IP: 157.245.8.131 (example)                          │
│                    Tier: $12-20/month (2GB RAM)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  🔒 Security Layer 2: UFW Firewall                                      │
│  ├─ Port 22 (SSH) - Key-based auth only, root login disabled           │
│  ├─ Port 80 (HTTP) - Redirect to HTTPS                                 │
│  ├─ Port 443 (HTTPS) - SSL/TLS enabled                                 │
│  └─ Ports 3000, 4000 - Blocked from external access                    │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │           🌐 NGINX REVERSE PROXY (Port 80/443)                │    │
│  │              SSL: Let's Encrypt (Auto-renewal)                 │    │
│  ├───────────────────────────────────────────────────────────────┤    │
│  │  🔒 Security Layer 3:                                          │    │
│  │  ├─ HTTP → HTTPS redirect (301)                               │    │
│  │  ├─ TLS 1.2/1.3 only (Strong ciphers)                        │    │
│  │  ├─ Security Headers:                                          │    │
│  │  │   ├─ X-Frame-Options: SAMEORIGIN                          │    │
│  │  │   ├─ X-XSS-Protection: 1; mode=block                      │    │
│  │  │   ├─ X-Content-Type-Options: nosniff                       │    │
│  │  │   ├─ Strict-Transport-Security (HSTS)                      │    │
│  │  │   └─ Referrer-Policy                                       │    │
│  │  └─ Request routing:                                          │    │
│  │      ├─ /api/* → http://localhost:4000                        │    │
│  │      ├─ /socket.io/* → http://localhost:4000 (WebSocket)     │    │
│  │      └─ /* → http://localhost:3000                            │    │
│  └───────────────────┬──────────────────┬─────────────────────────┘    │
│                      │                  │                               │
│      ┌───────────────▼────────┐    ┌──▼──────────────────────┐        │
│      │   🎨 FRONTEND          │    │   ⚙️  BACKEND API       │        │
│      │   (Port 3000)          │    │   (Port 4000)           │        │
│      ├────────────────────────┤    ├─────────────────────────┤        │
│      │ Next.js 14 (App Router)│    │ Node.js 22 + Express    │        │
│      │ React 18               │    │ TypeScript              │        │
│      │ Tailwind CSS           │    │ Prisma ORM              │        │
│      │ Socket.IO Client       │    │ Socket.IO Server        │        │
│      │ Framer Motion          │    │ JWT Authentication      │        │
│      │                        │    │ Stripe Integration      │        │
│      │ Managed by PM2:        │    │ Cryptomus API           │        │
│      │ - Cluster mode (1)     │    │ Twilio SMS              │        │
│      │ - Auto-restart         │    │ Nodemailer (Email)      │        │
│      │ - Log rotation         │    │                         │        │
│      └────────────────────────┘    │ Managed by PM2:         │        │
│                                    │ - Cluster mode (2)      │        │
│                                    │ - Auto-restart          │        │
│                                    │ - Health checks         │        │
│                                    └───────┬─────────────────┘        │
│                                            │                           │
│      ┌─────────────────────────────────────▼─────────────┐           │
│      │         🗄️  POSTGRESQL 15 (Port 5432)             │           │
│      ├────────────────────────────────────────────────────┤           │
│      │ Database: advancia_payledger                       │           │
│      │ Models: User, Transaction, TokenWallet,            │           │
│      │         Reward, AuditLog, CryptoWallet             │           │
│      │                                                     │           │
│      │ 🔒 Security:                                       │           │
│      │ - Encrypted connections                            │           │
│      │ - User-specific access (not postgres superuser)   │           │
│      │ - Daily automated backups                          │           │
│      │ - 7-day retention policy                           │           │
│      └─────────────────────────────────────────────────────┘           │
│                                                                         │
│      ┌─────────────────────────────────────────────────────┐           │
│      │         📦 REDIS 7 (Port 6379)                      │           │
│      ├─────────────────────────────────────────────────────┤           │
│      │ Purpose: Session storage, caching, rate limiting    │           │
│      │                                                      │           │
│      │ 🔒 Security:                                        │           │
│      │ - Password protected                                │           │
│      │ - Localhost binding only                            │           │
│      │ - No external access                                │           │
│      └─────────────────────────────────────────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ External API Calls
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    🌍 EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  💳 Stripe                  - Payment processing, webhooks              │
│  🪙 Cryptomus              - Crypto payments (BTC, ETH, USDT)          │
│  📧 Gmail SMTP / SendGrid  - Transactional emails, OTP                 │
│  📱 Twilio                 - SMS OTP, notifications                     │
│  🔔 Web Push               - Browser notifications (VAPID)              │
│  🐛 Sentry                 - Error tracking & monitoring                │
│  📊 Mixpanel               - User analytics & events                    │
│  ☁️  AWS S3                - File storage & backups                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

### Scenario 1: User Login

```
1. User enters credentials at https://advanciapayledger.com/auth/login
   │
2. Request hits Cloudflare Edge
   ├─ DNS resolves to Droplet IP
   ├─ SSL/TLS handshake (Full Strict)
   ├─ WAF checks for SQLi/XSS patterns → ✅ Clean
   ├─ Rate Limit check (/api/auth/login) → ✅ Under limit (10/min)
   └─ Bot Protection → ✅ Human traffic
   │
3. Request forwarded to Droplet (encrypted)
   │
4. UFW Firewall → ✅ Port 443 allowed
   │
5. Nginx receives request
   ├─ Applies security headers
   ├─ Routes /api/auth/login → localhost:4000
   └─ Proxies request to Backend
   │
6. Backend (Node.js) processes login
   ├─ Validates credentials against PostgreSQL
   ├─ Checks password hash (bcrypt)
   ├─ Generates JWT token
   ├─ Stores session in Redis
   └─ Logs audit event
   │
7. Response flows back through Nginx → Cloudflare → User
   ├─ Sets secure cookies (httpOnly, SameSite=Strict)
   ├─ Returns JWT token
   └─ User redirected to dashboard
```

### Scenario 2: API Transaction Request

```
1. Authenticated user makes transaction at /api/transactions
   │
2. Cloudflare Edge
   ├─ JWT validation (passed in Authorization header)
   ├─ Rate Limit: 100 requests/min → ✅ Allowed
   ├─ WAF: No malicious payload detected → ✅ Pass
   │
3. Nginx → Backend (port 4000)
   │
4. Backend
   ├─ Verifies JWT signature
   ├─ Checks user permissions
   ├─ Validates transaction amount
   ├─ Creates Transaction record in PostgreSQL
   ├─ Updates user balance
   ├─ Emits Socket.IO event → Real-time update to frontend
   ├─ Logs to AuditLog table
   │
5. Response: Transaction confirmed
   │
6. Frontend receives Socket.IO event → Dashboard updates instantly
```

### Scenario 3: Admin Access (Zero Trust)

```
1. Admin navigates to https://advanciapayledger.com/admin
   │
2. Cloudflare Edge
   ├─ Zero Trust Access policy triggered
   ├─ Redirects to Cloudflare Access login
   │
3. Admin authenticates
   ├─ SSO via Google Workspace
   ├─ MFA via authenticator app
   ├─ Device posture check (corporate device)
   │
4. Cloudflare generates short-lived access token
   │
5. Request forwarded to Droplet with CF-Access-JWT-Assertion header
   │
6. Backend validates Cloudflare JWT
   ├─ Verifies signature
   ├─ Checks user email against admin list
   └─ Grants access
   │
7. Admin dashboard loads with elevated permissions
```

---

## 🛡️ Security Layers Breakdown

### Layer 1: Cloudflare Edge (Global)

**Position**: Before traffic reaches your infrastructure  
**Functions**:

- ✅ DDoS mitigation (automatic, unlimited)
- ✅ WAF rules (OWASP + Custom)
- ✅ Rate limiting (endpoint-specific)
- ✅ Bot detection & challenge
- ✅ SSL/TLS termination
- ✅ CDN caching (static assets)
- ✅ Zero Trust Access (admin routes)

**Blocks**: 99% of attacks before they reach your server

### Layer 2: DigitalOcean Droplet Firewall (UFW)

**Position**: Server network layer  
**Functions**:

- ✅ Port-level filtering
- ✅ IP-based rules
- ✅ SSH brute force protection
- ✅ Only allows necessary ports (22, 80, 443)

**Blocks**: Unauthorized port access, network scans

### Layer 3: Nginx Reverse Proxy

**Position**: Application gateway  
**Functions**:

- ✅ SSL certificate management (Let's Encrypt)
- ✅ HTTP → HTTPS redirect
- ✅ Security headers injection
- ✅ Request routing & load balancing
- ✅ Static asset caching
- ✅ WebSocket upgrade handling

**Blocks**: Unencrypted traffic, improperly routed requests

### Layer 4: Application Logic (Node.js)

**Position**: Backend business logic  
**Functions**:

- ✅ JWT authentication & validation
- ✅ Role-based access control (RBAC)
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ CSRF token validation
- ✅ Audit logging

**Blocks**: Unauthorized API access, malformed requests

### Layer 5: Database Security (PostgreSQL)

**Position**: Data persistence layer  
**Functions**:

- ✅ User-specific database accounts
- ✅ Encrypted connections (SSL)
- ✅ Prepared statements (SQL injection prevention)
- ✅ Row-level security policies
- ✅ Automated backups

**Blocks**: Direct database access, data breaches

---

## 📊 Performance Optimization

### Cloudflare CDN

- **Static Assets**: Cached at 200+ edge locations globally
- **Cache Hit Ratio**: Target >80%
- **Argo Smart Routing**: Faster origin connections (optional, paid)

### Nginx Caching

```nginx
/_next/static → 365 days cache (immutable)
/_next/image  → 7 days cache
/public       → 7 days cache
```

### PM2 Cluster Mode

- **Backend**: 2 instances (round-robin load balancing)
- **Frontend**: 1 instance (Next.js handles concurrency)
- **Auto-restart**: On crash or memory limit (500MB)

### Database Optimization

- **Connection Pooling**: Prisma manages connections
- **Indexes**: On frequently queried columns (userId, createdAt)
- **Query Optimization**: Prisma generates efficient SQL

---

## 📈 Monitoring & Observability

### DigitalOcean Monitoring

**Metrics:**

- CPU usage (alert if >80% for 5 min)
- Memory usage (alert if >85%)
- Disk usage (alert if >90%)
- Network bandwidth

### Cloudflare Analytics

**Metrics:**

- Total requests
- Bandwidth usage
- Threats blocked (WAF, rate limit, bots)
- Cache hit ratio
- Response time (origin vs edge)

### Sentry (Application Monitoring)

**Tracks:**

- JavaScript errors (frontend)
- Node.js exceptions (backend)
- Performance metrics
- User sessions
- Release tracking

### PM2 Monitoring

**Tracks:**

- Process uptime
- Memory consumption
- CPU usage per process
- Restart count
- Log aggregation

### Custom Health Checks

```bash
# Every 5 minutes via cron
curl https://advanciapayledger.com/api/health
# If non-200 → Restart PM2 + Send alert
```

---

## 🔄 Deployment Pipeline (CI/CD)

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ git push origin main
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions CI/CD Pipeline                   │
├─────────────────────────────────────────────────────────────┤
│  1. Trigger on push to main branch                          │
│  2. Run tests (backend + frontend)                          │
│  3. Build applications                                       │
│  4. SSH into DigitalOcean Droplet                           │
│  5. Pull latest code                                         │
│  6. Install dependencies                                     │
│  7. Run Prisma migrations                                    │
│  8. Build production bundles                                 │
│  9. Restart PM2 processes (zero-downtime)                   │
│  10. Run health checks                                       │
│  11. Notify team (Slack/Email)                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Deployment complete
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         Production Environment (DigitalOcean)                │
│         ✅ Backend + Frontend running                        │
│         ✅ Database migrated                                 │
│         ✅ Zero downtime achieved                            │
└─────────────────────────────────────────────────────────────┘
```

**Deployment Time**: ~3-5 minutes  
**Downtime**: 0 seconds (PM2 cluster reload)

---

## 💰 Cost Breakdown (Monthly)

| Service                  | Tier              | Cost     | Purpose                        |
| ------------------------ | ----------------- | -------- | ------------------------------ |
| **DigitalOcean Droplet** | 2GB RAM / 1 CPU   | $12-18   | Host backend, frontend, DB     |
| **Cloudflare**           | Pro Plan          | $20      | WAF, bot protection, analytics |
| **DigitalOcean Backups** | 20% of droplet    | $2-4     | Automated snapshots            |
| **Domain Name**          | .com              | $12/year | advanciapayledger.com          |
| **Sentry**               | Team Plan         | $26      | Error tracking (optional)      |
| **Mixpanel**             | Free / Growth     | $0-25    | Analytics (optional)           |
| **SendGrid**             | Free / Essentials | $0-20    | Email delivery                 |
| **Twilio**               | Pay-as-you-go     | ~$10     | SMS OTP                        |
| **Stripe**               | 2.9% + $0.30      | Variable | Payment processing             |
| **SSL Certificates**     | Let's Encrypt     | $0       | HTTPS encryption               |

**Total Base Cost**: ~$54-77/month  
**With Optional Services**: ~$100-150/month

**Compare to Vercel + Render:**

- Vercel Pro: $20/month
- Render Standard: $25/month
- Managed PostgreSQL: $50/month
- **Total**: $95/month (less control, vendor lock-in)

**DigitalOcean Advantage**: Full control, no vendor lock-in, predictable pricing

---

## 🚀 Scaling Strategy

### Vertical Scaling (Resize Droplet)

**When**: CPU consistently >70% or Memory >80%  
**Action**:

1. Create droplet snapshot (backup)
2. Power off droplet
3. Resize to 4GB RAM / 2 CPU ($24/month)
4. Power on and test
5. Update PM2 ecosystem.config.js (increase instances)

### Horizontal Scaling (Multiple Droplets)

**When**: Single droplet can't handle traffic (>10,000 req/min)  
**Action**:

1. Create 2-3 identical droplets
2. Set up DigitalOcean Load Balancer ($12/month)
3. Move PostgreSQL to managed database ($50/month)
4. Move Redis to managed cluster ($15/month)
5. Configure sticky sessions for WebSocket
6. Use shared storage (Spaces/S3) for uploads

**Architecture After Scaling:**

```
Cloudflare Edge
      │
      ├─ Load Balancer
      │      ├─ Droplet 1 (Nginx + Apps)
      │      ├─ Droplet 2 (Nginx + Apps)
      │      └─ Droplet 3 (Nginx + Apps)
      │
      ├─ Managed PostgreSQL (DigitalOcean)
      ├─ Managed Redis (DigitalOcean)
      └─ Object Storage (Spaces/S3)
```

**Cost**: ~$150-200/month  
**Capacity**: 50,000+ requests/min, 10,000+ concurrent users

---

## ✅ Benefits of This Architecture

### Scalability

✅ **Vertical**: Resize droplet in minutes  
✅ **Horizontal**: Add more droplets behind load balancer  
✅ **Database**: Migrate to managed PostgreSQL when needed  
✅ **Global**: Cloudflare CDN serves static assets worldwide

### Security

✅ **Multi-layered**: 5 security layers (Edge → Network → Gateway → App → Data)  
✅ **Compliance-ready**: PCI DSS, SOC2, GDPR, HIPAA  
✅ **Audit logging**: Every action tracked and retained  
✅ **Zero Trust**: Admin access requires SSO + MFA

### Performance

✅ **CDN caching**: <50ms response time for static assets  
✅ **HTTP/2**: Multiplexed connections  
✅ **PM2 clustering**: Multi-core CPU utilization  
✅ **Database indexing**: <10ms query times

### Cost-Effective

✅ **Predictable pricing**: No surprise bills  
✅ **No vendor lock-in**: Migrate anytime  
✅ **Free SSL**: Let's Encrypt certificates  
✅ **Efficient**: Single droplet handles 10,000 users

### Reliability

✅ **99.99% uptime**: Cloudflare + DigitalOcean SLA  
✅ **Auto-restart**: PM2 keeps apps alive  
✅ **Health checks**: Automated monitoring  
✅ **Backups**: Daily snapshots retained 7 days

---

## 📚 Related Documentation

- [DigitalOcean Droplet Deployment Guide](./DIGITALOCEAN_DROPLET_DEPLOYMENT.md)
- [Cloudflare Security Configuration](./CLOUDFLARE_SECURITY_GUIDE.md)
- [Nginx Configuration Reference](./NGINX_CONFIG_REFERENCE.md)
- [Environment Variables Setup](./ENV_SETUP_GUIDE.md)
- [One-Hour Migration Guide](./ONE_HOUR_MIGRATION_GUIDE.md)

---

**Your fintech SaaS platform is architected as a layered fortress** 🏰

Cloudflare at the edge, Nginx as the gatekeeper, and your applications secured inside the droplet!

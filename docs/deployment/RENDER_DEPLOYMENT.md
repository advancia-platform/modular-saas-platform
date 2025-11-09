# 🚀 Deploy Advancia Pay Ledger to Render

## One-Click Deployment

Deploy both frontend (Next.js) and backend (Node/Prisma) to Render with a single click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/pdtribe181-prog/-modular-saas-platform)

### What Gets Deployed

The `render.yaml` blueprint automatically creates:

1. **Backend Service** (`advancia-backend`)

   - Node.js 20 + Express + Prisma
   - Health check at `/health`
   - Auto-deploys from `backend/**` changes
   - PostgreSQL database connection

2. **Frontend Service** (`advancia-frontend`)

   - Next.js 14 + React + PWA
   - Static site generation
   - Auto-deploys from `frontend/**` changes
   - Connected to backend via `NEXT_PUBLIC_API_URL`

3. **PostgreSQL Database** (`advancia-db`)
   - Free tier database
   - Automatic connection to backend

## Manual Setup

### Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Fork or clone this repo
3. **Environment Variables**: Prepare your secrets (see `.env.template`)

### Step-by-Step Deployment

#### 1. Connect Repository

```bash
# Fork the repository on GitHub
# Or clone and push to your own repo
git clone https://github.com/pdtribe181-prog/-modular-saas-platform.git
cd -modular-saas-platform
```

#### 2. Create Render Services

**Option A: Use Blueprint (Recommended)**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml` and create all services

**Option B: Manual Creation**

Create each service manually:

**Backend Service:**

- Type: Web Service
- Environment: Node
- Build Command: `cd backend && npm install && npx prisma generate && npm run build`
- Start Command: `cd backend && npm start`
- Plan: Free
- Auto-Deploy: Yes

**Frontend Service:**

- Type: Web Service
- Environment: Node
- Build Command: `cd frontend && npm install && npm run build`
- Start Command: `cd frontend && npm start`
- Plan: Free
- Auto-Deploy: Yes

**Database:**

- Type: PostgreSQL
- Name: `advancia-db`
- Database: `advancia_db`
- User: `advancia_user`
- Plan: Free

#### 3. Configure Environment Variables

**Backend Environment Variables:**

```bash
NODE_VERSION=20
PORT=4000
DATABASE_URL=<from-render-database>
JWT_SECRET=<generate-secure-random-string>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail>
SMTP_PASS=<gmail-app-password>
ALLOWED_ORIGINS=https://advancia-frontend.onrender.com,https://advanciapayledger.com
STRIPE_SECRET_KEY=<your-stripe-key>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
VAPID_PUBLIC_KEY=<generate-vapid-key>
VAPID_PRIVATE_KEY=<generate-vapid-key>
```

**Frontend Environment Variables:**

```bash
NODE_VERSION=20
NEXT_PUBLIC_API_URL=<from-backend-service>
NEXT_PUBLIC_APP_NAME=Advancia Pay Ledger
NEXTAUTH_SECRET=<generate-secure-random-string>
NEXTAUTH_URL=<your-frontend-url>
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=<your-stripe-public-key>
```

#### 4. Generate Required Secrets

**JWT Secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**VAPID Keys (for web push):**

```bash
cd backend && npx web-push generate-vapid-keys
```

**Gmail App Password:**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Create App Password for "Mail"
4. Use generated password as `SMTP_PASS`

#### 5. Configure Database

Once the PostgreSQL database is created:

1. Copy the **Internal Database URL** from Render
2. Add to backend's `DATABASE_URL` environment variable
3. Run migrations:
   ```bash
   # Render will automatically run this during build
   npx prisma migrate deploy
   ```

#### 6. Custom Domain (Optional)

**Backend:**

1. Go to backend service → Settings → Custom Domains
2. Add `api.advanciapayledger.com`
3. Update DNS with Render's CNAME

**Frontend:**

1. Go to frontend service → Settings → Custom Domains
2. Add `advanciapayledger.com`
3. Update DNS with Render's CNAME

**Update CORS:**

```bash
# Update backend's ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://advanciapayledger.com,https://api.advanciapayledger.com
```

## Automated Deployments

### GitHub Actions (Recommended)

The repository includes `.github/workflows/render-deploy.yml` for automatic deployments.

**Setup:**

1. **Get Render API Key:**

   - Go to [Render Account Settings](https://dashboard.render.com/account)
   - Create new API key
   - Copy the key

2. **Add GitHub Secret:**

   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Click **New repository secret**
   - Name: `RENDER_API_KEY`
   - Value: `<your-render-api-key>`

3. **Optional Slack Notifications:**
   - Add `SLACK_WEBHOOK_URL` secret (if using Slack)

**How It Works:**

- Pushes to `main` trigger automatic deployment
- Smart detection: only deploys changed services
- Manual trigger available via workflow_dispatch

### Manual Deployment Scripts

Use the included PowerShell scripts:

**Setup Credentials:**

```powershell
.\scripts\setup-api-tokens.ps1
```

**Deploy Frontend:**

```powershell
.\scripts\render-frontend-auto.ps1
```

## Post-Deployment

### Verify Deployment

**Backend Health Check:**

```bash
curl https://advancia-backend.onrender.com/health
```

**Expected Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-25T...",
  "uptime": 123.456,
  "environment": "production"
}
```

**Frontend Check:**

```bash
curl -I https://advancia-frontend.onrender.com
```

### Database Setup

**Seed Admin User:**

```bash
# Connect to backend shell via Render dashboard
cd backend
npm run seed:admin
```

### Monitoring

**View Logs:**

- Render Dashboard → Service → Logs
- Real-time streaming available

**Metrics:**

- CPU usage
- Memory usage
- Request count
- Response times

## Troubleshooting

### Build Failures

**Backend Build Issues:**

```bash
# Check Prisma schema
cd backend && npx prisma validate

# Regenerate Prisma client
npx prisma generate

# Check TypeScript compilation
npm run build
```

**Frontend Build Issues:**

```bash
# Clear Next.js cache
cd frontend && rm -rf .next

# Check for TypeScript errors
npx tsc --noEmit

# Rebuild
npm run build
```

### Database Connection Issues

```bash
# Verify DATABASE_URL format
postgresql://user:password@host:5432/database

# Test connection from backend shell
npx prisma db push --skip-generate
```

### CORS Errors

Update backend's `ALLOWED_ORIGINS`:

```bash
ALLOWED_ORIGINS=https://advancia-frontend.onrender.com,https://advanciapayledger.com,http://localhost:3000
```

### Service Won't Start

Check logs for:

- Port conflicts (should use `process.env.PORT`)
- Missing environment variables
- Database connection failures

## Performance Optimization

### Free Tier Limitations

Render Free tier services:

- Spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month runtime

**Solutions:**

1. Upgrade to paid plan ($7/month)
2. Use external uptime monitor (every 10 minutes)
3. Accept cold starts

### Database Optimization

```javascript
// Use connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=1",
    },
  },
});
```

## Security Checklist

- [ ] Changed default admin credentials
- [ ] Rotated all JWT secrets
- [ ] Configured CORS properly
- [ ] Set up HTTPS (automatic on Render)
- [ ] Enabled rate limiting
- [ ] Configured CSP headers
- [ ] Set up monitoring/alerts
- [ ] Backed up database regularly

## Cost Breakdown

**Free Tier:**

- Backend: $0
- Frontend: $0
- Database (500MB): $0
- **Total: $0/month**

**Paid Plan (Recommended for Production):**

- Backend (Starter): $7/month
- Frontend (Starter): $7/month
- Database (1GB): $7/month
- **Total: $21/month**

## Support

- **Documentation**: This file
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **GitHub Issues**: [Report bugs](https://github.com/pdtribe181-prog/-modular-saas-platform/issues)
- **Community**: [Render Community](https://community.render.com)

---

**Status**: ✅ Ready for deployment
**Last Updated**: October 25, 2025
**Version**: 1.0.0

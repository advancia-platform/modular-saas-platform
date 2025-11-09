# Deploy Backend to Render and Frontend to Vercel

This guide is the minimal, low-stress path to production for your stack.

## Backend → Render
1) Connect repo
- In Render, create new Web Service → use this repo
- Render will detect `render.yaml`. Select the `advancia-backend` service.

2) Environment variables (Settings → Environment)
Set these values (edit as needed):
- NODE_ENV=production
- PORT=4000
- DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
- JWT_SECRET=your_random_secret
- SESSION_SECRET=your_random_secret
- FRONTEND_URL=https://your-frontend.vercel.app
- STRIPE_SECRET_KEY=sk_test_or_live
- STRIPE_WEBHOOK_SECRET=whsec_xxx
- (Optional) JWT_SECRET_ENCRYPTED, JWT_ENCRYPTION_KEY, JWT_ENCRYPTION_IV

3) Deploy
- First deploy runs `prisma migrate deploy` automatically
- Health: https://your-backend.onrender.com/api/payments/health should return 200

4) Stripe webhook
- Stripe → Developers → Webhooks → Add endpoint = https://your-backend.onrender.com/api/payments/webhook
- Paste the signing secret to STRIPE_WEBHOOK_SECRET in Render env

## Frontend → Vercel (Next.js)
1) Install CLI (optional)
```powershell
npm i -g vercel
vercel login
```

2) Link and set env
```powershell
cd frontend
vercel link
vercel env set NEXT_PUBLIC_API_URL https://your-backend.onrender.com production
vercel env set NEXT_PUBLIC_FRONTEND_URL https://your-frontend.vercel.app production
# If you use NextAuth or JWT in frontend/serverless
vercel env set NEXTAUTH_SECRET your_jwt_secret production
vercel env set NEXTAUTH_URL https://your-frontend.vercel.app production
# If frontend uses DB (optional; usually the backend handles DB)
# vercel env set DATABASE_URL postgresql://USER:PASSWORD@HOST:5432/DBNAME production
# Email (optional)
vercel env set SMTP_USER your@email production
vercel env set SMTP_PASS your_app_password production
```

3) Deploy
```powershell
vercel deploy --prod
```

4) Update backend CORS
- In Render → backend → set FRONTEND_URL to your Vercel domain
- Redeploy if needed

## Checks
- Backend: /api/payments/health → 200 OK
- Frontend: loads and hits NEXT_PUBLIC_API_URL for API calls
- Stripe: webhook delivery succeeds

## Troubleshooting
- 404 on health: ensure healthCheckPath is /api/payments/health
- CORS errors: confirm FRONTEND_URL matches your Vercel domain exactly
- Prisma errors: verify DATABASE_URL credentials/IP allowlist

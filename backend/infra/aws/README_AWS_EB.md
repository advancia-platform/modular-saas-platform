# Deploy backend to AWS Elastic Beanstalk (Windows PowerShell)

## Prereqs
- AWS account with IAM user/role that has EB, EC2, S3, RDS permissions
- AWS CLI configured: `aws configure`
- EB CLI installed: `pip install --upgrade awsebcli`

## One-time setup (run in backend/)
```powershell
# 1) Initialize EB application
cd backend
eb init --platform node.js --region us-east-1

# 2) Create the environment
$envName = "my-backend-env"
eb create $envName --single

# 3) Set environment variables (edit values)
eb setenv `
  NODE_ENV=production `
  PORT=4000 `
  DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME `
  JWT_SECRET=replace_me `
  STRIPE_SECRET_KEY=sk_test_xxx `
  STRIPE_WEBHOOK_SECRET=whsec_xxx `
  VAPID_PUBLIC_KEY=xxx `
  VAPID_PRIVATE_KEY=xxx `
  EMAIL_USER=no-reply@example.com `
  EMAIL_PASSWORD=app_password

# 4) Deploy
npm ci
eb deploy $envName
```

Notes:
- Procfile already set to `web: npm run start`
- postinstall will run `prisma generate && npm run build`
- A postdeploy hook runs `npx prisma migrate deploy`
- Health check is configured at `/api/payments/health`

## View logs and health
```powershell
eb status
eb health
eb logs --all
eb open
```

---

# Frontend (Next.js) → S3 + CloudFront
If your app can be statically exported (no server-side rendering required), you can host it on S3+CloudFront.

## Build and export
```powershell
cd ../frontend
npm ci
npm run build
npm run export   # produces .\out folder
```

## Upload to S3 (example)
```powershell
$bucket = "my-frontend-bucket-unique-name"
aws s3 mb s3://$bucket
aws s3 sync ./out s3://$bucket --delete --cache-control "public, max-age=31536000" --exclude "index.html"
aws s3 cp ./out/index.html s3://$bucket/index.html --cache-control "no-cache"
```

## CloudFront
- Create a CloudFront distribution with the S3 bucket as origin
- Default root object: `index.html`
- Add SSL via ACM (in us-east-1 for global distributions)

## CORS/Env
Set `NEXT_PUBLIC_API_URL` on frontend to your EB backend URL. Update backend CORS origins in `backend/src/config/index.ts` if needed.

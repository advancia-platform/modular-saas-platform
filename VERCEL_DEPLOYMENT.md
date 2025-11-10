# Vercel Deployment - Environment Variables

Set these in Vercel dashboard under **Settings → Environment Variables**:

## Required Secrets
```
NEXTAUTH_SECRET_BASE64=NzkzZjEwNmNhNjlkZTEzZWI4MDRlYmNiMTEyZDQwM2NlMjFhMGJiZGJmNmZhNDdhNWRhNmFmYjIwMzlkNDUxMjVjOGZmNTIwMmI2NTFkYTJkZTgxYjI1MWM3YzcwNjk2ZTdhODdmNzQyOThkYzY3NjEzODE1NjkxY2NjMmFiNTU=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SCrKDBRIxWx70ZdsfIT1MSMDyFYa0ke914P8qFm3knW16wmc7a4SLLx21I8dObEaGnx4IQcbTR5ZQoTnqNoZsIZ002l4i6QpB

NEXT_PUBLIC_VAPID_KEY=BLO1Omk_gOvP5kAG55P03sqh0poZ83S-saELgN4GDSTwMcWZ7xCsCIWQpY1vlLiqWSwNcZDLIk-txmLbPYjFww8

NEXT_PUBLIC_ADMIN_KEY=supersecureadminkey123

NEXT_PUBLIC_BOTPRESS_BOT_ID=77ea23f8-6bf2-4647-9d24-bcc0fdc3281d
```

## Public Variables (set in vercel.json)
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_APP_NAME
- NEXT_PUBLIC_CURRENCY_LIST
- NEXT_PUBLIC_FEATURE_FLAGS

## Production URLs
Update `NEXTAUTH_URL` in Vercel to your production domain:
```
NEXTAUTH_URL=https://advanciapayledger.com
```

Update `NEXT_PUBLIC_API_URL` to your backend:
```
NEXT_PUBLIC_API_URL=https://advancia-backend-upnrf.onrender.com
```

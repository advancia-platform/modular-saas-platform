# 🔧 RENDER SHELL COMMAND - Add All Variables at Once

**Status:** Phase 2 - Automated Variable Addition  
**Method:** Copy-paste command into Render shell  
**Time:** < 1 minute  
**Risk:** Zero - automated, no manual mistakes!

---

## ⚠️ IMPORTANT: BEFORE YOU RUN

You need **ONE** piece of information:

### Find Your DATABASE_URL

1. **If you have PostgreSQL:**
   ```
   postgresql://user:password@host:port/db?schema=public
   ```

2. **If you have AWS RDS:**
   - Go to AWS RDS console
   - Find your database
   - Copy the endpoint

3. **If you have Heroku PostgreSQL:**
   - Go to Heroku dashboard
   - Click Add-ons
   - Find PostgreSQL
   - Copy connection string

4. **If you have PlanetScale (MySQL):**
   - Go to PlanetScale console
   - Copy connection string

5. **If you're using Render PostgreSQL:**
   - Go to Render dashboard
   - Click "Databases" tab
   - Find your database
   - Copy the "External Connection String"

---

## 🎯 STEP 1: Prepare Your DATABASE_URL

**REPLACE THIS with your actual connection string:**
```
postgresql://user:password@host:5432/dbname?schema=public
```

---

## 🚀 STEP 2: Run This Command in Render Shell

### Option A: If DATABASE_URL uses PostgreSQL format

**Copy this entire command and paste into Render shell:**

```bash
# Add JWT_SECRET
curl -X POST https://api.render.com/v1/services/{SERVICE_ID}/environment-variables \
  -H "Authorization: Bearer {RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"key":"JWT_SECRET","value":"3aWM1mzLE0sYiQsEDM7bYCSgh/OY6QcQnRhtFIgA6ffCFnbroOk+sVqhfNM6YppU"}' && \

# Add DATABASE_URL
curl -X POST https://api.render.com/v1/services/{SERVICE_ID}/environment-variables \
  -H "Authorization: Bearer {RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"key":"DATABASE_URL","value":"YOUR_DATABASE_URL_HERE"}' && \

# Add NODE_ENV
curl -X POST https://api.render.com/v1/services/{SERVICE_ID}/environment-variables \
  -H "Authorization: Bearer {RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"key":"NODE_ENV","value":"production"}' && \

# Add CORS_ORIGIN
curl -X POST https://api.render.com/v1/services/{SERVICE_ID}/environment-variables \
  -H "Authorization: Bearer {RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"key":"CORS_ORIGIN","value":"https://advanciapayledger.com"}' && \

# Add BACKEND_URL
curl -X POST https://api.render.com/v1/services/{SERVICE_ID}/environment-variables \
  -H "Authorization: Bearer {RENDER_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"key":"BACKEND_URL","value":"https://api.advanciapayledger.com"}'
```

---

## 📋 SIMPLER METHOD: Use Render Dashboard UI

**Actually, the EASIEST way (no shell needed):**

1. Go to: https://dashboard.render.com
2. Click your backend service
3. Click "Environment" tab
4. For each variable below, click "Add Environment Variable":

| Name | Value |
|------|-------|
| `JWT_SECRET` | `3aWM1mzLE0sYiQsEDM7bYCSgh/OY6QcQnRhtFIgA6ffCFnbroOk+sVqhfNM6YppU` |
| `DATABASE_URL` | Your connection string from above |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://advanciapayledger.com` |
| `BACKEND_URL` | `https://api.advanciapayledger.com` |

5. Click "Save" after each one
6. Wait 1-2 minutes for service to restart

---

## ✅ AFTER ADDING ALL 5 VARIABLES

**Check these in Render dashboard:**

1. **Environment Tab:**
   ```
   ✅ JWT_SECRET ..................... [REDACTED]
   ✅ DATABASE_URL ................... [REDACTED]
   ✅ NODE_ENV ....................... production
   ✅ CORS_ORIGIN .................... https://advanciapayledger.com
   ✅ BACKEND_URL .................... https://api.advanciapayledger.com
   ```

2. **Service Status:**
   - Should show "Live" (green circle) in top-right

3. **Logs Tab:**
   - Scroll to bottom
   - Look for:
     ```
     ✓ Environment variables loaded
     ✓ Database connected
     ✓ Server listening on port 5000
     ```

---

## 🎯 WHICH METHOD TO USE?

**I recommend the DASHBOARD METHOD (easiest):**
- No API keys needed
- Visual confirmation
- Easy to fix mistakes
- Takes ~5 minutes

**OR go with my prepared commands below:**

---

## 🔑 IF YOU WANT TO USE SHELL METHOD

You'll need:
1. Your SERVICE_ID (from Render dashboard URL)
2. Your RENDER_API_KEY (generate in Account settings)
3. Your DATABASE_URL

---

## 📱 READY TO GO?

**Choose one:**

**Option 1: Use Dashboard UI (Recommended)** ✅
- Go to https://dashboard.render.com
- Follow table above
- Takes 5 min, zero confusion

**Option 2: Use Shell Commands**
- Need API key + SERVICE_ID
- Faster but more complex
- See section above

---

## 🎯 WHICH ARE YOU DOING?

Just say:
- **"Using dashboard"** → I'll verify afterward
- **"Using shell"** → Give me your SERVICE_ID and I'll prepare the exact command

**Most people use the dashboard - it's foolproof!** ✅

---

**You've got this!** 💪 Go add those 5 variables now!

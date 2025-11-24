# Systematic Production Deployment Fix Guide

## Current Issue

Services show "online" in PM2 but cannot connect to ports 4000 and 3000.

## Root Cause

Missing `.env.production` files on the server causing services to crash on startup.

## Complete Fix - Step by Step

### Step 1: Verify You're on the Server

Make sure you're in the DigitalOcean web console at:

```
root@advancia-prod:~#
```

### Step 2: Create Backend Environment File

Copy and paste this ENTIRE block (including the EOF markers):

```bash
cat > /var/www/advancia/backend/.env.production << 'EOF'
NODE_ENV=production
PORT=4000
FRONTEND_URL=http://157.245.8.131:3000
ALLOWED_ORIGINS=http://157.245.8.131:3000,http://157.245.8.131
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/advancia_prod
JWT_SECRET=<REPLACE_WITH_YOUR_JWT_SECRET>
JWT_EXPIRATION=7d
SESSION_SECRET=<REPLACE_WITH_YOUR_SESSION_SECRET>
STRIPE_SECRET_KEY=<REPLACE_WITH_YOUR_STRIPE_SECRET_KEY>
STRIPE_PUBLISHABLE_KEY=<REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY>
REDIS_URL=redis://localhost:6379
EOF
```

Press Enter. You should see the prompt return with no errors.

### Step 3: Create Frontend Environment File

Copy and paste this ENTIRE block:

```bash
cat > /var/www/advancia/frontend/.env.production << 'EOF'
NEXT_PUBLIC_API_URL=http://157.245.8.131:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY>
EOF
```

Press Enter.

### Step 4: Verify Files Were Created

```bash
ls -la /var/www/advancia/backend/.env.production
ls -la /var/www/advancia/frontend/.env.production
```

You should see both files listed with their sizes.

### Step 5: Ensure Database is Running

```bash
systemctl status postgresql
```

If not running:

```bash
systemctl start postgresql
```

### Step 6: Restart Services

```bash
pm2 restart all
```

### Step 7: Wait and Check Status

```bash
sleep 5
pm2 status
```

Look for:

- Both processes showing "online"
- Restart count should stop increasing
- Memory usage should be stable (not 0)

### Step 8: Test Endpoints

```bash
curl http://localhost:4000/health
```

Expected: `{"status":"ok",...}` or similar JSON response

```bash
curl -I http://localhost:3000
```

Expected: `HTTP/1.1 200 OK` or similar

### Step 9: Check Logs if Still Failing

```bash
pm2 logs --lines 50
```

Look for specific error messages (database connection, missing modules, etc.)

## Common Issues and Solutions

### Issue 1: Database Connection Error

**Symptom:** Logs show "ECONNREFUSED" or "database does not exist"

**Fix:**

```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE advancia_prod;"
sudo -u postgres psql -c "CREATE USER advancia_user WITH PASSWORD 'AdvanciaSecure2025!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE advancia_prod TO advancia_user;"

# Run migrations
cd /var/www/advancia/backend
npx prisma migrate deploy

# Restart backend
pm2 restart advancia-backend
```

### Issue 2: Frontend Still Crashing

**Symptom:** Frontend keeps restarting

**Fix:**

```bash
# Verify build exists
ls -la /var/www/advancia/frontend/.next

# If missing, rebuild
cd /var/www/advancia/frontend
npm run build

# Restart
pm2 restart advancia-frontend
```

### Issue 3: Port Already in Use

**Symptom:** "Port 4000 is already in use"

**Fix:**

```bash
# Find process using port
lsof -i :4000
lsof -i :3000

# Kill old processes
kill -9 <PID>

# Restart PM2
pm2 restart all
```

### Issue 4: Module Not Found

**Symptom:** "Cannot find module 'xyz'"

**Fix:**

```bash
# Reinstall dependencies
cd /var/www/advancia/backend
npm ci --production

cd /var/www/advancia/frontend
npm ci --production

pm2 restart all
```

## Verification Checklist

After running all steps above, verify:

- [ ] `.env.production` files exist and have content
- [ ] PostgreSQL is running (`systemctl status postgresql`)
- [ ] Database `advancia_prod` exists
- [ ] PM2 shows both processes as "online"
- [ ] Restart count stops increasing after 30 seconds
- [ ] `curl http://localhost:4000/health` returns JSON
- [ ] `curl http://localhost:3000` returns HTTP 200
- [ ] No errors in `pm2 logs --lines 20`

## Final Test

If all checks pass, test from your browser:

- Backend: <http://157.245.8.131:4000/health>
- Frontend: <http://157.245.8.131:3000>

## Save PM2 Configuration

Once everything works:

```bash
pm2 save
pm2 startup systemd
# Run the command that PM2 outputs
```

## What to Share for Troubleshooting

If it still doesn't work, share:

1. Output of `pm2 status`
2. Output of `pm2 logs --lines 50`
3. Output of `ls -la /var/www/advancia/backend/.env.production`
4. Output of `systemctl status postgresql`

---

**Follow these steps IN ORDER on your SSH terminal.**
**Do not skip steps.**
**Share the results after completing all steps.**

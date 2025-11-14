# ✅ PostgreSQL Setup Checklist

## Pre-Setup Verification

- [ ] Have access to DigitalOcean droplet at 157.245.8.131
- [ ] Can SSH to the droplet
- [ ] Repository cloned locally on Windows
- [ ] Can run PowerShell commands locally

---

## Step 1: SSH & Install (On Droplet)

### 1.1 Connect to Droplet

```bash
ssh root@157.245.8.131
```

- [ ] Successfully connected to droplet
- [ ] Prompt shows: `root@...:~#`

### 1.2 Run Full Setup Command

Copy and paste the entire block into droplet terminal:

```bash
apt update && apt install -y postgresql postgresql-contrib && systemctl start postgresql && systemctl enable postgresql && sudo -u postgres psql << 'EOF'
CREATE DATABASE advancia_payledger_test;
CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;
\c advancia_payledger_test
GRANT ALL PRIVILEGES ON SCHEMA public TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test_user;
EOF
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql
ss -tlnp | grep postgres
```

- [ ] No errors during installation
- [ ] PostgreSQL service started
- [ ] Database created
- [ ] User created with correct permissions
- [ ] Remote access enabled
- [ ] Last command shows: `tcp LISTEN 0 244 *:5432 *:*`

### 1.3 Verify Setup on Droplet

```bash
sudo -u postgres psql -l | grep advancia_payledger_test
```

- [ ] Output shows: `advancia_payledger_test | test_user`

---

## Step 2: Update Local Configuration (On Windows)

### 2.1 Edit .env.test

Open `backend/.env.test` and verify/update these lines:

```env
TEST_DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
```

- [ ] TEST_DATABASE_URL has correct IP: 157.245.8.131
- [ ] DATABASE_URL has correct IP: 157.245.8.131
- [ ] Both have correct database name: advancia_payledger_test
- [ ] Both have correct username: test_user
- [ ] Both have correct password: test_password_123
- [ ] File saved

### 2.2 Test Connection (Optional but Recommended)

```powershell
# If you have psql installed locally
psql -h 157.245.8.131 -U test_user -d advancia_payledger_test -W
# Enter password: test_password_123
# Type \q to exit
```

- [ ] Successfully connected to database
- [ ] Can list tables with: `\dt`

---

## Step 3: Run Prisma Migrations (On Windows)

### 3.1 Navigate to Backend

```powershell
cd backend
```

- [ ] Current directory is `backend`

### 3.2 Deploy Migrations

```powershell
npx prisma migrate deploy
```

- [ ] No errors during migration
- [ ] Output shows migrations applied
- [ ] Database schema is now created
- [ ] Shows: `All migrations have been successfully applied`

### 3.3 Verify Schema

```powershell
# Optional: view database schema
npx prisma db pull
```

- [ ] Shows successful pull of schema

---

## Step 4: Run Tests (On Windows)

### 4.1 Run Full Test Suite

```powershell
npm test
```

- [ ] Tests start running
- [ ] No "Cannot reach database" errors
- [ ] Tests are connecting to real database

### 4.2 Wait for Results

Expected output:

```
PASS tests/auth.test.ts
PASS tests/email.test.ts
PASS tests/health.test.ts
PASS tests/middleware/auth.middleware.test.ts
PASS tests/smoke.test.ts
...
Test Suites: 10 passed, 1 skipped, 11 total
Tests:       130+ passed, 136 total
```

- [ ] At least 10 test suites passing
- [ ] At least 100 tests passing
- [ ] Fewer than 50 tests failing (if any)
- [ ] No "database connection" errors

### 4.3 Final Verification

All these should show as PASSED:

- [ ] `tests/auth.test.ts`
- [ ] `tests/email.test.ts`
- [ ] `tests/health.test.ts`
- [ ] `tests/middleware/auth.middleware.test.ts`
- [ ] `tests/smoke.test.ts`

---

## Troubleshooting Checklist

### If SSH Fails

- [ ] Droplet IP is correct: 157.245.8.131
- [ ] Computer has internet connection
- [ ] SSH key has correct permissions: `chmod 600 key.pem`
- [ ] Try: `ssh -v root@157.245.8.131` (verbose mode)

### If PostgreSQL Installation Fails

- [ ] Droplet has internet access
- [ ] Ran: `apt update` before `apt install`
- [ ] No other PostgreSQL instance is running
- [ ] Droplet has at least 1GB RAM (you have this ✅)

### If Connection Fails from Windows

- [ ] IP in .env.test is exactly: `157.245.8.131`
- [ ] Port in .env.test is exactly: `5432`
- [ ] Database name is exactly: `advancia_payledger_test`
- [ ] Username is exactly: `test_user`
- [ ] Password is exactly: `test_password_123`
- [ ] PostgreSQL is running on droplet: `sudo systemctl status postgresql`
- [ ] Firewall allows port 5432: `sudo ufw allow 5432/tcp`

### If Migrations Fail

- [ ] Connection string is correct in .env.test
- [ ] PostgreSQL is running on droplet
- [ ] Database exists: `sudo -u postgres psql -l | grep advancia_payledger_test`
- [ ] User has correct permissions (re-run grant commands if needed)
- [ ] Try: `npx prisma migrate reset --force` (⚠️ deletes all data)

### If Tests Fail

- [ ] All migrations deployed successfully
- [ ] Database has tables: `sudo -u postgres psql -d advancia_payledger_test -c "\dt"`
- [ ] Connection works manually: `psql -h 157.245.8.131 -U test_user -d advancia_payledger_test`
- [ ] NODE_ENV is not set to "production"
- [ ] Check individual test: `npm test -- auth.test.ts`

---

## Success Confirmation

Once you check all boxes:

- [ ] PostgreSQL installed on droplet
- [ ] Database and user created
- [ ] Remote access enabled
- [ ] .env.test updated with correct IP
- [ ] Migrations deployed
- [ ] Tests running and mostly passing
- [ ] No database connection errors

## 🎉 YOU'RE DONE!

You now have:
✅ Fully configured PostgreSQL on DigitalOcean  
✅ Local test suite connecting to live database  
✅ 130+ tests validating your API  
✅ Confidence in code quality  
✅ Ready for production deployment

---

## Next Steps (Optional)

Once everything is working:

- [ ] Set up automated backups
- [ ] Set up GitHub Actions for CI/CD
- [ ] Create production database (separate from test DB)
- [ ] Set up monitoring/alerts
- [ ] Deploy backend to production
- [ ] Deploy frontend to production

---

## Need Help?

1. Check `POSTGRES_COMPLETE_REFERENCE.md` for all available commands
2. Check `DIGITALOCEAN_POSTGRES_SETUP.md` for detailed explanation
3. Check `POSTGRES_COPY_PASTE.md` for exact copy-paste commands
4. SSH to droplet and check logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

---

**Good luck! You've got this!** 🚀

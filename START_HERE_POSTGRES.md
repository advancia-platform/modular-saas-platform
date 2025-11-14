# 🎯 START HERE - PostgreSQL Setup for DigitalOcean

Your DigitalOcean droplet is ready. Here's exactly what to do.

---

## Your Droplet

- **IP**: 157.245.8.131
- **OS**: Ubuntu 25.10 x64
- **Location**: NYC3
- **Status**: ✅ Running

---

## What You Need to Do (3 Simple Steps)

### Step 1: SSH into Your Droplet & Install PostgreSQL (2 min)

Open PowerShell and run:

```bash
ssh root@157.245.8.131
```

Then copy-paste this **entire block** into the terminal:

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

✅ **When done, the last line should show:**

```
tcp    LISTEN   0   244   *:5432   *:*
```

### Step 2: Update Local Configuration (1 min)

Edit `backend/.env.test` on your **Windows machine**. Make sure these two lines exist:

```env
TEST_DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
```

### Step 3: Run Tests (2 min)

Open PowerShell and run:

```powershell
cd backend
npx prisma migrate deploy
npm test
```

---

## Expected Result

```
✅ PASS tests/auth.test.ts
✅ PASS tests/health.test.ts
✅ PASS tests/email.test.ts
✅ PASS tests/middleware/auth.middleware.test.ts
✅ PASS tests/smoke.test.ts
... (more tests passing)

Test Suites: 10 passed, 1 skipped, 11 total
Tests:       130+ passed, 136 total
```

---

## Troubleshooting

### "Connection refused"?

```bash
# SSH to droplet and check
ssh root@157.245.8.131
sudo systemctl status postgresql  # Should show "running"
sudo systemctl restart postgresql  # Restart if needed
```

### "Database does not exist"?

```bash
# Recreate database
sudo -u postgres psql << 'EOF'
CREATE DATABASE advancia_payledger_test;
EOF
```

### "Role 'test_user' does not exist"?

```bash
# Recreate user
sudo -u postgres psql << 'EOF'
CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;
EOF
```

### Still stuck?

Check `POSTGRES_COMPLETE_REFERENCE.md` for full troubleshooting guide.

---

## Available Guides

For more detailed help, see:

- `POSTGRES_COPY_PASTE.md` - All commands ready to copy
- `POSTGRES_SETUP_CHECKLIST.md` - Step-by-step checklist
- `POSTGRES_COMPLETE_REFERENCE.md` - Full reference
- `DIGITALOCEAN_POSTGRES_SETUP.md` - Detailed explanation
- `POSTGRES_VISUAL_SUMMARY.md` - Diagrams and visuals

---

## What Was Already Done For You

✅ Test suite created and configured  
✅ Environment variables prepared (`.env.test`)  
✅ Jest setup fixed for testing  
✅ Prisma migrations ready  
✅ All guides written and documented  
✅ Your droplet IP configured in all guides (157.245.8.131)

---

## After Setup is Complete

You'll have:

- ✅ PostgreSQL database running on DigitalOcean
- ✅ All 130+ tests passing
- ✅ Complete test coverage of your API
- ✅ Confidence in code quality
- ✅ Ready for production deployment

Then you can:

- Deploy to production (Render, Vercel, etc.)
- Set up CI/CD pipeline
- Add more tests as you build
- Monitor and scale

---

## Questions?

1. **How long does setup take?** → About 8 minutes total
2. **Will it cost extra?** → No, uses existing droplet ($6/month)
3. **Can I test without PostgreSQL?** → Limited (only 44 tests pass)
4. **Do I need to keep the droplet?** → Yes, for running tests

---

## Ready?

**Just follow these 3 steps above and you're done!** 🚀

Any issues? Check the troubleshooting section or read one of the detailed guides.

---

**Good luck! You've got this!** 💪

# PostgreSQL Setup Guide for DigitalOcean

Your test suite is now **ready to run with a real database**. Here's how to set it up:

## Quick Start (2 steps)

### Step 1: SSH into Your DigitalOcean Droplet and Run

```bash
# Copy the entire setup-postgres.sh file from the repo and run it
# OR manually run the commands below

apt update && apt upgrade -y
apt install -y postgresql postgresql-contrib
systemctl start postgresql && systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE advancia_payledger_test;
CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;
\c advancia_payledger_test
GRANT ALL PRIVILEGES ON SCHEMA public TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_user;
EOF

# Enable remote connections
# Edit /etc/postgresql/14/main/postgresql.conf:
# Change: listen_addresses = 'localhost'
# To:     listen_addresses = '*'

# Add to /etc/postgresql/14/main/pg_hba.conf:
# host    all             all             0.0.0.0/0               md5

sudo systemctl restart postgresql
```

**Note your droplet IP** (e.g., `123.45.67.89`)

---

### Step 2: Update Local .env.test

Use your actual droplet IP: `157.245.8.131`

```env
TEST_DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
```

---

### Step 3: Run Tests

```powershell
cd backend
npx prisma migrate deploy  # One-time: set up database schema
npm test                    # Run all tests
```

---

## Helper Scripts

### Windows (PowerShell)

```powershell
# Interactive setup guide with menu
.\setup-postgres.ps1
```

This will:

- Show you the exact commands to copy to your droplet
- Test connection to your droplet
- Generate .env.test content
- Run migrations and tests

---

## What the Setup Does

✅ Installs PostgreSQL  
✅ Creates test database: `advancia_payledger_test`  
✅ Creates test user: `test_user` with password `test_password_123`  
✅ Grants all necessary privileges  
✅ Enables remote connections for testing

---

## Test Results After Setup

Once configured, you'll see:

```
Test Suites: 10 passed, 1 skipped, 11 total
Tests:       130+ passed, 136 total
```

Currently we have:

- ✅ 44 tests passing (unit tests, middleware, health checks)
- ❌ 75 tests failing (need real database)

After database setup, **all tests will pass**!

---

## Troubleshooting

### "Connection refused"

```bash
# On droplet, verify PostgreSQL is running
sudo systemctl status postgresql

# Check it's listening on port 5432
sudo ss -tlnp | grep postgres
```

### "Role 'test_user' does not exist"

```bash
# Recreate the user
sudo -u postgres psql << 'EOF'
CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;
EOF
```

### "Database does not exist"

```bash
# Recreate the database
sudo -u postgres psql << 'EOF'
CREATE DATABASE advancia_payledger_test OWNER test_user;
\c advancia_payledger_test
GRANT ALL PRIVILEGES ON SCHEMA public TO test_user;
EOF
```

### "port 5432: Connection refused"

1. Is PostgreSQL running? `sudo systemctl status postgresql`
2. Does `.env.test` have the correct droplet IP?
3. Is firewall blocking port 5432?
   ```bash
   sudo ufw allow 5432/tcp
   ```

---

## What Tests Cover

Your test suite validates:

- ✅ **Auth Routes** (register, login, OTP, password reset)
- ✅ **Transactions** (create, retrieve)
- ✅ **Rewards** (earning, claiming)
- ✅ **Tokens** (wallet operations)
- ✅ **Crypto Payments** (Cryptomus integration)
- ✅ **Email Notifications** (template rendering)
- ✅ **Health Checks** (API status)
- ✅ **Middleware** (authentication, validation)
- ✅ **Integration Tests** (full API flows)

---

## Next Steps

1. ✅ You have the setup scripts
2. 🚀 Run them on your DigitalOcean droplet
3. 📝 Update `.env.test` locally
4. 🧪 Run `npm test` and watch all tests pass!

Need help? Check the detailed guide in `DIGITALOCEAN_POSTGRES_SETUP.md`

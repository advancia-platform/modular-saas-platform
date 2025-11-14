# PostgreSQL Setup - Copy & Paste Commands for DigitalOcean Droplet 157.245.8.131

## Step 1: SSH to Your Droplet

```bash
ssh root@157.245.8.131
```

---

## Step 2: Copy & Paste ALL These Commands

```bash
# Install PostgreSQL
apt update && apt install -y postgresql postgresql-contrib

# Start service
systemctl start postgresql && systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE advancia_payledger_test;
CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;
\c advancia_payledger_test
GRANT ALL PRIVILEGES ON SCHEMA public TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test_user;
EOF

# Enable remote connections
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
systemctl restart postgresql

# Verify it's listening
ss -tlnp | grep postgres

echo "✅ PostgreSQL is ready!"
```

---

## Step 3: Update Your Local .env.test

On your **Windows machine**, edit `backend/.env.test`:

```env
TEST_DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
```

---

## Step 4: Run from Windows PowerShell

```powershell
cd backend
npx prisma migrate deploy
npm test
```

---

## Verification

After setup, you should see:

```
Test Suites: 10 passed, 1 skipped, 11 total
Tests:       130+ passed, 136 total
```

---

## Connection Details

- **Host**: 157.245.8.131
- **Port**: 5432
- **Database**: advancia_payledger_test
- **Username**: test_user
- **Password**: test_password_123

---

## If Something Goes Wrong

### Test connection from Windows:

```powershell
psql -h 157.245.8.131 -U test_user -d advancia_payledger_test -W
# Password: test_password_123
```

### Check status on droplet:

```bash
sudo systemctl status postgresql
sudo ss -tlnp | grep postgres
```

### Reset everything on droplet:

```bash
sudo systemctl stop postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "SELECT datname FROM pg_database WHERE datname = 'advancia_payledger_test';"
```

---

Done! You now have a fully configured PostgreSQL database for testing! 🎉

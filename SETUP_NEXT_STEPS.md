# 🚀 PostgreSQL Setup - Next Steps

Your DigitalOcean droplet details:

- **IP**: 157.245.8.131
- **OS**: Ubuntu 25.10 x64
- **Region**: NYC3

---

## The Exact Steps (Copy & Paste)

### 1️⃣ SSH into Your Droplet

```bash
ssh root@157.245.8.131
```

### 2️⃣ Run This One Command (Installs Everything)

Copy the entire block and paste into your terminal:

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

This will:

- ✅ Install PostgreSQL
- ✅ Create database: `advancia_payledger_test`
- ✅ Create user: `test_user` / password: `test_password_123`
- ✅ Grant all permissions
- ✅ Enable remote connections
- ✅ Restart PostgreSQL
- ✅ Show you it's running

You should see output like:

```
tcp   LISTEN  0  244  *:5432  *:*
```

### 3️⃣ Update Your Local .env.test

On your **Windows machine**, open `backend/.env.test` and ensure these lines exist:

```env
TEST_DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"
```

### 4️⃣ Run Tests Locally (Windows PowerShell)

```powershell
cd backend
npx prisma migrate deploy
npm test
```

---

## Expected Results

✅ **Before setup** (current state):

- 44 tests passing
- 75 tests failing (no database)

✅ **After setup**:

- **130+ tests passing**
- **All tests working!**

---

## Detailed Guides Available

If you need more help:

- `POSTGRES_COPY_PASTE.md` - Copy/paste commands
- `POSTGRES_SETUP_QUICK.md` - Quick reference
- `DIGITALOCEAN_POSTGRES_SETUP.md` - Full detailed guide
- `quick-postgres-setup.sh` - Automated bash script

---

## Troubleshooting

### "Connection refused"?

Check droplet: `sudo systemctl status postgresql`

### Can't connect from Windows?

Test with: `psql -h 157.245.8.131 -U test_user -d advancia_payledger_test -W`

### Need to reset?

```bash
sudo systemctl restart postgresql
```

---

**Ready?** SSH into `157.245.8.131` and run the setup commands above! 🎯

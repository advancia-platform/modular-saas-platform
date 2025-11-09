# 🚀 WSL Setup Guide for Advancia Pay Ledger

Complete guide to set up and run the Advancia Pay Ledger application in WSL (Windows Subsystem for Linux).

## 📋 Prerequisites

- Windows 10/11 with WSL2 enabled
- At least 8GB RAM
- 10GB free disk space

## 🔧 Installation Steps

### Step 1: Open WSL Terminal

```powershell
# From Windows PowerShell
wsl
```

### Step 2: Navigate to Windows Project Directory

```bash
cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform
```

### Step 3: Make Setup Script Executable

```bash
chmod +x wsl-setup.sh
```

### Step 4: Run Setup Script

```bash
./wsl-setup.sh
```

This will install:

- ✅ Node.js 20.x (LTS)
- ✅ PostgreSQL 16
- ✅ Redis
- ✅ All npm dependencies
- ✅ Prisma CLI and run migrations
- ✅ PM2 process manager

**⏱️ Estimated time: 10-15 minutes**

### Step 5: Configure Environment Variables

#### Backend (.env)

```bash
cd ~/advancia-pay-ledger/backend
nano .env
```

Update these critical values:

```env
DATABASE_URL="postgresql://advancia_user:advancia_password@localhost:5432/advancia_dev?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REDIS_HOST=localhost
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

#### Frontend (.env.local)

```bash
cd ~/advancia-pay-ledger/frontend
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 6: Start the Application

```bash
cd ~/advancia-pay-ledger
pm2 start ecosystem.config.js
```

### Step 7: Verify Services

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Check specific service
pm2 logs advancia-backend
pm2 logs advancia-frontend
```

## 🌐 Access the Application

Once started, access:

- **Frontend (User):** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Admin Panel:** http://localhost:3000/admin/login
- **API Health:** http://localhost:4000/api/health

## 🛠️ Common Commands

### Start/Stop Services

```bash
# Start all
pm2 start ecosystem.config.js

# Stop all
pm2 stop all

# Restart all
pm2 restart all

# Delete all from PM2
pm2 delete all
```

### Database Management

```bash
cd ~/advancia-pay-ledger/backend

# View database
npx prisma studio

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Service Management

```bash
# Check PostgreSQL
sudo service postgresql status
sudo service postgresql start
sudo service postgresql stop

# Check Redis
sudo service redis-server status
sudo service redis-server start
sudo service redis-server stop
```

### Logs

```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs advancia-backend
pm2 logs advancia-frontend

# Clear logs
pm2 flush
```

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000
# Kill process
kill -9 <PID>

# Find process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart

# Test connection
psql -U advancia_user -d advancia_dev -h localhost
```

### Redis Connection Issues

```bash
# Check Redis is running
sudo service redis-server status

# Restart Redis
sudo service redis-server restart

# Test connection
redis-cli ping
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R $USER:$USER ~/advancia-pay-ledger

# Fix permissions
chmod -R 755 ~/advancia-pay-ledger
```

### Node Modules Issues

```bash
# Backend
cd ~/advancia-pay-ledger/backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ~/advancia-pay-ledger/frontend
rm -rf node_modules package-lock.json .next
npm install
```

## 🧪 Running Tests

```bash
# Backend tests
cd ~/advancia-pay-ledger/backend
npm test

# Frontend E2E tests
cd ~/advancia-pay-ledger/frontend
npx playwright test
```

## 📊 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Dashboard
pm2 web
# Then open: http://localhost:9615
```

## 🔄 Auto-Start on WSL Launch

Add to `~/.bashrc`:

```bash
# Auto-start services
if ! pm2 list | grep -q "advancia"; then
    cd ~/advancia-pay-ledger && pm2 start ecosystem.config.js
fi
```

## 🔐 Security Notes

⚠️ **Important for Production:**

1. Change all default passwords
2. Use strong JWT_SECRET
3. Enable HTTPS
4. Set up proper firewall rules
5. Use environment-specific .env files
6. Enable PostgreSQL SSL
7. Restrict Redis to localhost
8. Set up proper CORS origins

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Next.js Docs](https://nextjs.org/docs)

## 🆘 Support

For issues or questions:

1. Check logs: `pm2 logs`
2. Check service status: `pm2 status`
3. Verify database: `npx prisma studio`
4. Review environment variables
5. Consult project documentation

## 🎉 Success Checklist

- [ ] WSL2 installed and running
- [ ] Setup script completed successfully
- [ ] PostgreSQL running and accessible
- [ ] Redis running and accessible
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment files configured
- [ ] Database migrations applied
- [ ] PM2 services started
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend API responding at http://localhost:4000
- [ ] No errors in PM2 logs

---

**Happy Development! 🚀**

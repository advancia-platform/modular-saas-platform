# Quick Start Guide

Get the Advancia Pay Ledger Platform running locally in under 10 minutes.

## Prerequisites

- **Node.js** 18.x or later
- **PostgreSQL** 14+ or Docker
- **Redis** (optional, for session storage)
- **Git** for version control

## 🚀 1-Command Setup

For the fastest setup, use our automated script:

```bash
# Clone and setup everything automatically
git clone https://github.com/advancia-platform/modular-saas-platform.git
cd modular-saas-platform
npm run setup:quick
```

This will:

- Install all dependencies (backend + frontend)
- Setup the database with sample data
- Start both servers
- Open the application in your browser

## Manual Setup (Step by Step)

If you prefer manual control:

### 1. Clone Repository

```bash
git clone https://github.com/advancia-platform/modular-saas-platform.git
cd modular-saas-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/advancia"
JWT_SECRET="your-super-secret-jwt-key-here"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
```

Initialize database:

```bash
npx prisma migrate dev
npx prisma generate
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 4. Start Services

**Backend** (Terminal 1):

```bash
cd backend
npm run dev
# Starts on http://localhost:4000
```

**Frontend** (Terminal 2):

```bash
cd frontend
npm run dev
# Starts on http://localhost:3000
```

## 🎯 Verification

1. **Backend Health Check**:

   ```bash
   curl http://localhost:4000/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Frontend Access**:
   - Open <http://localhost:3000>
   - You should see the Advancia Pay login page

3. **Database Connection**:

   ```bash
   cd backend
   npx prisma studio
   # Opens database browser at http://localhost:5555
   ```

## 🔐 Default Admin Account

For testing, use these credentials:

- **Email**: <admin@advancia.com>
- **Password**: Will be generated and shown in backend console

## Next Steps

Now that you're running:

1. **[Environment Setup](environment-setup.md)** - Configure production settings
2. **[API Reference](../api/authentication.md)** - Explore the API
3. **[Development Guide](../development/contributing.md)** - Start developing

## Common Issues

### Database Connection Failed

```bash
# Make sure PostgreSQL is running
docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

### Port Already in Use

```bash
# Kill processes using ports 3000 or 4000
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

### Email Not Sending

- Use Gmail App Passwords (not your regular password)
- Enable 2FA on Gmail first
- Check firewall settings for SMTP port 587

## Docker Alternative

Prefer containers? Use our Docker setup:

```bash
# Start everything with Docker
docker-compose up -d

# Access the application
open http://localhost:3000
```

## 🆘 Need Help?

- [Troubleshooting Guide](../ai-agent/troubleshooting.md)
- [Development Debugging](../development/debugging.md)
- [Contact Support](mailto:support@advancia.com)

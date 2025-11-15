# 🚀 Local Development Setup - Quick Start

## Problem

The backend is failing to start because it can't connect to PostgreSQL database. The error occurs during startup migrations.

## Solution Options

### Option 1: Docker PostgreSQL (Recommended)

```bash
# Install Docker if not already installed
# Then run PostgreSQL in Docker
docker run --name advancia-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=advvancia -p 5432:5432 -d postgres:15

# Wait for database to start
sleep 10

# Test connection
docker exec -it advancia-postgres psql -U postgres -d advvancia -c "SELECT version();"
```

### Option 2: Local PostgreSQL Installation

```bash
# Install PostgreSQL locally (Windows)
# Download from: https://www.postgresql.org/download/windows/

# Create database
createdb -U postgres advvancia

# Or using psql
psql -U postgres -c "CREATE DATABASE advvancia;"
```

### Option 3: Use Existing Docker Compose

If you have `docker-compose.yml` in the root:

```bash
# Start all services
docker-compose up -d

# Check if database is running
docker-compose ps
```

## Quick Test

Once database is running:

```bash
# Go to backend directory
cd backend

# Test database connection
node -e "require('./src/db.js').query('SELECT 1').then(() => console.log('✅ DB connected')).catch(console.error)"

# Start the backend
npm run dev
```

## Environment Variables

Make sure your `.env` file has:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/advvancia
PORT=4000
NODE_ENV=development
JWT_SECRET=dev_secret_key_change_in_prod
```

## Next Steps After Database Setup

1. **Test Backend Locally:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Test PM2 Locally:**

   ```bash
   pm2 start ecosystem.config.js
   pm2 logs
   ```

3. **Deploy to Staging:**
   ```bash
   # On staging server with database
   ./quick-deploy.sh staging
   ```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
netstat -an | find "5432"

# Test connection manually
psql -h localhost -U postgres -d advvancia
```

### Migration Issues

```bash
# Reset database
dropdb advvancia
createdb advvancia

# Or with Docker
docker exec -it advancia-postgres dropdb -U postgres advvancia
docker exec -it advancia-postgres createdb -U postgres advvancia
```

### PM2 Issues

````bash
# Kill all PM2 processes
pm2 kill

# Clear PM2 logs
pm2 flush

# Start fresh
pm2 start ecosystem.config.js
```</content>
<parameter name="filePath">c:\Users\mucha.DESKTOP-H7T9NPM\-modular-saas-platform\-modular-saas-platform\LOCAL_DEV_SETUP.md
````

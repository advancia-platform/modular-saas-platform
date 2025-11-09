# Prisma Database Setup Guide

## ✅ Completed Steps

1. **Prisma Schema Created**: `backend/prisma/schema.prisma`
   - User model (authentication)
   - Transaction model (financial records)
   - DebitCard model (card management)
   - Session model (user sessions)
   - AuditLog model (compliance tracking)

2. **Prisma Client Generated**: TypeScript types and client created successfully

## 🔧 Database Setup Options

### Option 1: Local PostgreSQL (Recommended for Production)

**Install PostgreSQL:**
```powershell
# Using Chocolatey
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

**Configure Database:**
```powershell
# Start PostgreSQL service
Start-Service postgresql-x64-14

# Create database (using psql)
psql -U postgres
CREATE DATABASE advancia_ledger;
CREATE USER dev_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE advancia_ledger TO dev_user;
\q
```

**Update `.env` file:**
```env
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/advancia_ledger?schema=public"
```

**Run Migration:**
```powershell
cd backend
npx prisma migrate dev --name init
```

### Option 2: Docker PostgreSQL (Quick Setup)

**Start PostgreSQL Container:**
```powershell
docker run --name advancia-postgres `
  -e POSTGRES_USER=dev_user `
  -e POSTGRES_PASSWORD=dev_password `
  -e POSTGRES_DB=advancia_ledger `
  -p 5432:5432 `
  -d postgres:14-alpine
```

**Update `.env` file:**
```env
DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/advancia_ledger?schema=public"
```

**Run Migration:**
```powershell
cd backend
npx prisma migrate dev --name init
```

### Option 3: SQLite (Quick Development Only)

**Update `schema.prisma`:**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**Remove DATABASE_URL from `.env` or set:**
```env
DATABASE_URL="file:./dev.db"
```

**Run Migration:**
```powershell
cd backend
npx prisma migrate dev --name init
```

**Note**: SQLite doesn't support all PostgreSQL features. For production, use PostgreSQL.

## 🎯 Next Steps After Database Setup

1. **Verify Migration:**
   ```powershell
   npx prisma studio
   ```
   This opens a GUI to view your database tables.

2. **Update Transaction Routes** (`backend/src/routes/transaction.ts`):
   Replace in-memory array with Prisma client:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   
   // Example: Create transaction
   const transaction = await prisma.transaction.create({
     data: {
       userId: req.body.userId,
       amount: req.body.amount,
       type: req.body.type,
       status: 'pending',
       description: req.body.description
     }
   });
   ```

3. **Test API with Database:**
   ```powershell
   npm run dev
   ```
   All transactions will now persist to the database!

## 📊 Prisma Commands

```powershell
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

## 🔍 Current Status

- ✅ Prisma schema created with 5 models
- ✅ Prisma client generated successfully
- ⏸️ Database migration pending (requires PostgreSQL setup)
- ⏸️ Transaction routes still using in-memory storage

## 🚨 Common Issues

**Error: "Authentication failed against database server"**
- PostgreSQL is not running or credentials are wrong
- Check if PostgreSQL service is active: `Get-Service postgresql*`
- Verify DATABASE_URL in `.env` matches your database credentials

**Error: "Can't reach database server"**
- PostgreSQL is not installed or not running
- For Docker: check container status with `docker ps`
- Verify port 5432 is not blocked by firewall

**Error: "Database does not exist"**
- Create the database first using `psql` or pgAdmin
- Or use `npx prisma db push` to create database automatically

## 📖 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Download](https://www.postgresql.org/download/windows/)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)

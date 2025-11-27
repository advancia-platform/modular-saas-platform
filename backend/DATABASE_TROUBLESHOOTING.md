# Database Connection Troubleshooting Guide

## Production Database Details

- **Host**: `dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com`
- **Database**: `db_adnan_postrl`
- **User**: `database_advancia`
- **Region**: Oregon (US West)

## Common Database Connection Issues

### Issue 1: "Connection refused" or "ECONNREFUSED"

**Cause**: Using Internal URL instead of External URL

**Solution**:

- ✅ Use External URL: `dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com`
- ❌ NOT Internal URL: `dpg-d4f112trnu6s73doipjg-a`

### Issue 2: "SSL connection required"

**Cause**: PostgreSQL requires SSL in production

**Solution**: Add `?sslmode=require` to connection string

```bash
DATABASE_URL="postgresql://...?sslmode=require"
```

### Issue 3: "Too many connections"

**Cause**: Not using connection pooling

**Solution**: Add connection limit to URL

```bash
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=10"
```

### Issue 4: "Password authentication failed"

**Cause**: Incorrect credentials or special characters not encoded

**Solution**:

- Verify password: `W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP`
- URL-encode special characters if any

### Issue 5: "Database does not exist"

**Cause**: Database name typo

**Solution**: Verify database name: `db_adnan_postrl`

### Issue 6: "Host not found"

**Cause**: DNS resolution issue

**Solution**:

- Verify host: `dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com`
- Check network connectivity
- Try from different location

### Issue 7: "The 'string' argument must be of type string"

**Cause**: Prisma 7 requires pg adapter with Pool

**Solution**: Use correct Prisma setup:

```typescript
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```

## Testing Connection Locally

### From Command Line

```bash
# Using psql
PGPASSWORD=W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP psql -h dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com -U database_advancia db_adnan_postrl

# Using connection string
psql "postgresql://database_advancia:W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl"
```

### From Node.js

```bash
# Test via npm script
npm run db:test

# Or directly
npx ts-node src/utils/testDatabaseConnection.ts
```

### From API

```bash
# Local
curl http://localhost:4000/api/system/db-health

# Production
curl https://your-backend.onrender.com/api/system/db-health
```

## Production Checklist

- [x] Use External Database URL (not internal)
- [x] Add SSL mode to connection string (`?sslmode=require`)
- [x] Configure connection pooling (`connection_limit=5`)
- [x] Set connection timeout (`pool_timeout=10`)
- [ ] Enable Prisma query logging in development only
- [x] Configure graceful shutdown handlers
- [ ] Add database health check endpoint
- [ ] Monitor connection pool metrics
- [x] Set up database backups (Render auto-backups enabled)
- [ ] Configure connection retry logic

## Correct Connection String Format

```bash
# Full production connection string with all parameters
DATABASE_URL="postgresql://database_advancia:W9vl0keXJcw6zTFH0VQDGG9evLwMPyNP@dpg-d4f112trnu6s73doipjg-a.oregon-postgres.render.com/db_adnan_postrl?connection_limit=5&pool_timeout=10&sslmode=require"
```

## Migration Commands

### Run Migrations

```bash
# Production
npm run db:migrate:prod

# Development
npx prisma migrate dev
```

### Prisma Studio

```bash
# Production database
npm run db:studio:prod

# Local database
npx prisma studio
```

### Generate Prisma Client

```bash
npx prisma generate
```

## Monitoring and Debugging

### Enable Query Logging

In `.env` (development only):

```bash
# Add to see all queries
DEBUG=prisma:query
```

### Check Database Health

```bash
# Via npm script
npm run db:health

# Via curl
curl http://localhost:4000/api/system/db-health
```

### View Connection Pool Stats

Monitor these metrics in your application logs:

- Active connections
- Idle connections
- Connection wait time
- Query execution time

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Rotate passwords regularly** - Update in Render dashboard
3. **Use SSL/TLS** - Always include `?sslmode=require`
4. **Limit connections** - Set appropriate `connection_limit`
5. **Monitor access logs** - Check Render dashboard regularly
6. **Use read replicas** - For high-traffic read operations (Render Pro)

## Support Resources

- Render Dashboard: https://dashboard.render.com
- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs

## Emergency Contacts

If database is completely unreachable:

1. Check Render status page: https://status.render.com
2. Verify your network can reach oregon-postgres.render.com
3. Check Render dashboard for maintenance notifications
4. Contact Render support if issue persists

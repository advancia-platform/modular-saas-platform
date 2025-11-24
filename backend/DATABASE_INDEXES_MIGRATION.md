# Database Migration Script for Production Indexes

## Run this after deploying to add performance indexes

```bash
cd backend
npx prisma migrate dev --name add_performance_indexes
```

## Verify indexes were created

```sql
-- Connect to your database and run:
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('users', 'transactions', 'crypto_withdrawals')
ORDER BY tablename, indexname;
```

## Expected New Indexes

### users table

-   `users_email_idx` - For login queries
-   `users_role_idx` - For role-based queries
-   `users_active_idx` - For filtering active users
-   `users_emailVerified_idx` - For email verification checks

### transactions table

-   `transactions_userId_createdAt_idx` - For user transaction history (sorted by date)
-   `transactions_status_type_idx` - For dashboard analytics

### crypto_withdrawals table

-   `crypto_withdrawals_userId_status_idx` - For user withdrawal dashboard
-   `crypto_withdrawals_status_requestedAt_idx` - For admin withdrawal queue

## Performance Impact

These indexes will significantly improve:

-   User authentication queries (email lookup)
-   Transaction history pagination
-   Admin dashboard queries
-   Withdrawal request processing

Estimated query performance improvement: **50-80% faster** on large datasets.

## Backup Before Migration

Always backup before schema changes:

```bash
npm run db:backup
```

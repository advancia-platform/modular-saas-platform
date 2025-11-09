-- Mark the failed migration as rolled back so Prisma can retry
-- Run this SQL directly on the Render PostgreSQL database

UPDATE _prisma_migrations 
SET rolled_back_at = NOW(), 
    finished_at = NULL 
WHERE migration_name = ''20251022094130_add_crypto_balances_to_users'';

-- Then run: npx prisma migrate resolve --rolled-back 20251022094130_add_crypto_balances_to_users

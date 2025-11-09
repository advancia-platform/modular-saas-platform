#!/bin/bash
# Fix Prisma migration error P3009 by marking the failed migration as rolled back

echo "🔧 Fixing Prisma Migration Error P3009..."
echo ""
echo "Database: advancia_prod"
echo "Failed Migration: 20251022094130_add_crypto_balances_to_users"
echo ""

# Connect to database and mark migration as failed (will be retried)
PGPASSWORD="${DATABASE_URL#*:}" psql -h "dpg-d3p5n1p5pdvs73ad8o1g-a.virginia-postgres.render.com" -U "advancia_prod_user" -d "advancia_prod" -c "
-- Remove the failed migration from _prisma_migrations table
DELETE FROM \"_prisma_migrations\" 
WHERE migration = '20251022094130_add_crypto_balances_to_users' 
AND finished_at IS NULL;

-- Verify deletion
SELECT migration, started_at, finished_at, logs FROM \"_prisma_migrations\" 
WHERE migration LIKE '%crypto_balances%' 
ORDER BY started_at DESC;
"

echo ""
echo "✅ Migration state reset. Next deployment will retry the migration."

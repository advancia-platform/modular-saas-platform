#!/usr/bin/env bash
set -euo pipefail

# Fix P3009 migration error by clearing failed migrations
# Usage: ./scripts/fix-p3009-migration.sh [database-url]

DATABASE_URL="${1:-${DATABASE_URL:-}}"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not provided"
  exit 1
fi

echo "🔧 Fixing P3009 migration error..."
echo ""
echo "⚠️  WARNING: This will delete failed migration records"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read -r

# Delete failed migrations
psql "$DATABASE_URL" <<SQL
DELETE FROM "_prisma_migrations" 
WHERE finished_at IS NULL;

SELECT 
  migration_name,
  started_at,
  finished_at,
  logs
FROM "_prisma_migrations"
ORDER BY started_at DESC
LIMIT 5;
SQL

echo ""
echo "✅ Failed migrations cleared"
echo "📋 Next step: Run 'npx prisma migrate deploy' in backend/"

#!/usr/bin/env bash
set -euo pipefail

# Backup Render Postgres database
# Usage: ./scripts/backup-render-db.sh [database-url]

DATABASE_URL="${1:-${DATABASE_URL:-}}"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not provided"
  echo "Usage: $0 postgresql://user:pass@host:5432/dbname"
  echo "   OR: DATABASE_URL=... $0"
  exit 1
fi

mkdir -p db_backups
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="db_backups/render_backup_${TIMESTAMP}.sql"

echo "📦 Backing up database to: $BACKUP_FILE"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"
echo "✅ Backup complete: ${BACKUP_FILE}.gz"
echo "📊 Size: $(du -h "${BACKUP_FILE}.gz" | cut -f1)"

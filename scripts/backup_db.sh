#!/bin/bash
# ==================================
# Database Backup Script
# ==================================
# Performs pg_dump from the database container to ./db_backups with timestamped filename.

set -e  # Exit on error

# Configuration
DB_SERVICE="${DB_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-saasdb}"
BACKUP_DIR="./db_backups"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Source .env if present
if [ -f .env ]; then
    log_info "Loading environment variables from .env"
    set -a
    source .env
    set +a
fi

# Detect docker compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    log_error "Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_${POSTGRES_DB}_${TIMESTAMP}.sql"

# Check if database container is running
if ! $DOCKER_COMPOSE ps | grep -q "$DB_SERVICE.*Up"; then
    log_error "Database container '$DB_SERVICE' is not running."
    log_error "Please start the database with: $DOCKER_COMPOSE up -d $DB_SERVICE"
    exit 1
fi

# Perform backup
log_info "Backing up database '$POSTGRES_DB'..."
log_info "Backup file: $BACKUP_FILE"

$DOCKER_COMPOSE exec -T "$DB_SERVICE" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "Backup completed successfully!"
    log_info "File: $BACKUP_FILE (Size: $BACKUP_SIZE)"
else
    log_error "Backup failed!"
    exit 1
fi

# Optional: Keep only the last 10 backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
    log_info "Cleaning up old backups (keeping last 10)..."
    ls -1t "$BACKUP_DIR"/backup_*.sql | tail -n +11 | xargs rm -f
fi

log_info "Done!"

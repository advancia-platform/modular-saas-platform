#!/bin/sh
# restore_db.sh - Restore PostgreSQL database from a SQL dump file
# Usage: ./scripts/restore_db.sh path/to/backup.sql

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    printf "${GREEN}[INFO]${NC} %s\n" "$1"
}

log_warn() {
    printf "${YELLOW}[WARN]${NC} %s\n" "$1"
}

log_error() {
    printf "${RED}[ERROR]${NC} %s\n" "$1"
}

# Check if backup file is provided
if [ -z "$1" ]; then
    log_error "Usage: $0 <path/to/backup.sql>"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

log_info "Backup file found: $BACKUP_FILE"

# Check if docker compose is available
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

# Determine docker compose command (v1 or v2)
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    log_error "Docker Compose is not installed"
    exit 1
fi

log_info "Using docker compose command: $DOCKER_COMPOSE"

# Find the database service name from docker-compose.yml
DB_SERVICE="postgres"
DB_CONTAINER=$(${DOCKER_COMPOSE} ps -q ${DB_SERVICE} 2>/dev/null || echo "")

if [ -z "$DB_CONTAINER" ]; then
    log_error "Database container '${DB_SERVICE}' is not running. Please start it first with: ${DOCKER_COMPOSE} up -d ${DB_SERVICE}"
    exit 1
fi

log_info "Found database container: $DB_CONTAINER"

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    log_info "Loading environment variables from .env file"
    # Export only POSTGRES_* variables
    export $(grep -E '^POSTGRES_(USER|DB|PASSWORD)=' .env | xargs) 2>/dev/null || true
fi

# Set default values if not set
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-saasdb}"

log_info "Database user: $POSTGRES_USER"
log_info "Database name: $POSTGRES_DB"

# Ask for confirmation
printf "\n${YELLOW}WARNING:${NC} This will overwrite all data in the database '${POSTGRES_DB}'!\n"
printf "Do you want to continue? (yes/no): "
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_warn "Restoration cancelled by user"
    exit 0
fi

# Check if app service is running and stop it
APP_SERVICE="app"
APP_CONTAINER=$(${DOCKER_COMPOSE} ps -q ${APP_SERVICE} 2>/dev/null || echo "")

if [ -n "$APP_CONTAINER" ]; then
    log_info "Stopping app service..."
    ${DOCKER_COMPOSE} stop ${APP_SERVICE}
    APP_WAS_RUNNING=true
else
    APP_WAS_RUNNING=false
fi

# Restore the database
log_info "Restoring database from $BACKUP_FILE..."

# Copy the backup file into the container
docker cp "$BACKUP_FILE" "$DB_CONTAINER:/tmp/restore.sql"

# Drop and recreate the database, then restore
docker exec -i "$DB_CONTAINER" sh -c "
    psql -U ${POSTGRES_USER} -c 'DROP DATABASE IF EXISTS ${POSTGRES_DB};' &&
    psql -U ${POSTGRES_USER} -c 'CREATE DATABASE ${POSTGRES_DB};' &&
    psql -U ${POSTGRES_USER} -d ${POSTGRES_DB} -f /tmp/restore.sql &&
    rm /tmp/restore.sql
" 2>&1 | grep -v "NOTICE:" || {
    log_error "Failed to restore database"
    exit 1
}

log_info "Database restored successfully!"

# Optionally restart the app service
if [ "$APP_WAS_RUNNING" = true ]; then
    printf "\nDo you want to restart the app service? (yes/no): "
    read -r RESTART_APP
    
    if [ "$RESTART_APP" = "yes" ]; then
        log_info "Starting app service..."
        ${DOCKER_COMPOSE} start ${APP_SERVICE}
        log_info "App service started"
    fi
fi

log_info "Database restoration completed!"

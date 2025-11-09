#!/usr/bin/env bash
# deploy.sh - Robust deploy for Docker Compose + Prisma
# Usage: ./scripts/deploy.sh [deploy|dev]
#  - deploy (default): apply existing migrations (non-interactive) and generate client
#  - dev: run prisma migrate dev --name init (interactive)
set -euo pipefail

MODE="${1:-deploy}"
DB_SERVICE="${DB_SERVICE:-db}"
REDIS_SERVICE="${REDIS_SERVICE:-redis}"
APP_SERVICE="${APP_SERVICE:-app}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-saas_platform}"
WAIT_TIMEOUT="${WAIT_TIMEOUT:-180}"
RETRY_ATTEMPTS=5
RETRY_SLEEP=5

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

if command -v docker > /dev/null 2>&1 && docker compose version > /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "ERROR: docker compose not found."
  exit 1
fi

echo "Deploy mode: $MODE"
echo "Using compose: $COMPOSE_CMD"

echo "Starting database and redis..."
$COMPOSE_CMD up -d "$DB_SERVICE" "$REDIS_SERVICE"

echo "Waiting for Postgres readiness..."
SECONDS=0
while true; do
  if $COMPOSE_CMD exec -T "$DB_SERVICE" pg_isready -U "${POSTGRES_USER}" >/dev/null 2>&1; then
    echo "Postgres ready."
    break
  fi
  if [ "$SECONDS" -ge "$WAIT_TIMEOUT" ]; then
    echo "ERROR: Postgres timeout."
    exit 1
  fi
  sleep 1
done

echo "Building app..."
$COMPOSE_CMD build "$APP_SERVICE" || echo "Warning: build failed"

if [ -x "./scripts/backup_db.sh" ]; then
  echo "Running backup..."
  ./scripts/backup_db.sh || echo "Warning: backup failed"
fi

run_prisma() {
  local cmd="$1"
  local attempt=1
  while [ $attempt -le $RETRY_ATTEMPTS ]; do
    echo "Prisma attempt $attempt/$RETRY_ATTEMPTS"
    if $COMPOSE_CMD run --rm "$APP_SERVICE" sh -c "$cmd"; then
      return 0
    fi
    sleep "$RETRY_SLEEP"
    attempt=$((attempt + 1))
  done
  return 1
}

if [ "$MODE" = "dev" ]; then
  run_prisma "npx prisma migrate dev --name init" || exit 1
else
  run_prisma "npx prisma migrate deploy" || exit 1
fi

echo "Generating Prisma client..."
$COMPOSE_CMD run --rm "$APP_SERVICE" npx prisma generate || exit 1

echo "Starting app..."
$COMPOSE_CMD up -d "$APP_SERVICE"

HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"
echo "Health check: $HEALTH_URL"
for i in $(seq 1 10); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Deploy complete."
    exit 0
  fi
  sleep 3
done

echo "ERROR: Health check failed."
exit 1

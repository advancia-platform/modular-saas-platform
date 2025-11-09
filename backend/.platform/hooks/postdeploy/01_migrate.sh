#!/bin/bash
# Run Prisma migrations after deploy
set -euo pipefail
if command -v node >/dev/null 2>&1; then
  echo "Running Prisma migrate deploy..."
  npx prisma generate || true
  npx prisma migrate deploy || exit 0
else
  echo "Node not found; skipping migrations"
fi

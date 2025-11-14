#!/usr/bin/env bash
set -euo pipefail

echo "SSH_OK"

# Docker versions and status
docker version --format 'Server: {{.Server.Version}}' || true
if docker compose version >/dev/null 2>&1; then
  docker compose version || true
else
  docker-compose --version || true
fi
systemctl is-active docker || true

# Running containers and images
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' || true
docker images --format '{{.Repository}}:{{.Tag}} {{.Size}}' | sort || true

# Repo and docker-compose file
if [ -d /app/modular-saas-platform ]; then
  echo "REPO_EXISTS"
  ls -la /app/modular-saas-platform | sed -n '1,200p' || true
  if [ -f /app/modular-saas-platform/docker-compose.prod.yml ]; then
    echo "FOUND docker-compose.prod.yml"
    sed -n '1,200p' /app/modular-saas-platform/docker-compose.prod.yml || true
  fi
fi

# If compose file exists, show ps and recent logs
if [ -f /app/modular-saas-platform/docker-compose.prod.yml ]; then
  docker compose -f /app/modular-saas-platform/docker-compose.prod.yml ps || true
  echo '--- TAIL backend logs (200 lines) ---'
  docker compose -f /app/modular-saas-platform/docker-compose.prod.yml logs backend --tail 200 || true
  echo '--- TAIL frontend logs (200 lines) ---'
  docker compose -f /app/modular-saas-platform/docker-compose.prod.yml logs frontend --tail 200 || true
fi

#!/usr/bin/env bash
set -euo pipefail

# droplet-deploy.sh
# One-shot helper to clone the repo, install Node, install deps,
# run prisma migrations and start the backend with pm2.
#
# Usage (on the droplet):
#   sudo bash droplet-deploy.sh
#
# Preconditions:
# - An SSH deploy key for GitHub has been added to this machine and to the
#   target GitHub repo (or your GitHub account).
# - Run as root or a user with sudo privileges.

REPO_SSH_URL="git@github.com:pdtribe181-prog/-modular-saas-platform.git"
TARGET_PARENT_DIR="/var/www"
REPO_DIR_NAME="-modular-saas-platform"
BACKEND_DIR="$TARGET_PARENT_DIR/$REPO_DIR_NAME/backend"
NODE_VERSION="20"

echo "==> Deploy helper started"
echo "Repo: $REPO_SSH_URL"
echo "Target dir: $BACKEND_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "Installing git..."
  apt-get update -y
  apt-get install -y git ca-certificates curl build-essential
fi

mkdir -p "$TARGET_PARENT_DIR"
chown "$SUDO_USER:${SUDO_USER:-$(whoami)}" "$TARGET_PARENT_DIR" || true
cd "$TARGET_PARENT_DIR"

if [ -d "$TARGET_PARENT_DIR/$REPO_DIR_NAME" ]; then
  echo "Repository already exists in $TARGET_PARENT_DIR/$REPO_DIR_NAME — fetching latest"
  cd "$TARGET_PARENT_DIR/$REPO_DIR_NAME"
  git pull --rebase
else
  echo "Cloning repository..."
  git clone "$REPO_SSH_URL"
fi

cd "$BACKEND_DIR"

echo "==> Installing nvm and Node.js $NODE_VERSION (if needed)"
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
fi
# shellcheck source=/dev/null
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi
nvm install "$NODE_VERSION" || true
nvm use "$NODE_VERSION" || true

echo "==> Installing repository dependencies"
npm install --no-audit --no-fund

echo "==> Generating Prisma client"
npx prisma generate

echo "==> IMPORTANT: Ensure you have a valid .env in $BACKEND_DIR with DATABASE_URL and other secrets."
if [ ! -f .env ]; then
  if [ -f .env.test ]; then
    echo "No .env found — copying .env.test -> .env (edit values as needed)"
    cp .env.test .env
  else
    echo "No .env or .env.test present — create .env before running migrations"
  fi
fi

echo "==> Running Prisma migrations (deploy)"
if [ -n "${DATABASE_URL:-}" ] || grep -q 'DATABASE_URL' .env 2>/dev/null; then
  npx prisma migrate deploy || echo "Prisma migrate deploy returned non-zero exit code"
else
  echo "DATABASE_URL not set in environment nor .env — skipping migrations"
fi

echo "==> Starting backend with pm2"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# Start or reload the app using pm2
if pm2 list | grep -q advancia-backend; then
  echo "Reloading advancia-backend with pm2"
  pm2 restart advancia-backend || pm2 reload advancia-backend || true
else
  echo "Starting advancia-backend with pm2"
  pm2 start npm --name advancia-backend -- start
fi

pm2 save

echo "==> Deploy helper finished — check pm2 status and logs"
echo "  pm2 status advancia-backend"
echo "  pm2 logs advancia-backend --lines 200"

exit 0

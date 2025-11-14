#!/usr/bin/env bash
set -euo pipefail

# run-deploy.sh
# Wrapper to pull latest code (as current user) and run deploy script as root.
# Run this on the droplet as the same user that owns the repo directory.

LOGFILE="/tmp/deploy-wrapper.log"
echo "=== Deploy wrapper started at $(date)" | tee "$LOGFILE"

REPO_DIR="/var/www/-modular-saas-platform"
if [ ! -d "$REPO_DIR" ]; then
  echo "Repository not found at $REPO_DIR" | tee -a "$LOGFILE"
  exit 1
fi

cd "$REPO_DIR"

echo "==> Showing git remote and branch" | tee -a "$LOGFILE"
git remote -v | tee -a "$LOGFILE"
git rev-parse --abbrev-ref HEAD | tee -a "$LOGFILE" || true

echo "==> Ensure ssh-agent has deploy key (best-effort)" | tee -a "$LOGFILE"
eval "$(ssh-agent -s)" | tee -a "$LOGFILE"
ssh-add ~/.ssh/deploy_key 2>/dev/null || ssh-add /root/.ssh/deploy_key 2>/dev/null || true
ssh-add -l | tee -a "$LOGFILE" || true

echo "==> Pulling latest from origin/main" | tee -a "$LOGFILE"
git pull origin main 2>&1 | tee -a "$LOGFILE" || echo "git pull failed, continuing" | tee -a "$LOGFILE"

cd backend

echo "==> Running deploy script as root (this may take several minutes)" | tee -a "$LOGFILE"
sudo ENABLE_SYSTEMD=true ENABLE_NGINX=true ENABLE_CERTBOT=false \
     SERVICE_USER=www-data SERVER_NAME=157.245.8.131 \
     bash scripts/deploy/droplet-deploy.sh 2>&1 | tee -a "$LOGFILE"

echo "=== Deploy wrapper finished at $(date)" | tee -a "$LOGFILE"
echo "Logs: $LOGFILE"

exit 0

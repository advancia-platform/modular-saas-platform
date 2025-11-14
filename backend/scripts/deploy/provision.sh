#!/usr/bin/env bash
set -euo pipefail

# provision.sh
# Installs OS packages commonly needed for deploying the Advancia backend on Ubuntu/Debian droplets.
# Usage: sudo bash provision.sh

echo "==> Updating apt and installing base packages"
apt-get update -y
apt-get install -y --no-install-recommends \
  git curl ca-certificates build-essential nginx ufw \
  software-properties-common apt-transport-https lsb-release \
  python3-certbot-nginx certbot

echo "==> Setting up basic firewall rules (allow SSH and Nginx)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Creating /var/www and setting permissions"
mkdir -p /var/www
chown $(whoami):$(whoami) /var/www

echo "==> Installing nvm (if not present) and Node LTS via nvm for current user"
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
fi
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
  nvm install 20 || true
  nvm use 20 || true
fi

echo "==> Provision complete. You can now clone the repo into /var/www and run deploy script."
echo "Example: git clone git@github.com:ptribe181-prog/-modular-saas-platform.git /var/www/-modular-saas-platform"

exit 0

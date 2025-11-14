#!/bin/bash

# 🚀 Advancia Launch-Today Script
# Run this on your DigitalOcean Droplet (Ubuntu 22.04)
# Execute: curl -fsSL https://raw.githubusercontent.com/muchaeljohn739337-cloud/-modular-saas-platform/main/scripts/launch-today.sh | bash

set -e

echo "🚀 Starting Advancia Launch-Today Setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
echo "📋 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Certbot for SSL
echo "🔒 Installing Certbot..."
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Configure UFW Firewall
echo "🔥 Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Clone Repository
echo "📥 Cloning Advancia Repository..."
git clone https://github.com/muchaeljohn739337-cloud/-modular-saas-platform.git
cd -modular-saas-platform

# Setup Environment Files
echo "⚙️ Setting up environment files..."
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# NOTE: Edit .env files with your actual secrets before proceeding

# Build and Start Services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Configure Nginx
echo "🌐 Configuring Nginx reverse proxy..."
sudo cp nginx/advancia.conf /etc/nginx/sites-available/advancia
sudo ln -s /etc/nginx/sites-available/advancia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Certbot
echo "🔒 Setting up SSL with Let's Encrypt..."
# NOTE: Replace yourdomain.com with your actual domain
# sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Install PM2 for process management
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# Setup Monitoring (Sentry, Datadog placeholders)
echo "📊 Setting up monitoring placeholders..."
# Add your Sentry DSN and Datadog API key to .env files

echo "✅ Launch setup complete!"
echo "Next steps:"
echo "1. Edit .env files with real secrets"
echo "2. Run SSL certbot command with your domain"
echo "3. Configure Cloudflare (point domain, enable SSL, WAF)"
echo "4. Push code to trigger GitHub Actions CI/CD"
echo "5. Verify services are running: docker-compose ps"
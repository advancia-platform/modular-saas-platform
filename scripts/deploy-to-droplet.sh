#!/bin/bash
set -e

# Droplet configuration
DROPLET_IP="157.245.8.131"
DROPLET_USER="root"
SSH_KEY="$HOME/.ssh/advancia_droplet"
PROJECT_DIR="/root/advancia-pay-ledger"

echo "🚀 Deploying Advancia Pay Ledger to DigitalOcean Droplet..."

# Step 1: Install Node.js and dependencies on droplet
echo "📦 Step 1: Setting up droplet environment..."
ssh -i $SSH_KEY $DROPLET_USER@$DROPLET_IP << 'ENDSSH'
# Update system
apt-get update
apt-get install -y curl git build-essential

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL client
apt-get install -y postgresql-client

echo "✅ Environment setup complete"
node --version
npm --version
pm2 --version
ENDSSH

# Step 2: Create project directory
echo "📁 Step 2: Creating project directory..."
ssh -i $SSH_KEY $DROPLET_USER@$DROPLET_IP "mkdir -p $PROJECT_DIR"

# Step 3: Sync project files
echo "📤 Step 3: Uploading project files..."
rsync -avz --delete \
  -e "ssh -i $SSH_KEY" \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude 'frontend' \
  backend/ $DROPLET_USER@$DROPLET_IP:$PROJECT_DIR/backend/

# Step 4: Copy .env file
echo "🔐 Step 4: Uploading environment configuration..."
scp -i $SSH_KEY backend/.env $DROPLET_USER@$DROPLET_IP:$PROJECT_DIR/backend/.env

# Step 5: Install dependencies and build
echo "🔨 Step 5: Building application on droplet..."
ssh -i $SSH_KEY $DROPLET_USER@$DROPLET_IP << ENDSSH
cd $PROJECT_DIR/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build TypeScript
npm run build

echo "✅ Build complete"
ENDSSH

# Step 6: Setup PM2 ecosystem
echo "⚙️  Step 6: Configuring PM2..."
cat > /tmp/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'advancia-backend',
      script: 'dist/index.js',
      cwd: '/root/advancia-pay-ledger/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/root/advancia-pay-ledger/logs/backend-error.log',
      out_file: '/root/advancia-pay-ledger/logs/backend-out.log',
      log_file: '/root/advancia-pay-ledger/logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      autorestart: true,
      watch: false
    }
  ]
};
EOF

scp -i $SSH_KEY /tmp/ecosystem.config.js $DROPLET_USER@$DROPLET_IP:$PROJECT_DIR/ecosystem.config.js

# Step 7: Start application
echo "🚀 Step 7: Starting application..."
ssh -i $SSH_KEY $DROPLET_USER@$DROPLET_IP << ENDSSH
cd $PROJECT_DIR

# Create logs directory
mkdir -p logs

# Stop existing process if any
pm2 stop ecosystem.config.js || true
pm2 delete ecosystem.config.js || true

# Start application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
pm2 save

echo "✅ Application started"
pm2 status
ENDSSH

# Step 8: Health check
echo "🏥 Step 8: Running health check..."
sleep 5

if ssh -i $SSH_KEY $DROPLET_USER@$DROPLET_IP "curl -f http://localhost:4000/api/health" > /dev/null 2>&1; then
    echo "✅ Backend is healthy on droplet"
else
    echo "⚠️  Backend health check failed, checking logs..."
    ssh -i $SSH_KEY $DROPLET_USER@$DROPLET_IP "pm2 logs advancia-backend --lines 30"
fi

# Step 9: Test external access
echo "🌐 Step 9: Testing external access..."
if curl -f https://api.advanciapayledger.com/api/health > /dev/null 2>&1; then
    echo "✅ API accessible externally via Cloudflare"
else
    echo "⚠️  External access check failed (Cloudflare proxy may need time to update)"
fi

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📊 Commands to manage your application:"
echo "  ssh -i ~/.ssh/advancia_droplet root@$DROPLET_IP"
echo "  pm2 status              - View process status"
echo "  pm2 logs advancia-backend - View logs"
echo "  pm2 restart advancia-backend - Restart application"
echo "  pm2 stop advancia-backend - Stop application"
echo ""
echo "🔗 URLs:"
echo "  Health Check: https://api.advanciapayledger.com/api/health"
echo "  API Base: https://api.advanciapayledger.com/api"
echo ""

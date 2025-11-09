#!/bin/bash
#
# Advancia Pay Ledger - WSL Setup Script
# Installs all dependencies and prepares the app for development
#

set -e  # Exit on error

echo "🚀 Advancia Pay Ledger - WSL Setup"
echo "═══════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install essential build tools
echo -e "${BLUE}🔧 Installing build essentials...${NC}"
sudo apt-get install -y \
    build-essential \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release

# Install Node.js 20.x (LTS)
echo -e "${BLUE}📦 Installing Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed: $(node -v)"
fi

# Install PostgreSQL 16
echo -e "${BLUE}🐘 Installing PostgreSQL 16...${NC}"
if ! command -v psql &> /dev/null; then
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt-get update
    sudo apt-get install -y postgresql-16 postgresql-contrib-16
    
    # Start PostgreSQL
    sudo service postgresql start
    
    # Create database and user
    echo -e "${YELLOW}⚙️  Configuring PostgreSQL...${NC}"
    sudo -u postgres psql -c "CREATE DATABASE advancia_dev;" || echo "Database already exists"
    sudo -u postgres psql -c "CREATE USER advancia_user WITH PASSWORD 'advancia_password';" || echo "User already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE advancia_dev TO advancia_user;"
    sudo -u postgres psql -c "ALTER DATABASE advancia_dev OWNER TO advancia_user;"
else
    echo "PostgreSQL already installed: $(psql --version)"
    sudo service postgresql start
fi

# Install Redis
echo -e "${BLUE}📮 Installing Redis...${NC}"
if ! command -v redis-cli &> /dev/null; then
    sudo apt-get install -y redis-server
    sudo service redis-server start
else
    echo "Redis already installed: $(redis-cli --version)"
    sudo service redis-server start
fi

# Install global npm packages
echo -e "${BLUE}📦 Installing global npm packages...${NC}"
sudo npm install -g \
    pm2 \
    prisma \
    typescript \
    ts-node \
    tsx

# Verify installations
echo ""
echo -e "${GREEN}✅ Installation Summary${NC}"
echo "═══════════════════════════════════════════"
echo "Node.js:     $(node -v)"
echo "npm:         $(npm -v)"
echo "PostgreSQL:  $(psql --version | grep -oP '\d+\.\d+')"
echo "Redis:       $(redis-cli --version | grep -oP '\d+\.\d+\.\d+')"
echo "Prisma:      $(npx prisma --version | grep -oP '\d+\.\d+\.\d+' | head -1)"
echo ""

# Clone/navigate to project
PROJECT_DIR="$HOME/advancia-pay-ledger"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}⚠️  Project directory exists: $PROJECT_DIR${NC}"
    echo "Skipping clone. Using existing directory."
else
    echo -e "${BLUE}📂 Creating project directory...${NC}"
    mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR" || exit

# Copy project files if running from Windows path
WINDOWS_PROJECT="/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform"
if [ -d "$WINDOWS_PROJECT" ]; then
    echo -e "${BLUE}📋 Copying project files from Windows...${NC}"
    rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.next' \
        "$WINDOWS_PROJECT/" "$PROJECT_DIR/" 2>/dev/null || cp -r "$WINDOWS_PROJECT/"* "$PROJECT_DIR/" 2>/dev/null || echo "Manual copy recommended"
fi

# Install backend dependencies
echo ""
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend" || cd backend || exit
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚙️  Creating backend .env file...${NC}"
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://advancia_user:advancia_password@localhost:5432/advancia_dev?schema=public"

# Server
PORT=4000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Stripe (use test keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: Web Push
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Optional: Ethereum
INFURA_PROJECT_ID=your-infura-project-id
ADMIN_WALLET_PRIVATE_KEY=your-wallet-private-key
EOF
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please update the .env file with your actual credentials${NC}"
fi

# Run Prisma migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
npx prisma generate
npx prisma migrate deploy || npx prisma db push

# Seed database (optional)
echo -e "${BLUE}🌱 Seeding database...${NC}"
npm run seed 2>/dev/null || echo "Seeding skipped (no seed script)"

# Install frontend dependencies
echo ""
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend" || cd ../frontend || exit
npm install

# Create frontend .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚙️  Creating frontend .env.local file...${NC}"
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
NEXT_PUBLIC_INFURA_PROJECT_ID=your-infura-project-id
EOF
    echo -e "${GREEN}✅ Created .env.local file${NC}"
fi

# Create PM2 ecosystem file
echo ""
echo -e "${BLUE}⚙️  Creating PM2 ecosystem file...${NC}"
cd "$PROJECT_DIR" || exit
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'advancia-backend',
      cwd: './backend',
      script: 'tsx',
      args: 'src/index.ts',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs', 'dist'],
      max_memory_restart: '500M',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'advancia-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      max_memory_restart: '500M',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Update environment files:"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Start the application:"
echo -e "   ${YELLOW}pm2 start ecosystem.config.js${NC}"
echo ""
echo "3. View logs:"
echo -e "   ${YELLOW}pm2 logs${NC}"
echo ""
echo "4. Stop the application:"
echo -e "   ${YELLOW}pm2 stop all${NC}"
echo ""
echo "5. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:4000"
echo "   - Admin:    http://localhost:3000/admin/login"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "   pm2 status        - Check app status"
echo "   pm2 restart all   - Restart all apps"
echo "   pm2 monit        - Monitor apps"
echo "   pm2 delete all   - Remove all apps from PM2"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

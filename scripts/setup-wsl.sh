#!/bin/bash

# ============================================================================
# WSL Environment Setup Script for Advancia SaaS Platform
# ============================================================================
# This script sets up the WSL environment with all necessary dependencies

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐧 Setting up WSL environment for Advancia SaaS Platform...${NC}"

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install essential build tools
echo -e "${YELLOW}🔧 Installing build essentials...${NC}"
sudo apt install -y build-essential curl wget git

# Install Node.js via NodeSource repository (latest LTS)
echo -e "${YELLOW}📦 Installing Node.js LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# Install global npm packages
echo -e "${YELLOW}📦 Installing global npm packages...${NC}"
sudo npm install -g typescript ts-node nodemon prisma eslint

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}🐳 Installing Docker...${NC}"

    # Add Docker's official GPG key
    sudo apt-get update
    sudo apt-get install ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # Add the repository to Apt sources
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add user to docker group
    sudo usermod -aG docker $USER

    echo -e "${GREEN}✅ Docker installed. Please restart WSL for group changes to take effect.${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Navigate to project directory
PROJECT_DIR="/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform"
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    echo -e "${GREEN}📁 Changed to project directory: $PROJECT_DIR${NC}"
else
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    exit 1
fi

# Install project dependencies
echo -e "${YELLOW}📦 Installing project dependencies...${NC}"

# Root level dependencies
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Root dependencies installed${NC}"
fi

# Backend dependencies
if [ -d "backend" ] && [ -f "backend/package.json" ]; then
    cd backend
    npm install
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"

    # Generate Prisma client
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
        echo -e "${GREEN}✅ Prisma client generated${NC}"
    fi

    cd ..
fi

# Frontend dependencies
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    cd frontend
    npm install
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
    cd ..
fi

# Set up environment file for development
echo -e "${YELLOW}⚙️ Setting up development environment...${NC}"
if [ -d "backend" ]; then
    cd backend
    if [ -f ".env.development" ] && [ ! -f ".env" ]; then
        cp .env.development .env
        echo -e "${GREEN}✅ Development environment configured${NC}"
    fi
    cd ..
fi

# Create WSL-specific scripts directory
WSL_SCRIPTS_DIR="scripts/wsl"
mkdir -p "$WSL_SCRIPTS_DIR"

# Create WSL development script
cat > "$WSL_SCRIPTS_DIR/dev.sh" << 'EOF'
#!/bin/bash
# Start development servers in WSL

PROJECT_DIR="/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform"
cd "$PROJECT_DIR"

echo "🚀 Starting Advancia SaaS Platform development servers..."

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend in background
echo "🌐 Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Development servers started:"
echo "   Backend: http://localhost:4000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt signal
trap 'kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit' INT
wait
EOF

chmod +x "$WSL_SCRIPTS_DIR/dev.sh"

# Create WSL build script
cat > "$WSL_SCRIPTS_DIR/build.sh" << 'EOF'
#!/bin/bash
# Build all components in WSL

PROJECT_DIR="/mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform"
cd "$PROJECT_DIR"

echo "🏗️ Building Advancia SaaS Platform..."

# Build backend
if [ -d "backend" ]; then
    echo "🔧 Building backend..."
    cd backend
    npm run build
    cd ..
fi

# Build frontend
if [ -d "frontend" ]; then
    echo "🌐 Building frontend..."
    cd frontend
    npm run build
    cd ..
fi

echo "✅ Build complete!"
EOF

chmod +x "$WSL_SCRIPTS_DIR/build.sh"

echo -e "${GREEN}🎉 WSL environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Restart WSL: wsl --shutdown && wsl"
echo "2. Start development: cd /mnt/c/Users/mucha.DESKTOP-H7T9NPM/-modular-saas-platform && ./scripts/wsl/dev.sh"
echo "3. Or use VS Code tasks: Ctrl+Shift+P → 'Tasks: Run Task' → '🚀 WSL: Start Backend Dev'"
echo ""
echo -e "${YELLOW}Available WSL scripts:${NC}"
echo "- ./scripts/wsl/dev.sh - Start all development servers"
echo "- ./scripts/wsl/build.sh - Build all components"
echo ""
echo -e "${GREEN}🔧 Environment configured for WSL development!${NC}"

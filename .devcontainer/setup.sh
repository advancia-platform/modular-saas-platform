#!/bin/bash
# Codespace/Devcontainer Setup Script for Advancia PayLedger
set -e

echo "🚀 Setting up Advancia PayLedger development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() { echo -e "${BLUE}[SETUP]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check environment
if [ "$CODESPACES" = "true" ]; then
    print_status "Running in GitHub Codespace"
    ENV_TYPE="codespace"
elif [ "$DEVCONTAINER" = "true" ] || [ -n "$REMOTE_CONTAINERS" ]; then
    print_status "Running in Dev Container"
    ENV_TYPE="devcontainer" 
else
    print_status "Running in local development environment"
    ENV_TYPE="local"
fi

# System dependencies
print_status "Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq curl wget git build-essential
fi

# Install Node.js dependencies
print_status "Installing npm dependencies..."

if [ -d "backend" ]; then
    print_status "Installing backend dependencies..."
    cd backend 
    npm ci --silent
    print_success "Backend dependencies installed"
    cd ..
fi

if [ -d "frontend" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend 
    npm ci --silent
    print_success "Frontend dependencies installed"
    cd ..
fi

# Setup environment files
print_status "Setting up environment configuration..."
if [ -f "package.json" ]; then
    print_status "Installing root dependencies..."
    npm install
fi

# Install Playwright browsers
print_status "Setting up Playwright browsers..."
npx playwright install --with-deps

# Set up Git configuration (if not already set)
if [ -z "$(git config --global user.name)" ]; then
    print_warning "Git user.name not set. Please configure with: git config --global user.name 'Your Name'"
fi

if [ -z "$(git config --global user.email)" ]; then
    print_warning "Git user.email not set. Please configure with: git config --global user.email 'your.email@example.com'"
fi

# Wait for database to be ready
print_status "Waiting for database to be ready..."
timeout=60
counter=0
until pg_isready -h db -p 5432 -U postgres; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        print_error "Database failed to start within $timeout seconds"
        exit 1
    fi
done

print_success "Database is ready!"

# Wait for Redis to be ready
print_status "Waiting for Redis to be ready..."
timeout=30
counter=0
until redis-cli -h redis -p 6379 -a devpassword ping > /dev/null 2>&1; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        print_error "Redis failed to start within $timeout seconds"
        exit 1
    fi
done

print_success "Redis is ready!"

# Set up environment variables
if [ ! -f backend/.env ]; then
    print_status "Creating backend .env file..."
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        print_success "Backend environment file created. Please update with your specific values."
    else
        print_warning "No backend/.env.example found"
    fi
fi

if [ ! -f frontend/.env.local ]; then
    print_status "Creating frontend .env.local file..."
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env.local
        print_success "Frontend environment file created. Please update with your specific values."
    else
        print_warning "No frontend/.env.example found"
    fi
fi

# Run database migrations (if Prisma schema exists)
if [ -f backend/prisma/schema.prisma ]; then
    print_status "Running database migrations..."
    cd backend
    npx prisma migrate deploy || print_warning "Database migrations failed - this might be expected for a new setup"
    
    print_status "Generating Prisma client..."
    npx prisma generate
    cd ..
fi

# Seed database (if seed script exists)
if [ -f backend/prisma/seed.ts ] || [ -f backend/prisma/seed.js ]; then
    print_status "Seeding database..."
    cd backend
    npm run db:seed || print_warning "Database seeding failed - this might be expected"
    cd ..
fi

# Build the application
print_status "Building backend..."
if [ -f backend/package.json ]; then
    cd backend && npm run build && cd .. || print_warning "Backend build failed - this might be expected for initial setup"
fi

print_status "Building frontend..."
if [ -f frontend/package.json ]; then
    cd frontend && npm run build && cd .. || print_warning "Frontend build failed - this might be expected for initial setup"
fi

# Run tests to verify setup
print_status "Running test suite to verify setup..."
if [ -f frontend/package.json ]; then
    cd frontend
    npm run test:simple || print_warning "Some tests failed - this might be expected during initial setup"
    cd ..
fi

# Create development shortcuts
print_status "Creating development shortcuts..."
mkdir -p ~/.local/bin

cat > ~/.local/bin/saas-dev << 'EOF'
#!/bin/bash
echo "🚀 Starting SaaS Platform development servers..."
cd /workspaces/modular-saas-platform/backend && npm run dev &
cd /workspaces/modular-saas-platform/frontend && npm run dev &
wait
EOF

cat > ~/.local/bin/saas-test << 'EOF'
#!/bin/bash
echo "🧪 Running comprehensive test suite..."
cd /workspaces/modular-saas-platform/frontend && npm run test:working
EOF

cat > ~/.local/bin/saas-e2e << 'EOF'
#!/bin/bash
echo "🎭 Running E2E tests..."
cd /workspaces/modular-saas-platform/frontend && npm run test:e2e
EOF

chmod +x ~/.local/bin/saas-*

# Add to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

print_success "Development environment setup complete!"

echo ""
echo "🎉 Welcome to the Modular SaaS Platform!"
echo ""
echo "Available commands:"
echo "  saas-dev    - Start development servers"
echo "  saas-test   - Run test suite"  
echo "  saas-e2e    - Run E2E tests"
echo ""
echo "Manual commands:"
echo "  npm run dev              - Start Next.js development server"
echo "  npm run dev:ui           - Start UI on port 3003"
echo "  npm run dev:api          - Start API server"
echo "  npm run test:working     - Run working tests"
echo "  npm run test:e2e         - Run Playwright E2E tests"
echo "  npm run test:cypress     - Run Cypress tests"
echo ""
echo "Database commands:"
echo "  npx prisma studio        - Open Prisma Studio"
echo "  npx prisma db push       - Push schema changes"
echo "  npx prisma migrate dev   - Create and apply migration"
echo ""
echo "🔗 Port forwarding:"
echo "  3000 - Next.js App"
echo "  3003 - Development UI"
echo "  3005 - API Server"
echo "  5432 - PostgreSQL"
echo "  6379 - Redis"
echo "  9090 - Prometheus"
echo ""

# Setup complete notification
if [ "$CODESPACES" = "true" ]; then
    print_status "Codespace ready! Services will start automatically."
    echo "Visit the forwarded ports to access:"
    echo "- Frontend: https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "- Backend API: https://${CODESPACE_NAME}-4000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
fi

print_success "🎯 Setup completed successfully!"
echo "Happy coding! 🚀"
    nohup npm run dev > /tmp/frontend-dev.log 2>&1 &
    
    print_success "Development servers started in background."
    print_status "Backend logs: /tmp/backend-dev.log"
    print_status "Frontend logs: /tmp/frontend-dev.log"
fi

print_success "Setup completed successfully! 🎊"
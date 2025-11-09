#!/bin/bash
# Local Codespace simulation script
# This script helps you test the Codespace configuration locally

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║              Codespace Local Testing                          ║  
║             Modular SaaS Platform                             ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${YELLOW}This script will simulate a Codespace environment locally.${NC}\n"

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is required but not installed."
    echo "   Please install Docker Desktop and try again."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is required but not installed."
    exit 1
fi

echo "✅ Prerequisites satisfied"

# Start services
echo -e "\n🚀 Starting Codespace services..."
cd .devcontainer

echo "📦 Building containers..."
docker-compose build --no-cache

echo "🔄 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo -e "\n🏥 Health check..."

# Check database
if docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is starting..."
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "⚠️  Redis is starting..."
fi

# Show services status
echo -e "\n📊 Services Status:"
docker-compose ps

# Show port mappings
echo -e "\n🔗 Port Mappings:"
echo "   Application:     http://localhost:3000"
echo "   Development UI:  http://localhost:3003"
echo "   API Server:      http://localhost:3005"
echo "   Prometheus:      http://localhost:9090"
echo "   PostgreSQL:      localhost:5432"
echo "   Redis:           localhost:6379"

echo -e "\n🎯 Next Steps:"
echo "1. Open a new terminal"
echo "2. Run: docker-compose -f .devcontainer/docker-compose.yml exec app bash"
echo "3. Inside the container, run: npm install && npm run dev"
echo "4. Open http://localhost:3000 in your browser"

echo -e "\n📝 Useful Commands:"
echo "   View logs:       docker-compose -f .devcontainer/docker-compose.yml logs -f"
echo "   Stop services:   docker-compose -f .devcontainer/docker-compose.yml down"
echo "   Restart:         docker-compose -f .devcontainer/docker-compose.yml restart"

echo -e "\n${GREEN}🎉 Local Codespace simulation is ready!${NC}"
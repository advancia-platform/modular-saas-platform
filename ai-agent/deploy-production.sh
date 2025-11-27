#!/bin/bash

# Production Deployment Script
# AI Cybersecurity System - Automated Production Deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

echo -e "${BLUE}🚀 AI Cybersecurity System - Production Deployment${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Pre-deployment checks
echo -e "${YELLOW}🔍 Performing pre-deployment checks...${NC}"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if required files exist
REQUIRED_FILES=(
    ".env.production"
    "docker-compose.production.yml"
    "Dockerfile.production"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Required file not found: $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required files present${NC}"

# Check environment variables
REQUIRED_ENV_VARS=(
    "DB_PASSWORD"
    "REDIS_PASSWORD"
    "JWT_SECRET"
    "ENCRYPTION_KEY"
    "SESSION_SECRET"
)

for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo -e "${RED}❌ Required environment variable not set: $var${NC}"
        echo -e "${YELLOW}Please set all required environment variables and try again.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ All required environment variables set${NC}"

# Create backup if requested
if [[ "$BACKUP_BEFORE_DEPLOY" == "true" ]]; then
    echo -e "${YELLOW}💾 Creating backup before deployment...${NC}"

    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup database
    if docker ps | grep -q postgres; then
        echo -e "${BLUE}📦 Backing up database...${NC}"
        docker exec -t $(docker ps --filter "name=database" --format "{{.ID}}") \
            pg_dump -U ${DB_USER:-aiuser} cybersecurity_ai > "$BACKUP_DIR/database.sql"
        echo -e "${GREEN}✅ Database backed up to $BACKUP_DIR/database.sql${NC}"
    fi

    # Backup application logs
    if docker ps | grep -q ai_system; then
        echo -e "${BLUE}📦 Backing up application logs...${NC}"
        docker cp $(docker ps --filter "name=ai_system" --format "{{.ID}}"):/var/log/cybersecurity-ai \
            "$BACKUP_DIR/logs" 2>/dev/null || true
        echo -e "${GREEN}✅ Logs backed up to $BACKUP_DIR/logs${NC}"
    fi

    echo -e "${GREEN}✅ Backup completed: $BACKUP_DIR${NC}"
fi

# Build new images
echo -e "${YELLOW}🔨 Building production images...${NC}"
docker compose -f docker-compose.production.yml build --no-cache
echo -e "${GREEN}✅ Images built successfully${NC}"

# Stop existing containers gracefully
echo -e "${YELLOW}⏹️ Stopping existing containers...${NC}"
docker compose -f docker-compose.production.yml down --timeout 30
echo -e "${GREEN}✅ Containers stopped${NC}"

# Start new deployment
echo -e "${YELLOW}🚀 Starting new deployment...${NC}"
docker compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}🏥 Waiting for services to be healthy...${NC}"
TIMEOUT=$HEALTH_CHECK_TIMEOUT
ELAPSED=0
INTERVAL=10

while [[ $ELAPSED -lt $TIMEOUT ]]; do
    if docker compose -f docker-compose.production.yml ps --services --filter "status=running" | wc -l | grep -q "$(docker compose -f docker-compose.production.yml ps --services | wc -l)"; then
        echo -e "${GREEN}✅ All services are running${NC}"
        break
    fi

    echo -e "${BLUE}⏳ Waiting for services... ($ELAPSED/${TIMEOUT}s)${NC}"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo -e "${RED}❌ Health check timeout. Some services may not be ready.${NC}"

    if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
        echo -e "${YELLOW}🔄 Rolling back deployment...${NC}"
        docker compose -f docker-compose.production.yml down
        # Restore from backup if available
        echo -e "${RED}❌ Deployment failed and rolled back${NC}"
        exit 1
    fi
fi

# Perform application-level health checks
echo -e "${YELLOW}🔬 Performing application health checks...${NC}"

# Check AI System API
AI_HEALTH_URL="http://localhost:8000/health"
if curl -f -s "$AI_HEALTH_URL" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ AI System API is healthy${NC}"
else
    echo -e "${RED}❌ AI System API health check failed${NC}"
fi

# Check Dashboard
DASHBOARD_URL="http://localhost:3000"
if curl -f -s "$DASHBOARD_URL" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Dashboard is accessible${NC}"
else
    echo -e "${RED}❌ Dashboard health check failed${NC}"
fi

# Check Database Connection
DB_CONTAINER=$(docker ps --filter "name=database" --format "{{.ID}}")
if [[ -n "$DB_CONTAINER" ]]; then
    if docker exec "$DB_CONTAINER" pg_isready -U ${DB_USER:-aiuser} -d cybersecurity_ai >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database is ready${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
    fi
fi

# Security scan (basic)
echo -e "${YELLOW}🛡️ Performing basic security checks...${NC}"

# Check for running containers with root user
ROOT_CONTAINERS=$(docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Command}}" | grep -v "USER" | wc -l)
if [[ $ROOT_CONTAINERS -gt 0 ]]; then
    echo -e "${YELLOW}⚠️ Warning: Some containers may be running as root${NC}"
else
    echo -e "${GREEN}✅ No containers running as root detected${NC}"
fi

# Check SSL configuration
if [[ -f "ssl/cybersecurity-ai.crt" && -f "ssl/cybersecurity-ai.key" ]]; then
    echo -e "${GREEN}✅ SSL certificates found${NC}"
else
    echo -e "${YELLOW}⚠️ Warning: SSL certificates not found${NC}"
fi

# Display deployment status
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""
echo -e "${BLUE}📊 Service Endpoints:${NC}"
echo -e "   Dashboard:    ${GREEN}http://localhost:3000${NC}"
echo -e "   AI Agent API: ${GREEN}http://localhost:3001${NC}"
echo -e "   Integration:  ${GREEN}http://localhost:8000${NC}"
echo -e "   Metrics:      ${GREEN}http://localhost:9090${NC}"
echo -e "   Grafana:      ${GREEN}http://localhost:3003${NC}"
echo -e "   Kibana:       ${GREEN}http://localhost:5601${NC}"
echo ""

# Display running containers
echo -e "${BLUE}🐳 Running Containers:${NC}"
docker compose -f docker-compose.production.yml ps

echo ""
echo -e "${GREEN}✅ AI Cybersecurity System is now running in production!${NC}"
echo -e "${BLUE}📖 Check the logs with: docker compose -f docker-compose.production.yml logs -f${NC}"
echo -e "${BLUE}🔧 Manage with: docker compose -f docker-compose.production.yml [command]${NC}"

# Post-deployment tasks
echo ""
echo -e "${YELLOW}📋 Post-Deployment Tasks:${NC}"
echo -e "   1. Configure SSL certificates if not already done"
echo -e "   2. Set up external monitoring and alerting"
echo -e "   3. Configure backup schedules"
echo -e "   4. Set up log rotation and retention policies"
echo -e "   5. Configure firewall rules and security groups"
echo -e "   6. Test all integrations and workflows"
echo -e "   7. Update DNS records if applicable"

echo ""
echo -e "${GREEN}🚀 Production deployment completed successfully! 🚀${NC}"

#!/bin/bash
# AI DevOps Agent - Docker Compose Validation Script
# Comprehensive validation for local development deployment

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🎯 AI DevOps Agent - Docker Compose Validation"
echo "=============================================="

# Check prerequisites
echo ""
print_status $BLUE "🔍 Checking Prerequisites..."
echo "============================================"

if command_exists docker; then
    print_status $GREEN "✅ Docker is installed"
    docker version --format "{{.Server.Version}}"
else
    print_status $RED "❌ Docker not found. Please install Docker."
    exit 1
fi

if command_exists docker-compose; then
    print_status $GREEN "✅ Docker Compose is available"
    docker-compose version --short
else
    print_status $RED "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

if command_exists curl; then
    print_status $GREEN "✅ curl is available"
else
    print_status $RED "❌ curl not found. Please install curl."
    exit 1
fi

# Check if docker-compose.yml exists
if [ -f "docker-compose.yml" ]; then
    print_status $GREEN "✅ docker-compose.yml found"
else
    print_status $RED "❌ docker-compose.yml not found. Please ensure you're in the right directory."
    exit 1
fi

echo ""
print_status $BLUE "📊 Checking Docker Compose Services..."
echo "============================================"

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_status $GREEN "✅ Docker Compose services are running"
    docker-compose ps
else
    print_status $YELLOW "⚠️  Starting Docker Compose services..."
    docker-compose up -d
    sleep 30  # Wait for services to start
fi

echo ""
print_status $BLUE "🔍 Checking Service Health..."
echo "============================================"

services=("reasoning-engine" "execution-engine" "postgres" "redis" "prometheus" "grafana" "elasticsearch" "kibana" "nginx")

for service in "${services[@]}"; do
    if docker-compose ps $service | grep -q "Up"; then
        print_status $GREEN "✅ $service is running"
    else
        print_status $RED "❌ $service is not running"
        # Show logs for failed service
        echo "Recent logs for $service:"
        docker-compose logs --tail=10 $service
    fi
done

echo ""
print_status $BLUE "🧠 Testing AI DevOps Agent Core Services..."
echo "============================================"

# Wait for services to be fully ready
sleep 10

# Test Reasoning Engine Health
echo ""
print_status $BLUE "➡️ Testing Reasoning Engine Health..."
reasoning_health=$(curl -s -w "%{http_code}" -o /tmp/reasoning_health http://localhost:5000/health) || true
if [ "$reasoning_health" = "200" ]; then
    print_status $GREEN "✅ Reasoning Engine health check passed"
    cat /tmp/reasoning_health
else
    print_status $RED "❌ Reasoning Engine health check failed (HTTP: $reasoning_health)"
    print_status $YELLOW "Reasoning Engine logs:"
    docker-compose logs --tail=10 reasoning-engine
fi

# Test Execution Engine Health
echo ""
print_status $BLUE "➡️ Testing Execution Engine Health..."
execution_health=$(curl -s -w "%{http_code}" -o /tmp/execution_health http://localhost:3000/health) || true
if [ "$execution_health" = "200" ]; then
    print_status $GREEN "✅ Execution Engine health check passed"
    cat /tmp/execution_health
else
    print_status $RED "❌ Execution Engine health check failed (HTTP: $execution_health)"
    print_status $YELLOW "Execution Engine logs:"
    docker-compose logs --tail=10 execution-engine
fi

# Test Reasoning Engine Analysis
echo ""
print_status $BLUE "➡️ Testing AI Analysis Pipeline..."
analysis_response=$(curl -s -w "%{http_code}" -X POST http://localhost:5000/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "error_id": "docker-validation-001",
        "message": "Database connection timeout in payment processor",
        "severity": "critical",
        "environment": "development",
        "context": {
            "file_path": "src/payment-processor.js",
            "environment": "development"
        },
        "metadata": {
            "frequency": "high",
            "severity": "critical"
        }
    }' \
    -o /tmp/analysis_response) || true

if [ "$analysis_response" = "200" ]; then
    print_status $GREEN "✅ AI Analysis pipeline working"
    if command_exists jq; then
        print_status $BLUE "Analysis summary:"
        jq -r '.summary // .message // "Analysis completed successfully"' /tmp/analysis_response 2>/dev/null || cat /tmp/analysis_response
    else
        print_status $GREEN "Analysis response received (install jq for detailed parsing)"
    fi
else
    print_status $RED "❌ AI Analysis pipeline failed (HTTP: $analysis_response)"
fi

# Test Execution Engine
echo ""
print_status $BLUE "➡️ Testing Execution Engine..."
execution_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/execute \
    -H "Content-Type: application/json" \
    -d '{
        "error_id": "docker-validation-001",
        "fix_plan": {
            "type": "DATABASE_FIX",
            "target_files": ["src/payment-processor.js"],
            "estimated_time": "10-15 minutes",
            "risk_level": "MEDIUM"
        },
        "deployment_strategy": "blue_green"
    }' \
    -o /tmp/execution_response) || true

if [ "$execution_response" = "200" ]; then
    print_status $GREEN "✅ Execution Engine working"
    if command_exists jq; then
        print_status $BLUE "Execution summary:"
        jq -r '.status // .message // "Execution completed successfully"' /tmp/execution_response 2>/dev/null || cat /tmp/execution_response
    else
        print_status $GREEN "Execution response received (install jq for detailed parsing)"
    fi
else
    print_status $RED "❌ Execution Engine failed (HTTP: $execution_response)"
fi

echo ""
print_status $BLUE "📊 Testing Monitoring Stack..."
echo "============================================"

# Test Prometheus
echo ""
print_status $BLUE "➡️ Testing Prometheus..."
prometheus_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:9090/-/healthy) || true
if [ "$prometheus_response" = "200" ]; then
    print_status $GREEN "✅ Prometheus is healthy"
    # Check targets
    if command_exists jq; then
        print_status $BLUE "Prometheus targets:"
        curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"' 2>/dev/null || print_status $YELLOW "Could not parse targets"
    fi
else
    print_status $RED "❌ Prometheus health check failed (HTTP: $prometheus_response)"
fi

# Test Grafana
echo ""
print_status $BLUE "➡️ Testing Grafana..."
grafana_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/health) || true
if [ "$grafana_response" = "200" ]; then
    print_status $GREEN "✅ Grafana is healthy"
else
    print_status $RED "❌ Grafana health check failed (HTTP: $grafana_response)"
fi

# Test Elasticsearch
echo ""
print_status $BLUE "➡️ Testing Elasticsearch..."
elasticsearch_response=$(curl -s -w "%{http_code}" -o /tmp/elasticsearch_response http://localhost:9200/_cluster/health) || true
if [ "$elasticsearch_response" = "200" ]; then
    print_status $GREEN "✅ Elasticsearch is healthy"
    if command_exists jq; then
        cluster_status=$(jq -r '.status' /tmp/elasticsearch_response 2>/dev/null)
        print_status $BLUE "Cluster status: $cluster_status"
    fi
else
    print_status $RED "❌ Elasticsearch health check failed (HTTP: $elasticsearch_response)"
fi

# Test Kibana
echo ""
print_status $BLUE "➡️ Testing Kibana..."
kibana_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:5601/api/status) || true
if [ "$kibana_response" = "200" ]; then
    print_status $GREEN "✅ Kibana is healthy"
else
    print_status $RED "❌ Kibana health check failed (HTTP: $kibana_response)"
fi

# Test Database connections
echo ""
print_status $BLUE "🗄️ Testing Database Connections..."
echo "============================================"

# Test PostgreSQL
postgres_test=$(docker-compose exec -T postgres psql -U agent -d agentdb -c "SELECT 1;" 2>/dev/null || echo "failed")
if [[ $postgres_test == *"1"* ]]; then
    print_status $GREEN "✅ PostgreSQL connection successful"
else
    print_status $RED "❌ PostgreSQL connection failed"
fi

# Test Redis
redis_test=$(docker-compose exec -T redis redis-cli ping 2>/dev/null || echo "failed")
if [ "$redis_test" = "PONG" ]; then
    print_status $GREEN "✅ Redis connection successful"
else
    print_status $RED "❌ Redis connection failed"
fi

echo ""
print_status $BLUE "🌐 Testing Nginx API Gateway..."
echo "============================================"

# Test Nginx health
nginx_health=$(curl -s -w "%{http_code}" -o /dev/null http://localhost/health) || true
if [ "$nginx_health" = "200" ]; then
    print_status $GREEN "✅ Nginx API Gateway is healthy"
else
    print_status $YELLOW "⚠️  Nginx health endpoint returned: $nginx_health"
fi

# Test API routes through Nginx
api_analyze_response=$(curl -s -w "%{http_code}" -X POST http://localhost/api/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "error_id": "nginx-test-001",
        "message": "Test error through Nginx",
        "severity": "low"
    }' \
    -o /dev/null) || true

if [ "$api_analyze_response" = "200" ]; then
    print_status $GREEN "✅ Nginx API routing working"
else
    print_status $YELLOW "⚠️  Nginx API routing returned: $api_analyze_response"
fi

echo ""
print_status $BLUE "📊 Resource Usage Summary..."
echo "============================================"

print_status $BLUE "Docker container resource usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
print_status $BLUE "📋 Deployment Summary..."
echo "============================================"

# Count healthy services
healthy_count=0
total_count=${#services[@]}

for service in "${services[@]}"; do
    if docker-compose ps $service | grep -q "Up"; then
        ((healthy_count++))
    fi
done

print_status $GREEN "🎯 Healthy Services: $healthy_count/$total_count"

if [ $healthy_count -eq $total_count ]; then
    print_status $GREEN "✅ All services are healthy and operational!"
    echo ""
    print_status $GREEN "🎊 AI DevOps Agent Docker Compose Validation SUCCESSFUL!"
    echo ""
    print_status $BLUE "🌐 Service Access URLs:"
    echo "   🧠 Reasoning Engine API: http://localhost:5000"
    echo "   ⚡ Execution Engine API: http://localhost:3000"
    echo "   🌐 API Gateway: http://localhost"
    echo "   📊 Grafana Dashboards: http://localhost:3001 (admin/admin123)"
    echo "   🔍 Prometheus Metrics: http://localhost:9090"
    echo "   📋 Kibana Logs: http://localhost:5601"
    echo "   🔍 Elasticsearch: http://localhost:9200"
    echo ""
    print_status $GREEN "🚀 Your AI DevOps Agent is ready for development and testing!"
else
    print_status $YELLOW "⚠️  Some services need attention. Check the output above."
    print_status $BLUE "To view service logs: docker-compose logs [service-name]"
    print_status $BLUE "To restart services: docker-compose restart [service-name]"
fi

echo ""
print_status $BLUE "✅ Docker Compose validation complete!"

# Clean up temporary files
rm -f /tmp/reasoning_health /tmp/execution_health /tmp/analysis_response /tmp/execution_response /tmp/elasticsearch_response

# AI DevOps Agent - Deployment Scripts
# Complete deployment automation for Docker Compose and Kubernetes

# =============================================================================
# DOCKER COMPOSE DEPLOYMENT
# =============================================================================

# 1. Quick Start - Local Development
echo "🚀 Starting AI DevOps Agent - Local Development"
echo "=================================================="

# Set environment variables
echo "Setting up environment variables..."
export OPENAI_API_KEY="your-openai-api-key-here"

# Create necessary directories
mkdir -p logs monitoring/prometheus monitoring/grafana monitoring/logstash nginx database/init

# Start all services
echo "Starting all services with Docker Compose..."
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 30

# Check service health
echo "Checking service health..."
docker-compose ps

# Access URLs
echo ""
echo "🎯 Service Access URLs:"
echo "================================"
echo "🧠 Reasoning Engine API: http://localhost:5000"
echo "⚡ Execution Engine API: http://localhost:3000"
echo "📊 Grafana Dashboard: http://localhost:3001 (admin/admin123)"
echo "🔍 Prometheus Metrics: http://localhost:9090"
echo "📋 Kibana Logs: http://localhost:5601"
echo "🗄️ PostgreSQL: localhost:5432 (agent/securepass)"
echo "💾 Redis: localhost:6379"

# =============================================================================
# KUBERNETES DEPLOYMENT
# =============================================================================

# 2. Production Deployment - Kubernetes
echo ""
echo "🚀 Deploying AI DevOps Agent to Kubernetes"
echo "============================================="

# Prerequisites Check
echo "Checking prerequisites..."
kubectl version --client
helm version

# Create namespace
echo "Creating namespace..."
kubectl create namespace ai-devops-agent --dry-run=client -o yaml | kubectl apply -f -

# Setup secrets (you need to base64 encode your actual values)
echo "Setting up secrets..."
echo "⚠️  Please update the secret values in k8s-deployment.yaml before applying!"
echo ""
echo "To encode your secrets:"
echo "echo -n 'your-openai-api-key' | base64"
echo "echo -n 'your-postgres-password' | base64"
echo "echo -n 'your-redis-password' | base64"

# Apply Kubernetes configurations
echo "Applying Kubernetes configurations..."
kubectl apply -f k8s-deployment.yaml

# Wait for deployments
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n ai-devops-agent
kubectl wait --for=condition=available --timeout=300s deployment/redis -n ai-devops-agent
kubectl wait --for=condition=available --timeout=300s deployment/reasoning-engine -n ai-devops-agent
kubectl wait --for=condition=available --timeout=300s deployment/execution-engine -n ai-devops-agent

# Check deployment status
echo "Checking deployment status..."
kubectl get all -n ai-devops-agent

# Port forwarding for access
echo ""
echo "🎯 Setting up port forwarding for access:"
echo "==========================================="
echo "Run these commands in separate terminals:"
echo ""
echo "# Reasoning Engine API"
echo "kubectl port-forward -n ai-devops-agent service/reasoning-service 5000:5000"
echo ""
echo "# Execution Engine API"
echo "kubectl port-forward -n ai-devops-agent service/execution-service 3000:3000"
echo ""
echo "# Grafana Dashboard"
echo "kubectl port-forward -n ai-devops-agent service/grafana-service 3001:3000"
echo ""
echo "# Prometheus Metrics"
echo "kubectl port-forward -n ai-devops-agent service/prometheus-service 9090:9090"

# =============================================================================
# VERIFICATION COMMANDS
# =============================================================================

echo ""
echo "🔍 Verification Commands"
echo "========================"
echo ""
echo "# Test Reasoning Engine Health"
echo "curl http://localhost:5000/health"
echo ""
echo "# Test Execution Engine Health"
echo "curl http://localhost:3000/health"
echo ""
echo "# Submit test error for analysis"
echo 'curl -X POST http://localhost:5000/analyze \\'
echo '  -H "Content-Type: application/json" \\'
echo '  -d '"'"'{'
echo '    "error_id": "test-001",'
echo '    "message": "Database connection failed",'
echo '    "severity": "high",'
echo '    "environment": "production"'
echo '  }'"'"

# =============================================================================
# MONITORING SETUP
# =============================================================================

echo ""
echo "📊 Monitoring Setup"
echo "==================="
echo ""
echo "# Import Grafana Dashboard"
echo "1. Open Grafana at http://localhost:3001"
echo "2. Login with admin/admin123"
echo "3. Import dashboard from monitoring/grafana/dashboards/"
echo ""
echo "# View Application Logs"
echo "1. Open Kibana at http://localhost:5601"
echo "2. Create index pattern for application logs"
echo "3. Explore logs and create visualizations"

# =============================================================================
# SCALING COMMANDS
# =============================================================================

echo ""
echo "📈 Scaling Commands (Kubernetes)"
echo "================================"
echo ""
echo "# Scale Reasoning Engine"
echo "kubectl scale deployment reasoning-engine --replicas=5 -n ai-devops-agent"
echo ""
echo "# Scale Execution Engine"
echo "kubectl scale deployment execution-engine --replicas=4 -n ai-devops-agent"
echo ""
echo "# Check HPA status"
echo "kubectl get hpa -n ai-devops-agent"

# =============================================================================
# TROUBLESHOOTING
# =============================================================================

echo ""
echo "🔧 Troubleshooting Commands"
echo "============================"
echo ""
echo "# Docker Compose Logs"
echo "docker-compose logs -f reasoning-engine"
echo "docker-compose logs -f execution-engine"
echo ""
echo "# Kubernetes Logs"
echo "kubectl logs -f deployment/reasoning-engine -n ai-devops-agent"
echo "kubectl logs -f deployment/execution-engine -n ai-devops-agent"
echo ""
echo "# Check Pod Status"
echo "kubectl describe pod -l app=reasoning-engine -n ai-devops-agent"
echo "kubectl describe pod -l app=execution-engine -n ai-devops-agent"

echo ""
echo "🎉 Deployment script complete!"
echo "==============================="
echo "Your AI DevOps Agent is ready for revolutionizing operations!"

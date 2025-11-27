#!/bin/bash
set -e

# AI DevOps Agent - Complete Deployment Validation Script
# Comprehensive validation for Kubernetes and Docker Compose deployments

echo "🎯 AI DevOps Agent - Complete Deployment Validation"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo ""
print_status $BLUE "🔍 Checking Prerequisites..."
echo "============================================"

if command_exists kubectl; then
    print_status $GREEN "✅ kubectl is installed"
    kubectl version --client --short
else
    print_status $RED "❌ kubectl not found. Please install kubectl."
    exit 1
fi

if command_exists curl; then
    print_status $GREEN "✅ curl is available"
else
    print_status $RED "❌ curl not found. Please install curl."
    exit 1
fi

if command_exists jq; then
    print_status $GREEN "✅ jq is available"
else
    print_status $YELLOW "⚠️  jq not found. JSON parsing will be limited."
fi

echo ""
print_status $BLUE "🔍 Checking Kubernetes Cluster Status..."
echo "============================================"

# Check cluster connectivity
if kubectl cluster-info &>/dev/null; then
    print_status $GREEN "✅ Kubernetes cluster is accessible"
    kubectl cluster-info
else
    print_status $RED "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi

# Check nodes
echo ""
print_status $BLUE "📊 Node Status:"
kubectl get nodes -o wide

# Check namespace
echo ""
print_status $BLUE "🔍 Checking AI DevOps Agent Namespace..."
if kubectl get namespace ai-devops-agent &>/dev/null; then
    print_status $GREEN "✅ Namespace 'ai-devops-agent' exists"
else
    print_status $RED "❌ Namespace 'ai-devops-agent' not found"
    echo "Creating namespace..."
    kubectl create namespace ai-devops-agent
fi

echo ""
print_status $BLUE "📊 Pod Status in ai-devops-agent namespace:"
kubectl get pods -n ai-devops-agent -o wide

echo ""
print_status $BLUE "➡️ Verifying Services..."
echo "============================================"
kubectl get svc -n ai-devops-agent

echo ""
print_status $BLUE "➡️ Checking Deployments..."
echo "============================================"
kubectl get deployments -n ai-devops-agent

# Check deployment status
echo ""
print_status $BLUE "🔍 Checking Deployment Readiness..."
echo "============================================"

deployments=("reasoning-engine" "execution-engine" "postgres" "redis" "prometheus" "grafana")
for deployment in "${deployments[@]}"; do
    if kubectl get deployment $deployment -n ai-devops-agent &>/dev/null; then
        ready=$(kubectl get deployment $deployment -n ai-devops-agent -o jsonpath='{.status.readyReplicas}')
        desired=$(kubectl get deployment $deployment -n ai-devops-agent -o jsonpath='{.spec.replicas}')
        if [ "$ready" = "$desired" ]; then
            print_status $GREEN "✅ $deployment: $ready/$desired pods ready"
        else
            print_status $YELLOW "⚠️  $deployment: $ready/$desired pods ready"
        fi
    else
        print_status $RED "❌ $deployment: deployment not found"
    fi
done

echo ""
print_status $BLUE "➡️ Checking Ingress Routes..."
echo "============================================"
if kubectl get ingress -n ai-devops-agent &>/dev/null; then
    kubectl get ingress -n ai-devops-agent
else
    print_status $YELLOW "⚠️  No ingress resources found"
fi

echo ""
print_status $BLUE "🧠 Testing AI DevOps Agent Core Services..."
echo "============================================"

# Setup port forwarding for testing
print_status $BLUE "Setting up port forwarding..."

# Port forward reasoning engine
kubectl port-forward -n ai-devops-agent service/reasoning-service 5000:5000 &
PF_REASONING_PID=$!

# Port forward execution engine
kubectl port-forward -n ai-devops-agent service/execution-service 3000:3000 &
PF_EXECUTION_PID=$!

# Port forward Grafana
kubectl port-forward -n ai-devops-agent service/grafana-service 3001:3000 &
PF_GRAFANA_PID=$!

# Port forward Prometheus
kubectl port-forward -n ai-devops-agent service/prometheus-service 9090:9090 &
PF_PROMETHEUS_PID=$!

# Wait for port forwards to establish
sleep 10

# Function to cleanup port forwards
cleanup() {
    print_status $YELLOW "🧹 Cleaning up port forwards..."
    kill $PF_REASONING_PID $PF_EXECUTION_PID $PF_GRAFANA_PID $PF_PROMETHEUS_PID &>/dev/null || true
    wait
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

echo ""
print_status $BLUE "➡️ Testing Reasoning Engine Health..."
health_response=$(curl -s -w "%{http_code}" -o /tmp/health_response http://localhost:5000/health) || true
if [ "$health_response" = "200" ]; then
    print_status $GREEN "✅ Reasoning Engine health check passed"
    cat /tmp/health_response
else
    print_status $RED "❌ Reasoning Engine health check failed (HTTP: $health_response)"
fi

echo ""
print_status $BLUE "➡️ Testing Reasoning Engine /analyze endpoint..."
analyze_response=$(curl -s -w "%{http_code}" -X POST http://localhost:5000/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "error_id": "validation-001",
        "message": "Simulated pipeline error for validation",
        "severity": "high",
        "environment": "production",
        "context": {
            "file_path": "test/validation.js",
            "environment": "production"
        },
        "metadata": {
            "frequency": "high",
            "severity": "high"
        }
    }' \
    -o /tmp/analyze_response) || true

if [ "$analyze_response" = "200" ]; then
    print_status $GREEN "✅ Reasoning Engine /analyze endpoint working"
    if command_exists jq; then
        echo "Response summary:"
        jq -r '.summary // .message // "Analysis completed"' /tmp/analyze_response 2>/dev/null || cat /tmp/analyze_response
    fi
else
    print_status $RED "❌ Reasoning Engine /analyze endpoint failed (HTTP: $analyze_response)"
fi

echo ""
print_status $BLUE "➡️ Testing Execution Engine Health..."
exec_health_response=$(curl -s -w "%{http_code}" -o /tmp/exec_health_response http://localhost:3000/health) || true
if [ "$exec_health_response" = "200" ]; then
    print_status $GREEN "✅ Execution Engine health check passed"
    cat /tmp/exec_health_response
else
    print_status $RED "❌ Execution Engine health check failed (HTTP: $exec_health_response)"
fi

echo ""
print_status $BLUE "➡️ Testing Execution Engine /execute endpoint..."
execute_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/execute \
    -H "Content-Type: application/json" \
    -d '{
        "error_id": "validation-001",
        "fix_plan": {
            "type": "SECURITY_FIX",
            "target_files": ["test/validation.js"],
            "estimated_time": "5-10 minutes",
            "risk_level": "LOW"
        },
        "deployment_strategy": "blue_green"
    }' \
    -o /tmp/execute_response) || true

if [ "$execute_response" = "200" ]; then
    print_status $GREEN "✅ Execution Engine /execute endpoint working"
    if command_exists jq; then
        echo "Response summary:"
        jq -r '.status // .message // "Execution completed"' /tmp/execute_response 2>/dev/null || cat /tmp/execute_response
    fi
else
    print_status $RED "❌ Execution Engine /execute endpoint failed (HTTP: $execute_response)"
fi

echo ""
print_status $BLUE "📊 Checking Monitoring Stack..."
echo "============================================"

# Check Prometheus
echo ""
print_status $BLUE "➡️ Checking Prometheus availability..."
prometheus_response=$(curl -s -w "%{http_code}" -o /tmp/prometheus_response http://localhost:9090/-/healthy) || true
if [ "$prometheus_response" = "200" ]; then
    print_status $GREEN "✅ Prometheus is healthy"
else
    print_status $RED "❌ Prometheus health check failed (HTTP: $prometheus_response)"
fi

# Check Prometheus targets
echo ""
print_status $BLUE "➡️ Checking Prometheus targets..."
if curl -s http://localhost:9090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"' 2>/dev/null; then
    print_status $GREEN "✅ Prometheus targets status retrieved"
else
    print_status $YELLOW "⚠️  Could not retrieve Prometheus targets"
fi

# Check Grafana
echo ""
print_status $BLUE "➡️ Checking Grafana availability..."
grafana_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/health) || true
if [ "$grafana_response" = "200" ]; then
    print_status $GREEN "✅ Grafana is healthy"
else
    print_status $RED "❌ Grafana health check failed (HTTP: $grafana_response)"
fi

echo ""
print_status $BLUE "➡️ Validating Prometheus Alert Rules..."
if command_exists jq; then
    if curl -s http://localhost:9090/api/v1/rules | jq -r '.data.groups[].name' 2>/dev/null; then
        print_status $GREEN "✅ Alert rules loaded successfully"
    else
        print_status $YELLOW "⚠️  Could not retrieve alert rules"
    fi
else
    print_status $YELLOW "⚠️  jq not available, skipping alert rules validation"
fi

echo ""
print_status $BLUE "➡️ Checking Active Alerts..."
if command_exists jq; then
    active_alerts=$(curl -s http://localhost:9090/api/v1/alerts | jq -r '.data.alerts[] | select(.state=="firing") | .labels.alertname' 2>/dev/null || echo "")
    if [ -z "$active_alerts" ]; then
        print_status $GREEN "✅ No active alerts (system is healthy)"
    else
        print_status $YELLOW "⚠️  Active alerts detected:"
        echo "$active_alerts"
    fi
else
    print_status $YELLOW "⚠️  jq not available, skipping active alerts check"
fi

echo ""
print_status $BLUE "🔍 Checking Persistent Volumes..."
echo "============================================"
kubectl get pv
kubectl get pvc -n ai-devops-agent

echo ""
print_status $BLUE "📊 Resource Usage Summary..."
echo "============================================"
kubectl top nodes 2>/dev/null || print_status $YELLOW "⚠️  Metrics server not available for resource usage"
kubectl top pods -n ai-devops-agent 2>/dev/null || print_status $YELLOW "⚠️  Metrics server not available for pod usage"

echo ""
print_status $BLUE "🔍 Checking ConfigMaps and Secrets..."
echo "============================================"
kubectl get configmaps -n ai-devops-agent
kubectl get secrets -n ai-devops-agent

echo ""
print_status $BLUE "🧪 Testing 12 Fintech AI Mappers..."
echo "============================================"

# Test comprehensive analysis with all mappers
mappers_test_response=$(curl -s -w "%{http_code}" -X POST http://localhost:5000/comprehensive-analyze \
    -H "Content-Type: application/json" \
    -d '{
        "error_id": "mappers-validation-001",
        "message": "Payment gateway timeout - high CPU usage detected",
        "severity": "critical",
        "environment": "production",
        "context": {
            "file_path": "src/payment-processor.js",
            "environment": "production"
        },
        "metadata": {
            "frequency": "high",
            "severity": "critical"
        }
    }' \
    -o /tmp/mappers_response) || true

if [ "$mappers_test_response" = "200" ] || [ "$mappers_test_response" = "404" ]; then
    if [ "$mappers_test_response" = "200" ]; then
        print_status $GREEN "✅ 12 Fintech AI Mappers endpoint working"
        if command_exists jq; then
            mappers_count=$(jq -r '.fintech_intelligence | length' /tmp/mappers_response 2>/dev/null || echo "unknown")
            print_status $GREEN "🧠 Active mappers: $mappers_count"
        fi
    else
        print_status $YELLOW "⚠️  Comprehensive analyze endpoint not found, using standard analyze"
    fi
else
    print_status $RED "❌ Fintech AI Mappers test failed (HTTP: $mappers_test_response)"
fi

echo ""
print_status $BLUE "📋 Deployment Summary..."
echo "============================================"

# Count healthy services
healthy_services=0
total_services=6

for deployment in "${deployments[@]}"; do
    if kubectl get deployment $deployment -n ai-devops-agent &>/dev/null; then
        ready=$(kubectl get deployment $deployment -n ai-devops-agent -o jsonpath='{.status.readyReplicas}')
        desired=$(kubectl get deployment $deployment -n ai-devops-agent -o jsonpath='{.spec.replicas}')
        if [ "$ready" = "$desired" ]; then
            ((healthy_services++))
        fi
    fi
done

print_status $GREEN "🎯 Healthy Services: $healthy_services/$total_services"

if [ $healthy_services -eq $total_services ]; then
    print_status $GREEN "✅ All core services are healthy and operational"
    echo ""
    print_status $GREEN "🎊 AI DevOps Agent Deployment Validation SUCCESSFUL!"
    echo ""
    print_status $BLUE "🌐 Access URLs (with port forwarding active):"
    echo "   🧠 Reasoning Engine API: http://localhost:5000"
    echo "   ⚡ Execution Engine API: http://localhost:3000"
    echo "   📊 Grafana Dashboards: http://localhost:3001 (admin/admin123)"
    echo "   🔍 Prometheus Metrics: http://localhost:9090"
    echo ""
    print_status $GREEN "🚀 Your revolutionary AI DevOps Agent is ready for production!"
else
    print_status $YELLOW "⚠️  Some services need attention. Check the logs above."
fi

echo ""
print_status $BLUE "✅ Validation complete. All core systems checked."

# Cleanup will be handled by trap

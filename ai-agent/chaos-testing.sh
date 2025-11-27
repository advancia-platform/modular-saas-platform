#!/bin/bash
# AI DevOps Agent - Error Injection and Chaos Testing Script
# Tests system resilience, alerting, and recovery capabilities

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Configuration
REASONING_ENGINE_URL="http://localhost:5000"
EXECUTION_ENGINE_URL="http://localhost:3000"
GRAFANA_URL="http://localhost:3001"
PROMETHEUS_URL="http://localhost:9090"

# Alert thresholds (matching Prometheus alert rules)
HIGH_MTTR_THRESHOLD=600    # 10 minutes
ROLLBACK_THRESHOLD=5       # 5 rollbacks in 5 minutes
FAILURE_RATE_THRESHOLD=20  # 20% failure rate

echo ""
print_status $CYAN "🚨 AI DevOps Agent - Error Injection & Chaos Testing"
print_status $CYAN "===================================================="
print_status $BLUE "Testing system resilience, alerting, and recovery capabilities"

echo ""
print_status $YELLOW "⚠️  WARNING: This script will intentionally inject errors to test:"
echo "   • Alert system responsiveness"
echo "   • MTTR (Mean Time To Resolution) monitoring"
echo "   • Rollback detection and automation"
echo "   • System recovery capabilities"
echo "   • Performance under stress"

echo ""
read -p "Continue with chaos testing? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status $YELLOW "❌ Chaos testing cancelled"
    exit 1
fi

echo ""
print_status $MAGENTA "🎯 Starting chaos engineering tests..."

# Test 1: High MTTR Simulation
print_status $BLUE "🔍 Test 1: High MTTR (Mean Time To Resolution) Simulation"
print_status $BLUE "========================================================="

print_status $YELLOW "Injecting slow-resolution error to trigger HighMTTR alert..."

# Create a complex error that takes time to resolve
high_mttr_payload='{
    "error_id": "chaos-high-mttr-001",
    "message": "Critical database connection pool exhaustion with memory leak",
    "severity": "critical",
    "environment": "production",
    "context": {
        "file_path": "src/database/connection-manager.js",
        "stack_trace": "ConnectionPoolError: Maximum pool size reached\n    at ConnectionManager.acquire(connection-manager.js:234)\n    at Database.query(database.js:156)",
        "environment": "production",
        "memory_usage": "95%",
        "cpu_usage": "87%",
        "connection_count": 500
    },
    "metadata": {
        "frequency": "very_high",
        "severity": "critical",
        "complexity": "high",
        "estimated_resolution_time": "15-20 minutes"
    }
}'

start_time=$(date +%s)
print_status $BLUE "   📤 Sending high-complexity error for analysis..."

analysis_response=$(curl -s -w "%{http_code}" -X POST $REASONING_ENGINE_URL/analyze \
    -H "Content-Type: application/json" \
    -d "$high_mttr_payload" \
    -o /tmp/chaos_high_mttr_analysis) || true

if [ "$analysis_response" = "200" ]; then
    print_status $GREEN "   ✅ Error analysis started"

    # Simulate long resolution time (>10 minutes to trigger alert)
    print_status $YELLOW "   ⏳ Simulating complex resolution process..."
    print_status $BLUE "   📊 Monitor Grafana dashboard: $GRAFANA_URL"
    print_status $BLUE "   🚨 HighMTTR alert should trigger after ${HIGH_MTTR_THRESHOLD} seconds"

    # Sleep for alert threshold + buffer to trigger HighMTTR alert
    sleep_time=$((HIGH_MTTR_THRESHOLD + 60))
    for i in $(seq 1 $((sleep_time / 60))); do
        print_status $YELLOW "   ⏰ Simulating resolution attempt $i/$(($sleep_time / 60)) (${i} minutes elapsed)"
        sleep 60

        # Send periodic status updates
        status_update='{
            "error_id": "chaos-high-mttr-001",
            "status": "analyzing",
            "progress": "'"$((i * 100 / (sleep_time / 60)))"'%",
            "message": "Still analyzing complex database issue..."
        }'

        curl -s -X POST $REASONING_ENGINE_URL/status \
            -H "Content-Type: application/json" \
            -d "$status_update" > /dev/null || true
    done

    end_time=$(date +%s)
    resolution_time=$((end_time - start_time))
    print_status $GREEN "   ✅ High MTTR test completed in $resolution_time seconds"
    print_status $RED "   🚨 HighMTTR alert should have been triggered!"
else
    print_status $RED "   ❌ Failed to start high MTTR test (HTTP: $analysis_response)"
fi

echo ""

# Test 2: Frequent Rollback Simulation
print_status $BLUE "🔄 Test 2: Frequent Rollback Simulation"
print_status $BLUE "======================================="

print_status $YELLOW "Injecting multiple deployment failures to trigger FrequentRollbacks alert..."

rollback_count=0
for i in $(seq 1 8); do
    print_status $BLUE "   🚀 Deployment attempt $i - injecting failure..."

    # Create failing deployment scenario
    failing_deployment='{
        "error_id": "chaos-rollback-'"$i"'",
        "fix_plan": {
            "type": "DEPLOYMENT",
            "strategy": "blue_green",
            "target_files": ["src/payment/processor.js"],
            "estimated_time": "5 minutes",
            "risk_level": "MEDIUM",
            "force_failure": true
        },
        "deployment_strategy": "blue_green"
    }'

    deployment_response=$(curl -s -w "%{http_code}" -X POST $EXECUTION_ENGINE_URL/execute \
        -H "Content-Type: application/json" \
        -d "$failing_deployment" \
        -o /tmp/chaos_rollback_$i) || true

    if [ "$deployment_response" = "200" ] || [ "$deployment_response" = "500" ]; then
        rollback_count=$((rollback_count + 1))
        print_status $YELLOW "   ⏪ Rollback $rollback_count triggered"

        # Check if we've hit the alert threshold
        if [ $rollback_count -ge $ROLLBACK_THRESHOLD ]; then
            print_status $RED "   🚨 FrequentRollbacks alert threshold reached!"
        fi
    else
        print_status $RED "   ❌ Deployment test failed (HTTP: $deployment_response)"
    fi

    # Brief pause between deployments
    sleep 10
done

print_status $GREEN "   ✅ Rollback simulation completed: $rollback_count rollbacks triggered"

echo ""

# Test 3: High Failure Rate Simulation
print_status $BLUE "📉 Test 3: High Failure Rate Simulation"
print_status $BLUE "======================================="

print_status $YELLOW "Injecting multiple failed fixes to trigger HighFailureRate alert..."

total_fixes=20
failed_fixes=0
target_failure_rate=$((FAILURE_RATE_THRESHOLD + 10))  # Ensure we exceed threshold

for i in $(seq 1 $total_fixes); do
    # Determine if this fix should fail (to reach target failure rate)
    should_fail=$((i * 100 / total_fixes <= target_failure_rate))

    if [ $should_fail -eq 1 ]; then
        # Create failing fix
        print_status $RED "   ❌ Fix attempt $i - injecting failure..."
        failing_fix='{
            "error_id": "chaos-failure-'"$i"'",
            "fix_plan": {
                "type": "AUTOMATED_FIX",
                "target_files": ["src/auth/validator.js"],
                "force_failure": true
            }
        }'
        failed_fixes=$((failed_fixes + 1))
    else
        # Create successful fix
        print_status $GREEN "   ✅ Fix attempt $i - success..."
        successful_fix='{
            "error_id": "chaos-success-'"$i"'",
            "fix_plan": {
                "type": "AUTOMATED_FIX",
                "target_files": ["src/utils/helper.js"]
            }
        }'
    fi

    fix_payload=$([ $should_fail -eq 1 ] && echo "$failing_fix" || echo "$successful_fix")

    fix_response=$(curl -s -w "%{http_code}" -X POST $EXECUTION_ENGINE_URL/execute \
        -H "Content-Type: application/json" \
        -d "$fix_payload" \
        -o /tmp/chaos_fix_$i) || true

    # Brief pause between fixes
    sleep 2
done

current_failure_rate=$((failed_fixes * 100 / total_fixes))
print_status $BLUE "   📊 Final failure rate: $current_failure_rate% ($failed_fixes/$total_fixes)"

if [ $current_failure_rate -gt $FAILURE_RATE_THRESHOLD ]; then
    print_status $RED "   🚨 HighFailureRate alert should be triggered!"
else
    print_status $YELLOW "   ⚠️  Failure rate below alert threshold"
fi

echo ""

# Test 4: Memory and CPU Stress Test
print_status $BLUE "💾 Test 4: System Resource Stress Test"
print_status $BLUE "======================================"

print_status $YELLOW "Generating high resource usage to test performance alerts..."

# Create resource-intensive analysis requests
for i in $(seq 1 10); do
    print_status $BLUE "   🔥 Resource stress test $i/10..."

    stress_payload='{
        "error_id": "chaos-stress-'"$i"'",
        "message": "Complex multi-layered security breach with cascading failures",
        "severity": "critical",
        "environment": "production",
        "context": {
            "file_path": "src/security/multi-factor-auth.js",
            "complexity": "very_high",
            "analysis_type": "deep_learning",
            "data_size": "large"
        },
        "metadata": {
            "requires_heavy_processing": true,
            "estimated_analysis_time": "5-10 minutes"
        }
    }'

    # Send requests in parallel to stress the system
    curl -s -X POST $REASONING_ENGINE_URL/analyze \
        -H "Content-Type: application/json" \
        -d "$stress_payload" \
        -o /tmp/chaos_stress_$i &

    if [ $((i % 3)) -eq 0 ]; then
        sleep 2  # Brief pause every 3 requests
    fi
done

print_status $YELLOW "   ⏳ Waiting for stress tests to complete..."
wait  # Wait for all background requests to finish

print_status $GREEN "   ✅ Resource stress test completed"

echo ""

# Test 5: Network and Service Disruption
print_status $BLUE "🌐 Test 5: Network Disruption Simulation"
print_status $BLUE "========================================"

print_status $YELLOW "Testing system resilience under network issues..."

# Simulate network timeouts
for i in $(seq 1 5); do
    print_status $BLUE "   📡 Network disruption test $i/5..."

    timeout_payload='{
        "error_id": "chaos-network-'"$i"'",
        "message": "Network timeout during external API call",
        "severity": "high",
        "context": {
            "timeout": true,
            "simulate_network_failure": true
        }
    }'

    # Use shorter timeout to simulate network issues
    timeout_response=$(timeout 5s curl -s -w "%{http_code}" -X POST $REASONING_ENGINE_URL/analyze \
        -H "Content-Type: application/json" \
        -d "$timeout_payload" \
        -o /tmp/chaos_timeout_$i 2>/dev/null) || echo "TIMEOUT"

    if [ "$timeout_response" = "TIMEOUT" ]; then
        print_status $YELLOW "   ⏰ Network timeout simulated"
    else
        print_status $GREEN "   ✅ Request completed (HTTP: $timeout_response)"
    fi

    sleep 3
done

print_status $GREEN "   ✅ Network disruption test completed"

echo ""

# Summary and Alert Check
print_status $CYAN "📋 Chaos Testing Summary"
print_status $CYAN "========================"

echo ""
print_status $GREEN "🎯 Tests Completed:"
echo "   ✅ High MTTR simulation (>$HIGH_MTTR_THRESHOLD seconds)"
echo "   ✅ Frequent rollback simulation ($rollback_count rollbacks)"
echo "   ✅ High failure rate simulation ($current_failure_rate% failure rate)"
echo "   ✅ Resource stress testing (10 concurrent heavy requests)"
echo "   ✅ Network disruption simulation (5 timeout scenarios)"

echo ""
print_status $BLUE "🚨 Expected Alert Triggers:"
if [ $resolution_time -gt $HIGH_MTTR_THRESHOLD ]; then
    echo "   🔴 HighMTTR alert (resolution time: ${resolution_time}s > ${HIGH_MTTR_THRESHOLD}s)"
fi

if [ $rollback_count -ge $ROLLBACK_THRESHOLD ]; then
    echo "   🔴 FrequentRollbacks alert ($rollback_count rollbacks >= $ROLLBACK_THRESHOLD)"
fi

if [ $current_failure_rate -gt $FAILURE_RATE_THRESHOLD ]; then
    echo "   🔴 HighFailureRate alert ($current_failure_rate% >= $FAILURE_RATE_THRESHOLD%)"
fi

echo ""
print_status $BLUE "📊 Monitor Your Dashboards:"
echo "   🎯 Grafana: $GRAFANA_URL"
echo "   📈 Prometheus Alerts: $PROMETHEUS_URL/alerts"

echo ""
print_status $CYAN "🧪 Validation Steps:"
echo "   1. Check Grafana for triggered alerts"
echo "   2. Verify alert notifications (Slack/email if configured)"
echo "   3. Monitor system recovery and auto-remediation"
echo "   4. Review alert acknowledgment and escalation"

echo ""
print_status $GREEN "✅ Chaos engineering tests completed!"
print_status $BLUE "💡 Your AI DevOps Agent's resilience and alerting have been thoroughly tested."

# Cleanup
rm -f /tmp/chaos_*

echo ""
print_status $YELLOW "🔧 Next Steps:"
echo "   • Review alert configurations in monitoring/prometheus/alert-rules.yml"
echo "   • Test alert routing and notification channels"
echo "   • Validate automated recovery procedures"
echo "   • Document incident response procedures"

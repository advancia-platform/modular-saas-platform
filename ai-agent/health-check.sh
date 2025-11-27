#!/bin/bash

# Production Health Check Script
# Comprehensive health monitoring for all production components

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/cybersecurity-ai/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HEALTH_STATUS_FILE="/tmp/health-status.json"

# Default ports (can be overridden by environment)
AI_AGENT_PORT="${AI_AGENT_PORT:-3001}"
DASHBOARD_PORT="${DASHBOARD_PORT:-3000}"
INTEGRATION_PORT="${INTEGRATION_SERVER_PORT:-8000}"
DATABASE_PORT="${DATABASE_PORT:-5432}"
REDIS_PORT="${REDIS_PORT:-6379}"
NGINX_PORT="${NGINX_PORT:-80}"
NGINX_SSL_PORT="${NGINX_SSL_PORT:-443}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${TIMESTAMP} $1" | tee -a "${LOG_FILE}"
}

# Health check function
check_service() {
    local service_name="$1"
    local host="${2:-localhost}"
    local port="$3"
    local endpoint="${4:-/health}"
    local timeout="${5:-10}"

    echo -n "Checking ${service_name}... "

    if curl -sf --max-time "${timeout}" "http://${host}:${port}${endpoint}" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

# Database check function
check_database() {
    echo -n "Checking database connection... "

    if docker exec cybersecurity_ai_database pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Database accessible${NC}"
        return 0
    else
        echo -e "${RED}✗ Database connection failed${NC}"
        return 1
    fi
}

# Redis check function
check_redis() {
    echo -n "Checking Redis connection... "

    if docker exec cybersecurity_ai_redis redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis accessible${NC}"
        return 0
    else
        echo -e "${RED}✗ Redis connection failed${NC}"
        return 1
    fi
}

# SSL certificate check
check_ssl_certificate() {
    echo -n "Checking SSL certificate... "

    if [ -f "/etc/ssl/certs/cybersecurity-ai.crt" ] && [ -f "/etc/ssl/private/cybersecurity-ai.key" ]; then
        # Check certificate validity
        if openssl x509 -in /etc/ssl/certs/cybersecurity-ai.crt -noout -checkend 2592000 >/dev/null 2>&1; then
            echo -e "${GREEN}✓ SSL certificate valid (expires > 30 days)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠ SSL certificate expires within 30 days${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ SSL certificate files missing${NC}"
        return 1
    fi
}

# Docker container health check
check_docker_containers() {
    echo "Checking Docker containers..."

    local containers=(
        "cybersecurity_ai_main"
        "cybersecurity_ai_dashboard"
        "cybersecurity_ai_database"
        "cybersecurity_ai_redis"
        "cybersecurity_ai_nginx"
        "cybersecurity_ai_prometheus"
        "cybersecurity_ai_grafana"
        "cybersecurity_ai_elasticsearch"
    )

    local healthy=0
    local total=${#containers[@]}

    for container in "${containers[@]}"; do
        if docker ps --filter "name=${container}" --filter "status=running" --format "{{.Names}}" | grep -q "${container}"; then
            echo -e "  ${GREEN}✓ ${container}${NC}"
            ((healthy++))
        else
            echo -e "  ${RED}✗ ${container}${NC}"
        fi
    done

    echo "Container health: ${healthy}/${total} containers running"

    if [ "${healthy}" -eq "${total}" ]; then
        return 0
    else
        return 1
    fi
}

# Memory usage check
check_memory_usage() {
    echo -n "Checking memory usage... "

    local memory_usage=$(free | grep '^Mem:' | awk '{printf "%.1f", $3/$2 * 100.0}')
    local memory_threshold=85.0

    if (( $(echo "${memory_usage} < ${memory_threshold}" | bc -l) )); then
        echo -e "${GREEN}✓ Memory usage: ${memory_usage}%${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ High memory usage: ${memory_usage}%${NC}"
        return 1
    fi
}

# Disk usage check
check_disk_usage() {
    echo -n "Checking disk usage... "

    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    local disk_threshold=85

    if [ "${disk_usage}" -lt "${disk_threshold}" ]; then
        echo -e "${GREEN}✓ Disk usage: ${disk_usage}%${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ High disk usage: ${disk_usage}%${NC}"
        return 1
    fi
}

# Load average check
check_load_average() {
    echo -n "Checking system load... "

    local load_1min=$(uptime | awk -F'load average:' '{print $2}' | awk -F', ' '{print $1}' | xargs)
    local cpu_cores=$(nproc)
    local load_threshold=$(echo "${cpu_cores} * 0.8" | bc)

    if (( $(echo "${load_1min} < ${load_threshold}" | bc -l) )); then
        echo -e "${GREEN}✓ Load average: ${load_1min} (threshold: ${load_threshold})${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ High load average: ${load_1min} (threshold: ${load_threshold})${NC}"
        return 1
    fi
}

# Network connectivity check
check_network_connectivity() {
    echo "Checking network connectivity..."

    local endpoints=(
        "google.com:80"
        "github.com:443"
    )

    local connected=0
    local total=${#endpoints[@]}

    for endpoint in "${endpoints[@]}"; do
        local host=$(echo "${endpoint}" | cut -d: -f1)
        local port=$(echo "${endpoint}" | cut -d: -f2)

        if timeout 5 bash -c "</dev/tcp/${host}/${port}" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓ ${endpoint}${NC}"
            ((connected++))
        else
            echo -e "  ${RED}✗ ${endpoint}${NC}"
        fi
    done

    echo "Network connectivity: ${connected}/${total} endpoints reachable"

    if [ "${connected}" -eq "${total}" ]; then
        return 0
    else
        return 1
    fi
}

# Log analysis check
check_recent_errors() {
    echo -n "Checking for recent errors... "

    local error_count
    error_count=$(docker logs cybersecurity_ai_main --since="5m" 2>&1 | grep -i "error" | wc -l)

    if [ "${error_count}" -eq 0 ]; then
        echo -e "${GREEN}✓ No errors in last 5 minutes${NC}"
        return 0
    elif [ "${error_count}" -lt 5 ]; then
        echo -e "${YELLOW}⚠ ${error_count} errors in last 5 minutes${NC}"
        return 1
    else
        echo -e "${RED}✗ ${error_count} errors in last 5 minutes${NC}"
        return 1
    fi
}

# Generate health status JSON
generate_health_status() {
    local overall_status="$1"
    local timestamp="$2"

    cat > "${HEALTH_STATUS_FILE}" <<EOF
{
    "timestamp": "${timestamp}",
    "overall_status": "${overall_status}",
    "checks": {
        "ai_agent": $(check_service "AI Agent" localhost "${AI_AGENT_PORT}" "/health" 5 && echo "true" || echo "false"),
        "dashboard": $(check_service "Dashboard" localhost "${DASHBOARD_PORT}" "/" 5 && echo "true" || echo "false"),
        "database": $(check_database && echo "true" || echo "false"),
        "redis": $(check_redis && echo "true" || echo "false"),
        "containers": $(check_docker_containers >/dev/null && echo "true" || echo "false"),
        "ssl_certificate": $(check_ssl_certificate && echo "true" || echo "false"),
        "memory": $(check_memory_usage && echo "true" || echo "false"),
        "disk": $(check_disk_usage && echo "true" || echo "false"),
        "load": $(check_load_average && echo "true" || echo "false"),
        "network": $(check_network_connectivity >/dev/null && echo "true" || echo "false"),
        "errors": $(check_recent_errors && echo "true" || echo "false")
    },
    "system_info": {
        "uptime": "$(uptime -p)",
        "memory_usage": "$(free | grep '^Mem:' | awk '{printf "%.1f", $3/$2 * 100.0}')%",
        "disk_usage": "$(df / | tail -1 | awk '{print $5}')",
        "load_average": "$(uptime | awk -F'load average:' '{print $2}' | awk -F', ' '{print $1}' | xargs)"
    }
}
EOF
}

# Main health check function
main() {
    echo "================================================"
    echo "Cybersecurity AI - Production Health Check"
    echo "================================================"
    echo "Started at: ${TIMESTAMP}"
    echo ""

    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "${LOG_FILE}")"

    local failed_checks=0

    # Core service checks
    check_service "AI Agent" localhost "${AI_AGENT_PORT}" "/health" 10 || ((failed_checks++))
    check_service "Dashboard" localhost "${DASHBOARD_PORT}" "/" 10 || ((failed_checks++))
    check_service "Integration Server" localhost "${INTEGRATION_PORT}" "/health" 10 || ((failed_checks++))

    # Infrastructure checks
    check_database || ((failed_checks++))
    check_redis || ((failed_checks++))
    check_docker_containers || ((failed_checks++))

    # Security checks
    check_ssl_certificate || ((failed_checks++))

    # System resource checks
    check_memory_usage || ((failed_checks++))
    check_disk_usage || ((failed_checks++))
    check_load_average || ((failed_checks++))

    # Network and error checks
    check_network_connectivity || ((failed_checks++))
    check_recent_errors || ((failed_checks++))

    echo ""
    echo "================================================"

    local overall_status
    if [ "${failed_checks}" -eq 0 ]; then
        overall_status="healthy"
        echo -e "${GREEN}✓ Overall Status: HEALTHY${NC}"
        log "INFO: Health check passed - all systems operational"
    elif [ "${failed_checks}" -lt 3 ]; then
        overall_status="degraded"
        echo -e "${YELLOW}⚠ Overall Status: DEGRADED (${failed_checks} issues detected)${NC}"
        log "WARN: Health check detected ${failed_checks} issues"
    else
        overall_status="unhealthy"
        echo -e "${RED}✗ Overall Status: UNHEALTHY (${failed_checks} issues detected)${NC}"
        log "ERROR: Health check failed - ${failed_checks} critical issues"
    fi

    echo "================================================"

    # Generate health status JSON
    generate_health_status "${overall_status}" "${TIMESTAMP}"

    # Exit with appropriate code
    if [ "${failed_checks}" -eq 0 ]; then
        exit 0
    elif [ "${failed_checks}" -lt 3 ]; then
        exit 1
    else
        exit 2
    fi
}

# Handle script arguments
case "${1:-check}" in
    "check")
        main
        ;;
    "status")
        if [ -f "${HEALTH_STATUS_FILE}" ]; then
            cat "${HEALTH_STATUS_FILE}"
        else
            echo "No health status file found. Run health check first."
            exit 1
        fi
        ;;
    "log")
        if [ -f "${LOG_FILE}" ]; then
            tail -f "${LOG_FILE}"
        else
            echo "No log file found."
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 [check|status|log]"
        echo ""
        echo "Commands:"
        echo "  check   - Run comprehensive health check (default)"
        echo "  status  - Show last health check status"
        echo "  log     - Tail health check log file"
        exit 1
        ;;
esac

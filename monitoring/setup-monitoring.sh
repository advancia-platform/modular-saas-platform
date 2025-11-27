#!/bin/bash

# Advancia Pay Monitoring Stack Setup Script
# This script sets up the complete monitoring infrastructure

set -e

echo "🚀 Setting up Advancia Pay Monitoring Stack..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking required environment variables..."

    required_vars=(
        "PAGERDUTY_ROUTING_KEY"
        "SLACK_WEBHOOK_URL"
        "TEAMS_WEBHOOK_URL"
        "DATABASE_URL"
    )

    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables in your environment or .env file"
        exit 1
    fi

    print_success "All required environment variables are set"
}

# Create monitoring directory structure
create_directories() {
    print_status "Creating monitoring directory structure..."

    directories=(
        "monitoring/prometheus"
        "monitoring/grafana/dashboards"
        "monitoring/grafana/datasources"
        "monitoring/alertmanager"
        "monitoring/blackbox"
        "monitoring/postgres-exporter"
        "monitoring/logs"
    )

    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        print_success "Created directory: $dir"
    done
}

# Generate Blackbox exporter config
create_blackbox_config() {
    print_status "Creating Blackbox exporter configuration..."

    cat > monitoring/blackbox/blackbox.yml << 'EOF'
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: [200, 201, 202]
      method: GET
      follow_redirects: true
      preferred_ip_protocol: "ip4"

  http_post_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: [200, 201, 202]
      method: POST
      headers:
        Content-Type: application/json
      body: '{"health": "check"}'

  tcp_connect:
    prober: tcp
    timeout: 5s

  dns_lookup:
    prober: dns
    timeout: 5s
    dns:
      query_name: "advancia.pay"
      query_type: "A"
EOF

    print_success "Blackbox configuration created"
}

# Generate PostgreSQL exporter queries
create_postgres_queries() {
    print_status "Creating PostgreSQL exporter queries..."

    cat > monitoring/postgres-exporter/queries.yaml << 'EOF'
pg_replication:
  query: "SELECT CASE WHEN NOT pg_is_in_recovery() THEN 0 ELSE GREATEST (0, EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))) END AS lag"
  master: true
  metrics:
    - lag:
        usage: "GAUGE"
        description: "Replication lag behind master in seconds"

pg_postmaster:
  query: "SELECT pg_postmaster_start_time as start_time_seconds from pg_postmaster_start_time()"
  master: true
  metrics:
    - start_time_seconds:
        usage: "GAUGE"
        description: "Time at which postmaster started"

pg_stat_user_tables:
  query: |
    SELECT
      current_database() datname,
      schemaname,
      relname,
      seq_scan,
      seq_tup_read,
      idx_scan,
      idx_tup_fetch,
      n_tup_ins,
      n_tup_upd,
      n_tup_del,
      n_tup_hot_upd,
      n_live_tup,
      n_dead_tup,
      vacuum_count,
      autovacuum_count,
      analyze_count,
      autoanalyze_count
    FROM pg_stat_user_tables
  metrics:
    - datname:
        usage: "LABEL"
        description: "Name of current database"
    - schemaname:
        usage: "LABEL"
        description: "Name of the schema that this table is in"
    - relname:
        usage: "LABEL"
        description: "Name of this table"
    - seq_scan:
        usage: "COUNTER"
        description: "Number of sequential scans initiated on this table"
    - seq_tup_read:
        usage: "COUNTER"
        description: "Number of live rows fetched by sequential scans"
    - idx_scan:
        usage: "COUNTER"
        description: "Number of index scans initiated on this table"
    - idx_tup_fetch:
        usage: "COUNTER"
        description: "Number of live rows fetched by index scans"
    - n_tup_ins:
        usage: "COUNTER"
        description: "Number of rows inserted"
    - n_tup_upd:
        usage: "COUNTER"
        description: "Number of rows updated"
    - n_tup_del:
        usage: "COUNTER"
        description: "Number of rows deleted"
    - n_tup_hot_upd:
        usage: "COUNTER"
        description: "Number of rows HOT updated"
    - n_live_tup:
        usage: "GAUGE"
        description: "Estimated number of live rows"
    - n_dead_tup:
        usage: "GAUGE"
        description: "Estimated number of dead rows"
    - vacuum_count:
        usage: "COUNTER"
        description: "Number of times this table has been manually vacuumed"
    - autovacuum_count:
        usage: "COUNTER"
        description: "Number of times this table has been vacuumed by the autovacuum daemon"
    - analyze_count:
        usage: "COUNTER"
        description: "Number of times this table has been manually analyzed"
    - autoanalyze_count:
        usage: "COUNTER"
        description: "Number of times this table has been analyzed by the autovacuum daemon"
EOF

    print_success "PostgreSQL queries configuration created"
}

# Start monitoring services
start_services() {
    print_status "Starting monitoring services..."

    cd monitoring

    # Pull latest images
    print_status "Pulling latest Docker images..."
    docker-compose pull

    # Start services
    print_status "Starting monitoring stack..."
    docker-compose up -d

    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 30

    # Check service health
    services=("prometheus" "alertmanager" "grafana" "node-exporter")
    for service in "${services[@]}"; do
        if docker-compose ps | grep -q "$service.*Up"; then
            print_success "$service is running"
        else
            print_error "$service failed to start"
            docker-compose logs "$service"
        fi
    done

    cd ..
}

# Import Grafana dashboard
import_dashboard() {
    print_status "Importing Grafana dashboard..."

    # Wait for Grafana to be ready
    timeout=60
    counter=0
    until curl -s -f -o /dev/null http://localhost:3001/api/health || [ $counter -eq $timeout ]; do
        sleep 2
        counter=$((counter + 2))
    done

    if [ $counter -eq $timeout ]; then
        print_error "Grafana failed to start within timeout"
        return 1
    fi

    # Import dashboard
    curl -X POST \
        -H "Content-Type: application/json" \
        -u "${GRAFANA_ADMIN_USER:-admin}:${GRAFANA_ADMIN_PASSWORD:-admin}" \
        -d @monitoring/grafana/dashboards/advancia-pay-production.json \
        http://localhost:3001/api/dashboards/db

    print_success "Dashboard imported to Grafana"
}

# Validate monitoring setup
validate_setup() {
    print_status "Validating monitoring setup..."

    # Check Prometheus targets
    targets_response=$(curl -s http://localhost:9090/api/v1/targets)
    active_targets=$(echo "$targets_response" | jq '.data.activeTargets | length')
    print_status "Prometheus has $active_targets active targets"

    # Check Alertmanager config
    if curl -s -f -o /dev/null http://localhost:9093/-/ready; then
        print_success "Alertmanager is ready"
    else
        print_error "Alertmanager is not ready"
    fi

    # Check Grafana
    if curl -s -f -o /dev/null http://localhost:3001/api/health; then
        print_success "Grafana is ready"
    else
        print_error "Grafana is not ready"
    fi
}

# Print access information
print_access_info() {
    echo ""
    echo "🎉 Monitoring stack setup complete!"
    echo ""
    echo "Access URLs:"
    echo "  📊 Grafana:      http://localhost:3001 (admin/admin)"
    echo "  📈 Prometheus:   http://localhost:9090"
    echo "  🔔 Alertmanager: http://localhost:9093"
    echo "  🖥️  Node Export.: http://localhost:9100"
    echo ""
    echo "Default credentials:"
    echo "  Grafana: admin / admin (change on first login)"
    echo ""
    echo "Next steps:"
    echo "  1. Update Grafana admin password"
    echo "  2. Configure notification channels in Alertmanager"
    echo "  3. Test alert rules with simulated failures"
    echo "  4. Set up external monitoring from GitHub Actions"
    echo ""
}

# Main execution
main() {
    echo "==================================="
    echo "Advancia Pay Monitoring Setup"
    echo "==================================="
    echo ""

    check_env_vars
    create_directories
    create_blackbox_config
    create_postgres_queries
    start_services
    import_dashboard
    validate_setup
    print_access_info

    print_success "Setup completed successfully!"
}

# Run main function
main "$@"

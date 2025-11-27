# Advancia Pay Monitoring Stack Setup Script (PowerShell)
# This script sets up the complete monitoring infrastructure for Windows

param(
    [switch]$SkipValidation,
    [switch]$Force
)

# Color functions for output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if required environment variables are set
function Test-EnvironmentVariables {
    Write-Status "Checking required environment variables..."

    $requiredVars = @(
        'PAGERDUTY_ROUTING_KEY',
        'SLACK_WEBHOOK_URL',
        'TEAMS_WEBHOOK_URL',
        'DATABASE_URL'
    )

    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ([string]::IsNullOrEmpty($env:$var)) {
            $missingVars += $var
        }
    }

    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  - $var" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Please set these variables in your environment or .env file"
        if (-not $Force) {
            exit 1
        }
    }

    Write-Success "All required environment variables are set"
}

# Create monitoring directory structure
function New-MonitoringDirectories {
    Write-Status "Creating monitoring directory structure..."

    $directories = @(
        'monitoring\prometheus',
        'monitoring\grafana\dashboards',
        'monitoring\grafana\datasources',
        'monitoring\alertmanager',
        'monitoring\blackbox',
        'monitoring\postgres-exporter',
        'monitoring\logs'
    )

    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Created directory: $dir"
        } else {
            Write-Status "Directory already exists: $dir"
        }
    }
}

# Generate Blackbox exporter config
function New-BlackboxConfig {
    Write-Status "Creating Blackbox exporter configuration..."

    $blackboxConfig = @'
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
'@

    $blackboxConfig | Out-File -FilePath "monitoring\blackbox\blackbox.yml" -Encoding UTF8
    Write-Success "Blackbox configuration created"
}

# Generate PostgreSQL exporter queries
function New-PostgresQueries {
    Write-Status "Creating PostgreSQL exporter queries..."

    $postgresQueries = @'
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
'@

    $postgresQueries | Out-File -FilePath "monitoring\postgres-exporter\queries.yaml" -Encoding UTF8
    Write-Success "PostgreSQL queries configuration created"
}

# Start monitoring services
function Start-MonitoringServices {
    Write-Status "Starting monitoring services..."

    Push-Location "monitoring"

    try {
        # Check if Docker is running
        $dockerRunning = docker info 2>$null
        if (-not $dockerRunning) {
            Write-Error "Docker is not running. Please start Docker Desktop and try again."
            return $false
        }

        # Pull latest images
        Write-Status "Pulling latest Docker images..."
        docker-compose pull

        # Start services
        Write-Status "Starting monitoring stack..."
        docker-compose up -d

        # Wait for services to be healthy
        Write-Status "Waiting for services to start..."
        Start-Sleep 30

        # Check service health
        $services = @('prometheus', 'alertmanager', 'grafana', 'node-exporter')
        foreach ($service in $services) {
            $serviceStatus = docker-compose ps $service
            if ($serviceStatus -match "Up") {
                Write-Success "$service is running"
            } else {
                Write-Error "$service failed to start"
                docker-compose logs $service
            }
        }

        return $true
    }
    catch {
        Write-Error "Failed to start monitoring services: $($_.Exception.Message)"
        return $false
    }
    finally {
        Pop-Location
    }
}

# Import Grafana dashboard
function Import-GrafanaDashboard {
    Write-Status "Importing Grafana dashboard..."

    # Wait for Grafana to be ready
    $timeout = 60
    $counter = 0

    do {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -ErrorAction SilentlyContinue -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                break
            }
        }
        catch {
            # Grafana not ready yet
        }

        Start-Sleep 2
        $counter += 2
    } while ($counter -lt $timeout)

    if ($counter -ge $timeout) {
        Write-Error "Grafana failed to start within timeout"
        return $false
    }

    # Import dashboard
    try {
        $dashboardJson = Get-Content "monitoring\grafana\dashboards\advancia-pay-production.json" -Raw
        $adminUser = if ($env:GRAFANA_ADMIN_USER) { $env:GRAFANA_ADMIN_USER } else { "admin" }
        $adminPass = if ($env:GRAFANA_ADMIN_PASSWORD) { $env:GRAFANA_ADMIN_PASSWORD } else { "admin" }

        $credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${adminUser}:${adminPass}"))
        $headers = @{
            "Authorization" = "Basic $credentials"
            "Content-Type" = "application/json"
        }

        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/dashboards/db" -Method POST -Body $dashboardJson -Headers $headers
        Write-Success "Dashboard imported to Grafana"
        return $true
    }
    catch {
        Write-Warning "Failed to import dashboard: $($_.Exception.Message)"
        return $false
    }
}

# Validate monitoring setup
function Test-MonitoringSetup {
    if ($SkipValidation) {
        Write-Status "Skipping validation as requested"
        return $true
    }

    Write-Status "Validating monitoring setup..."

    try {
        # Check Prometheus targets
        $response = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/targets" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $targets = ($response.Content | ConvertFrom-Json).data.activeTargets
            Write-Status "Prometheus has $($targets.Count) active targets"
        }

        # Check Alertmanager
        $response = Invoke-WebRequest -Uri "http://localhost:9093/-/ready" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Alertmanager is ready"
        } else {
            Write-Error "Alertmanager is not ready"
        }

        # Check Grafana
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "Grafana is ready"
        } else {
            Write-Error "Grafana is not ready"
        }

        return $true
    }
    catch {
        Write-Error "Validation failed: $($_.Exception.Message)"
        return $false
    }
}

# Print access information
function Show-AccessInfo {
    Write-Host ""
    Write-Host "🎉 Monitoring stack setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access URLs:"
    Write-Host "  📊 Grafana:      http://localhost:3001 (admin/admin)" -ForegroundColor Cyan
    Write-Host "  📈 Prometheus:   http://localhost:9090" -ForegroundColor Cyan
    Write-Host "  🔔 Alertmanager: http://localhost:9093" -ForegroundColor Cyan
    Write-Host "  🖥️  Node Export.: http://localhost:9100" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Default credentials:"
    Write-Host "  Grafana: admin / admin (change on first login)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Update Grafana admin password"
    Write-Host "  2. Configure notification channels in Alertmanager"
    Write-Host "  3. Test alert rules with simulated failures"
    Write-Host "  4. Set up external monitoring from GitHub Actions"
    Write-Host ""
}

# Main execution
function Main {
    Write-Host "===================================" -ForegroundColor Blue
    Write-Host "Advancia Pay Monitoring Setup" -ForegroundColor Blue
    Write-Host "===================================" -ForegroundColor Blue
    Write-Host ""

    try {
        Test-EnvironmentVariables
        New-MonitoringDirectories
        New-BlackboxConfig
        New-PostgresQueries

        if (Start-MonitoringServices) {
            Import-GrafanaDashboard | Out-Null
            Test-MonitoringSetup | Out-Null
            Show-AccessInfo
            Write-Success "Setup completed successfully!"
            return $true
        } else {
            Write-Error "Failed to start monitoring services"
            return $false
        }
    }
    catch {
        Write-Error "Setup failed: $($_.Exception.Message)"
        return $false
    }
}

# Run main function
$success = Main
if (-not $success) {
    exit 1
}

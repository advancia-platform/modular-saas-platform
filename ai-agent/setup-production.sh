#!/bin/bash

# Production Environment Setup Script
# Prepares the production environment with proper configuration and secrets

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.production"
ENV_TEMPLATE="${SCRIPT_DIR}/.env.production.template"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Generate secure random string
generate_secret() {
    local length="${1:-32}"
    openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
}

# Generate secure password
generate_password() {
    local length="${1:-32}"
    openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
}

# Validate domain name
validate_domain() {
    local domain="$1"
    if [[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        return 0
    else
        return 1
    fi
}

# Check if environment file exists
check_existing_env() {
    if [ -f "${ENV_FILE}" ]; then
        log "${YELLOW}⚠ Production environment file already exists${NC}"
        read -p "Do you want to overwrite it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Aborting setup. Existing environment preserved."
            exit 0
        fi

        # Backup existing file
        cp "${ENV_FILE}" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
        log "${BLUE}Existing file backed up${NC}"
    fi
}

# Collect user input
collect_configuration() {
    log "${BLUE}Collecting production configuration...${NC}"
    echo ""

    # Domain configuration
    while true; do
        read -p "Enter your domain name (e.g., example.com): " DOMAIN
        if validate_domain "${DOMAIN}"; then
            break
        else
            echo "Invalid domain name. Please try again."
        fi
    done

    read -p "Enter additional domains (comma-separated, optional): " ADDITIONAL_DOMAINS

    # Database configuration
    echo ""
    echo "Database Configuration:"
    read -p "Database name [cybersecurity_ai]: " DB_NAME
    DB_NAME="${DB_NAME:-cybersecurity_ai}"

    read -p "Database username [cybersec_user]: " DB_USER
    DB_USER="${DB_USER:-cybersec_user}"

    read -s -p "Database password (leave empty to auto-generate): " DB_PASSWORD
    echo
    if [ -z "${DB_PASSWORD}" ]; then
        DB_PASSWORD=$(generate_password)
        log "Auto-generated database password"
    fi

    # Redis configuration
    echo ""
    read -s -p "Redis password (leave empty to auto-generate): " REDIS_PASSWORD
    echo
    if [ -z "${REDIS_PASSWORD}" ]; then
        REDIS_PASSWORD=$(generate_password)
        log "Auto-generated Redis password"
    fi

    # Email configuration
    echo ""
    echo "Email Configuration:"
    read -p "SMTP host [smtp.${DOMAIN}]: " SMTP_HOST
    SMTP_HOST="${SMTP_HOST:-smtp.${DOMAIN}}"

    read -p "SMTP port [587]: " SMTP_PORT
    SMTP_PORT="${SMTP_PORT:-587}"

    read -p "SMTP username [notifications@${DOMAIN}]: " SMTP_USER
    SMTP_USER="${SMTP_USER:-notifications@${DOMAIN}}"

    read -s -p "SMTP password: " SMTP_PASSWORD
    echo

    read -p "Admin email [admin@${DOMAIN}]: " ADMIN_EMAIL
    ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN}}"

    # SSL configuration
    echo ""
    echo "SSL Configuration:"
    read -p "Enable SSL? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        SSL_ENABLED="false"
    else
        SSL_ENABLED="true"
    fi

    # Monitoring configuration
    echo ""
    echo "Monitoring Configuration:"
    read -p "Enable metrics collection? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        METRICS_ENABLED="false"
    else
        METRICS_ENABLED="true"
    fi

    read -p "Prometheus metrics port [9090]: " PROMETHEUS_PORT
    PROMETHEUS_PORT="${PROMETHEUS_PORT:-9090}"

    # External services (optional)
    echo ""
    echo "External Services (Optional - press Enter to skip):"
    read -p "Threat Intelligence API key: " THREAT_INTEL_KEY
    read -p "Slack webhook URL for alerts: " SLACK_WEBHOOK
    read -p "SIEM integration URL: " SIEM_URL

    log "${GREEN}✓ Configuration collected${NC}"
}

# Generate environment file
generate_env_file() {
    log "${BLUE}Generating production environment file...${NC}"

    # Generate secrets
    JWT_SECRET=$(generate_secret 64)
    ENCRYPTION_KEY=$(generate_secret 32)
    SESSION_SECRET=$(generate_secret 32)

    # Create environment file from template
    cp "${ENV_TEMPLATE}" "${ENV_FILE}"

    # Replace placeholders with actual values
    sed -i "s/yourdomain\.com/${DOMAIN}/g" "${ENV_FILE}"

    # Update database configuration
    sed -i "s/cybersec_user:CHANGE_THIS_PASSWORD@database:5432\/cybersecurity_ai/cybersec_user:${DB_PASSWORD}@database:5432\/${DB_NAME}/g" "${ENV_FILE}"

    # Update Redis configuration
    sed -i "s/:CHANGE_THIS_PASSWORD@redis:6379/:${REDIS_PASSWORD}@redis:6379/g" "${ENV_FILE}"

    # Update security secrets
    sed -i "s/JWT_SECRET=CHANGE_THIS_TO_A_STRONG_32_CHAR_SECRET/JWT_SECRET=${JWT_SECRET}/g" "${ENV_FILE}"
    sed -i "s/ENCRYPTION_KEY=CHANGE_THIS_TO_A_STRONG_32_CHAR_SECRET/ENCRYPTION_KEY=${ENCRYPTION_KEY}/g" "${ENV_FILE}"
    sed -i "s/SESSION_SECRET=CHANGE_THIS_TO_A_STRONG_32_CHAR_SECRET/SESSION_SECRET=${SESSION_SECRET}/g" "${ENV_FILE}"

    # Update email configuration
    sed -i "s/SMTP_HOST=smtp\.yourdomain\.com/SMTP_HOST=${SMTP_HOST}/g" "${ENV_FILE}"
    sed -i "s/SMTP_PORT=587/SMTP_PORT=${SMTP_PORT}/g" "${ENV_FILE}"
    sed -i "s/SMTP_USER=notifications@yourdomain\.com/SMTP_USER=${SMTP_USER}/g" "${ENV_FILE}"
    sed -i "s/SMTP_PASS=CHANGE_THIS_EMAIL_PASSWORD/SMTP_PASS=${SMTP_PASSWORD}/g" "${ENV_FILE}"
    sed -i "s/CRITICAL_ALERT_EMAIL=admin@yourdomain\.com/CRITICAL_ALERT_EMAIL=${ADMIN_EMAIL}/g" "${ENV_FILE}"

    # Update SSL configuration
    sed -i "s/SSL_ENABLED=true/SSL_ENABLED=${SSL_ENABLED}/g" "${ENV_FILE}"

    # Update monitoring configuration
    sed -i "s/METRICS_COLLECTION_ENABLED=true/METRICS_COLLECTION_ENABLED=${METRICS_ENABLED}/g" "${ENV_FILE}"
    sed -i "s/PROMETHEUS_METRICS_PORT=9090/PROMETHEUS_METRICS_PORT=${PROMETHEUS_PORT}/g" "${ENV_FILE}"

    # Update external services if provided
    if [ -n "${THREAT_INTEL_KEY}" ]; then
        sed -i "s/THREAT_INTELLIGENCE_API_KEY=your_threat_intel_api_key_here/THREAT_INTELLIGENCE_API_KEY=${THREAT_INTEL_KEY}/g" "${ENV_FILE}"
    fi

    if [ -n "${SLACK_WEBHOOK}" ]; then
        sed -i "s|ALERT_WEBHOOK_URL=https://hooks\.slack\.com/services/YOUR/SLACK/WEBHOOK|ALERT_WEBHOOK_URL=${SLACK_WEBHOOK}|g" "${ENV_FILE}"
    fi

    if [ -n "${SIEM_URL}" ]; then
        sed -i "s|SIEM_INTEGRATION_URL=https://siem\.yourdomain\.com/api|SIEM_INTEGRATION_URL=${SIEM_URL}|g" "${ENV_FILE}"
    fi

    # Update CORS origins
    if [ -n "${ADDITIONAL_DOMAINS}" ]; then
        local cors_origins="https://${DOMAIN}"
        IFS=',' read -ra DOMAINS <<< "${ADDITIONAL_DOMAINS}"
        for domain in "${DOMAINS[@]}"; do
            cors_origins+=",https://${domain}"
        done
        sed -i "s/CORS_ORIGINS=https:\/\/yourdomain\.com,https:\/\/www\.yourdomain\.com,https:\/\/api\.yourdomain\.com/CORS_ORIGINS=${cors_origins}/g" "${ENV_FILE}"
    else
        sed -i "s/CORS_ORIGINS=https:\/\/yourdomain\.com,https:\/\/www\.yourdomain\.com,https:\/\/api\.yourdomain\.com/CORS_ORIGINS=https:\/\/${DOMAIN},https:\/\/www\.${DOMAIN},https:\/\/api\.${DOMAIN}/g" "${ENV_FILE}"
    fi

    log "${GREEN}✓ Environment file generated${NC}"
}

# Set proper file permissions
secure_env_file() {
    log "${BLUE}Setting secure file permissions...${NC}"

    # Set restrictive permissions on environment file
    chmod 600 "${ENV_FILE}"

    # Change ownership to current user
    chown "$(whoami)":"$(whoami)" "${ENV_FILE}"

    log "${GREEN}✓ File permissions secured${NC}"
}

# Generate database initialization script
generate_db_init() {
    log "${BLUE}Generating database initialization script...${NC}"

    cat > "${SCRIPT_DIR}/init-database.sql" <<EOF
-- Database Initialization Script
-- Creates user and database for Cybersecurity AI system

-- Create database user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Connect to the new database
\c ${DB_NAME}

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
EOF

    chmod 600 "${SCRIPT_DIR}/init-database.sql"

    log "${GREEN}✓ Database initialization script generated${NC}"
}

# Display setup summary
display_summary() {
    log "${GREEN}Production Environment Setup Complete!${NC}"
    echo ""
    echo "=========================================="
    echo "Configuration Summary:"
    echo "=========================================="
    echo "Domain: ${DOMAIN}"
    echo "Database: ${DB_NAME}"
    echo "Database User: ${DB_USER}"
    echo "SSL Enabled: ${SSL_ENABLED}"
    echo "Metrics Enabled: ${METRICS_ENABLED}"
    echo "Admin Email: ${ADMIN_EMAIL}"
    echo ""
    echo "Files Created:"
    echo "- ${ENV_FILE}"
    echo "- ${SCRIPT_DIR}/init-database.sql"
    if [ -f "${ENV_FILE}.backup.$(date +%Y%m%d)_"* ]; then
        echo "- Backup of previous environment file"
    fi
    echo ""
    echo "=========================================="
    echo "Next Steps:"
    echo "=========================================="
    echo "1. Review the generated .env.production file"
    echo "2. Set up SSL certificates:"
    echo "   sudo ./setup-ssl.sh --letsencrypt"
    echo "3. Initialize the database:"
    echo "   sudo -u postgres psql < init-database.sql"
    echo "4. Deploy the application:"
    echo "   ./deploy-production.sh"
    echo "5. Run health checks:"
    echo "   ./health-check.sh"
    echo ""
    echo "Security Notes:"
    echo "- Environment file permissions are set to 600 (owner read/write only)"
    echo "- All secrets have been auto-generated with secure random values"
    echo "- Database password and other credentials are stored securely"
    echo "- Review firewall settings and network security"
    echo ""
    echo "Documentation:"
    echo "- API documentation: https://${DOMAIN}/docs"
    echo "- Health check: https://${DOMAIN}/health"
    echo "- Metrics endpoint: https://${DOMAIN}/metrics"
    echo ""
}

# Main setup function
main() {
    echo "========================================"
    echo "Cybersecurity AI - Production Setup"
    echo "========================================"
    echo ""

    # Check if template exists
    if [ ! -f "${ENV_TEMPLATE}" ]; then
        log "${RED}✗ Environment template not found: ${ENV_TEMPLATE}${NC}"
        exit 1
    fi

    # Check for required tools
    local required_tools=("openssl" "sed")
    for tool in "${required_tools[@]}"; do
        if ! command -v "${tool}" &> /dev/null; then
            log "${RED}✗ Required tool not found: ${tool}${NC}"
            exit 1
        fi
    done

    # Run setup steps
    check_existing_env
    collect_configuration
    generate_env_file
    secure_env_file
    generate_db_init
    display_summary

    log "${GREEN}✅ Production environment setup completed successfully!${NC}"
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "--help"|"help")
        echo "Production Environment Setup Script"
        echo ""
        echo "This script helps you configure the production environment"
        echo "for the Cybersecurity AI system by generating secure"
        echo "environment variables and configuration files."
        echo ""
        echo "Usage: $0 [setup]"
        echo ""
        echo "The script will:"
        echo "- Collect production configuration interactively"
        echo "- Generate secure secrets and passwords"
        echo "- Create .env.production file"
        echo "- Generate database initialization script"
        echo "- Set proper file permissions"
        echo ""
        exit 0
        ;;
    *)
        log "${RED}Unknown option: $1${NC}"
        echo "Use '$0 --help' for usage information"
        exit 1
        ;;
esac

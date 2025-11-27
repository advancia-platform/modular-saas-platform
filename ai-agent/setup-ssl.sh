#!/bin/bash

# SSL Certificate Setup Script for Production Deployment
# Generates self-signed certificates for development and provides guidance for production certificates

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="/etc/ssl/certs"
KEY_DIR="/etc/ssl/private"
CERT_NAME="cybersecurity-ai"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Domain configuration (update these for your deployment)
DOMAIN="${DOMAIN:-localhost}"
ADDITIONAL_DOMAINS="${ADDITIONAL_DOMAINS:-}"

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Create certificate directories
create_cert_directories() {
    log "${BLUE}Creating certificate directories...${NC}"

    sudo mkdir -p "${CERT_DIR}"
    sudo mkdir -p "${KEY_DIR}"

    # Set proper permissions
    sudo chmod 755 "${CERT_DIR}"
    sudo chmod 700 "${KEY_DIR}"

    log "${GREEN}✓ Certificate directories created${NC}"
}

# Generate self-signed certificate for development/testing
generate_self_signed_cert() {
    log "${YELLOW}Generating self-signed SSL certificate...${NC}"

    # Create OpenSSL configuration
    cat > /tmp/openssl.conf <<EOF
[req]
default_bits = 4096
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Cybersecurity AI
OU = IT Department
CN = ${DOMAIN}

[v3_req]
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = ${DOMAIN}
DNS.2 = localhost
DNS.3 = 127.0.0.1
EOF

    # Add additional domains if specified
    if [ -n "${ADDITIONAL_DOMAINS}" ]; then
        IFS=',' read -ra DOMAINS <<< "${ADDITIONAL_DOMAINS}"
        local counter=4
        for domain in "${DOMAINS[@]}"; do
            echo "DNS.${counter} = ${domain}" >> /tmp/openssl.conf
            ((counter++))
        done
    fi

    # Generate private key
    sudo openssl genrsa -out "${KEY_DIR}/${CERT_NAME}.key" 4096

    # Generate certificate signing request
    sudo openssl req -new -key "${KEY_DIR}/${CERT_NAME}.key" -out "/tmp/${CERT_NAME}.csr" -config /tmp/openssl.conf

    # Generate self-signed certificate
    sudo openssl x509 -req -in "/tmp/${CERT_NAME}.csr" -signkey "${KEY_DIR}/${CERT_NAME}.key" \
        -out "${CERT_DIR}/${CERT_NAME}.crt" -days 365 -extensions v3_req -extfile /tmp/openssl.conf

    # Set proper permissions
    sudo chmod 644 "${CERT_DIR}/${CERT_NAME}.crt"
    sudo chmod 600 "${KEY_DIR}/${CERT_NAME}.key"

    # Clean up temporary files
    rm -f /tmp/openssl.conf "/tmp/${CERT_NAME}.csr"

    log "${GREEN}✓ Self-signed certificate generated${NC}"
    log "Certificate: ${CERT_DIR}/${CERT_NAME}.crt"
    log "Private Key: ${KEY_DIR}/${CERT_NAME}.key"
}

# Verify certificate installation
verify_certificate() {
    log "${BLUE}Verifying certificate installation...${NC}"

    if [ -f "${CERT_DIR}/${CERT_NAME}.crt" ] && [ -f "${KEY_DIR}/${CERT_NAME}.key" ]; then
        # Check certificate validity
        local expiry_date
        expiry_date=$(openssl x509 -in "${CERT_DIR}/${CERT_NAME}.crt" -noout -enddate | cut -d= -f2)

        log "${GREEN}✓ Certificate files found${NC}"
        log "Certificate expires: ${expiry_date}"

        # Check if certificate matches private key
        local cert_hash
        local key_hash
        cert_hash=$(openssl x509 -noout -modulus -in "${CERT_DIR}/${CERT_NAME}.crt" | openssl md5)
        key_hash=$(openssl rsa -noout -modulus -in "${KEY_DIR}/${CERT_NAME}.key" | openssl md5)

        if [ "${cert_hash}" = "${key_hash}" ]; then
            log "${GREEN}✓ Certificate and private key match${NC}"
        else
            log "${RED}✗ Certificate and private key do not match${NC}"
            return 1
        fi

        # Display certificate information
        log "${BLUE}Certificate Information:${NC}"
        openssl x509 -in "${CERT_DIR}/${CERT_NAME}.crt" -noout -subject -issuer -dates

    else
        log "${RED}✗ Certificate files not found${NC}"
        return 1
    fi
}

# Setup Let's Encrypt certificate (production)
setup_letsencrypt() {
    log "${BLUE}Setting up Let's Encrypt certificate...${NC}"

    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        log "${YELLOW}Installing certbot...${NC}"

        # Install certbot based on OS
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot python3-certbot-nginx
        elif command -v dnf &> /dev/null; then
            sudo dnf install -y certbot python3-certbot-nginx
        else
            log "${RED}✗ Unable to install certbot. Please install manually.${NC}"
            return 1
        fi
    fi

    # Stop nginx temporarily for certificate generation
    if systemctl is-active --quiet nginx; then
        sudo systemctl stop nginx
        local nginx_was_running=true
    else
        local nginx_was_running=false
    fi

    # Generate Let's Encrypt certificate
    log "Generating Let's Encrypt certificate for: ${DOMAIN}"

    local certbot_cmd="sudo certbot certonly --standalone -d ${DOMAIN}"

    # Add additional domains if specified
    if [ -n "${ADDITIONAL_DOMAINS}" ]; then
        IFS=',' read -ra DOMAINS <<< "${ADDITIONAL_DOMAINS}"
        for domain in "${DOMAINS[@]}"; do
            certbot_cmd+=" -d ${domain}"
        done
    fi

    # Run certbot
    if ${certbot_cmd} --non-interactive --agree-tos --email admin@${DOMAIN}; then
        log "${GREEN}✓ Let's Encrypt certificate generated${NC}"

        # Copy certificates to expected location
        sudo cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${CERT_DIR}/${CERT_NAME}.crt"
        sudo cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${KEY_DIR}/${CERT_NAME}.key"

        # Set proper permissions
        sudo chmod 644 "${CERT_DIR}/${CERT_NAME}.crt"
        sudo chmod 600 "${KEY_DIR}/${CERT_NAME}.key"

        log "${GREEN}✓ Certificates copied to standard location${NC}"
    else
        log "${RED}✗ Let's Encrypt certificate generation failed${NC}"
        return 1
    fi

    # Restart nginx if it was running
    if [ "${nginx_was_running}" = true ]; then
        sudo systemctl start nginx
    fi

    # Setup automatic renewal
    setup_cert_renewal
}

# Setup certificate auto-renewal
setup_cert_renewal() {
    log "${BLUE}Setting up certificate auto-renewal...${NC}"

    # Create renewal script
    sudo tee /usr/local/bin/renew-ssl-cert.sh > /dev/null <<EOF
#!/bin/bash

# SSL Certificate Renewal Script
# Automatically renew Let's Encrypt certificates

set -euo pipefail

# Renew certificates
certbot renew --quiet

# Copy renewed certificates to standard location
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    cp "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" "${CERT_DIR}/${CERT_NAME}.crt"
    cp "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" "${KEY_DIR}/${CERT_NAME}.key"

    # Set proper permissions
    chmod 644 "${CERT_DIR}/${CERT_NAME}.crt"
    chmod 600 "${KEY_DIR}/${CERT_NAME}.key"

    # Restart nginx to reload certificates
    systemctl reload nginx

    echo "SSL certificates renewed successfully"
fi
EOF

    # Make renewal script executable
    sudo chmod +x /usr/local/bin/renew-ssl-cert.sh

    # Add to crontab for automatic renewal (runs twice daily)
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/renew-ssl-cert.sh") | sudo crontab -

    log "${GREEN}✓ Certificate auto-renewal configured${NC}"
}

# Generate Docker secrets for certificates
generate_docker_secrets() {
    log "${BLUE}Creating Docker secrets for SSL certificates...${NC}"

    if [ -f "${CERT_DIR}/${CERT_NAME}.crt" ] && [ -f "${KEY_DIR}/${CERT_NAME}.key" ]; then
        # Create Docker secrets (if using Docker Swarm)
        if command -v docker &> /dev/null && docker info 2>/dev/null | grep -q "Swarm: active"; then
            # Remove existing secrets if they exist
            docker secret rm ssl_certificate 2>/dev/null || true
            docker secret rm ssl_private_key 2>/dev/null || true

            # Create new secrets
            docker secret create ssl_certificate "${CERT_DIR}/${CERT_NAME}.crt"
            docker secret create ssl_private_key "${KEY_DIR}/${CERT_NAME}.key"

            log "${GREEN}✓ Docker secrets created${NC}"
        else
            log "${YELLOW}⚠ Docker Swarm not active. Skipping Docker secrets creation.${NC}"
        fi
    else
        log "${RED}✗ Certificate files not found${NC}"
        return 1
    fi
}

# Display production certificate instructions
show_production_instructions() {
    log "${BLUE}Production Certificate Setup Instructions:${NC}"
    echo ""
    echo "For production deployment, you have several options:"
    echo ""
    echo "1. Let's Encrypt (Free, Automated):"
    echo "   Run: $0 --letsencrypt"
    echo "   Requirements: Domain must be publicly accessible"
    echo ""
    echo "2. Commercial SSL Certificate:"
    echo "   - Purchase from Certificate Authority (CA)"
    echo "   - Generate CSR: openssl req -new -newkey rsa:4096 -keyout ${CERT_NAME}.key -out ${CERT_NAME}.csr"
    echo "   - Submit CSR to CA and obtain certificate"
    echo "   - Install certificate files to ${CERT_DIR}/${CERT_NAME}.crt and ${KEY_DIR}/${CERT_NAME}.key"
    echo ""
    echo "3. Cloud Provider Certificates:"
    echo "   - AWS Certificate Manager"
    echo "   - Google Cloud SSL Certificates"
    echo "   - Azure Key Vault Certificates"
    echo ""
    echo "4. Self-Signed (Development Only):"
    echo "   Run: $0 --self-signed"
    echo "   Warning: Not suitable for production use"
    echo ""
}

# Main function
main() {
    local mode="${1:-help}"

    case "${mode}" in
        "--self-signed")
            create_cert_directories
            generate_self_signed_cert
            verify_certificate
            generate_docker_secrets
            log "${GREEN}✓ Self-signed certificate setup complete${NC}"
            ;;
        "--letsencrypt")
            if [ "${DOMAIN}" = "localhost" ]; then
                log "${RED}✗ Cannot generate Let's Encrypt certificate for localhost${NC}"
                log "Please set DOMAIN environment variable to your actual domain name"
                exit 1
            fi
            create_cert_directories
            setup_letsencrypt
            verify_certificate
            generate_docker_secrets
            log "${GREEN}✓ Let's Encrypt certificate setup complete${NC}"
            ;;
        "--verify")
            verify_certificate
            ;;
        "--help"|"help"|*)
            echo "SSL Certificate Setup Script"
            echo ""
            echo "Usage: $0 [option]"
            echo ""
            echo "Options:"
            echo "  --self-signed    Generate self-signed certificate (development)"
            echo "  --letsencrypt    Generate Let's Encrypt certificate (production)"
            echo "  --verify         Verify existing certificate installation"
            echo "  --help           Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DOMAIN                  Main domain name (default: localhost)"
            echo "  ADDITIONAL_DOMAINS      Comma-separated additional domains"
            echo ""
            echo "Examples:"
            echo "  DOMAIN=example.com $0 --letsencrypt"
            echo "  DOMAIN=api.example.com ADDITIONAL_DOMAINS=www.example.com,app.example.com $0 --letsencrypt"
            echo ""
            show_production_instructions
            ;;
    esac
}

# Check if running as root for certificate generation
if [ "$EUID" -ne 0 ] && [ "${1:-help}" != "--help" ] && [ "${1:-help}" != "help" ]; then
    log "${RED}This script requires root privileges for certificate generation${NC}"
    log "Please run with sudo: sudo $0 $*"
    exit 1
fi

# Run main function with all arguments
main "$@"

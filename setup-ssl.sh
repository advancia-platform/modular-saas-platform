#!/bin/bash
# CloudFlare SSL Setup Script

echo "🔐 Setting up CloudFlare SSL certificates..."

SSL_DIR="/root/projects/advancia-pay-ledger/backend/ssl"
CERT_FILE="$SSL_DIR/cloudflare-cert.pem"
KEY_FILE="$SSL_DIR/cloudflare-key.pem"

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

echo "📋 Certificate location: $CERT_FILE"
echo "🔑 Private key location: $KEY_FILE"

# Check if certificate exists
if [ ! -f "$CERT_FILE" ]; then
    echo "❌ Certificate not found at $CERT_FILE"
    echo "ℹ️  The certificate has been created. Please verify it."
    exit 1
fi

echo "✅ Certificate found"

# Check if private key exists
if [ ! -f "$KEY_FILE" ]; then
    echo "⚠️  Private key not found. This is normal for CloudFlare Origin Certificates."
    echo "📝 You need to download the private key from CloudFlare:"
    echo "   1. Go to CloudFlare Dashboard"
    echo "   2. Navigate to SSL/TLS → Origin Server"
    echo "   3. Find your certificate and click 'View'"
    echo "   4. Copy the Private Key"
    echo "   5. Save it to: $KEY_FILE"
    echo ""
    read -p "Do you have the private key ready? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Please paste the private key (including -----BEGIN and END lines), then press Ctrl+D:"
        cat > "$KEY_FILE"
        chmod 600 "$KEY_FILE"
        echo "✅ Private key saved and permissions set to 600"
    else
        echo "ℹ️  Please obtain the private key from CloudFlare and save it to $KEY_FILE"
        exit 1
    fi
else
    echo "✅ Private key found"
fi

# Set proper permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "🔍 Verifying certificate..."

# Check certificate validity
if openssl x509 -in "$CERT_FILE" -text -noout > /dev/null 2>&1; then
    echo "✅ Certificate is valid"
    
    # Show certificate details
    echo ""
    echo "📄 Certificate Details:"
    openssl x509 -in "$CERT_FILE" -noout -subject -issuer -dates
    
    # Show SANs (Subject Alternative Names)
    echo ""
    echo "🌐 Domains covered:"
    openssl x509 -in "$CERT_FILE" -noout -text | grep -A 1 "Subject Alternative Name" | tail -1
else
    echo "❌ Certificate is invalid or corrupted"
    exit 1
fi

# Verify private key (if it exists)
if [ -f "$KEY_FILE" ]; then
    echo ""
    echo "🔍 Verifying private key..."
    if openssl ecparam -in "$KEY_FILE" -noout 2>/dev/null || openssl rsa -in "$KEY_FILE" -check -noout 2>/dev/null; then
        echo "✅ Private key is valid"
    else
        echo "❌ Private key is invalid"
        exit 1
    fi
fi

echo ""
echo "✨ SSL setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Update backend/.env.production:"
echo "     SSL_ENABLED=true"
echo "     SSL_CERT_PATH=$CERT_FILE"
echo "     SSL_KEY_PATH=$KEY_FILE"
echo ""
echo "  2. Deploy the application:"
echo "     cd /root/projects/advancia-pay-ledger"
echo "     ./deploy.sh"
echo ""
echo "  3. Test HTTPS:"
echo "     curl -v https://localhost:4000/health"

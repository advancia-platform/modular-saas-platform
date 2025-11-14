#!/bin/bash

# DigitalOcean PostgreSQL Automated Setup Script
# Run this on your droplet: bash setup-postgres.sh

set -e

echo "=========================================="
echo "PostgreSQL Setup for Advancia Test Suite"
echo "=========================================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install PostgreSQL
echo "📥 Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
echo "🚀 Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql

# Create test database and user
echo "🗄️  Creating test database and user..."
sudo -u postgres psql << 'EOF'
-- Create test database
CREATE DATABASE advancia_payledger_test;

-- Create a test user with password
CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';

-- Grant privileges on database
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;

-- Connect to the test database and grant schema privileges
\c advancia_payledger_test
GRANT ALL PRIVILEGES ON SCHEMA public TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO test_user;

-- Verify
\dt
EOF

# Configure PostgreSQL for remote connections
echo "🔧 Configuring PostgreSQL for remote connections..."

# Find PostgreSQL version
PG_VERSION=$(sudo -u postgres psql --version | awk '{print $3}' | cut -d'.' -f1)
PG_MAIN="/etc/postgresql/$PG_VERSION/main"

# Backup original files
cp "$PG_MAIN/postgresql.conf" "$PG_MAIN/postgresql.conf.backup"
cp "$PG_MAIN/pg_hba.conf" "$PG_MAIN/pg_hba.conf.backup"

# Update postgresql.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_MAIN/postgresql.conf"

# Add remote connection rule to pg_hba.conf
echo "host    all             all             0.0.0.0/0               md5" >> "$PG_MAIN/pg_hba.conf"

# Restart PostgreSQL
echo "🔄 Restarting PostgreSQL..."
systemctl restart postgresql

# Verify
echo "✅ Verifying PostgreSQL is listening..."
sleep 2
ss -tlnp | grep postgres || echo "Warning: Could not verify PostgreSQL is listening"

# Get the droplet IP
DROPLET_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo "✅ PostgreSQL Setup Complete!"
echo "=========================================="
echo ""
echo "Connection details:"
echo "  Host: $DROPLET_IP"
echo "  Port: 5432"
echo "  Database: advancia_payledger_test"
echo "  Username: test_user"
echo "  Password: test_password_123"
echo ""
echo "Update your local .env.test:"
echo "  TEST_DATABASE_URL=\"postgresql://test_user:test_password_123@$DROPLET_IP:5432/advancia_payledger_test\""
echo "  DATABASE_URL=\"postgresql://test_user:test_password_123@$DROPLET_IP:5432/advancia_payledger_test\""
echo ""
echo "Then run locally:"
echo "  cd backend"
echo "  npx prisma migrate deploy"
echo "  npm test"
echo ""

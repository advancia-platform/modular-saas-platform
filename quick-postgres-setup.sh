#!/bin/bash

# Quick PostgreSQL Setup for DigitalOcean Droplet
# This script sets up PostgreSQL in ~2 minutes
# Run as root: bash setup-postgres.sh

echo "✅ Starting PostgreSQL setup..."
echo "IP: 157.245.8.131"
echo ""

# Install PostgreSQL
apt update -y
apt install -y postgresql postgresql-contrib

# Start service
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'PSQL_EOF'
-- Create test database
CREATE DATABASE advancia_payledger_test;

-- Create test user with password
CREATE USER test_user WITH ENCRYPTED PASSWORD 'test_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE advancia_payledger_test TO test_user;

-- Connect and grant schema privileges
\c advancia_payledger_test
GRANT ALL PRIVILEGES ON SCHEMA public TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO test_user;

\q
PSQL_EOF

# Enable remote connections
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host    all             all             0.0.0.0/0               md5" >> /etc/postgresql/*/main/pg_hba.conf

# Restart
systemctl restart postgresql

echo ""
echo "=========================================="
echo "✅ PostgreSQL Setup Complete!"
echo "=========================================="
echo ""
echo "Update your local .env.test:"
echo ""
echo 'TEST_DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"'
echo 'DATABASE_URL="postgresql://test_user:test_password_123@157.245.8.131:5432/advancia_payledger_test"'
echo ""
echo "Then run locally:"
echo "  cd backend"
echo "  npx prisma migrate deploy"
echo "  npm test"
echo ""

-- Initialize Advancia Test Database
-- This script runs automatically when the Docker Postgres container starts

-- Create test database if not exists
SELECT 'CREATE DATABASE advancia_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'advancia_test')\gexec

-- Grant all privileges to test user
GRANT ALL PRIVILEGES ON DATABASE advancia_test TO test_user;

-- Connect to test database
\c advancia_test;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test_user;

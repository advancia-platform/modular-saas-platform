-- Database initialization script for development
-- This script runs when the PostgreSQL container starts

-- Create development database if it doesn't exist
CREATE DATABASE IF NOT EXISTS saas_platform_dev;

-- Create test database for running tests
CREATE DATABASE IF NOT EXISTS saas_platform_test;

-- Create staging database for staging environment testing
CREATE DATABASE IF NOT EXISTS saas_platform_staging;

-- Connect to the development database
\c saas_platform_dev;

-- Enable commonly used extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create development user with necessary permissions
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'dev_user') THEN
        CREATE ROLE dev_user LOGIN PASSWORD 'dev_password';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE saas_platform_dev TO dev_user;
GRANT USAGE ON SCHEMA public TO dev_user;
GRANT CREATE ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;

-- Connect to test database and apply same setup
\c saas_platform_test;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

GRANT CONNECT ON DATABASE saas_platform_test TO dev_user;
GRANT USAGE ON SCHEMA public TO dev_user;
GRANT CREATE ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;

-- Connect to staging database and apply same setup
\c saas_platform_staging;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

GRANT CONNECT ON DATABASE saas_platform_staging TO dev_user;
GRANT USAGE ON SCHEMA public TO dev_user;
GRANT CREATE ON SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;
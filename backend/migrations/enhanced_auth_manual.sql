-- Enhanced Authentication System Migration
-- Run this manually in your PostgreSQL database

-- Create user_sessions table (enhanced session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" VARCHAR NOT NULL,
    "refreshTokenHash" VARCHAR NOT NULL,
    "tokenVersion" INTEGER DEFAULT 1,
    "userAgent" VARCHAR,
    ip VARCHAR,
    "isRevoked" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "lastActivity" TIMESTAMP DEFAULT now(),
    "createdAt" TIMESTAMP DEFAULT now(),
    "updatedAt" TIMESTAMP DEFAULT now(),
    "expiresAt" TIMESTAMP NOT NULL,

    CONSTRAINT fk_user_sessions_userId
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS session_userId_idx ON user_sessions("userId");
CREATE INDEX IF NOT EXISTS session_refreshTokenHash_idx ON user_sessions("refreshTokenHash");
CREATE INDEX IF NOT EXISTS session_isRevoked_idx ON user_sessions("isRevoked");
CREATE INDEX IF NOT EXISTS session_expiresAt_idx ON user_sessions("expiresAt");

-- Create revoked_access_tokens table (token blacklisting)
CREATE TABLE IF NOT EXISTS revoked_access_tokens (
    jti VARCHAR PRIMARY KEY,
    "userId" VARCHAR NOT NULL,
    reason VARCHAR,
    "revokedAt" TIMESTAMP DEFAULT now(),
    exp INTEGER NOT NULL -- expiration timestamp for cleanup
);

-- Create indexes for revoked_access_tokens
CREATE INDEX IF NOT EXISTS revoked_token_userId_idx ON revoked_access_tokens("userId");
CREATE INDEX IF NOT EXISTS revoked_token_exp_idx ON revoked_access_tokens(exp);

-- Create user_audit_logs table (comprehensive audit trail)
CREATE TABLE IF NOT EXISTS user_audit_logs (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    resource VARCHAR NOT NULL,
    "resourceId" VARCHAR,
    "oldValues" TEXT, -- JSON string
    "newValues" TEXT, -- JSON string
    metadata TEXT,    -- JSON string
    "ipAddress" VARCHAR,
    "userAgent" VARCHAR,
    "timestamp" TIMESTAMP DEFAULT now(),

    CONSTRAINT fk_user_audit_logs_userId
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for user_audit_logs
CREATE INDEX IF NOT EXISTS audit_log_userId_idx ON user_audit_logs("userId");
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON user_audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_log_resource_idx ON user_audit_logs(resource);
CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx ON user_audit_logs("timestamp");

-- Update users table to add new authentication fields if they don't exist
DO $$
BEGIN
    -- Add sessions relation support (this will be handled by Prisma relations)

    -- Add TOTP fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='totpSecret') THEN
        ALTER TABLE users ADD COLUMN "totpSecret" VARCHAR;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='totpEnabled') THEN
        ALTER TABLE users ADD COLUMN "totpEnabled" BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='totpVerified') THEN
        ALTER TABLE users ADD COLUMN "totpVerified" BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='backupCodes') THEN
        ALTER TABLE users ADD COLUMN "backupCodes" TEXT;
    END IF;

END $$;

-- Create cleanup function for expired sessions and tokens
CREATE OR REPLACE FUNCTION cleanup_auth_data()
RETURNS TABLE(
    sessions_deleted INTEGER,
    tokens_deleted INTEGER,
    audit_logs_deleted INTEGER
) AS $$
DECLARE
    session_count INTEGER;
    token_count INTEGER;
    audit_count INTEGER;
    retention_date TIMESTAMP;
BEGIN
    -- Set retention date (90 days ago)
    retention_date := now() - interval '90 days';

    -- Clean up expired sessions
    DELETE FROM user_sessions
    WHERE "expiresAt" < now()
       OR ("isRevoked" = true AND "updatedAt" < now() - interval '1 day');
    GET DIAGNOSTICS session_count = ROW_COUNT;

    -- Clean up expired revoked tokens
    DELETE FROM revoked_access_tokens
    WHERE exp < extract(epoch from now());
    GET DIAGNOSTICS token_count = ROW_COUNT;

    -- Clean up old audit logs (keep last 90 days)
    DELETE FROM user_audit_logs
    WHERE "timestamp" < retention_date;
    GET DIAGNOSTICS audit_count = ROW_COUNT;

    RETURN QUERY SELECT session_count, token_count, audit_count;
END;
$$ LANGUAGE plpgsql;

-- Create a procedure to manually run cleanup
CREATE OR REPLACE FUNCTION manual_auth_cleanup()
RETURNS TEXT AS $$
DECLARE
    result_record RECORD;
BEGIN
    SELECT * FROM cleanup_auth_data() INTO result_record;

    RETURN format(
        'Cleanup completed: %s sessions deleted, %s tokens deleted, %s audit logs deleted',
        result_record.sessions_deleted,
        result_record.tokens_deleted,
        result_record.audit_logs_deleted
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON user_sessions TO your_app_user;
-- GRANT ALL PRIVILEGES ON revoked_access_tokens TO your_app_user;
-- GRANT ALL PRIVILEGES ON user_audit_logs TO your_app_user;

-- Insert a test entry to verify the setup (optional)
-- You can run this to test that everything is working:
/*
-- Test session creation (replace with actual user ID)
INSERT INTO user_sessions ("userId", "refreshTokenHash", "expiresAt")
VALUES ('your-test-user-id', 'test-hash', now() + interval '7 days');

-- Test audit log creation
INSERT INTO user_audit_logs ("userId", action, resource)
VALUES ('your-test-user-id', 'test_action', 'test_resource');

-- Run cleanup test
SELECT manual_auth_cleanup();
*/

COMMENT ON TABLE user_sessions IS 'Enhanced session management with token rotation';
COMMENT ON TABLE revoked_access_tokens IS 'Blacklisted JWT tokens for immediate revocation';
COMMENT ON TABLE user_audit_logs IS 'Comprehensive audit trail for authentication events';
COMMENT ON FUNCTION cleanup_auth_data() IS 'Automated cleanup of expired authentication data';
COMMENT ON FUNCTION manual_auth_cleanup() IS 'Manual trigger for authentication data cleanup';

-- Show completion message
SELECT 'Enhanced Authentication System migration completed successfully!' as status;

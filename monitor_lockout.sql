-- monitor_lockout.sql
-- Combined SQL monitoring script for lockout policy verification
-- Run after each test to see the complete security state

\echo '╔════════════════════════════════════════════════════════════════════╗'
\echo '║           Admin Account Security Status Monitor                    ║'
\echo '╚════════════════════════════════════════════════════════════════════╝'
\echo ''

-- Set nice formatting
\x auto
\pset border 2

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 BASIC SECURITY STATE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Check basic user security state
SELECT 
    email,
    role,
    failed_attempts,
    locked_until,
    CASE 
        WHEN locked_until IS NULL THEN '✓ Active'
        WHEN locked_until > NOW() THEN '✗ LOCKED'
        ELSE '⚠ Lock Expired'
    END as lock_status,
    last_login_at,
    totp_enabled,
    totp_verified
FROM users
WHERE email = 'admin@advvancia.com';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '⏱️  LOCKOUT TIMING DETAILS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Lockout timing analysis
SELECT 
    email,
    failed_attempts,
    locked_until,
    NOW() as current_time,
    CASE 
        WHEN locked_until IS NULL THEN 'No lockout'
        WHEN locked_until > NOW() THEN 
            CONCAT(
                EXTRACT(EPOCH FROM (locked_until - NOW())) / 60, 
                ' minutes remaining'
            )
        ELSE 'Lockout expired'
    END as lockout_status,
    EXTRACT(EPOCH FROM (locked_until - NOW())) / 60 as minutes_remaining_numeric
FROM users
WHERE email = 'admin@advvancia.com';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔐 TWO-FACTOR AUTHENTICATION STATUS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- 2FA configuration
SELECT 
    email,
    totp_secret,
    totp_enabled,
    totp_verified,
    LENGTH(totp_secret) as secret_length,
    CASE 
        WHEN totp_enabled AND totp_verified THEN '✓ 2FA Active'
        WHEN totp_enabled AND NOT totp_verified THEN '⚠ 2FA Pending Verification'
        ELSE '✗ 2FA Disabled'
    END as two_factor_status
FROM users
WHERE email = 'admin@advvancia.com';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '💾 BACKUP CODES STATUS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Backup codes analysis
SELECT 
    email,
    jsonb_array_length(backup_codes) as total_backup_codes,
    5 - jsonb_array_length(backup_codes) as codes_used,
    CASE 
        WHEN jsonb_array_length(backup_codes) = 5 THEN '✓ All codes available'
        WHEN jsonb_array_length(backup_codes) > 2 THEN '⚠ Some codes used'
        WHEN jsonb_array_length(backup_codes) > 0 THEN '⚠ Warning: Few codes remaining'
        ELSE '✗ No backup codes left'
    END as backup_status
FROM users
WHERE email = 'admin@advvancia.com';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🕐 LOGIN HISTORY'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Login timing details
SELECT 
    email,
    last_login_at,
    CASE 
        WHEN last_login_at IS NULL THEN 'Never logged in'
        ELSE CONCAT(
            EXTRACT(EPOCH FROM (NOW() - last_login_at)) / 60, 
            ' minutes ago'
        )
    END as time_since_last_login,
    created_at as account_created,
    updated_at as last_modified
FROM users
WHERE email = 'admin@advvancia.com';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📋 RECOVERY CODES (if applicable)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Recovery codes status
SELECT 
    email,
    recovery_codes,
    CASE 
        WHEN recovery_codes IS NULL THEN 'No recovery codes set'
        WHEN array_length(recovery_codes, 1) IS NULL THEN 'Empty recovery codes array'
        ELSE CONCAT(array_length(recovery_codes, 1), ' recovery codes available')
    END as recovery_status
FROM users
WHERE email = 'admin@advvancia.com';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '🔍 COMPLETE SECURITY AUDIT VIEW'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Complete audit view with all security columns
\x on
SELECT 
    id,
    email,
    role,
    failed_attempts,
    locked_until,
    last_login_at,
    totp_secret,
    totp_enabled,
    totp_verified,
    jsonb_array_length(backup_codes) as backup_codes_count,
    recovery_codes,
    created_at,
    updated_at,
    -- Computed status fields
    CASE 
        WHEN locked_until IS NULL THEN 'Active'
        WHEN locked_until > NOW() THEN 'LOCKED'
        ELSE 'Lock Expired'
    END as current_status,
    CASE 
        WHEN locked_until > NOW() THEN 
            EXTRACT(EPOCH FROM (locked_until - NOW())) / 60
        ELSE NULL
    END as minutes_until_unlock
FROM users
WHERE email = 'admin@advvancia.com';
\x auto

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '📊 SECURITY METRICS SUMMARY'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Security metrics summary
SELECT 
    COUNT(*) FILTER (WHERE failed_attempts > 0) as accounts_with_failures,
    COUNT(*) FILTER (WHERE locked_until > NOW()) as currently_locked,
    COUNT(*) FILTER (WHERE totp_enabled = true) as accounts_with_2fa,
    MAX(failed_attempts) as max_failed_attempts,
    COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '24 hours') as logins_last_24h,
    COUNT(*) as total_admin_accounts
FROM users
WHERE role = 'admin';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ Monitoring Complete'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo 'Timestamp: '
SELECT NOW();

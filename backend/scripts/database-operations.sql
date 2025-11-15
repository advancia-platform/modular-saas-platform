-- ============================================================
-- Advancia Pay Ledger - Database Operations & Verification
-- ============================================================
-- Purpose: Complete SQL script for database verification,
--          maintenance, and administrative operations
-- Date: November 14, 2025
-- ============================================================

-- ============================================================
-- 1. DATABASE HEALTH CHECKS
-- ============================================================

-- Check database connection and size
SELECT 
    pg_database.datname AS database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS database_size,
    (SELECT count(*) FROM pg_stat_activity WHERE datname = pg_database.datname) AS active_connections
FROM pg_database
WHERE datname = current_database();

-- Check all tables and row counts
SELECT 
    schemaname AS schema,
    tablename AS table_name,
    n_live_tup AS row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Check migration status
SELECT * FROM "_prisma_migrations"
ORDER BY finished_at DESC;

-- ============================================================
-- 2. USER VERIFICATION & SECURITY
-- ============================================================

-- Check all users with security status
SELECT 
    id,
    email,
    username,
    role,
    approved,
    totp_enabled AS "2FA_enabled",
    failed_attempts,
    locked_until,
    "createdAt",
    "updatedAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- Find admin users
SELECT 
    id,
    email,
    username,
    role,
    totp_enabled AS "admin_2FA"
FROM "User"
WHERE role = 'ADMIN';

-- Check locked accounts
SELECT 
    id,
    email,
    username,
    failed_attempts,
    locked_until,
    NOW() AS current_time,
    (locked_until > NOW()) AS still_locked
FROM "User"
WHERE locked_until IS NOT NULL
ORDER BY locked_until DESC;

-- Check users pending approval
SELECT 
    id,
    email,
    username,
    approved,
    "createdAt"
FROM "User"
WHERE approved = FALSE
ORDER BY "createdAt" DESC;

-- ============================================================
-- 3. TRANSACTION MONITORING
-- ============================================================

-- Get transaction summary by type
SELECT 
    type,
    COUNT(*) AS transaction_count,
    SUM(amount::numeric) AS total_amount,
    AVG(amount::numeric) AS avg_amount,
    MIN(amount::numeric) AS min_amount,
    MAX(amount::numeric) AS max_amount
FROM "Transaction"
GROUP BY type
ORDER BY total_amount DESC;

-- Recent transactions (last 24 hours)
SELECT 
    t.id,
    u.email AS user_email,
    t.type,
    t.amount,
    t.description,
    t."createdAt"
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
WHERE t."createdAt" >= NOW() - INTERVAL '24 hours'
ORDER BY t."createdAt" DESC
LIMIT 50;

-- Large transactions (over $1000)
SELECT 
    t.id,
    u.email AS user_email,
    t.type,
    t.amount,
    t.description,
    t."createdAt"
FROM "Transaction" t
JOIN "User" u ON t."userId" = u.id
WHERE t.amount::numeric > 1000
ORDER BY t.amount::numeric DESC;

-- ============================================================
-- 4. TOKEN WALLET OPERATIONS
-- ============================================================

-- Token wallet summary
SELECT 
    u.id AS user_id,
    u.email,
    tw.balance,
    tw."lastUpdated"
FROM "TokenWallet" tw
JOIN "User" u ON tw."userId" = u.id
ORDER BY tw.balance DESC;

-- Total token supply
SELECT 
    SUM(balance) AS total_token_supply,
    COUNT(*) AS wallet_count,
    AVG(balance) AS avg_balance
FROM "TokenWallet";

-- Token transactions summary
SELECT 
    type,
    COUNT(*) AS count,
    SUM(amount) AS total_amount
FROM "TokenTransaction"
GROUP BY type
ORDER BY total_amount DESC;

-- Recent token transfers
SELECT 
    tt.id,
    sender.email AS sender_email,
    receiver.email AS receiver_email,
    tt.amount,
    tt.type,
    tt."createdAt"
FROM "TokenTransaction" tt
LEFT JOIN "User" sender ON tt."senderId" = sender.id
LEFT JOIN "User" receiver ON tt."receiverId" = receiver.id
ORDER BY tt."createdAt" DESC
LIMIT 20;

-- ============================================================
-- 5. CRYPTO OPERATIONS MONITORING
-- ============================================================

-- Crypto wallet balances
SELECT 
    u.email,
    cw.currency,
    cw.balance,
    cw."lastUpdated"
FROM "CryptoWallet" cw
JOIN "User" u ON cw."userId" = u.id
ORDER BY cw.currency, cw.balance DESC;

-- Crypto withdrawal status
SELECT 
    cwd.id,
    u.email AS user_email,
    cwd.currency,
    cwd.amount,
    cwd.address,
    cwd.status,
    cwd."createdAt",
    cwd."processedAt"
FROM "CryptoWithdrawal" cwd
JOIN "User" u ON cwd."userId" = u.id
ORDER BY cwd."createdAt" DESC;

-- Pending crypto withdrawals
SELECT 
    cwd.id,
    u.email AS user_email,
    cwd.currency,
    cwd.amount,
    cwd.address,
    cwd."createdAt"
FROM "CryptoWithdrawal" cwd
JOIN "User" u ON cwd."userId" = u.id
WHERE cwd.status = 'PENDING'
ORDER BY cwd."createdAt" ASC;

-- Cryptomus orders summary
SELECT 
    status,
    COUNT(*) AS order_count,
    SUM(amount::numeric) AS total_amount
FROM "CryptomusOrder"
GROUP BY status;

-- ============================================================
-- 6. REWARDS & TIERS
-- ============================================================

-- Rewards summary
SELECT 
    type,
    COUNT(*) AS reward_count,
    SUM(amount) AS total_rewards,
    COUNT(CASE WHEN claimed THEN 1 END) AS claimed_count,
    COUNT(CASE WHEN NOT claimed THEN 1 END) AS unclaimed_count
FROM "Reward"
GROUP BY type;

-- User tier distribution
SELECT 
    tier,
    COUNT(*) AS user_count,
    AVG("totalSpent"::numeric) AS avg_spent,
    AVG(points) AS avg_points
FROM "UserTier"
GROUP BY tier
ORDER BY tier;

-- Top users by spending
SELECT 
    u.email,
    ut.tier,
    ut."totalSpent",
    ut.points,
    ut."updatedAt"
FROM "UserTier" ut
JOIN "User" u ON ut."userId" = u.id
ORDER BY ut."totalSpent"::numeric DESC
LIMIT 20;

-- ============================================================
-- 7. AUDIT LOGS & ACTIVITY
-- ============================================================

-- Recent audit logs
SELECT 
    al.id,
    u.email AS user_email,
    al.action,
    al.entity,
    al."entityId",
    al."createdAt"
FROM "AuditLog" al
LEFT JOIN "User" u ON al."userId" = u.id
ORDER BY al."createdAt" DESC
LIMIT 50;

-- Audit log summary by action
SELECT 
    action,
    COUNT(*) AS count,
    MAX("createdAt") AS last_occurrence
FROM "AuditLog"
GROUP BY action
ORDER BY count DESC;

-- User activity by hour (last 7 days)
SELECT 
    DATE_TRUNC('hour', "createdAt") AS hour,
    COUNT(*) AS activity_count
FROM "AuditLog"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC;

-- ============================================================
-- 8. SUPPORT TICKETS MONITORING
-- ============================================================

-- Support ticket status
SELECT 
    status,
    priority,
    COUNT(*) AS ticket_count
FROM "SupportTicket"
GROUP BY status, priority
ORDER BY priority, status;

-- Open support tickets
SELECT 
    st.id,
    u.email AS user_email,
    st.subject,
    st.priority,
    st.status,
    st."createdAt"
FROM "SupportTicket" st
JOIN "User" u ON st."userId" = u.id
WHERE st.status IN ('OPEN', 'IN_PROGRESS')
ORDER BY 
    CASE st.priority
        WHEN 'URGENT' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END,
    st."createdAt" ASC;

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================

-- Notification summary
SELECT 
    type,
    COUNT(*) AS count,
    COUNT(CASE WHEN read THEN 1 END) AS read_count,
    COUNT(CASE WHEN NOT read THEN 1 END) AS unread_count
FROM "Notification"
GROUP BY type;

-- Unread notifications by user
SELECT 
    u.email,
    COUNT(n.id) AS unread_count
FROM "Notification" n
JOIN "User" u ON n."userId" = u.id
WHERE n.read = FALSE
GROUP BY u.email
ORDER BY unread_count DESC;

-- ============================================================
-- 10. ETHEREUM ACTIVITY
-- ============================================================

-- Ethereum activity summary
SELECT 
    type,
    COUNT(*) AS transaction_count,
    AVG(amount::numeric) AS avg_amount
FROM "EthereumActivity"
GROUP BY type;

-- Recent Ethereum transactions
SELECT 
    ea.id,
    u.email AS user_email,
    ea.address,
    ea."txHash",
    ea.type,
    ea.amount,
    ea."createdAt"
FROM "EthereumActivity" ea
JOIN "User" u ON ea."userId" = u.id
ORDER BY ea."createdAt" DESC
LIMIT 20;

-- ============================================================
-- 11. ADMINISTRATIVE OPERATIONS
-- ============================================================

-- Unlock specific user account
-- USAGE: UPDATE "User" SET failed_attempts = 0, locked_until = NULL WHERE email = 'user@example.com';
-- Example (commented):
-- UPDATE "User" 
-- SET failed_attempts = 0, locked_until = NULL 
-- WHERE email = 'specific-user@example.com';

-- Approve user manually
-- USAGE: UPDATE "User" SET approved = TRUE WHERE email = 'user@example.com';
-- Example (commented):
-- UPDATE "User" 
-- SET approved = TRUE 
-- WHERE email = 'pending-user@example.com';

-- Reset user password hash (requires bcrypt hash)
-- USAGE: UPDATE "User" SET password = '$2b$10$...' WHERE email = 'user@example.com';
-- Example (commented):
-- UPDATE "User" 
-- SET password = '$2b$10$newHashHere...' 
-- WHERE email = 'user@example.com';

-- Grant admin privileges
-- USAGE: UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
-- Example (commented):
-- UPDATE "User" 
-- SET role = 'ADMIN' 
-- WHERE email = 'new-admin@example.com';

-- Process pending crypto withdrawal
-- USAGE: UPDATE "CryptoWithdrawal" SET status = 'COMPLETED', "processedAt" = NOW() WHERE id = 'withdrawal-id';
-- Example (commented):
-- UPDATE "CryptoWithdrawal" 
-- SET status = 'COMPLETED', "processedAt" = NOW() 
-- WHERE id = 'specific-withdrawal-id';

-- ============================================================
-- 12. PERFORMANCE & INDEX CHECKS
-- ============================================================

-- Check table indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check slow queries (requires pg_stat_statements extension)
-- SELECT query, calls, total_time, mean_time
-- FROM pg_stat_statements
-- ORDER BY mean_time DESC
-- LIMIT 10;

-- Database cache hit ratio (should be > 90%)
SELECT 
    sum(heap_blks_read) AS heap_read,
    sum(heap_blks_hit) AS heap_hit,
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS cache_hit_ratio
FROM pg_statio_user_tables;

-- ============================================================
-- 13. BACKUP & MAINTENANCE QUERIES
-- ============================================================

-- Check table bloat
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_dead_tup AS dead_tuples,
    n_live_tup AS live_tuples,
    ROUND(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2) AS dead_tuple_percent
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_tuple_percent DESC NULLS LAST;

-- Last vacuum and analyze times
SELECT 
    schemaname,
    relname AS table_name,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY last_autovacuum DESC NULLS LAST;

-- ============================================================
-- 14. DATA INTEGRITY CHECKS
-- ============================================================

-- Check for orphaned token wallets (users deleted but wallets remain)
SELECT tw.id, tw."userId", tw.balance
FROM "TokenWallet" tw
LEFT JOIN "User" u ON tw."userId" = u.id
WHERE u.id IS NULL;

-- Check for orphaned transactions
SELECT t.id, t."userId", t.amount
FROM "Transaction" t
LEFT JOIN "User" u ON t."userId" = u.id
WHERE u.id IS NULL;

-- Check for negative balances
SELECT 
    u.email,
    tw.balance
FROM "TokenWallet" tw
JOIN "User" u ON tw."userId" = u.id
WHERE tw.balance < 0;

-- Check for duplicate email addresses
SELECT 
    email,
    COUNT(*) AS count
FROM "User"
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================================
-- 15. BUSINESS INTELLIGENCE QUERIES
-- ============================================================

-- Daily transaction volume (last 30 days)
SELECT 
    DATE(t."createdAt") AS transaction_date,
    COUNT(*) AS transaction_count,
    SUM(t.amount::numeric) AS total_volume
FROM "Transaction" t
WHERE t."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE(t."createdAt")
ORDER BY transaction_date DESC;

-- User registration trend (last 30 days)
SELECT 
    DATE("createdAt") AS registration_date,
    COUNT(*) AS new_users
FROM "User"
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY registration_date DESC;

-- Revenue by payment method
SELECT 
    'Fiat' AS payment_method,
    COUNT(*) AS transaction_count,
    SUM(amount::numeric) AS total_revenue
FROM "Transaction"
WHERE type IN ('DEPOSIT', 'PAYMENT')

UNION ALL

SELECT 
    'Crypto' AS payment_method,
    COUNT(*) AS transaction_count,
    SUM(amount::numeric) AS total_revenue
FROM "CryptomusOrder"
WHERE status = 'COMPLETED';

-- Top 10 most active users (by transaction count)
SELECT 
    u.email,
    u.username,
    COUNT(t.id) AS transaction_count,
    SUM(t.amount::numeric) AS total_transaction_value
FROM "User" u
JOIN "Transaction" t ON u.id = t."userId"
GROUP BY u.id, u.email, u.username
ORDER BY transaction_count DESC
LIMIT 10;

-- ============================================================
-- END OF DATABASE OPERATIONS SCRIPT
-- ============================================================

-- Notes:
-- 1. Run verification queries regularly for monitoring
-- 2. Uncomment administrative operations only when needed
-- 3. Always backup before running UPDATE/DELETE operations
-- 4. Use WHERE clauses carefully to avoid unintended changes
-- 5. Test on staging environment before production
-- ============================================================

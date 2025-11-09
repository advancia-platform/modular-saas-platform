# Brute Force Protection & Security Features

## Overview
Comprehensive multi-layer security system to prevent brute force attacks, credential stuffing, and abuse.

## Features Implemented

### 1. **Rate Limiting (Tiered)**
- **Authentication endpoints**: 5 requests per 15 minutes
- **Password reset**: 3 requests per hour
- **Registration**: 3 accounts per hour per IP
- **General API**: 100 requests per 15 minutes
- **Progressive slowdown**: Delays responses after 50 requests

### 2. **IP Blocking**
- Automatic blocking after repeated failed attempts
- Manual admin blocking with reason tracking
- Temporary (1 hour default) or permanent blocks
- Public/private block reasons for user-facing messages
- Database-backed with expiration support

### 3. **Account Lockout**
- Locks account after 5 failed login attempts within 15 minutes
- Admin can manually unlock accounts
- Automatic unlock after cooldown period
- Tracks failed attempts per user + IP combination

### 4. **Security Monitoring**
- Real-time attack detection
- Admin alerts for suspicious activity
- Failed login attempt tracking
- Security event audit logs
- Dashboard for security metrics

### 5. **Redis Support (Optional)**
- Distributed rate limiting across multiple servers
- Falls back to memory-based limiting if Redis unavailable
- Better performance for high-traffic scenarios

## API Endpoints

### Admin Security Management

#### List Blocked IPs
```bash
GET /api/admin/security-management/blocked-ips?page=1&limit=50&active=true
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "blocks": [
    {
      "id": "uuid",
      "ipAddress": "192.168.1.100",
      "reason": "Auto-blocked: auth_brute_force",
      "isActive": true,
      "expiresAt": "2025-11-08T15:00:00Z",
      "createdAt": "2025-11-08T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

#### Block IP Manually
```bash
POST /api/admin/security-management/block-ip
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "ipAddress": "192.168.1.100",
  "reason": "Suspicious activity detected",
  "duration": 3600,
  "isPublic": false
}
```

#### Unblock IP
```bash
DELETE /api/admin/security-management/unblock-ip/:id
Authorization: Bearer <admin_token>
```

#### Get Security Alerts
```bash
GET /api/admin/security-management/alerts?severity=HIGH&resolved=false
Authorization: Bearer <admin_token>
```

#### Get Failed Login Attempts
```bash
GET /api/admin/security-management/failed-logins?hours=24
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "failedLogins": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "ip": "192.168.1.100",
      "attempts": 5,
      "lastAttempt": "2025-11-08T14:30:00Z",
      "accountLocked": true
    }
  ],
  "total": 15
}
```

#### Unlock Account
```bash
POST /api/admin/security-management/unlock-account
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "uuid"
}
```

## Configuration

### Environment Variables
```env
# Optional Redis for distributed rate limiting
REDIS_URL=redis://localhost:6379

# Existing JWT secret
JWT_SECRET=your-secret-key
```

### Rate Limit Customization
Edit `/backend/src/middleware/rateLimiter.ts`:

```typescript
// Change auth rate limit from 5 to 10 requests
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Changed from 5
  // ...
});
```

## How It Works

### 1. Login Flow with Protection
```
User attempts login
    ↓
checkIPBlock middleware (global)
    ↓ (if IP not blocked)
authRateLimiter (5 per 15 min)
    ↓ (if under limit)
Validate credentials
    ↓
  ┌─────┴─────┐
  │           │
Valid      Invalid
  │           │
  │      Track failed attempt
  │      (increment counter)
  │           │
  │      5th failure?
  │           ├─ Yes → Lock account
  │           │        + Create alert
  │           │        + Auto-block IP
  │           │
  │           └─ No → Return error
  │
Clear failed attempts
Return JWT token
```

### 2. Auto-Blocking Logic
- Failed login triggers `trackFailedLogin()`
- Counts failures in last 15 minutes
- On 5th failure:
  - Account set to `active: false`
  - IP added to `ipBlock` table with 1-hour expiration
  - Admin alert created

### 3. IP Block Check
- Runs on every request (global middleware)
- Checks `ipBlock` table for active blocks
- Returns 403 if blocked (permanent or not expired)
- Logs blocked attempts for auditing

## Security Best Practices

### For Production:
1. **Enable Redis** for distributed rate limiting across multiple servers
2. **Configure fail2ban** at OS level for additional protection
3. **Use Cloudflare** or similar CDN for DDoS protection
4. **Enable HTTPS** only (disable HTTP)
5. **Monitor alerts** regularly via admin dashboard
6. **Set up email notifications** for HIGH severity alerts
7. **Regular security audits** of blocked IPs and failed logins

### Rate Limit Tuning:
- Start conservative (current limits)
- Monitor false positives (legitimate users blocked)
- Adjust based on traffic patterns
- Consider geographic variations (VPNs, shared IPs)

## Testing

### Test Rate Limiting
```bash
# Try 6 login attempts rapidly (should block on 6th)
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done
```

### Test IP Blocking
```bash
# Block your test IP
curl -X POST http://localhost:4000/api/admin/security-management/block-ip \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "127.0.0.1",
    "reason": "Test block",
    "duration": 300
  }'

# Try to access any endpoint (should get 403)
curl http://localhost:4000/api/auth/login
```

### Monitor Security Events
```bash
# Get recent alerts
curl http://localhost:4000/api/admin/security-management/alerts \
  -H "Authorization: Bearer <admin_token>"

# Get failed logins in last hour
curl "http://localhost:4000/api/admin/security-management/failed-logins?hours=1" \
  -H "Authorization: Bearer <admin_token>"
```

## Monitoring Dashboard Metrics

Track these KPIs in admin dashboard:
- **Blocked IPs**: Total active blocks
- **Failed Logins**: Last 24 hours
- **Locked Accounts**: Count needing manual unlock
- **Security Alerts**: Unresolved HIGH/CRITICAL
- **Rate Limit Hits**: Requests hitting limits
- **Attack Patterns**: Time-series of failed attempts

## Incident Response

### If Under Attack:
1. Check `/api/admin/security-management/alerts` for patterns
2. Review `/api/admin/security-management/failed-logins`
3. Block attacking IPs manually if not auto-blocked
4. Lower rate limits temporarily (edit `rateLimiter.ts` and restart)
5. Enable Cloudflare "I'm Under Attack" mode
6. Contact hosting provider if DDoS suspected

### If Legitimate User Locked:
1. Verify identity through secondary channel
2. Use `/api/admin/security-management/unlock-account`
3. If IP blocked, use `/api/admin/security-management/unblock-ip/:id`
4. Advise user to reset password if credentials may be compromised

## Performance Impact

- **Memory-based rate limiting**: Negligible (<1ms per request)
- **Redis-based rate limiting**: ~2-5ms per request
- **IP block check**: Single database query, indexed lookup (~1-3ms)
- **Failed login tracking**: Async, non-blocking

## Compliance

- **GDPR**: IP addresses stored for security purposes (legitimate interest)
- **Data retention**: Auto-expire temporary blocks, manual cleanup for permanent
- **Audit trail**: All security actions logged with admin ID and timestamp
- **User notification**: Blocked users receive clear error messages

## Future Enhancements

- [ ] CAPTCHA after 3 failed attempts
- [ ] Email notifications for locked accounts
- [ ] Geolocation-based risk scoring
- [ ] Machine learning anomaly detection
- [ ] Integration with threat intelligence feeds
- [ ] Two-factor authentication requirement after suspicious activity
- [ ] Honeypot endpoints to detect scanners

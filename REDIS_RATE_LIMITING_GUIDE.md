# Redis-Backed Rate Limiting - Complete Guide

## Overview

The rate limiting system has been upgraded from in-memory storage to Redis-backed distributed rate limiting. This enables horizontal scaling across multiple backend instances while maintaining consistent rate limit enforcement globally.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Backend 1  │────▶│    Redis    │◀────│  Backend 2  │
│  Instance   │     │   Cluster   │     │  Instance   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       └────────────────────┴────────────────────┘
                   Shared Rate Limit State
```

## Key Features

1. **Per-User + IP Tracking**: Rate limits can be enforced by authenticated user ID or IP address
2. **Distributed Offender Tracking**: Redis sorted sets track top offenders across all instances
3. **Graceful Degradation**: If Redis fails, requests are allowed through (fail-open)
4. **Admin Monitoring Dashboard**: Visual interface for tracking abuse patterns
5. **Sentry Integration**: All rate limit violations logged to Sentry with route group tags

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install ioredis zod
```

### 2. Setup Redis

#### Local Development (Docker)

```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

#### Production (Managed Service)

- **AWS ElastiCache**: Redis-compatible managed service
- **Azure Cache for Redis**: Enterprise-grade Redis
- **Redis Cloud**: Official managed Redis

### 3. Environment Configuration

```bash
# Required
REDIS_URL=redis://localhost:6379

# Optional: For secure production environments
REDIS_PASSWORD=your-secure-password
REDIS_TLS=true

# Sentry (for rate limit violation logging)
SENTRY_DSN=your-sentry-dsn
NODE_ENV=production
```

## Configuration

### Rate Limiter Options

```typescript
interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  group: string; // Route group identifier
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}
```

### Pre-Configured Rate Limiters

#### 1. Strict Rate Limiter (Authentication)

```typescript
// 5 attempts per 15 minutes
export const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  group: "auth-strict",
  message: "Too many login attempts, please try again in 15 minutes.",
});
```

**Applied to:**

- `/api/auth/login`
- `/api/auth/login-doctor`

#### 2. Admin Rate Limiter

```typescript
// 20 requests per minute
export const adminRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  group: "admin",
  message: "Too many admin requests, please slow down.",
});
```

**Applied to:**

- `/api/admin/users`
- `/api/admin/rate-limits`
- `/api/admin/rate-limits/groups`
- `/api/admin/rate-limits/clear`

#### 3. General API Rate Limiter

```typescript
// 100 requests per minute
export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  group: "api",
  message: "API rate limit exceeded, please try again later.",
});
```

## Identifier Detection Logic

The rate limiter intelligently selects the identifier for tracking:

```typescript
function getIdentifier(req: Request): string {
  // 1. Prefer authenticated user ID
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // 2. Fallback to X-Forwarded-For header
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    return `ip:${forwardedFor.split(",")[0].trim()}`;
  }

  // 3. Fallback to X-Real-IP header
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return `ip:${realIp}`;
  }

  // 4. Fallback to req.ip or socket address
  return `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;
}
```

## Redis Data Structures

### Rate Limit Counters

```redis
# Key: rate:{group}:{identifier}
# Value: request count (integer)
# TTL: windowMs (auto-expires)

SET rate:admin:user:123 5
EXPIRE rate:admin:user:123 60
```

### Offender Tracking

```redis
# Key: offenders:{group}
# Type: Sorted Set (ZSET)
# Score: violation count
# Member: identifier

ZINCRBY offenders:admin 1 user:123
ZREVRANGE offenders:admin 0 9 WITHSCORES  # Top 10 offenders
```

## API Response Formats

### 429 Rate Limit Exceeded

```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 45,
  "limit": 5,
  "windowMs": 900000
}
```

## Admin Monitoring API

### GET `/api/admin/rate-limits`

Get rate limit offenders for monitoring dashboard.

**Query Parameters:**

- `group` (optional): Route group to monitor (default: "admin")
- `limit` (optional): Maximum offenders to return (default: 20, max: 100)

**Response:**

```json
{
  "success": true,
  "group": "admin",
  "offenders": [
    {
      "identifier": "192.168.1.100",
      "count": 15,
      "type": "ip"
    },
    {
      "identifier": "user:456",
      "count": 8,
      "type": "user"
    }
  ],
  "availableGroups": [
    { "group": "admin", "offenderCount": 5 },
    { "group": "auth-strict", "offenderCount": 12 }
  ],
  "totalOffenders": 2
}
```

### GET `/api/admin/rate-limits/groups`

Get all available rate limit groups with offender counts.

**Response:**

```json
{
  "success": true,
  "groups": [
    { "group": "admin", "offenderCount": 5 },
    { "group": "auth-strict", "offenderCount": 12 }
  ]
}
```

### POST `/api/admin/rate-limits/clear`

Clear rate limit for a specific identifier.

**Request Body:**

```json
{
  "group": "admin",
  "identifier": "user:123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Rate limit cleared for user:123 in group admin"
}
```

## Frontend Dashboard

**URL:** `/admin/rate-limits`

**Features:**

1. **Real-time Stats**: Total violations, unique offenders, user/IP breakdown
2. **Group Filtering**: Filter by route group (admin, auth, payments, crypto)
3. **Offender Table**: View top offenders with identifier, type, and violation count
4. **Clear Action**: Admin can manually clear rate limits
5. **Auto-refresh**: Real-time data updates

## Sentry Integration

All rate limit violations are logged to Sentry:

```typescript
captureError(new Error("Rate limit exceeded"), {
  level: "warning",
  tags: {
    type: "security",
    event: "rate_limit_exceeded",
    severity: "medium",
    routeGroup: "admin",
    limitGroup: "admin",
  },
  extra: {
    identifier: "user:123",
    path: "/api/admin/users",
    attemptsCount: 21,
    maxAllowed: 20,
  },
});
```

### Sentry Dashboard Queries

```
# All rate limit violations
event.tags.event:rate_limit_exceeded

# Admin route violations
event.tags.routeGroup:admin AND event.tags.event:rate_limit_exceeded

# Authentication abuse
event.tags.limitGroup:auth-strict
```

## Production Deployment

### Redis Setup

#### AWS ElastiCache

```bash
REDIS_URL=redis://your-elasticache-endpoint:6379
REDIS_TLS=true
```

#### Azure Cache for Redis

```bash
REDIS_URL=rediss://your-cache.redis.cache.windows.net:6380
REDIS_PASSWORD=your-access-key
```

#### Redis Cloud

```bash
REDIS_URL=redis://default:password@endpoint:port
```

### Security Best Practices

1. **Authentication**: Always set Redis password in production
2. **TLS Encryption**: Enable TLS for Redis connections
3. **Network Isolation**: Run Redis in private subnet
4. **Regular Backups**: Configure Redis persistence (RDB or AOF)

### Monitoring

#### Redis Health Checks

```bash
# Check connectivity
redis-cli ping

# Monitor rate limit keys
redis-cli --scan --pattern "rate:*" | wc -l

# View top offenders
redis-cli ZREVRANGE offenders:admin 0 9 WITHSCORES
```

#### Sentry Alerts

Configure alerts for:

1. High violation count: `attemptsCount > 100`
2. Repeated offenders
3. Redis connection failures

## Testing

### Manual Testing

```bash
# Test login rate limiter (5 attempts per 15 min)
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
done

# Expected: First 5 return 401, next 5 return 429
```

### Automated Testing

```typescript
describe("Rate Limiter", () => {
  it("should block after max attempts", async () => {
    const requests = Array(6)
      .fill(null)
      .map(() =>
        request(app)
          .post("/api/auth/login")
          .send({ email: "test@example.com", password: "wrong" })
      );

    const responses = await Promise.all(requests);
    expect(responses[5].status).toBe(429);
    expect(responses[5].body).toHaveProperty("retryAfter");
  });
});
```

## Troubleshooting

### Redis Connection Issues

```bash
# Check Redis status
redis-cli ping

# Check backend logs
grep "Redis connection error" backend/logs/app.log

# Verify environment
echo $REDIS_URL
```

### Rate Limit Not Working

1. **Check Redis Keys**: `redis-cli KEYS "rate:*"`
2. **Check Identifier**: Log `getIdentifier(req)` in code
3. **Check Middleware Order**: Rate limiter before route handler

### False Positives

If legitimate users are blocked:

1. **Increase Limits**: Adjust `max` value
2. **Whitelist IPs**: Skip rate limiting for trusted IPs
3. **Skip Successful Requests**: Set `skipSuccessfulRequests: true`

## Migration Guide

### From In-Memory to Redis

1. **Deploy Redis**: Start Redis instance/cluster
2. **Update Environment**: Set `REDIS_URL`
3. **Deploy Backend**: Roll out new code
4. **Monitor**: Check Sentry for Redis connection errors

**No downtime required** - graceful degradation ensures continuity.

## Performance Considerations

### Redis Optimization

- **Connection Pooling**: ioredis auto-manages connections
- **Pipeline Commands**: Batch Redis operations
- **TTL Management**: Keys auto-expire
- **Memory Monitoring**: Track Redis memory usage

### Scaling

- **Single Instance**: Up to 50,000 req/sec
- **Redis Cluster**: Horizontal scaling for millions of req/sec
- **Read Replicas**: For read-heavy workloads

## Security Benefits

1. **Brute Force Protection**: Blocks repeated login attempts
2. **API Abuse Prevention**: Throttles excessive requests
3. **DDoS Mitigation**: Limits per-IP request rates
4. **Account Protection**: Per-user rate limiting
5. **Audit Trail**: Complete Sentry logging

---

**Next Steps:**

1. Deploy Redis in your environment
2. Update `.env` with `REDIS_URL`
3. Restart backend services
4. Access `/admin/rate-limits` to monitor
5. Configure Sentry alerts for violations

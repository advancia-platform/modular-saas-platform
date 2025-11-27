# Security Testing Guide

## Overview

This guide covers security testing practices for Advancia Pay, including automated evaluation framework, manual penetration testing procedures, and compliance validation.

## Security Evaluation Framework

### Purpose

The Security Evaluation Framework provides automated, continuous validation of authentication and security hardening implementation against PCI-DSS requirements.

### Quick Start

```bash
# Run full security evaluation
cd evaluation
pip install -r requirements.txt
python run_evaluation.py

# Run specific category
python run_evaluation.py --test password
python run_evaluation.py --test rate_limit
python run_evaluation.py --test account_lockout
python run_evaluation.py --test jwt
```

### Integration with CI/CD

The framework runs automatically on:

- Every push to `main` or `develop`
- All pull requests
- Weekly schedule (Monday 2 AM UTC)
- Manual trigger via GitHub Actions

**Build fails if security score < 80/100**

### What's Tested

1. **Password Strength** (PCI-DSS 8.2.3)
   - Minimum 12 characters
   - Complexity requirements (upper, lower, number, special)
   - Common password rejection
   - Proper error messages

2. **Account Lockout** (PCI-DSS 8.2.4)
   - 5 failed attempts threshold
   - 15-minute lockout duration
   - Proper 429 status with ACCOUNT_LOCKED
   - retryAfter timestamp

3. **Rate Limiting** (PCI-DSS 6.5.10)
   - Auth endpoints: 5 per 15 minutes
   - Signup: 3 per hour
   - Payments: 10 per 10 minutes
   - Proper 429 responses

4. **JWT Security** (PCI-DSS 8.2.5)
   - Token structure validation
   - Signature verification
   - Expiry enforcement
   - Claim validation

## Manual Security Testing

### Pre-Deployment Checklist

Before deploying to production, manually verify:

- [ ] All auth endpoints require valid JWT
- [ ] Admin endpoints check role permissions
- [ ] Rate limiting active on all public endpoints
- [ ] CORS properly configured (no `*` in production)
- [ ] Security headers present (CSP, HSTS, etc.)
- [ ] No secrets in logs or error messages
- [ ] Database uses prepared statements (Prisma ORM)
- [ ] File uploads validated and sanitized
- [ ] Webhook signatures verified (Stripe, Cryptomus)

### Penetration Testing Scenarios

#### 1. Authentication Bypass Attempts

```bash
# Test missing token
curl http://localhost:4000/api/users/profile

# Test invalid token
curl -H "Authorization: Bearer invalid" \
  http://localhost:4000/api/users/profile

# Test expired token
curl -H "Authorization: Bearer <expired_token>" \
  http://localhost:4000/api/users/profile
```

**Expected**: All return 401 or 403

#### 2. SQL Injection Prevention

```bash
# Test SQL injection in login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin'\'' OR 1=1--","password":"anything"}'
```

**Expected**: 401 Unauthorized (Prisma prevents SQLi)

#### 3. XSS Prevention

```bash
# Test XSS in user input
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"<script>alert(1)</script>","lastName":"User"}'
```

**Expected**: Input sanitized before storage

#### 4. Rate Limit Bypass

```bash
# Rapid-fire requests with different IPs
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "X-Forwarded-For: 192.168.1.$i" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

**Expected**: Rate limit still enforced (IP spoofing blocked)

#### 5. CSRF Protection

```bash
# Attempt state-changing operation without CSRF token
curl -X POST http://localhost:4000/api/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Origin: https://evil.com" \
  -d '{"amount":"1000","type":"WITHDRAWAL"}'
```

**Expected**: Blocked by CORS policy

## Compliance Testing

### PCI-DSS Requirements Mapping

| Requirement | Test Coverage | Location |
|-------------|---------------|----------|
| 8.2.3 - Strong passwords | Password strength evaluator | `evaluation/evaluators/password_strength_evaluator.py` |
| 8.2.4 - Account lockout | Account lockout evaluator | `evaluation/evaluators/account_lockout_evaluator.py` |
| 8.2.5 - Session management | JWT security evaluator | `evaluation/evaluators/jwt_security_evaluator.py` |
| 6.5.10 - Broken auth | Rate limiting evaluator | `evaluation/evaluators/rate_limit_evaluator.py` |
| 6.5.7 - XSS | Input sanitization tests | `backend/src/middleware/security.ts` |
| 6.5.1 - SQLi | Prisma ORM usage | All `backend/src/routes/*.ts` |

### Audit Trail Validation

All security tests generate audit logs for compliance:

```bash
# View audit trail
cat evaluation/results/ci-evaluation_audit.json
```

Audit logs include:

- Timestamp (UTC)
- Evaluator name
- Action performed
- Result (passed/failed)
- Sanitized details (no PII/secrets)

### Compliance Reports

Generate compliance reports for auditors:

```bash
# Generate HTML report
python run_evaluation.py --report html

# Output: evaluation/results/evaluation_report.html
```

## Security Monitoring

### Real-Time Alerts

Configure Sentry for security event monitoring:

```typescript
// backend/src/utils/sentry.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Track authentication failures
  beforeSend(event) {
    if (event.tags?.security === 'auth_failure') {
      // Alert security team
    }
    return event;
  }
});
```

### Log Monitoring

Use Winston structured logging for security events:

```typescript
import logger from './logger';

// Log security events
logger.warn('Failed login attempt', {
  userId: '[REDACTED]',
  ip: req.ip,
  attempts: failedAttempts
});
```

### Metrics to Track

- Failed login attempts per user
- Rate limit hits per endpoint
- JWT validation failures
- Account lockout frequency
- API response times (detect DoS)

## Incident Response

### Security Incident Checklist

If a security issue is discovered:

1. **Immediate Actions**
   - [ ] Document the issue (what, when, how)
   - [ ] Assess impact (data breach? service disruption?)
   - [ ] Isolate affected systems if needed

2. **Investigation**
   - [ ] Review audit logs (`evaluation/results/*_audit.json`)
   - [ ] Check backend logs (`backend/logs/`)
   - [ ] Analyze Sentry error reports
   - [ ] Review database for unauthorized changes

3. **Remediation**
   - [ ] Apply security patches
   - [ ] Update affected user credentials
   - [ ] Re-run security evaluation
   - [ ] Document lessons learned

4. **Post-Incident**
   - [ ] Update security tests to prevent recurrence
   - [ ] Brief team on findings
   - [ ] File compliance reports if required

## Best Practices

### For Developers

1. **Never log sensitive data**

   ```typescript
   // ❌ Bad
   console.log('User password:', password);
   
   // ✅ Good
   logger.info('Password validation completed');
   ```

2. **Use evaluation framework before PR**

   ```bash
   cd evaluation && python run_evaluation.py
   ```

3. **Test edge cases**
   - Empty inputs
   - Very long inputs (buffer overflow)
   - Special characters
   - Concurrent requests

4. **Follow secure coding guidelines**
   - See `.github/copilot-instructions.md`
   - Use Prisma for all DB queries
   - Validate all inputs with `validateInput`
   - Use Winston logger, not `console.log`

### For Security Team

1. **Weekly Review**
   - Check GitHub Actions evaluation results
   - Review failed security tests
   - Monitor Sentry security alerts

2. **Quarterly Audit**
   - Full penetration testing
   - Review audit trail completeness
   - Update threat model
   - Refresh security training

3. **Continuous Improvement**
   - Add new test cases as threats emerge
   - Update evaluation thresholds
   - Refine alerting rules

## References

- Evaluation Framework: `evaluation/README.md`
- Security Hardening Guide: `docs/SECURITY_HARDENING_GUIDE.md`
- Integration Documentation: `docs/EVALUATION_FRAMEWORK.md`
- Backend Architecture: `.github/copilot-instructions.md`
- PCI-DSS Guidelines: <https://www.pcisecuritystandards.org/>

---

**Last Updated**: January 26, 2025  
**Maintained by**: Security & Platform Team

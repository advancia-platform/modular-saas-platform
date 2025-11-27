# Security Evaluation Framework

## Overview

The Security Evaluation Framework provides automated testing and validation of Advancia Pay's authentication and security hardening implementation. It follows fintech security best practices and PCI-DSS compliance requirements.

## Key Features

- **Automated Security Testing**: Validates password strength, account lockout, rate limiting, and JWT security
- **Audit Logging**: Compliance-ready audit trail for all security tests
- **PCI-DSS Compliance Checks**: Built-in validation against PCI-DSS requirements
- **CI/CD Integration**: GitHub Actions workflow for continuous security validation
- **PII Protection**: No sensitive data logged, all outputs sanitized
- **Winston-Style Logging**: Structured logging without console.log (production-ready)

## Architecture Alignment

The framework follows Advancia Pay's architecture patterns:

- Uses **Winston-style structured logging** (see `backend/src/logger.ts`)
- Implements **centralized error handling** patterns
- Follows **Prisma singleton** pattern for any DB access needs
- Uses **proper Decimal serialization** if testing monetary operations
- Respects **CORS and rate limiting** configurations
- Implements **audit logging** for compliance

## Quick Start

```bash
# From repository root
cd evaluation

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Ensure backend is running
cd ../backend && npm run dev

# Run evaluation (in another terminal)
cd evaluation
python run_evaluation.py
```

## Integration with Main Codebase

### Backend Dependencies

The framework tests against these backend components:

- **Authentication**: `backend/src/routes/auth.ts`
- **Rate Limiting**: `backend/src/middleware/rateLimiter.ts`
- **JWT Security**: `backend/src/middleware/auth.ts`
- **Security Headers**: `backend/src/middleware/security.ts`

### Test Coverage

1. **Password Validation** (`evaluators/password_strength_evaluator.py`)
   - Tests rules from `backend/src/routes/auth.ts`
   - Validates 12+ character requirement
   - Checks complexity requirements
   - Tests common password rejection

2. **Account Lockout** (`evaluators/account_lockout_evaluator.py`)
   - Validates 5 failed attempt threshold
   - Tests 15-minute lockout duration
   - Verifies proper error codes (429, ACCOUNT_LOCKED)

3. **Rate Limiting** (`evaluators/rate_limit_evaluator.py`)
   - Tests auth endpoint limits (5 per 15min)
   - Validates signup limits (3 per hour)
   - Checks payment limits (10 per 10min)

4. **JWT Security** (`evaluators/jwt_security_evaluator.py`)
   - Validates token structure
   - Tests signature verification
   - Checks expiry enforcement

## CI/CD Pipeline

The framework integrates with GitHub Actions via `.github/workflows/security-evaluation.yml`:

```yaml
# Triggered on:
- Push to main/develop
- Pull requests
- Weekly schedule (Monday 2 AM UTC)
- Manual dispatch

# Workflow:
1. Setup PostgreSQL test database
2. Install backend dependencies
3. Run database migrations
4. Start backend server
5. Install Python dependencies
6. Run security evaluation
7. Check score threshold (minimum 80/100)
8. Upload results as artifacts
9. Comment on PR with results
```

## Compliance & Auditing

### PCI-DSS Compliance

The framework validates key PCI-DSS requirements:

- **Requirement 8.2.3**: Strong password policies (12+ chars, complexity)
- **Requirement 8.2.4**: Account lockout after failed attempts
- **Requirement 8.2.5**: Session management and JWT security
- **Requirement 6.5.10**: Rate limiting to prevent abuse

### Audit Trail

All security tests generate audit logs:

```json
{
  "timestamp": "2025-01-26T10:30:00Z",
  "evaluator": "PasswordStrengthEvaluator",
  "action": "password_validation_test",
  "result": "passed",
  "details": {
    "expected_accept": false,
    "actual_accept": false,
    "status_code": 400
  }
}
```

Audit logs are saved separately: `results/ci-evaluation_audit.json`

### GDPR Compliance

- **No PII stored**: Test emails use non-identifiable patterns (`eval.test` domain)
- **Data minimization**: Only security-relevant data collected
- **Sanitized logging**: All logs sanitized to remove sensitive data

## Best Practices

### For Developers

1. **Run locally before PR**: `python run_evaluation.py`
2. **Fix failing tests immediately**: Security regressions block deployment
3. **Update test data**: Add new test cases when discovering edge cases
4. **Review audit logs**: Check compliance trail after changes

### For Security Team

1. **Monitor trends**: Track security scores over time
2. **Review weekly reports**: Check automated weekly runs
3. **Audit trail review**: Inspect audit logs quarterly
4. **Update thresholds**: Adjust minimum score as needed

### For DevOps

1. **CI/CD integration**: Workflow runs automatically on push
2. **Artifact retention**: Results kept for 30 days
3. **Alert on failures**: Security score < 80 fails the build
4. **Manual triggers**: Use workflow_dispatch for ad-hoc testing

## Troubleshooting

### Common Issues

**Backend not responding:**

```bash
# Check backend health
curl http://localhost:4000/health

# Check logs
cd backend && npm run dev
```

**Rate limiting interference:**

```bash
# Wait 15 minutes or restart backend
cd backend && npm run dev
```

**Database connection issues:**

```bash
cd backend
npx prisma migrate reset --force
npx prisma migrate deploy
```

### Debug Mode

```bash
# Run with full debug output
python run_evaluation.py --debug --verbose

# Test specific category
python run_evaluation.py --test password --debug
```

## Maintenance

### Quarterly Review Checklist

- [ ] Update test data based on new attack patterns
- [ ] Review and adjust security score thresholds
- [ ] Audit compliance with latest PCI-DSS requirements
- [ ] Update Python dependencies (`pip list --outdated`)
- [ ] Review audit logs for trends
- [ ] Update documentation with new test cases

### Version Compatibility

- **Python**: 3.9+
- **Backend**: Node.js 18+, matches `backend/package.json`
- **Database**: PostgreSQL 15+, matches production
- **Framework**: Aligned with backend security patterns

## References

- Main Security Guide: `docs/SECURITY_HARDENING_GUIDE.md`
- Backend Architecture: `.github/copilot-instructions.md`
- Evaluation README: `evaluation/README.md`
- CI/CD Workflow: `.github/workflows/security-evaluation.yml`

---

**Last Updated**: January 26, 2025  
**Framework Version**: 1.0  
**Maintained by**: Security & Platform Team

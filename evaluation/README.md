# Security Evaluation Framework

This directory contains the evaluation framework for testing and validating the authentication and security hardening implementation.

## Overview

The evaluation framework tests:

- Password strength validation
- Account lockout mechanisms
- Rate limiting enforcement
- JWT token security
- Authentication flows
- Admin security measures
- Payment security

## Structure

```
evaluation/
├── README.md                           # This file
├── requirements.txt                    # Python dependencies
├── .env.example                        # Environment template
├── setup.py                            # Setup validation script
├── data/
│   ├── password_test_cases.jsonl      # Password strength test data
│   ├── auth_test_cases.jsonl          # Authentication flow test data
│   ├── rate_limit_test_cases.jsonl    # Rate limiting test data
│   └── security_scenarios.jsonl       # Comprehensive security tests
├── evaluators/
│   ├── __init__.py
│   ├── password_strength_evaluator.py # Custom password validation evaluator
│   ├── rate_limit_evaluator.py        # Rate limiting effectiveness evaluator
│   ├── account_lockout_evaluator.py   # Account lockout evaluator
│   └── jwt_security_evaluator.py      # JWT token security evaluator
├── run_evaluation.py                   # Main evaluation script
└── results/                            # Evaluation results (generated)
    └── .gitkeep
```

## Quick Start

```bash
# 1. Navigate to evaluation directory
cd evaluation

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start backend server (in another terminal)
cd ../backend && npm run dev

# 5. Run evaluation
python run_evaluation.py
```

## Prerequisites

- Python 3.9+
- Backend server running on <http://localhost:4000>
- Node.js 18+ (for backend)
- PostgreSQL database (for backend)

## Setup

### 1. Install Dependencies

```bash
cd evaluation
pip install -r requirements.txt
```

Required packages:

- `requests` - HTTP client for API testing
- `python-dotenv` - Environment variable management
- `pytest` - Testing framework
- `jsonlines` - JSONL file parsing

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Backend API URL
BACKEND_URL=http://localhost:4000

# Test user credentials (will be created if not exist)
TEST_EMAIL=evaltest@example.com
TEST_PASSWORD=EvalTest123!@#

# Optional: LLM-based evaluators (for advanced analysis)
# OPENAI_API_KEY=your-openai-key
# OPENAI_MODEL=gpt-4
```

### 3. Verify Backend is Running

```bash
# Test backend health
curl http://localhost:4000/health

# Should return: {"status":"healthy"}
```

## Running Evaluations

### Run All Evaluations

```bash
python run_evaluation.py
```

### Run Specific Evaluation

```bash
# Password strength only
python run_evaluation.py --test password

# Rate limiting only
python run_evaluation.py --test rate_limit

# Authentication flow only
python run_evaluation.py --test auth_flow

# JWT security only
python run_evaluation.py --test jwt
```

### Run with Verbose Output

```bash
python run_evaluation.py --verbose
```

### Generate Report

```bash
python run_evaluation.py --report html
# Creates: results/evaluation_report.html
```

## Evaluation Metrics

### 1. Password Strength Validation

**Evaluator**: `PasswordStrengthEvaluator` (Custom Code-based)

**Metrics**:

- `password_accepted`: Boolean - Whether password was accepted
- `validation_correct`: Boolean - Whether validation matched expected result
- `error_message_quality`: 1-5 - Quality of error message
- `execution_time_ms`: Float - Time taken for validation

**Expected Behaviors**:

- Reject passwords < 12 characters
- Reject passwords without uppercase letters
- Reject passwords without lowercase letters
- Reject passwords without numbers
- Reject passwords without special characters
- Reject common passwords (password, 123456, etc.)
- Accept strong passwords meeting all criteria

### 2. Account Lockout Effectiveness

**Evaluator**: `AccountLockoutEvaluator` (Custom Code-based)

**Metrics**:

- `lockout_triggered`: Boolean - Whether account was locked after max attempts
- `attempts_before_lockout`: Int - Number of attempts before lockout (expected: 5)
- `lockout_duration_minutes`: Float - How long account stays locked (expected: 15)
- `reset_on_success`: Boolean - Whether lockout resets after successful login
- `proper_error_code`: Boolean - Returns 429 with ACCOUNT_LOCKED

**Expected Behaviors**:

- Lock account after 5 consecutive failed attempts
- Return 429 status with `error: "ACCOUNT_LOCKED"` or `code: "ACCOUNT_LOCKED"`
- Lockout duration = 15 minutes
- Reset failure counter on successful login
- Provide `retryAfter` timestamp in response

### 3. Rate Limiting Enforcement

**Evaluator**: `RateLimitEvaluator` (Custom Code-based)

**Metrics**:

- `rate_limit_enforced`: Boolean - Whether rate limit was enforced
- `requests_before_limit`: Int - Requests before hitting limit
- `expected_limit`: Int - Expected rate limit value
- `admin_bypass_works`: Boolean - Whether admin bypass functions
- `error_code`: String - HTTP status code when limited

**Expected Behaviors**:

- Auth endpoints: 5 requests per 15 minutes
- Registration: 3 requests per hour
- Password reset: 3 requests per hour
- Payments: 10 requests per 10 minutes
- Admin users bypass all rate limits
- Return 429 status with retryAfter

### 4. JWT Security Validation

**Evaluator**: `JWTSecurityEvaluator` (Custom Code-based)

**Metrics**:

- `token_format_valid`: Boolean - Token structure is valid
- `signature_verified`: Boolean - Token signature is valid
- `claims_present`: Boolean - Required claims (iss, aud, exp) present
- `expiry_checked`: Boolean - Expired tokens rejected
- `invalid_tokens_rejected`: Boolean - Malformed tokens rejected

**Expected Behaviors**:

- Reject requests without tokens (401)
- Reject invalid tokens (403)
- Reject expired tokens (403)
- Accept valid tokens with correct claims
- Validate issuer and audience

### 5. Authentication Flow Completeness

**Evaluator**: `TaskAdherenceEvaluator` (Built-in Prompt-based)

**Purpose**: Validates complete auth flows work end-to-end

**Test Scenarios**:

- Registration → Email verification → Login
- Login → Token refresh → Protected resource access
- Failed login → Account lockout → Wait → Successful login
- Password reset → New password validation → Login

### 6. Security Response Quality

**Evaluator**: Custom Prompt-based with LLM

**Purpose**: Evaluates quality of security error messages

**Metrics**:

- `information_leakage`: 1-5 - Whether error reveals sensitive info
- `user_friendliness`: 1-5 - How clear and helpful the message is
- `security_appropriate`: 1-5 - Whether message follows security best practices

## Test Data Format

### password_test_cases.jsonl

```jsonl
{"password": "short", "should_accept": false, "reason": "Too short (< 12 chars)", "expected_error": "Password must be at least 12 characters"}
{"password": "alllowercase123!", "should_accept": false, "reason": "Missing uppercase", "expected_error": "Password must contain at least one uppercase letter"}
{"password": "ALLUPPERCASE123!", "should_accept": false, "reason": "Missing lowercase", "expected_error": "Password must contain at least one lowercase letter"}
{"password": "NoNumbers!", "should_accept": false, "reason": "Missing number", "expected_error": "Password must contain at least one number"}
{"password": "NoSpecialChar123", "should_accept": false, "reason": "Missing special character", "expected_error": "Password must contain at least one special character"}
{"password": "Password123!", "should_accept": false, "reason": "Common password", "expected_error": "common password"}
{"password": "MyS3cur3P@ssw0rd!", "should_accept": true, "reason": "Strong password", "expected_error": null}
```

### auth_test_cases.jsonl

```jsonl
{"test_name": "signup_weak_password", "endpoint": "/api/auth/signup", "method": "POST", "payload": {"email": "weak@test.com", "password": "weak", "firstName": "Test", "lastName": "User"}, "expected_status": 400}
{"test_name": "signup_strong_password", "endpoint": "/api/auth/signup", "method": "POST", "payload": {"email": "strong@test.com", "password": "StrongP@ss123", "firstName": "Test", "lastName": "User"}, "expected_status": 201}
{"test_name": "login_correct_credentials", "endpoint": "/api/auth/login", "method": "POST", "payload": {"email": "strong@test.com", "password": "StrongP@ss123"}, "expected_status": 200}
```

### rate_limit_test_cases.jsonl

```jsonl
{"endpoint": "/api/auth/login", "method": "POST", "limit": 5, "window_seconds": 900, "description": "Login rate limit"}
{"endpoint": "/api/auth/signup", "method": "POST", "limit": 3, "window_seconds": 3600, "description": "Signup rate limit"}
{"endpoint": "/api/payments/create-intent", "method": "POST", "limit": 10, "window_seconds": 600, "description": "Payment rate limit", "requires_auth": true}
```

## Results Interpretation

### Overall Security Score

The framework calculates an overall security score (0-100) based on:

- Password validation: 20 points
- Account lockout: 20 points
- Rate limiting: 20 points
- JWT security: 20 points
- Auth flow completeness: 10 points
- Error message security: 10 points

**Score Interpretation**:

- 90-100: Excellent - Production ready
- 80-89: Good - Minor improvements needed
- 70-79: Fair - Several issues to address
- <70: Poor - Major security concerns

### Example Results Output

```json
{
  "overall_score": 95,
  "timestamp": "2025-01-26T10:30:00Z",
  "backend_url": "http://localhost:4000",
  "test_duration_seconds": 45.3,
  "summary": {
    "total_tests": 50,
    "passed": 47,
    "failed": 3,
    "skipped": 0
  },
  "category_scores": {
    "password_validation": { "score": 100, "passed": 10, "failed": 0 },
    "account_lockout": { "score": 100, "passed": 5, "failed": 0 },
    "rate_limiting": { "score": 90, "passed": 9, "failed": 1 },
    "jwt_security": { "score": 100, "passed": 8, "failed": 0 },
    "auth_flow": { "score": 85, "passed": 10, "failed": 2 }
  },
  "issues_found": [
    {
      "severity": "medium",
      "category": "rate_limiting",
      "test": "payment_rate_limit_enforcement",
      "message": "Payment endpoint allows 11 requests before limiting (expected 10)",
      "recommendation": "Review rate limiting configuration for payment endpoints"
    }
  ],
  "passed_tests": [
    "password_length_validation",
    "password_complexity_validation"
    // ...
  ],
  "failed_tests": [
    {
      "name": "payment_rate_limit_exact",
      "category": "rate_limiting",
      "expected": "Limit at 10 requests",
      "actual": "Limited at 11 requests",
      "details": "Off-by-one error in rate limiter"
    }
  ]
}
```

## Continuous Evaluation

### GitHub Actions Integration

Add to `.github/workflows/security-evaluation.yml`:

```yaml
name: Security Evaluation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 2 * * 1" # Weekly on Monday at 2 AM UTC

jobs:
  evaluate:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Install backend dependencies
        run: |
          cd backend
          npm ci

      - name: Setup database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        run: |
          cd backend
          npx prisma migrate deploy
          npx prisma db seed

      - name: Start backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          JWT_SECRET: test-jwt-secret
          NODE_ENV: test
        run: |
          cd backend
          npm run build
          npm start &

          # Wait for server to be ready
          timeout 30 bash -c 'until curl -f http://localhost:4000/health; do sleep 1; done'

      - name: Install evaluation dependencies
        run: |
          cd evaluation
          pip install -r requirements.txt

      - name: Run evaluation
        env:
          BACKEND_URL: http://localhost:4000
        run: |
          cd evaluation
          python run_evaluation.py --report json --output results/ci-run.json

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: evaluation-results
          path: evaluation/results/

      - name: Check security score
        run: |
          cd evaluation
          SCORE=$(python -c "import json; print(json.load(open('results/ci-run.json'))['overall_score'])")
          echo "Security Score: $SCORE/100"

          if [ "$SCORE" -lt 80 ]; then
            echo "❌ Security score too low: $SCORE (minimum: 80)"
            exit 1
          fi

          echo "✅ Security score acceptable: $SCORE"

      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('evaluation/results/ci-run.json', 'utf8'));

            const comment = `## 🔒 Security Evaluation Results

            **Overall Score:** ${results.overall_score}/100
            **Tests Passed:** ${results.summary.passed}/${results.summary.total_tests}
            **Duration:** ${results.test_duration_seconds}s

            ### Category Scores
            ${Object.entries(results.category_scores).map(([cat, data]) => 
              `- **${cat}**: ${data.score}/100 (${data.passed}/${data.passed + data.failed} passed)`
            ).join('\n')}

            ${results.issues_found.length > 0 ? `
            ### ⚠️ Issues Found
            ${results.issues_found.map(issue => 
              `- **[${issue.severity.toUpperCase()}]** ${issue.message}`
            ).join('\n')}
            ` : '✅ No issues found'}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Best Practices

1. **Run Before Deployment**: Always run evaluation before deploying to production
2. **Monitor Trends**: Track security scores over time
3. **Update Test Data**: Add new test cases as you discover edge cases
4. **Review Failures**: Investigate all failed tests, even if score is high
5. **Automate**: Integrate into CI/CD pipeline
6. **Regular Audits**: Run comprehensive evaluation weekly

## Troubleshooting

### Backend Not Responding

```bash
# Check if backend is running
curl http://localhost:4000/health

# Check backend logs
cd ../backend
npm run dev

# Verify database connection
cd ../backend
npx prisma studio
```

### Authentication Failures

```bash
# Test signup
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","firstName":"Test","lastName":"User"}'

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'
```

### Rate Limiting Interference

If tests fail due to existing rate limits:

```bash
# Option 1: Wait for rate limit window to expire (15 minutes)

# Option 2: Restart backend to clear in-memory rate limit data
cd ../backend
npm run dev

# Option 3: Use different test emails for each run
export TEST_EMAIL=evaltest-$(date +%s)@example.com
```

### Database Issues

```bash
# Reset database
cd ../backend
npx prisma migrate reset --force

# Apply migrations
npx prisma migrate deploy

# Seed test data
npx prisma db seed
```

### Python Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install with specific versions
pip install -r requirements.txt --no-cache-dir

# Virtual environment recommended
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Development

### Adding New Tests

1. Create test data in `data/` directory:

   ```jsonl
   {
     "test_name": "my_test",
     "endpoint": "/api/endpoint",
     "expected_status": 200
   }
   ```

2. Add evaluator in `evaluators/`:

   ```python
   # evaluators/my_evaluator.py
   def evaluate_my_feature(test_case):
       # Implementation
       return {"passed": True, "score": 100}
   ```

3. Register in `run_evaluation.py`:

   ```python
   evaluators = {
       "my_feature": MyFeatureEvaluator()
   }
   ```

### Running Tests Locally

```bash
# Run with pytest
pytest run_evaluation.py -v

# Run specific test
python run_evaluation.py --test password --verbose

# Debug mode
python run_evaluation.py --debug
```

## Support

For issues or questions:

1. Check the main `SECURITY_HARDENING_GUIDE.md` in `docs/`
2. Review test logs in `results/` directory
3. Check backend logs for API errors
4. Open an issue in the repository with:
   - Evaluation results JSON
   - Backend logs
   - Steps to reproduce

## References

- Main documentation: `docs/SECURITY_HARDENING_GUIDE.md`
- Backend routes: `backend/src/routes/`
- Security middleware: `backend/src/middleware/security.ts`
- Auth implementation: `backend/src/routes/auth.ts`

---

**Last Updated**: January 26, 2025  
**Framework Version**: 1.0  
**Compatible with**: Backend v1.0+, Node.js 18+, Python 3.9+

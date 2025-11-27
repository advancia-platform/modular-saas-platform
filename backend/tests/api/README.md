# Notification Services API Test Package

This package contains comprehensive tests for the Advancia Platform notification services API.

## Test Structure

- `test_notification_services.py` - Main test suite with RBAC, preferences, and email service tests
- `conftest.py` - Pytest configuration and shared fixtures
- `requirements-test.txt` - Test dependencies

## Test Categories

### 🔐 RBAC Tests (`@pytest.mark.rbac`)

- Admin, auditor, and viewer permission testing
- Role-based access control validation
- Cross-role preference isolation

### 📧 Notification Tests (`@pytest.mark.notification`)

- Email service integration (Resend)
- Preference management
- Template handling

### 🚀 Performance Tests (`@pytest.mark.slow`)

- Load testing for concurrent requests
- Performance benchmarks
- Timeout handling

### 🔗 Integration Tests (`@pytest.mark.integration`)

- End-to-end workflow testing
- Multi-service integration scenarios

## Running Tests

### Quick Start

```bash
# Install dependencies
pip install -r requirements-test.txt

# Run all tests with coverage
python run_tests.py

# Run specific test categories
pytest -m "notification"          # Notification tests only
pytest -m "rbac"                  # RBAC tests only
pytest -m "not slow"              # Exclude slow tests
```

### Advanced Usage

```bash
# Run tests with custom coverage threshold
python run_tests.py --coverage-threshold 85

# Run tests in parallel
python run_tests.py --parallel 4

# Run full checks (tests + security + linting)
python run_tests.py --full-check

# Run specific test file
pytest tests/api/test_notification_services.py -v
```

### CI/CD Integration

Tests are automatically run in GitHub Actions with:

- PostgreSQL and Redis services
- Coverage reporting to Codecov
- Security analysis with Bandit
- Dependency vulnerability checks

## Environment Variables

### Required for Local Testing

```bash
export BASE_URL="http://localhost:4000"
export ADMIN_TOKEN="your-admin-jwt-token"
export AUDITOR_TOKEN="your-auditor-jwt-token" 
export VIEWER_TOKEN="your-viewer-jwt-token"
export USER_TOKEN="your-user-jwt-token"
```

### Optional Configuration

```bash
export TEST_TIMEOUT="30"           # Request timeout in seconds
export DATABASE_URL="postgresql://..." # Test database URL
export REDIS_URL="redis://localhost:6379" # Test Redis URL
```

## Test Reports

After running tests, you'll find:

- `coverage.xml` - XML coverage report for CI/CD
- `htmlcov/index.html` - Interactive HTML coverage report
- `bandit-report.json` - Security analysis results
- `safety-report.json` - Dependency vulnerability report

## Coverage Targets

- **Overall Coverage**: 75% minimum, 80% target
- **RBAC Functions**: 90% minimum
- **Notification Services**: 85% minimum
- **API Endpoints**: 80% minimum

## Test Data

Tests use isolated test users with different roles:

- `test@example.com` - Standard user
- `admin@example.com` - Admin user
- `auditor@example.com` - Auditor user  
- `viewer@example.com` - Viewer user

All test data is automatically cleaned up between test runs.

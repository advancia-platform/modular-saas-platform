# Security Evaluation Framework

Python-based security testing suite for the Advancia Pay Ledger backend API.

## Quick Start

```bash
# From backend directory:
npm run eval:install          # Install Python dependencies
npm run eval:setup            # Create .env file
npm run dev                   # Start backend in another terminal
npm run security:test         # Run all security tests
```

## Troubleshooting

If tests fail, run diagnostics:

```bash
npm run eval:diagnose
```

This will check:

- ✅ Backend server status
- ✅ Database connectivity
- ✅ Python dependencies
- ✅ Test data files
- ✅ Environment configuration

## Manual Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Configure environment:

```bash
cp .env.example .env
# Edit .env with your test configuration
```

3. Ensure backend is running:

```bash
cd ..
npm run dev
```

## Running Tests

### Run all security evaluators

```bash
python run_all_evaluators.py
```

### Run specific evaluator

```bash
python evaluators/password_strength.py
python evaluators/auth_bypass.py
python evaluators/rate_limiting.py
```

## Evaluators

- **password_strength.py**: Tests password validation rules (12 test cases)
- **auth_flow.py**: Tests authentication endpoints and error handling (5 test cases)
- **rate_limiting.py**: Tests rate limiting on sensitive endpoints (2 test cases)

## Reports

Results are saved to `results/` directory in JSON format.

## Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run Security Tests
  run: |
    cd backend/security-tests
    pip install -r requirements.txt
    python run_all_evaluators.py
```

# Wallet Test Suite

Comprehensive testing for the custodial wallet system.

## Test Files

### `wallet-unit.test.js`

Unit tests for individual wallet service functions:

- Address format validation (BTC, ETH, USDT)
- Encryption/decryption logic
- User index derivation
- BIP44 path validation
- Master seed validation
- Rotation logic

### `wallet-integration.test.js`

End-to-end integration tests:

- User registration with auto-wallet initialization
- Wallet retrieval and validation
- Address uniqueness across users
- Wallet rotation functionality
- Rotation history tracking
- Security and authorization

### `test-wallet.js`

Manual testing script for production verification.

## Running Tests

### Install Dependencies

```bash
cd backend
pnpm add -D mocha chai axios
```

### Run All Tests

```bash
pnpm test
```

### Run Unit Tests Only

```bash
pnpm test:unit
```

### Run Integration Tests Only

```bash
pnpm test:integration
```

### Watch Mode (for development)

```bash
pnpm test:watch
```

## Test Coverage

### ✅ Functional Tests

- [x] User registration creates 3 wallets
- [x] BTC, ETH, USDT addresses generated
- [x] Address format validation
- [x] Unique addresses per user
- [x] Wallet rotation changes address
- [x] Balance preservation during rotation
- [x] Rotation history tracking

### ✅ Security Tests

- [x] Unauthorized access blocked
- [x] Invalid tokens rejected
- [x] Rotation requires reason
- [x] Invalid currency rejected
- [x] Encryption/decryption working
- [x] Wrong key rejected

### ✅ Data Integrity Tests

- [x] Deterministic address generation
- [x] Same userId = same index
- [x] Creation timestamps present
- [x] Wallet IDs valid

## Expected Results

All tests should pass with:

```
  Custodial Wallet System - Integration Tests
    1. User Registration & Wallet Initialization
      ✓ should register a new user
      ✓ should auto-initialize 3 wallets (BTC, ETH, USDT)
      ✓ should have unique addresses for each currency
      ✓ should have valid BTC address format
      ✓ should have valid ETH address format
      ✓ should have valid USDT address format
      ✓ should have zero initial balance

    2. Wallet Rotation
      ✓ should rotate BTC wallet address
      ✓ should preserve balance after rotation
      ✓ should record rotation in history

    3. Security & Validation
      ✓ should prevent unauthorized access to wallets
      ✓ should reject rotation without reason
      ✓ should reject invalid currency rotation

    4. Multiple Users - Unique Addresses
      ✓ should create second user with different wallets
      ✓ should have different addresses from user 1
      ✓ should maintain address uniqueness for same currency

    5. Wallet Properties & Metadata
      ✓ should have creation timestamp
      ✓ should have correct currency labels
      ✓ should include wallet ID

  18 passing (8s)
```

## Prerequisites

### Local Testing

1. Docker Desktop running (Postgres database)
2. Backend server running on port 4000
3. Environment variables configured:
   - `WALLET_MASTER_SEED`
   - `WALLET_ENCRYPTION_KEY`

### Production Testing

```bash
export TEST_API_URL=https://api.advancia.com/api
pnpm test:integration
```

## Troubleshooting

### Tests Fail with Connection Error

- Ensure backend server is running: `pnpm run dev`
- Check Docker container: `docker ps | grep advancia-postgres`

### Invalid Address Format

- Verify master seed is configured
- Check encryption key is valid base64

### Unauthorized Errors

- Clear test database between runs
- Verify JWT_SECRET is set

## CI/CD Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run Wallet Tests
  run: |
    cd backend
    pnpm test
```

## Coverage Goals

- **Unit Tests**: 100% of utility functions
- **Integration Tests**: 90%+ of API endpoints
- **Security Tests**: 100% of auth/validation paths

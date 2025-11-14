# Advancia Pay Ledger - Backend API

Real-time transaction processing backend with WebSocket support and Prisma ORM.

## ✅ Setup Status

- ✅ Express.js server configured
- ✅ Socket.IO for real-time updates
- ✅ TypeScript compilation working
- ✅ Prisma schema created
- ✅ Prisma client generated
- ✅ Winston logger configured
- ✅ Email templates with XSS protection
- ✅ Debug configurations for VS Code
- ⏸️ Database migration pending (see [PRISMA_SETUP.md](./PRISMA_SETUP.md))

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Uses nodemon for auto-restart on file changes.

### Production Mode with PM2

```bash
# Install PM2 globally (one-time)
npm install -g pm2

# Start the application
npm run pm2:start

# View logs
npm run pm2:logs

# Monitor processes
npm run pm2:monit

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop

# Save PM2 configuration for auto-restart on server reboot
pm2 save
pm2 startup
```

PM2 ensures your application stays running, auto-restarts on crashes, and survives server reboots.

### Log Rotation

PM2 automatically rotates logs to prevent disk space issues. Log rotation is configured directly in `ecosystem.config.js`:

- **Max size**: 10MB per log file
- **Retention**: Keep 7 rotated log files
- **Compression**: Gzipped old logs
- **Rotation**: Daily at midnight
- **Date format**: `YYYY-MM-DD_HH-mm-ss`

Logs are stored in `backend/logs/`:

- `out.log` - Standard output
- `err.log` - Error output
- `combined.log` - All logs combined

Rotated files will appear as:
```
out-2025-11-14_00-00-00.log.gz
err-2025-11-14_00-00-00.log.gz
combined-2025-11-14_00-00-00.log.gz
```

## 🚀 API Endpoints

### Health & Status

- `GET /api/health` - Health check endpoint

### Authentication (Stubs - Ready for Implementation)

- `POST /api/auth/login` - User login (TODO: implement real logic)
- `POST /api/auth/register` - User registration (TODO: implement real logic)
- `POST /api/auth/logout` - User logout (TODO: implement real logic)

### Email Templates Available

- Welcome email (`emailTemplates.welcome`)
- Password reset (`emailTemplates.passwordReset`)
- Email verification (`emailTemplates.emailVerification`)
- Transaction alerts (`emailTemplates.transactionAlert`)

**See `src/routes/` for implementation stubs and `src/utils/emailTemplates.ts` for email templates.**

## Quick Start

### 1. Install Dependencies

```powershell
npm install
```

### 2. Set Up Database

**See [PRISMA_SETUP.md](./PRISMA_SETUP.md) for detailed options.**

**Quick Docker Setup (Recommended):**

```powershell
# Start PostgreSQL container
docker run --name advancia-postgres `
  -e POSTGRES_USER=dev_user `
  -e POSTGRES_PASSWORD=dev_password `
  -e POSTGRES_DB=advancia_ledger `
  -p 5432:5432 `
  -d postgres:14-alpine

# Run database migration
npx prisma migrate dev --name init
```

**Alternative: SQLite (Quick Development)**

```powershell
# Edit prisma/schema.prisma - change provider to "sqlite"
# Then run:
npx prisma migrate dev --name init
```

### 3. Configure Environment

Create `.env` file (or copy from `.env.example`):

```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/advancia_ledger?schema=public

# Authentication
JWT_SECRET=your-super-secret-jwt-key
ADMIN_KEY=supersecureadminkey123

# Email (SMTP/Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@advanciapayledger.com

# Logging
LOG_LEVEL=info

# Stripe (optional but required for payments route)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Start Development Server

```powershell
npm run dev
```

Server starts on `http://localhost:4000`

### 5. Verify Setup

```powershell
# Test health endpoint
curl http://localhost:4000/health

# Open database GUI
npx prisma studio
```

## API Endpoints

### Health Check

```http
GET /health
```

Returns server status and uptime.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

### Create Transaction

```http
POST /api/transaction
Content-Type: application/json

{
  "userId": "user-123",
  "amount": 50.00,
  "type": "credit",
  "description": "Salary deposit"
}
```

**Response:**

```json
{
  "id": "uuid",
  "userId": "user-123",
  "amount": 50.0,
  "type": "credit",
  "status": "pending",
  "description": "Salary deposit",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Recent Transactions

```http
GET /api/transactions/recent/:userId
```

Returns the last 10 transactions for a user.

**Response:**

```json
[
  {
    "id": "uuid",
    "userId": "user-123",
    "amount": 50.0,
    "type": "credit",
    "status": "completed",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
]
```

### Get All User Transactions

```http
GET /api/transactions/user/:userId
```

Returns all transactions for a user.

### Get User Balance

```http
GET /api/transactions/balance/:userId
```

**Response:**

```json
{
  "userId": "user-123",
  "balance": 450.75
}
```

### Create Stripe Checkout Session

```http
POST /api/payments/checkout-session
Content-Type: application/json

{
  "amount": 49.99,
  "currency": "usd",
  "metadata": {
    "userId": "user-123",
    "email": "customer@example.com"
  }
}
```

**Response:**

```json
{
  "id": "cs_test_a1B2...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1B2..."
}
```

> Requires `STRIPE_SECRET_KEY` to be present. Returns 503 if payments are disabled.

### Save Recovery QR Snapshot

```http
POST /api/recovery/qr
Content-Type: application/json

{
  "walletId": "1",
  "address": "bc1q...",
  "qrDataUrl": "data:image/png;base64,iVBOR...",
  "userId": "user-123"
}
```

Currently stores payload in application logs (plug in secure storage later).

## WebSocket Events

### Client → Server

**Join User Room**

```javascript
socket.emit("join-room", userId);
```

### Server → Client

**New Transaction**

```javascript
socket.on("transaction-created", (transaction) => {
  console.log("New transaction:", transaction);
});
```

**Global Transaction Broadcast**

```javascript
socket.on("global-transaction", (transaction) => {
  console.log("Transaction broadcast:", transaction);
});
```

## Database Schema

The backend uses Prisma ORM with the following models:

### User

- Authentication and profile management
- Relations to transactions and debit cards

### Transaction

- Financial transaction records
- Decimal precision for amounts
- Status tracking (pending, completed, failed)

### DebitCard

- Virtual/physical card management
- Balance and daily limit tracking

### Session

- User session management
- Token-based authentication

### AuditLog

- Compliance and activity tracking
- JSON storage for flexible logging

See `prisma/schema.prisma` for full schema definition.

## Development

### Build Project

```powershell
npm run build
```

Compiles TypeScript to `dist/` folder.

### Start Production

```powershell
npm start
```

Runs compiled JavaScript from `dist/`.

### Prisma Commands

```powershell
# Generate Prisma Client (after schema changes)
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Server entry point
│   ├── routes/
│   │   └── transaction.ts    # Transaction API routes
│   └── types/
│       └── transaction.ts    # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration history
├── dist/                     # Compiled JavaScript
├── .env                      # Environment variables
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies

```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/advancia_ledger"

# Server
PORT=4000
NODE_ENV=development

# Frontend CORS
FRONTEND_URL="http://localhost:3000"

# Optional: JWT & Session
JWT_SECRET="your-secret-key"
SESSION_SECRET="your-session-secret"
```

## Testing

### Automated Test Suite

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run with watch mode (auto-rerun on changes)
npm run test:watch

# Run with full coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Run notification tests specifically
npm run test:notifications

# Run with verbose output for debugging
npm run test:verbose
```

**Test Status**: ✅ 67/84 tests passing (17 skipped - generic payments API)

### Test Infrastructure

The test suite includes comprehensive infrastructure for robust testing:

- **Mock Objects**: `tests/setup/mocks.ts`
  - Cryptomus API mocking for crypto payment tests
  - Email service mocking for notification tests
  - Blockchain network mocking for transaction tests
- **Admin Utilities**: `tests/setup/adminSetup.ts`
  - Admin user creation and cleanup
  - JWT token generation for authenticated tests
  - Test data fixtures and helpers
- **Environment Helpers**: `tests/setup/testEnv.ts`
  - Environment variable loading and validation
  - CI/CD detection
  - Service availability checks

### Test Configuration

- **Environment**: Uses `.env.test` with mock-friendly defaults
- **Database**: Separate test database (`advancia_payledger_test`)
- **Execution**: Serial execution to avoid race conditions
- **Cleanup**: Automatic database cleanup before/after tests

### Writing Tests

```typescript
// Example: Using test infrastructure
import { createTestAdmin, generateAdminToken } from "./setup/adminSetup";
import { mockCryptomusAPI, resetAllMocks } from "./setup/mocks";

describe("Your Feature", () => {
  let adminToken: string;

  beforeAll(async () => {
    const admin = await createTestAdmin();
    adminToken = generateAdminToken(admin.id);
  });

  afterEach(() => {
    resetAllMocks();
  });

  it("should work", async () => {
    const res = await request(app)
      .get("/api/endpoint")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});
```

**For detailed test documentation**, see:

- `TEST_IMPLEMENTATION_GUIDE.md` - Comprehensive implementation guide
- `QUICK_TEST_REFERENCE.md` - Quick reference card
- `tests/README.md` - Test suite documentation

### Manual API Testing

Use the automated health check:

```powershell
# From project root
.\START-HEALTH-TEST.bat
```

This will:

1. Start the backend server in a new terminal
2. Wait for startup
3. Run health checks
4. Test all API endpoints

## Troubleshooting

### Database Connection Failed

```
Error: P1000: Authentication failed
```

**Solution:**

- Verify PostgreSQL is running: `Get-Service postgresql*`
- Check DATABASE_URL in `.env`
- For Docker: `docker ps` to verify container is running
- See [PRISMA_SETUP.md](./PRISMA_SETUP.md) for setup help

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**

```powershell
# Find process using port 4000
netstat -ano | findstr :4000

# Kill process (replace PID)
taskkill /PID <pid> /F
```

### Prisma Client Not Generated

```
Error: Cannot find module '@prisma/client'
```

**Solution:**

```powershell
npx prisma generate
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.21
- **Language**: TypeScript 5.9
- **Database ORM**: Prisma 5.22
- **WebSocket**: Socket.IO 4.8
- **Database**: PostgreSQL 14+ (or SQLite for dev)

## API Documentation

For detailed API testing with Postman/Thunder Client, see the test collection in `START-HEALTH-TEST.bat`.

## Contributing

1. Make changes to source code in `src/`
2. Update schema if database changes needed
3. Run `npx prisma migrate dev --name <description>`
4. Test with `npm run dev`
5. Build with `npm run build`

## License

MIT

## Support

For issues and questions:

- Check [PRISMA_SETUP.md](./PRISMA_SETUP.md) for database setup
- Review API endpoints documentation above
- Check environment variables are correct
- Verify all dependencies installed: `npm install`

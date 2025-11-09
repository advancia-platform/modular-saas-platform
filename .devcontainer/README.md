# 🚀 Modular SaaS Platform - Codespace Development

Welcome to the GitHub Codespace for the Modular SaaS Platform! This environment is pre-configured with all the tools and services you need for full-stack development.

## 🎯 Quick Start

1. **Automatic Setup**: The Codespace will automatically run the setup script when created
2. **Wait for Services**: Allow 2-3 minutes for all services (PostgreSQL, Redis, Prometheus) to start
3. **Start Development**: Run `npm run dev` or use the shortcuts below

## 🛠️ Pre-installed Tools

- **Node.js 18** with npm and global packages
- **Playwright** with all browsers installed
- **Cypress** for E2E testing
- **PostgreSQL 15** with development databases
- **Redis 7** for caching and sessions
- **Prometheus** for monitoring
- **Docker CLI** for containerized development
- **GitHub CLI** for repository management

## 🚀 Development Commands

### Quick Shortcuts

```bash
saas-dev     # Start development servers
saas-test    # Run comprehensive tests
saas-e2e     # Run E2E tests
```

### Full Commands

```bash
# Development
npm run dev              # Next.js app (port 3000)
npm run dev:ui           # Development UI (port 3003)
npm run dev:api          # API server (port 3005)
npm run dev:services     # Both UI and API
npm run dev:full         # App + database studio

# Testing
npm run test             # All tests
npm run test:working     # Only working tests
npm run test:simple      # Simple component tests
npm run test:e2e         # Playwright E2E tests
npm run test:cypress     # Cypress E2E tests
npm run test:coverage    # Test coverage report

# Database
npx prisma studio        # Database browser (port 5555)
npx prisma db push       # Push schema changes
npx prisma migrate dev   # Create migration
npm run db:seed          # Seed test data
```

## 🔗 Port Forwarding

The Codespace automatically forwards these ports:

| Port | Service        | Description           |
| ---- | -------------- | --------------------- |
| 3000 | Next.js App    | Main application      |
| 3003 | Development UI | Development interface |
| 3005 | API Server     | Backend API           |
| 3001 | Storybook      | Component library     |
| 5432 | PostgreSQL     | Database              |
| 6379 | Redis          | Cache & sessions      |
| 9090 | Prometheus     | Monitoring            |
| 5555 | Prisma Studio  | Database browser      |

## 📊 Database Setup

Three databases are pre-configured:

- `saas_platform_dev` - Development
- `saas_platform_test` - Testing
- `saas_platform_staging` - Staging

Connection details:

```
Host: db (or localhost from your machine)
Port: 5432
Username: postgres
Password: password
```

## 🧪 Testing Framework

### Advanced UI Testing

- **Dynamic UI State Testing** - Test loading states, modals, forms
- **Visual Regression Testing** - Pixel-perfect UI comparison
- **Performance Testing** - State transition timing validation
- **Real Browser Testing** - Playwright automation
- **APM Integration** - Production monitoring simulation

### Test Patterns Available

```typescript
// Loading button testing
await waitForButtonToLoad(button);

// Modal state testing
await waitForModalToAppear(MODAL_PATTERNS.SUCCESS);

// Form validation testing
await waitForFormValidation();

// Performance measurement
const timing = await measureStateTransition('login-flow');
```

## 🏗️ Architecture

```
├── .devcontainer/          # Codespace configuration
├── src/                    # Source code
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── lib/               # Utilities
│   └── modules/           # Feature modules
├── tests/                 # Test suite
│   ├── components/        # Component tests
│   ├── patterns/          # UI pattern tests
│   └── utils/            # Test utilities
├── e2e/                   # End-to-end tests
├── cypress/               # Cypress tests
└── docs/                  # Documentation
```

## 🔧 Advanced Features

### Real Browser Automation

```typescript
const browser = new BrowserTestManager();
await browser.captureScreenshot('component-test');
const diff = await browser.compareWithBaseline('component-test');
```

### APM Integration

```typescript
const apm = APMProviders.getProvider('development');
await apm.startTransaction('user-workflow');
// ... test code ...
await apm.endTransaction();
```

### Performance Testing

```typescript
const tracker = new StateTimingTracker();
tracker.startTransition('page-load');
// ... page interaction ...
const metrics = tracker.endTransition('page-load');
```

## 🚨 Troubleshooting

### Services Not Starting

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs db
docker-compose logs redis

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Test connection
pg_isready -h db -p 5432 -U postgres

# Connect to database
psql -h db -U postgres -d saas_platform_dev
```

### Redis Connection Issues

```bash
# Test Redis
redis-cli -h redis -p 6379 ping

# Connect to Redis
redis-cli -h redis -p 6379
```

### Test Failures

```bash
# Clear test cache
npm run test -- --clearCache

# Run specific test
npm test -- --testNamePattern="specific test"

# Debug mode
npm test -- --verbose
```

## 📝 Environment Variables

Key environment variables for development:

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@db:5432/saas_platform_dev
REDIS_URL=redis://redis:6379
NEXT_TELEMETRY_DISABLED=1
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
```

## 🔄 CI/CD Integration

The Codespace is configured to work seamlessly with:

- GitHub Actions workflows
- Automated testing on PR
- Deployment to staging/production
- Performance monitoring

## 🎯 Development Workflow

1. **Feature Development**

   ```bash
   git checkout -b feature/new-feature
   npm run dev
   # Develop your feature
   npm run test:working
   ```

2. **Testing**

   ```bash
   npm run test              # Unit tests
   npm run test:e2e          # E2E tests
   npm run test:coverage     # Coverage report
   ```

3. **Quality Checks**

   ```bash
   npm run lint             # ESLint
   npm run format           # Prettier
   npm run type-check       # TypeScript
   ```

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

## 🌟 Pro Tips

- Use `Ctrl+Shift+P` → "Ports" to manage port forwarding
- Install recommended VS Code extensions for better DX
- Use GitHub CLI: `gh pr create` for quick PRs
- Monitor logs: `docker-compose logs -f`
- Database browser: Open port 5555 after running `npx prisma studio`

## 🆘 Support

- Check the main [README.md](../README.md) for project documentation
- Review [docs/](../docs/) for detailed guides
- Use GitHub Issues for bug reports
- Check [TESTING_GUIDE.md](../TESTING_GUIDE.md) for testing help

---

🎉 **Happy coding!** Your full-stack development environment is ready to use.

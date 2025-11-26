# Contributing Guide 🤝

Thank you for your interest in contributing to the Notification Preferences project!  
This guide outlines how to set up your environment, follow coding standards, and submit pull requests.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Version 18.x or higher
- **Python**: Version 3.9 or higher (for backend services)
- **PostgreSQL**: Version 14 or higher
- **Git**: Latest version for version control
- **Docker**: Optional, for containerized development

### Environment Setup
1. **Fork the repository** and clone your fork locally:
   ```bash
   git clone https://github.com/your-username/notification-preferences.git
   cd notification-preferences
   ```

2. **Install dependencies**:
   ```bash
   # Frontend dependencies
   cd frontend
   npm install

   # Backend dependencies  
   cd ../backend
   npm install
   
   # Install Python dependencies if using Python services
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   ```bash
   # Copy example environment files
   cp .env.example .env
   
   # Required environment variables:
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   JWT_SECRET=your-secret-key
   RESEND_API_KEY=your-resend-key
   TWILIO_API_KEY=your-twilio-key  
   SLACK_WEBHOOK_URL=your-slack-webhook
   ```

4. **Database setup**:
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development servers**:
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev

   # Terminal 2: Frontend  
   cd frontend && npm run dev
   ```

---

## 🧑‍💻 Development Standards

### Coding Standards
- **Frontend**: React + TypeScript with Next.js 14 (App Router)
- **Styling**: Tailwind CSS for consistent design system
- **State Management**: React hooks and Context API, Zustand for complex state
- **Backend**: Node.js + Express + TypeScript with Prisma ORM
- **Database**: PostgreSQL with proper normalization and indexing
- **API Design**: RESTful endpoints with OpenAPI documentation

### Code Style and Linting
- **ESLint Configuration**: Strict TypeScript and React rules
- **Prettier**: Code formatting with consistent style
- **Pre-commit hooks**: Automated linting and formatting
  ```bash
  # Run linting
  npm run lint           # Frontend
  npm run lint:backend   # Backend
  
  # Auto-fix linting issues
  npm run lint:fix       # Frontend
  npm run lint:fix:backend # Backend
  ```

### File and Folder Structure
```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and configurations
│   ├── types/           # TypeScript type definitions
│   └── __tests__/       # Test files
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript interfaces
│   └── __tests__/       # Test files
├── prisma/              # Database schema and migrations
└── docs/                # API documentation
```

### Naming Conventions
- **Files**: kebab-case for components (`notification-modal.tsx`)
- **Components**: PascalCase (`NotificationModal`)
- **Functions**: camelCase (`updatePreferences`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)
- **Database**: snake_case for tables and columns (`user_preferences`)

---

## 🧪 Testing Requirements

### Test Coverage Standards
- **Minimum coverage**: 80% (raising to 85% in v1.2)
- **Critical paths**: 100% coverage required for authentication and RBAC
- **New features**: All new code must include tests
- **Bug fixes**: Regression tests required

### Testing Frameworks
- **Frontend**: Vitest + React Testing Library
- **Backend**: Jest + Supertest for API testing
- **E2E Testing**: Playwright for critical user journeys
- **Component Testing**: Storybook for component documentation

### Running Tests
```bash
# Frontend tests
cd frontend && npm test

# Backend tests  
cd backend && npm test

# Coverage reports
npm run test:coverage

# E2E tests
npm run test:e2e

# Specific test patterns
npm test -- --grep "notification preferences"
```

### Test Structure and Best Practices
```typescript
// Example test structure
describe('NotificationPreferences', () => {
  beforeEach(() => {
    // Setup test data
  });

  describe('RBAC Enforcement', () => {
    it('should allow Admin to modify all preferences', async () => {
      // Test implementation
    });

    it('should restrict Viewer to read-only access', async () => {
      // Test implementation
    });
  });

  describe('Data Validation', () => {
    it('should validate notification category inputs', async () => {
      // Test implementation
    });
  });
});
```

---

## 🔄 Pull Request Workflow

### Before Creating a PR
1. **Create a feature branch**:
   ```bash
   git checkout -b feat/notification-categories
   # or
   git checkout -b fix/rbac-authorization-bug  
   # or
   git checkout -b docs/update-api-documentation
   ```

2. **Ensure code quality**:
   ```bash
   # Run tests
   npm test
   npm run test:coverage
   
   # Run linting
   npm run lint
   npm run lint:fix
   
   # Type checking
   npm run type-check
   ```

3. **Update documentation** if needed:
   - API changes: Update OpenAPI specification
   - New features: Update user documentation  
   - Configuration changes: Update setup guides

### PR Creation Process
1. **Push branch** to your fork:
   ```bash
   git push origin feat/notification-categories
   ```

2. **Create pull request** with clear title and description:
   - Use [Conventional Commits](https://www.conventionalcommits.org/) format
   - Describe what the PR does and why
   - Link related issues with `Fixes #123` or `Related to #456`
   - Include screenshots for UI changes

3. **PR Labels**: Apply appropriate labels
   - `feature`: New functionality
   - `bug`: Bug fixes  
   - `security`: Security improvements
   - `docs`: Documentation updates
   - `breaking`: Breaking changes

### PR Template
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)  
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Coverage requirements met (≥80%)
- [ ] Manual testing completed
- [ ] RBAC permissions verified

## Security Checklist  
- [ ] No secrets in code
- [ ] Input validation implemented
- [ ] RBAC controls enforced
- [ ] Security tests included

## Documentation
- [ ] API documentation updated
- [ ] User guide updated (if applicable)
- [ ] Code comments added for complex logic
```

### Review Requirements
- **Minimum reviewers**: 1 for bug fixes, 2 for new features
- **Security review**: Required for authentication, authorization, and data handling changes
- **Design review**: Required for significant UI/UX changes
- **Performance review**: Required for database schema or query changes

---

## 🚀 Release Process

### Release Management
- **Release Drafter**: Automated release notes generation
- **Semantic Versioning**: `MAJOR.MINOR.PATCH` format
- **Release Cadence**: 
  - Major releases: Quarterly
  - Minor releases: Monthly
  - Patch releases: As needed for bugs/security

### Version Bumping
```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)  
npm version minor

# Major version (breaking changes)
npm version major
```

### Release Notes
- Automatically generated via Release Drafter
- Manual curation for major releases
- Security updates highlighted prominently
- Migration guides for breaking changes

---

## 🔒 Security and Compliance

### Security Best Practices
- **Never commit secrets**: Use environment variables or secret management
- **Input validation**: Validate all user inputs at API boundaries
- **SQL injection prevention**: Use parameterized queries (Prisma handles this)
- **XSS prevention**: Sanitize outputs and use Content Security Policy
- **Authentication**: Implement proper JWT handling and validation

### RBAC Implementation
- **Role checking**: Implement role checks in both frontend and backend
- **Permission validation**: Verify permissions at multiple layers
- **Audit logging**: Log all permission changes and access attempts
- **Testing**: Include RBAC tests for all new features

### Compliance Requirements
- **GDPR compliance**: Ensure data handling follows privacy requirements
- **CCPA compliance**: Implement user rights for California residents  
- **Audit trails**: Maintain comprehensive logs for compliance reviews
- **Data retention**: Follow defined retention policies

### Security Testing
```bash
# Security linting
npm run lint:security

# Dependency vulnerability scanning
npm audit
npm audit fix

# OWASP ZAP scanning (if configured)
npm run security:scan
```

---

## 📊 Quality Gates

### Continuous Integration Checks
All PRs must pass these automated checks:
- ✅ **Tests pass**: All unit and integration tests
- ✅ **Coverage threshold**: Minimum 80% code coverage
- ✅ **Linting**: ESLint and Prettier checks pass
- ✅ **Type checking**: TypeScript compilation successful
- ✅ **Security scanning**: No critical vulnerabilities
- ✅ **Build success**: Frontend and backend build without errors

### Manual Review Checklist
- ✅ **Code quality**: Clean, readable, maintainable code
- ✅ **Performance**: No performance regressions introduced
- ✅ **Security**: Security best practices followed
- ✅ **Documentation**: Adequate documentation provided
- ✅ **Testing**: Appropriate test coverage and quality

### Definition of Done
- [ ] Feature/fix implemented according to requirements
- [ ] Code reviewed and approved by required reviewers
- [ ] All CI checks passing
- [ ] Documentation updated (if applicable)
- [ ] Tests written and passing (≥80% coverage)
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] RBAC controls implemented and tested

---

## 🤝 Community Standards

### Code of Conduct
All contributors must follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md):
- Be respectful and inclusive
- Provide constructive feedback
- Focus on the best outcome for the community
- Show empathy towards other community members

### Communication Guidelines
- **GitHub Issues**: Bug reports, feature requests, and discussions
- **Pull Request Comments**: Code review and technical discussions
- **Email**: Security vulnerabilities (security@company.com)
- **Slack**: Team coordination (internal contributors only)

### Respectful Collaboration
- **Constructive feedback**: Focus on code, not the person
- **Patience**: Allow time for responses and iterations
- **Recognition**: Credit others for their contributions
- **Learning**: Help newcomers and share knowledge

---

## 📚 Additional Resources

### Documentation
- [API Documentation](./API.md) - Complete API reference
- [Architecture Guide](./ARCHITECTURE.md) - System design overview
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Security Policy](./SECURITY.md) - Security guidelines and procedures

### Development Tools
- [VS Code Extensions](./.vscode/extensions.json) - Recommended extensions
- [Git Hooks](./.githooks/) - Pre-commit and pre-push hooks
- [Docker Setup](./docker-compose.yml) - Containerized development environment

### Learning Resources
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Security](https://nodejs.org/en/security/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🎯 Getting Help

### Where to Ask Questions
1. **GitHub Discussions**: General questions and feature discussions
2. **GitHub Issues**: Bug reports and feature requests
3. **Code Comments**: Specific implementation questions in PRs
4. **Documentation**: Check existing docs first

### Mentorship Program
- **New Contributors**: Paired with experienced team members
- **First-Time Setup**: Dedicated support for environment setup
- **Code Review**: Educational feedback for learning
- **Office Hours**: Regular sessions for questions and guidance

---

## ✅ Contribution Success

By following this guide, contributors ensure:
- **High-quality code**: Meets project standards for maintainability and performance
- **Security compliance**: Follows security best practices and compliance requirements  
- **Smooth collaboration**: Efficient review process and team coordination
- **Professional growth**: Learn best practices and contribute to a meaningful project
- **Project success**: Help build a reliable, secure notification system

Thank you for contributing to our project! Your efforts help make notification management better for everyone. 🙏

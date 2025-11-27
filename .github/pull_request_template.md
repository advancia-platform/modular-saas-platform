# Pull Request Template

## 📋 Description

Please provide a clear and concise description of the changes made.

---

## ✅ Checklist

- [ ] Code builds and tests pass locally
- [ ] Linter passes (`pre-commit run --all-files`)
- [ ] Documentation updated (`README.md`, `SECURITY.md`, etc.)
- [ ] **CHANGELOG.md updated** with Added/Changed/Fixed/Security section
- [ ] No secrets or credentials committed
- [ ] PR linked to an issue

---

## 🔒 Security & Compliance

- [ ] Security review checklist followed (see `SECURITY.md`)
- [ ] Required reviewers auto-assigned via CODEOWNERS
- [ ] Sensitive changes documented in `SECURITY.md`

---

## 📸 Screenshots / Evidence (if applicable)

Attach screenshots, logs, or test results to support your changes.

---

## 🧭 Additional Notes

Add any extra context or references here.

---

## 🔗 Related Issues

<!-- Link to related issues using GitHub keywords -->

Closes #
Fixes #
Resolves #

<!-- Or for partial work -->

Related to #
Part of #

---

## 🎯 Type of Change

<!-- Check all that apply -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that breaks existing functionality)
- [ ] 📝 Documentation update
- [ ] 🎨 UI/UX improvement
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security fix
- [ ] 🧪 Test addition/update
- [ ] 🔧 Configuration change
- [ ] 📦 Dependency update

---

## 🧪 Testing Checklist

<!-- Confirm all tests pass -->

- [ ] ✅ Backend tests pass (`cd backend && npm test`)
- [ ] ✅ Frontend tests pass (`cd frontend && npm test`)
- [ ] ✅ Backend builds successfully (`cd backend && npm run build`)
- [ ] ✅ Frontend builds successfully (`cd frontend && npm run build`)
- [ ] ✅ Prisma migrations tested (if applicable)
- [ ] ✅ Manual testing completed
- [ ] ✅ Production check passes (`.\scripts\production-check.ps1`)

### Test Coverage

<!-- Describe what was tested and how -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] Manual test scenarios:

  ```
  <!-- List manual test scenarios -->
  1.
  2.
  3.
  ```

---

## 🔒 Security Considerations

<!-- Review security implications -->

- [ ] No hardcoded secrets (checked with `git grep`)
- [ ] Environment variables properly configured
- [ ] Authentication/authorization tested
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection verified
- [ ] CSRF protection verified (if applicable)
- [ ] Rate limiting considered (if applicable)

---

## 📸 Screenshots/Videos

<!-- Add screenshots or videos for UI changes -->
<!-- Delete this section if not applicable -->

### Before

<!-- Screenshot or description of current state -->

### After

<!-- Screenshot or description of new state -->

---

## 📚 Documentation Updates

<!-- Confirm documentation is updated -->

- [ ] Code comments added/updated
- [ ] README.md updated (if applicable)
- [ ] API documentation updated (if applicable)
- [ ] Architecture diagrams updated (if applicable)
- [ ] Deployment guide updated (if applicable)

---

## 🚀 Deployment Notes

<!-- Information for deploying these changes -->

### Database Migrations

- [ ] No database changes
- [ ] Migration included (requires `npx prisma migrate deploy`)
- [ ] Migration is backward compatible
- [ ] Data migration script included (if applicable)

### Environment Variables

- [ ] No new environment variables
- [ ] New variables added (document below):

  ```bash
  # Add to backend/.env or frontend/.env.local
  NEW_VARIABLE=value
  ```

### Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes documented below:

  ```
  <!-- Describe breaking changes and migration path -->
  ```

### Deployment Sequence

<!-- If special deployment order is required -->

- [ ] Standard deployment (no special steps)
- [ ] Requires special deployment sequence:
  1.
  2.
  3.

---

## ✅ Pre-Merge Checklist

<!-- Confirm before requesting review -->

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] No console.log() or debugging code left
- [ ] No commented-out code (unless documented why)
- [ ] Branch is up to date with base branch
- [ ] No merge conflicts
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] PR title is clear and descriptive
- [ ] Labels applied appropriately
- [ ] Reviewers assigned

---

## 👥 Reviewers

<!-- Tag relevant team members based on CODEOWNERS -->

### Required Reviews

<!-- These areas require review based on files changed -->

- Backend changes: @backend-team
- Frontend changes: @frontend-team
- Database changes: @database-admin
- Security changes: @security-team

### Optional Reviews

<!-- Additional reviewers who might be interested -->

- ***

## 📊 Performance Impact

<!-- Assess performance implications -->

- [ ] No performance impact expected
- [ ] Performance improvement expected
- [ ] Potential performance impact (document below):

  ```
  <!-- Describe performance considerations -->
  ```

### Benchmarks (if applicable)

```
Before:
After:
```

---

## 🔄 Rollback Plan

<!-- How to rollback if this causes issues in production -->

```bash
# Rollback steps
1.
2.
3.
```

---

## 📝 Additional Notes

<!-- Any other information reviewers should know -->

---

## 🤖 Automated Checks Status

<!-- These will be auto-populated by GitHub Actions -->

- ⏳ CI/CD Pipeline: Pending
- ⏳ Code Quality: Pending
- ⏳ Security Scan: Pending
- ⏳ Production Check: Pending

---

**⚠️ Reminder:** This PR cannot be merged until:

1. ✅ All automated checks pass
2. ✅ Required approvals received (minimum 1)
3. ✅ No merge conflicts
4. ✅ All conversations resolved
5. ✅ Branch protection rules satisfied

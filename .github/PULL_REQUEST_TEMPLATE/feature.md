---
name: ✨ Feature PR
about: Pull request that adds a new feature
title: "feat: [Brief description of feature]"
labels: ["enhancement", "needs-review"]
---

## ✨ Feature Description

<!-- Clear description of the new feature -->

### What does this feature do?

<!-- Describe the functionality being added -->

### Why is this feature needed?

<!-- Explain the business value and use case -->

---

## 🔗 Related Issues

Closes #
Implements #

---

## 🎯 Implementation Details

<!-- Technical overview of the implementation -->

### Architecture Changes

<!-- Describe any architectural changes or new patterns introduced -->

### Key Components

1. **Backend Changes:**
   -

   -

2. **Frontend Changes:**
   -

   -

3. ## **Database Changes:**

### API Changes

<!-- Document new or modified endpoints -->

```typescript
// New endpoints added:
POST /api/feature-name
GET /api/feature-name/:id
```

---

## 🧪 Testing

### Feature Testing Checklist

- [ ] Happy path tested
- [ ] Edge cases tested
- [ ] Error handling tested
- [ ] Integration with existing features tested
- [ ] Performance tested (if applicable)

### Test Scenarios

1. **Scenario 1:** [Description]
   - Input:
   - Expected:
   - Actual:

2. **Scenario 2:** [Description]
   - Input:
   - Expected:
   - Actual:

### Automated Tests

- [ ] Unit tests added (coverage: %)
- [ ] Integration tests added
- [ ] E2E tests added (if applicable)

---

## 📸 Demo

<!-- Screenshots, GIFs, or video demonstrating the feature -->

### Before (if replacing existing functionality)

### After

---

## 📚 Documentation

- [ ] Code documented with comments
- [ ] API documentation updated
- [ ] User-facing documentation added (if needed)
- [ ] README updated (if needed)
- [ ] Architecture diagrams updated (if needed)

---

## 🚀 Deployment

### Environment Variables (if any)

```bash
# Add to backend/.env:
NEW_FEATURE_ENABLED=true
FEATURE_API_KEY=your-api-key
```

### Database Migration

- [ ] No migration needed
- [ ] Migration included:

  ```bash
  npx prisma migrate dev --name add_feature_name
  ```

### Feature Flags

- [ ] No feature flag needed
- [ ] Feature flag implemented: `FEATURE_NAME_ENABLED`

---

## ⚡ Performance Considerations

<!-- Assess performance impact -->

- Database query performance: [No impact / Improved / Needs monitoring]
- API response time: [No impact / Improved / Needs monitoring]
- Frontend bundle size: [No impact / +X KB]
- Memory usage: [No impact / Needs monitoring]

### Load Testing Results (if applicable)

```
Concurrent users:
Response time (avg):
Response time (p95):
Error rate:
```

---

## 🔒 Security Review

- [ ] No sensitive data exposed
- [ ] Authentication required (if applicable)
- [ ] Authorization rules implemented
- [ ] Input validation added
- [ ] Rate limiting considered
- [ ] Audit logging added (if needed)

---

## ♿ Accessibility (for UI features)

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels added
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators visible

---

## 🔄 Rollback Plan

```bash
# Feature can be disabled by:
1. Set FEATURE_NAME_ENABLED=false in environment
2. OR revert this PR: git revert <commit-hash>
3. If database migration required, run: npx prisma migrate resolve
```

---

## ✅ Feature PR Checklist

- [ ] Feature fully implemented
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Security reviewed
- [ ] Performance acceptable
- [ ] Accessibility verified (UI features)
- [ ] Error handling robust
- [ ] Logging added for debugging
- [ ] Feature flag implemented (if needed)
- [ ] Deployment plan documented

---

## 📝 Additional Notes

<!-- Anything else reviewers should know -->

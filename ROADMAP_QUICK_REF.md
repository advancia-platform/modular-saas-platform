# 📋 Roadmap Quick Reference

**Use this file as your daily navigation guide.**

---

## 🎯 Current Sprint: Week 1 - Foundation

**Status:** Day 1 (TypeScript cleanup in progress)  
**Goal:** Zero compile errors, validated inputs, 85% coverage  
**Completion:** 62% (28/75 TypeScript errors fixed)

### Today's Focus (Day 1)

- [ ] Fix service import errors in jobQueue.ts (13 errors)
- [ ] Fix Decimal import issues (health-readings.ts, medbeds.ts)
- [ ] Fix middleware type errors (express-validator, sessionID, file)
- [ ] Fix undefined array access in gamification.ts (6 errors)

**Target:** Reduce errors from 47 to <20 by end of day

---

## 📊 Critical Path

```
┌─────────────────┐
│ Day 1-2         │ TypeScript Cleanup → Zero errors
├─────────────────┤
│ Day 2-3         │ Zod Validation → 3 routes enforced
├─────────────────┤
│ Day 3           │ Sentry Redaction → PII/secrets masked
├─────────────────┤
│ Day 4           │ History Guards → Safe array access
├─────────────────┤
│ Day 5           │ Unit Tests → 85% coverage
└─────────────────┘
```

---

## 🚨 Blockers (URGENT)

1.  **GitHub Push Protection** 🔴
    - **Blocks:** All git pushes to remote
    - **Fix:** Redact secrets in docs or whitelist via GitHub
    - **Owner:** DevOps

2.  **Service Imports** 🟡
    - **Blocks:** TypeScript compilation
    - **Fix:** Create service stubs in backend/src/services/
    - **Owner:** Backend team

---

## 📁 Document Structure

| File                                                 | Purpose                                          | When to Use                      |
| ---------------------------------------------------- | ------------------------------------------------ | -------------------------------- |
| [ROADMAP_CONSOLIDATED.md](./ROADMAP_CONSOLIDATED.md) | Complete roadmap with epics, timelines, patterns | Strategic planning, onboarding   |
| [SPRINT_BOARD.md](./SPRINT_BOARD.md)                 | Current sprint tracking, metrics                 | Daily standups, progress updates |
| [ISSUES_TEMPLATE.md](./ISSUES_TEMPLATE.md)           | GitHub issue templates                           | Creating tickets, planning tasks |
| [EXECUTION_PLAN.md](./EXECUTION_PLAN.md)             | Day-by-day implementation guide                  | Tactical work breakdown          |
| **THIS FILE**                                        | Quick daily reference                            | Morning checklist, priorities    |

---

## ✅ Quick Commands

### Before Starting Work

```bash
cd backend
npm run type-check              # Check TypeScript errors
npm run lint                    # Check code style
npm test -- --coverage          # Run tests with coverage
```

### During Development

```bash
npx tsc --noEmit                # Watch for type errors
npm run dev                     # Start dev server
npx prisma studio               # Inspect database
```

### Before Committing

```bash
npm run lint:fix                # Auto-fix linting
git add .
git commit -m "feat: description"
git push origin feature/branch-name
```

### If Push Fails

```bash
# Option 1: Fix errors
npm run type-check
# Fix reported errors, then retry

# Option 2: Bypass (only if approved)
git push --no-verify
```

---

## 🎯 Daily Checklist

### Morning Routine

- [ ] Check [SPRINT_BOARD.md](./SPRINT_BOARD.md) for today's tasks
- [ ] Review blockers section
- [ ] Pull latest changes: `git pull origin staging`
- [ ] Run type-check to see current error count

### During Day

- [ ] Update sprint board when starting new task
- [ ] Commit frequently with descriptive messages
- [ ] Write tests alongside implementation
- [ ] Ask for help if blocked >30 minutes

### End of Day

- [ ] Run full test suite: `npm test -- --coverage`
- [ ] Push work to feature branch
- [ ] Update sprint board with progress
- [ ] Document any new blockers

---

## 🔗 Essential Links

- **Sprint Board:** [SPRINT_BOARD.md](./SPRINT_BOARD.md)
- **Execution Plan:** [EXECUTION_PLAN.md](./EXECUTION_PLAN.md)
- **Issue Templates:** [ISSUES_TEMPLATE.md](./ISSUES_TEMPLATE.md)
- **Full Roadmap:** [ROADMAP_CONSOLIDATED.md](./ROADMAP_CONSOLIDATED.md)
- **Backend Roadmap:** [backend/ROADMAP.md](./backend/ROADMAP.md)

---

## 📞 Communication

### Slack Channels

- `#dev-backend` - Implementation discussions
- `#sprint-updates` - Daily progress
- `#blockers` - Urgent issues

### Standup Questions (15 min daily)

1.  What did you complete yesterday?
2.  What will you work on today?
3.  Any blockers?

---

## 🎓 Code Patterns

### Zod Validation

```typescript
import { validate } from "../middleware/validation";
import { createProjectSchema } from "../schemas/projects";

router.post("/projects", validate(createProjectSchema), async (req, res) => {
  // req.body is now validated and typed
});
```

### Prisma Create with Defaults

```typescript
import { withDefaults } from "../utils/prismaHelpers";

await prisma.table_name.create({
  data: withDefaults({
    userId,
    field1,
    field2,
  }),
});
```

### Safe Array Access

```typescript
// ❌ Unsafe
const item = array[index];

// ✅ Safe
const item = array[index];
if (!item) {
  throw new Error("Item not found");
}
```

---

## 📊 Current Metrics

| Metric            | Target | Current | Status             |
| ----------------- | ------ | ------- | ------------------ |
| TypeScript Errors | 0      | 47      | 🟡 62% complete    |
| Test Coverage     | 85%    | TBD     | ⚪ Not measured    |
| Lint Warnings     | 0      | TBD     | ⚪ Not measured    |
| Deploy Success    | 100%   | Blocked | 🔴 Push protection |

---

## 🚀 Next Sprint Preview (Week 2)

- API Response Standardization (PaginatedResponse<T>)
- Docker deployment templates (ECS, Azure, K8s)
- CI/CD enhancements (security scans)
- Frontend TypeScript cleanup

---

**Last Updated:** November 24, 2025  
**Next Review:** End of Day 1  
**Status:** 🟢 On track

# 🔐 USER REGISTRATION APPROVAL + ROUTE PROTECTION PLAN

**Status**: Ready to Implement  
**Target**: Restrict user access + Protect all backend routes  
**Timeline**: 1-2 hours implementation + testing

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Registration Approval System (30 minutes)

- [ ] **Update** `backend/src/routes/auth.ts`

  - Change registration to create user with `active: false`
  - Add admin notification on new registration
  - Return `status: "pending_approval"` in response

- [ ] **Add to** `backend/src/routes/admin.ts`

  - `POST /api/admin/users/approve-registration` - Approve/reject single user
  - `GET /api/admin/users/pending-approvals` - List pending registrations
  - `POST /api/admin/users/bulk-approve` - Approve/reject multiple users

- [ ] **Test** registration approval flow
  - Register new user → Verify `active: false`
  - Try accessing protected endpoint → Verify `403 "Account disabled"`
  - Admin approves user → Verify `active: true`
  - User accesses endpoint → Verify `200` success

### Phase 2: Protect Unprotected Routes (45 minutes)

- [ ] **Routes to protect** with `authenticateToken` middleware:

  ```
  ✓ POST /api/debit-card/:userId/adjust-balance
  ✓ PATCH /api/users/:userId/role
  ✓ Any other sensitive endpoints
  ```

- [ ] **Verify protected routes**:

  - Admin routes (`/api/admin/*`) → All protected ✓
  - User routes → Protected ✓
  - Public routes → Allowed (health, config, etc.) ✓

- [ ] **Test protection**:
  - No token → `401 "Access token required"`
  - Invalid token → `403 "Invalid or expired token"`
  - Valid token → Access granted ✓
  - Disabled account → `403 "Account disabled"`

### Phase 3: Database Backup & Migration (15 minutes)

- [ ] Backup current database

  ```bash
  pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
  ```

- [ ] **Option A**: Approve all existing users

  ```sql
  UPDATE users SET active = true WHERE email IS NOT NULL;
  ```

- [ ] **Option B**: Manual selective approval
  - Review high-priority accounts
  - Set `active = true` for specific users

### Phase 4: Deployment & Testing (30 minutes)

- [ ] Run tests:

  ```bash
  cd backend && npm test
  npm run build
  npm run lint
  ```

- [ ] Commit changes:

  ```bash
  git add -A
  git commit -m "feat: add registration approval system and protect all routes"
  git push origin main
  ```

- [ ] Verify CI/CD workflow passes

  - Should trigger GitHub Actions workflow
  - All tests should pass
  - Auto-deploy to Render if successful

- [ ] Test in production:
  - Register new test user
  - Verify user is pending approval
  - Admin approves user
  - Verify user can now access

---

## 📊 CHANGES SUMMARY

### Files Modified

**1. `backend/src/routes/auth.ts`**

```diff
- const user = await prisma.user.create({
-   data: {
-     email, username, passwordHash,
-     firstName, lastName, termsAccepted: true, termsAcceptedAt: new Date()
-   }
- });

+ const user = await prisma.user.create({
+   data: {
+     email, username, passwordHash,
+     firstName, lastName, termsAccepted: true, termsAcceptedAt: new Date(),
+     active: false  // ← PENDING APPROVAL
+   }
+ });
+
+ // Notify admins
+ await notifyAllAdmins({...})
```

**2. `backend/src/routes/admin.ts`** (Add 3 new endpoints)

```typescript
// NEW: POST /api/admin/users/approve-registration
// NEW: GET /api/admin/users/pending-approvals
// NEW: POST /api/admin/users/bulk-approve
```

**3. `backend/src/routes/*` (Protected routes)**

```diff
- router.post("/:userId/adjust-balance", async (req, res) => {
+ router.post("/:userId/adjust-balance", authenticateToken, async (req, res) => {

- router.patch("/:userId/role", async (req, res) => {
+ router.patch("/:userId/role", authenticateToken, requireAdmin, async (req, res) => {
```

### Files Created (Reference)

- `REGISTRATION_APPROVAL_IMPLEMENTATION.md` - Implementation guide
- `AUTH_REGISTRATION_PATCH.ts` - Updated registration endpoint
- `ADMIN_APPROVAL_ENDPOINTS.ts` - New admin endpoints
- This file - Implementation plan

---

## 🧪 TEST CASES

### Test 1: New User Registration (Pending Approval)

```bash
# 1. Register
POST /api/auth/register
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}

# Expected: 201
# Response: { status: "pending_approval", token: "...", user: {...} }

# 2. Verify user in DB
SELECT id, email, active FROM users WHERE email = 'newuser@example.com';
# Result: active = false ✓

# 3. Try accessing protected route
GET /api/auth/me
Authorization: Bearer <TOKEN>

# Expected: 403
# Response: { error: "Account disabled" } ✓

# 4. Admin approves
POST /api/admin/users/approve-registration
Authorization: Bearer <ADMIN_TOKEN>
{ "userId": "user-id", "approved": true }

# Expected: 200
# Response: { message: "User registration approved", user: {...} }

# 5. User accesses protected route
GET /api/auth/me
Authorization: Bearer <TOKEN>

# Expected: 200
# Response: { user: {...} } ✓
```

### Test 2: Protected Routes

```bash
# No token
GET /api/tokens/balance
# Expected: 401 "Access token required"

# Invalid token
GET /api/tokens/balance
Authorization: Bearer invalid_token
# Expected: 403 "Invalid or expired token"

# Valid token but expired
GET /api/tokens/balance
Authorization: Bearer <EXPIRED_TOKEN>
# Expected: 403 "Invalid or expired token"

# Valid token, disabled account
GET /api/tokens/balance
Authorization: Bearer <TOKEN_FOR_DISABLED_ACCOUNT>
# Expected: 403 "Account disabled"

# Valid token, active account
GET /api/tokens/balance
Authorization: Bearer <VALID_TOKEN>
# Expected: 200 with data
```

### Test 3: Admin Endpoints

```bash
# List pending approvals
GET /api/admin/users/pending-approvals
Authorization: Bearer <ADMIN_TOKEN>
# Expected: 200 with list of pending users

# Bulk approve
POST /api/admin/users/bulk-approve
Authorization: Bearer <ADMIN_TOKEN>
{
  "userIds": ["id1", "id2", "id3"],
  "approved": true
}
# Expected: 200 with count updated

# Non-admin tries to access
GET /api/admin/users/pending-approvals
Authorization: Bearer <USER_TOKEN>
# Expected: 403 "Access denied: Admin privileges required"
```

---

## 🚀 DEPLOYMENT STRATEGY

### Option A: Gradual Rollout (Recommended)

1. Deploy changes to staging
2. Test with staging users
3. Approve all existing users in production:
   ```sql
   UPDATE users SET active = true WHERE createdAt < NOW() - INTERVAL '1 day';
   ```
4. Deploy to production
5. Monitor for issues 24 hours
6. New registrations now require approval

### Option B: Immediate Enforcement

1. Deploy to production
2. Approve all inactive users:
   ```sql
   UPDATE users SET active = true;
   ```
3. New registrations require approval immediately

---

## 📈 MONITORING & ALERTS

### Metrics to track

- `pending_approvals_count` - Number of pending registrations
- `registration_requests_per_day` - New registrations
- `approval_rate` - % of registrations approved vs rejected
- `auth_failures` - Failed authentication attempts

### Admin notifications

- New registration pending (immediate)
- Bulk approval actions (logged)
- Failed approvals (logged)
- Suspicious registration patterns (future)

---

## ⚙️ CONFIGURATION

### Environment Variables

```bash
# No new env vars needed for this feature
# Uses existing: ADMIN notification system, JWT secret, etc.
```

### Database

```sql
-- Verify active column exists
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'active';

-- Should show: active | boolean
```

---

## 🔄 ROLLBACK PROCEDURE

If issues arise:

```bash
# 1. Revert to previous version
git revert HEAD~1
git push origin main

# 2. Or manually allow all users
UPDATE users SET active = true;

# 3. Redeploy
# CI/CD will trigger automatically
```

---

## 📞 SUPPORT

### Common Issues

**Issue**: "Account disabled" error for old users

- **Solution**: Approve existing users or run:
  ```sql
  UPDATE users SET active = true WHERE createdAt < NOW() - INTERVAL '1 day';
  ```

**Issue**: Admins not receiving notifications

- **Solution**: Check notification service configuration
- Run: `POST /api/auth/test-email` to verify SMTP

**Issue**: Cannot approve registrations

- **Solution**: Verify admin token and permissions
- Check: `requireAdmin` middleware is applied

---

## ✅ SUCCESS CRITERIA

- ✅ New users created with `active: false`
- ✅ Existing users maintain current state (or manually approved)
- ✅ Admin can approve/reject registrations
- ✅ Pending approvals listed in admin panel
- ✅ Users get email notifications
- ✅ Protected routes require valid token
- ✅ Disabled accounts cannot access endpoints
- ✅ CI/CD workflow passes
- ✅ All tests pass
- ✅ Production deployment successful

---

## 🎯 NEXT STEPS

1. **Review** this implementation plan
2. **Confirm** database backup exists
3. **Create** feature branch: `git checkout -b feat/registration-approval`
4. **Implement** Phase 1: Registration approval
5. **Test** locally and on staging
6. **Deploy** to production
7. **Monitor** for 24 hours
8. **Document** any changes for team

---

**Estimated Total Time**: 2-3 hours  
**Risk Level**: Low (changes isolated, easily reversible)  
**Testing Coverage**: High (all auth flows tested)  
**Production Impact**: High (affects all new registrations)

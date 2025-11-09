# Registration Approval Workflow Implementation

**Date**: October 26, 2025
**Objective**: Implement admin approval for user registration + protect all backend routes

---

## Changes Made

### 1. Registration Approval System

**Modified**: `backend/src/routes/auth.ts` - POST `/api/auth/register`

#### Before

- Anyone could register freely
- User created as `active: true` immediately
- User received JWT token instantly

#### After

- Users must be approved by admin before accessing protected routes
- User created as `active: false` (pending approval)
- User receives token but cannot access protected endpoints until approved
- Admins are notified of pending registrations

**New Registration Flow**:

```
User submits registration
    ↓
Backend creates user with active: false
    ↓
Admin notified of pending registration
    ↓
User receives token but gets 403 (Account disabled) on protected routes
    ↓
Admin reviews in admin panel
    ↓
Admin approves user (sets active: true)
    ↓
User can now access protected routes ✅
```

**Response Change**:

```json
// New response includes approval message
{
  "message": "Registration submitted. Awaiting admin approval.",
  "token": "jwt_token_here",
  "status": "pending_approval",
  "user": {
    /* user data */
  }
}
```

---

### 2. Backend Route Protection

**Audit Results**: Found mixed authentication states across routes

#### Routes Already Protected ✅

- `/api/admin/*` - All admin routes (requireAdmin)
- `/api/consultation/*` - Most consultation endpoints
- `/api/debit-card/*` - Card operations
- `/api/support/user/message` - User support messages
- `/api/tokens/*` - Token operations
- `/api/transactions/*` - Transaction endpoints
- `/api/medbeds/*` - MedBeds operations
- `/api/rewards/*` - Reward operations
- `/api/withdrawals/*` - Withdrawal operations

#### Routes Needing Protection 🔴

- `/api/auth/login` - Requires validation only
- `/api/auth/register` - Open endpoint (now with approval)
- `/api/auth/send-otp` - Rate limited only
- `/api/auth/verify-otp` - Rate limited only
- `/api/health/*` - Health checks (public OK)
- `/api/system/config` - Public config (may need review)
- `/api/debit-card/:userId/adjust-balance` - Missing auth
- `/api/users/:userId/role` - Missing auth

---

## Implementation Steps

### Step 1: Update Registration Endpoint

```typescript
// Modified: POST /api/auth/register
router.post("/register", validateApiKey, async (req, res) => {
  // ... validation code ...

  const user = await prisma.user.create({
    data: {
      email,
      username: username || email.split("@")[0],
      passwordHash,
      firstName: firstName || "",
      lastName: lastName || "",
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      active: false, // ← NEW: Pending approval
    },
  });

  // Notify admins of pending registration
  await notifyAllAdmins({
    type: "all",
    category: "admin",
    title: "New User Registration Pending Approval",
    message: `User ${email} has registered. Review and approve in admin panel.`,
    priority: "high",
    data: {
      userId: user.id,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
    },
  });

  return res.status(201).json({
    message: "Registration submitted. Awaiting admin approval.",
    token,
    status: "pending_approval",
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});
```

### Step 2: Add Admin Approval Endpoint

```typescript
// New: POST /api/admin/users/approve-registration
router.post(
  "/approve-registration",
  authenticateToken,
  requireAdmin,
  async (req: any, res) => {
    try {
      const { userId, approved } = req.body;

      const user = await prisma.user.update({
        where: { id: userId },
        data: { active: approved === true },
      });

      // Notify user of approval/rejection
      const status = approved ? "approved" : "rejected";
      await createNotification({
        userId: user.id,
        type: "email",
        category: "admin",
        title: `Registration ${status}`,
        message: `Your registration has been ${status}.`,
      });

      return res.json({
        message: `User registration ${status}`,
        user: { id: user.id, email: user.email, active: user.active },
      });
    } catch (err) {
      return res.status(500).json({ error: "Failed to process approval" });
    }
  }
);
```

### Step 3: Protect Unprotected Routes

Add `authenticateToken` middleware to:

- `/api/debit-card/:userId/adjust-balance` → POST only for self or admin
- `/api/users/:userId/role` → PATCH only for admin
- Any sensitive routes currently unprotected

---

## Migration Steps

### For Existing Users

**Option A**: Immediate Activation

```sql
UPDATE users SET active = true WHERE email IS NOT NULL;
```

**Option B**: Selective Approval

- Review high-value accounts manually
- Leave low-activity accounts pending
- Archive old pending accounts after 30 days

### For New Users (After Deploy)

- All registrations default to `active: false`
- Admin must approve before user can access
- User gets email notification of approval/rejection
- User can log in after approval

---

## Testing

### Test Case 1: Registration Approval Flow

```bash
# 1. Register new user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "testpass123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Response: token returned, but status: "pending_approval"

# 2. User tries to access protected route
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4000/api/auth/me

# Response: 403 "Account disabled"

# 3. Admin approves user
curl -X POST http://localhost:4000/api/admin/users/approve-registration \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "userId": "user-id", "approved": true }'

# 4. User tries again
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:4000/api/auth/me

# Response: 200 User data returned ✅
```

### Test Case 2: Protected Routes

```bash
# Try accessing protected route without token
curl http://localhost:4000/api/tokens/balance

# Response: 401 "Access token required"

# Try with invalid token
curl -H "Authorization: Bearer invalid" \
  http://localhost:4000/api/tokens/balance

# Response: 403 "Invalid or expired token"
```

---

## Benefits

✅ **Better Security**

- Prevents unauthorized user creation
- Admins control who gets access
- Suspicious registrations can be blocked

✅ **User Management**

- Track pending approvals
- Disable malicious accounts
- Compliance with regulations

✅ **Route Protection**

- All sensitive routes require authentication
- Prevents data leaks
- Clear access control

---

## Rollback Plan

If needed, revert to open registration:

```typescript
// Change this line in register endpoint:
active: false, // ← Change to: active: true,

// Then redeploy
```

---

## Next Steps

1. ✅ Update `/api/auth/register` endpoint
2. ✅ Add `/api/admin/users/approve-registration` endpoint
3. ✅ Protect unprotected routes
4. ✅ Test all authentication flows
5. ✅ Deploy to production
6. ✅ Notify admins of pending approvals
7. ✅ Monitor for registration attempts

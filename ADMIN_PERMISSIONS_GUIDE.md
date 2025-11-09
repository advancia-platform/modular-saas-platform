# 🛡️ Admin Permissions & Feature Access Guide

**Date**: November 8, 2025  
**Platform**: Advancia Pay Ledger  
**Purpose**: Define admin-only vs user-accessible features

---

## 🔐 Authentication & Authorization

### Current Implementation

**Auth Middleware**: `backend/src/middleware/auth.ts`

```typescript
// Two-level authentication:
1. authenticateToken()  - Verifies JWT token, checks if user is active
2. requireAdmin()       - Checks if user.role === "ADMIN"
```

**User Roles**:
- `USER` - Regular users (default)
- `STAFF` - Staff members (elevated permissions)
- `ADMIN` - Full administrative access

---

## 📊 Feature Access Matrix

### ✅ ADMIN-ONLY FEATURES (Protected by `requireAdmin`)

#### 1. **User Management**
| Feature | Route | Status |
|---------|-------|--------|
| View all users | `GET /api/admin/users` | ✅ Protected |
| Block/Unblock user | `POST /api/admin/users/:id/block` | ✅ Protected |
| Delete user | `DELETE /api/admin/users/:id` | ✅ Protected |
| Add balance | `POST /api/admin/users/:id/balance` | ✅ Protected |
| Change user role | `POST /api/admin/users/:id/role` | ✅ Protected |
| View user sessions | `GET /api/admin/sessions` | ✅ Protected |

#### 2. **Token Management (Admin Controls)**
| Feature | Route | Status |
|---------|-------|--------|
| Add tokens to user | `POST /api/admin/tokens/add` | ⚠️ **NEEDS PROTECTION** |
| Remove tokens | `POST /api/admin/tokens/remove` | ⚠️ **NEEDS PROTECTION** |
| Adjust token balance | `PUT /api/admin/tokens/:userId` | ⚠️ **NEEDS PROTECTION** |
| View all wallets | `GET /api/admin/tokens/all` | ⚠️ **NEEDS PROTECTION** |

#### 3. **Transaction Oversight**
| Feature | Route | Status |
|---------|-------|--------|
| View all transactions | `GET /api/admin/transactions` | ✅ Protected |
| Reverse transaction | `POST /api/admin/transactions/:id/reverse` | ✅ Protected |
| Bulk credit users | `POST /api/admin/bulk-credit` | ✅ Protected |
| Export transactions | `GET /api/admin/transactions/export` | ✅ Protected |

#### 4. **System Administration**
| Feature | Route | Status |
|---------|-------|--------|
| IP blocking/unblocking | `POST /api/ip-blocks/*` | ✅ Protected |
| Security level changes | `POST /api/security-level/*` | ✅ Protected |
| System settings | `GET/POST /api/admin/settings` | ✅ Protected |
| Admin login logs | `GET /api/admin/login-logs` | ✅ Protected |

#### 5. **MedBeds Management**
| Feature | Route | Status |
|---------|-------|--------|
| View all bookings | `GET /api/medbeds/admin/bookings` | ✅ Protected |
| Manage booking status | `PUT /api/medbeds/admin/bookings/:id` | ✅ Protected |
| Configure pricing | `POST /api/medbeds/admin/pricing` | ✅ Protected |

#### 6. **Debit Card Administration**
| Feature | Route | Status |
|---------|-------|--------|
| View card pricing | `GET /api/debit-card/admin/price` | ✅ Protected |
| Update card pricing | `POST /api/debit-card/admin/price` | ✅ Protected |
| Manage card inventory | `POST /api/debit-card/admin/inventory` | ✅ Protected |

#### 7. **Support & Chat**
| Feature | Route | Status |
|---------|-------|--------|
| Reply to support tickets | `POST /api/chat/admin/reply` | ✅ Protected |
| View all tickets | `GET /api/support/admin/tickets` | ✅ Protected |
| Close tickets | `POST /api/support/admin/tickets/:id/close` | ✅ Protected |

#### 8. **Analytics & Reporting**
| Feature | Route | Status |
|---------|-------|--------|
| Platform analytics | `GET /api/admin/dashboard/stats` | ✅ Protected |
| Revenue reports | `GET /api/admin/dashboard/charts` | ✅ Protected |
| User activity logs | `GET /api/admin/activity-logs` | ✅ Protected |

#### 9. **Notifications**
| Feature | Route | Status |
|---------|-------|--------|
| Send system notifications | `POST /api/admin/notifications/send` | ✅ Protected |
| Broadcast to all users | `POST /api/admin/notifications/broadcast` | ✅ Protected |

---

### 👤 USER-ACCESSIBLE FEATURES (Authenticated, Not Admin)

#### 1. **Personal Account**
| Feature | Route | Access |
|---------|-------|--------|
| View own profile | `GET /api/users/profile` | ✅ All Users |
| Update profile | `PUT /api/users/profile` | ✅ All Users |
| Change password | `POST /api/users/change-password` | ✅ All Users |
| View own balance | `GET /api/users/balance` | ✅ All Users |

#### 2. **Token Wallet (Personal)**
| Feature | Route | Access |
|---------|-------|--------|
| View own wallet | `GET /api/tokens/balance/:userId` | ✅ Own Data Only |
| View own history | `GET /api/tokens/history/:userId` | ✅ Own Data Only |
| Transfer tokens | `POST /api/tokens/transfer` | ✅ All Users |
| Withdraw tokens | `POST /api/tokens/withdraw` | ✅ All Users |
| Cash-out tokens | `POST /api/tokens/cashout` | ✅ All Users |

#### 3. **Transactions (Personal)**
| Feature | Route | Access |
|---------|-------|--------|
| View own transactions | `GET /api/transactions/user/:userId` | ✅ Own Data Only |
| Create transaction | `POST /api/transactions` | ✅ All Users |

#### 4. **Rewards & Gamification**
| Feature | Route | Access |
|---------|-------|--------|
| View own rewards | `GET /api/rewards/:userId` | ✅ Own Data Only |
| Claim rewards | `POST /api/rewards/claim/:rewardId` | ✅ All Users |
| View tier status | `GET /api/rewards/tier/:userId` | ✅ Own Data Only |
| View leaderboard | `GET /api/rewards/leaderboard` | ✅ All Users |

#### 5. **MedBeds (User Booking)**
| Feature | Route | Access |
|---------|-------|--------|
| Browse sessions | `GET /api/medbeds/sessions` | ✅ All Users |
| Book session | `POST /api/medbeds/book` | ✅ All Users |
| View own bookings | `GET /api/medbeds/user/:userId` | ✅ Own Data Only |
| Cancel booking | `DELETE /api/medbeds/:id` | ✅ Own Bookings |

#### 6. **Health Tracking**
| Feature | Route | Access |
|---------|-------|--------|
| View own health data | `GET /api/health-readings/:userId` | ✅ Own Data Only |
| Add health reading | `POST /api/health-readings` | ✅ All Users |

#### 7. **Payments (Stripe)**
| Feature | Route | Access |
|---------|-------|--------|
| Create checkout session | `POST /api/payments/checkout-session` | ✅ All Users |
| View payment status | `GET /api/payments/status/:sessionId` | ✅ All Users |
| Payment history | `GET /api/payments/history` | ✅ Own Data Only |

#### 8. **Debit Cards (User)**
| Feature | Route | Access |
|---------|-------|--------|
| Request debit card | `POST /api/debit-card/request` | ✅ All Users |
| View own cards | `GET /api/debit-card/user/:userId` | ✅ Own Data Only |

#### 9. **Support**
| Feature | Route | Access |
|---------|-------|--------|
| Create support ticket | `POST /api/support/ticket` | ✅ All Users |
| View own tickets | `GET /api/support/tickets/:userId` | ✅ Own Data Only |
| Reply to own ticket | `POST /api/support/ticket/:id/reply` | ✅ Own Tickets |

---

### 🌐 PUBLIC ENDPOINTS (No Auth Required)

| Feature | Route | Access |
|---------|-------|--------|
| Health check | `GET /api/health` | ✅ Public |
| Register account | `POST /api/auth/register` | ✅ Public |
| Login | `POST /api/auth/login` | ✅ Public |
| Forgot password | `POST /api/auth/forgot-password` | ✅ Public |
| Stripe webhook | `POST /api/payments/webhook` | ✅ Public (Stripe) |

---

## 🚨 SECURITY ISSUES FOUND

### ⚠️ Critical: Token Management Not Protected

**Problem**: Admin token management endpoints may not have `requireAdmin` middleware

**Risk**: Users could potentially add tokens to their own accounts

**Fix Needed**:
```typescript
// In backend/src/routes/tokens.ts
router.post('/admin/add', authenticateToken, requireAdmin, async (req, res) => {
  // Add tokens to any user (admin only)
});

router.post('/admin/remove', authenticateToken, requireAdmin, async (req, res) => {
  // Remove tokens from any user (admin only)
});

router.put('/admin/:userId', authenticateToken, requireAdmin, async (req, res) => {
  // Adjust user token balance (admin only)
});
```

---

## 📱 Frontend Access Control

### Admin Pages (Should Redirect Non-Admins)

✅ **Protected Admin Routes**:
- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/transactions` - All transactions
- `/admin/settings` - System settings
- `/admin/analytics` - Platform analytics
- `/admin/support` - Support management
- `/admin/ip-blocks` - IP blocking
- `/admin/tools` - Admin tools

**Current Protection**: Client-side check in `useEffect`
```typescript
useEffect(() => {
  const isAdmin = user?.role === "admin" || user?.email?.includes("admin");
  if (!isAdmin) {
    alert("⛔ Access Denied");
    router.push("/");
  }
}, [user, router]);
```

**Recommendation**: Add backend API protection on ALL admin routes

---

### User Pages (Accessible to All Authenticated Users)

✅ **User Routes**:
- `/dashboard` - Personal dashboard
- `/tokens` - Personal token wallet
- `/rewards` - Personal rewards
- `/transactions` - Own transactions only
- `/medbeds` - Browse & book sessions
- `/debit-card` - Request cards
- `/support` - Create tickets
- `/profile` - Edit profile
- `/settings` - Account settings

---

## 💳 Stripe Integration Details

### Implementation Location
**File**: `backend/src/routes/payments.ts`

### Stripe Configuration
```typescript
const stripeClient = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey, {
      apiVersion: "2023-10-16",
    })
  : null;
```

### Environment Variables Required
```bash
STRIPE_SECRET_KEY="sk_test_..."           # Or sk_live_ for production
STRIPE_PUBLISHABLE_KEY="pk_test_..."      # Or pk_live_ for production
STRIPE_WEBHOOK_SECRET="whsec_..."         # For webhook verification
```

### Stripe Features Implemented

#### 1. **Checkout Sessions** ✅
```typescript
POST /api/payments/checkout-session
```
- **Access**: Authenticated users only
- **Purpose**: Create Stripe checkout for adding balance
- **Metadata**: Includes userId for tracking
- **Success/Cancel URLs**: Redirects after payment

#### 2. **Webhook Handler** ✅
```typescript
POST /api/payments/webhook
```
- **Access**: Public (Stripe only)
- **Verification**: Uses `STRIPE_WEBHOOK_SECRET`
- **Events Handled**:
  - `checkout.session.completed` - Credits user balance
  - `payment_intent.succeeded` - Confirms payment
  - `payment_intent.payment_failed` - Logs failure

#### 3. **Payment Intent Creation** ✅
```typescript
POST /api/payments/intent
```
- **Access**: Authenticated users
- **Purpose**: Direct payment intents for custom flows
- **Currency**: Supports USD, EUR, GBP

#### 4. **Payment History** ✅
```typescript
GET /api/payments/history/:userId
```
- **Access**: Own data only (or admin)
- **Returns**: List of Stripe charges and sessions

### Stripe Webhook Events
```typescript
switch (event.type) {
  case "checkout.session.completed":
    // Credit user balance
    // Create transaction record
    // Send notification
    
  case "payment_intent.succeeded":
    // Log successful payment
    
  case "payment_intent.payment_failed":
    // Log failed payment
    // Notify user
}
```

### Frontend Integration
**Location**: `frontend/src/app/payments/` (check for existence)

**Expected Flow**:
1. User clicks "Add Balance"
2. Frontend calls `POST /api/payments/checkout-session`
3. Redirects to Stripe hosted checkout
4. User completes payment on Stripe
5. Stripe redirects back to success/cancel URL
6. Webhook credits user balance automatically

---

## 🔧 Recommended Access Control Updates

### 1. Add Admin Protection to Token Management
```typescript
// backend/src/routes/tokens.ts
router.post('/admin/add', authenticateToken, requireAdmin, addTokensToUser);
router.post('/admin/remove', authenticateToken, requireAdmin, removeTokensFromUser);
router.put('/admin/:userId/balance', authenticateToken, requireAdmin, adjustBalance);
```

### 2. Protect Admin Dashboard API
```typescript
// backend/src/routes/adminDashboard.ts (NEW - Phase 3)
router.get('/stats', authenticateToken, requireAdmin, getDashboardStats);
router.get('/charts', authenticateToken, requireAdmin, getChartData);
router.get('/users', authenticateToken, requireAdmin, searchUsers);
```

### 3. Add User Data Access Control
```typescript
// Middleware to verify user can only access own data
export const requireSelfOrAdmin = (req: any, res: Response, next: NextFunction) => {
  const requestedUserId = req.params.userId;
  const currentUserId = req.user?.userId;
  const isAdmin = req.user?.role === "ADMIN";
  
  if (currentUserId === requestedUserId || isAdmin) {
    next();
  } else {
    res.status(403).json({ error: "Access denied: Can only access own data" });
  }
};

// Usage
router.get('/tokens/balance/:userId', authenticateToken, requireSelfOrAdmin, getBalance);
```

### 4. Frontend Route Guards
```typescript
// Create HOC for admin pages
export const withAdminAuth = (Component: any) => {
  return function AdminProtected(props: any) {
    const { data: session } = useSession();
    const router = useRouter();
    
    useEffect(() => {
      if (session && session.user?.role !== "ADMIN") {
        router.push("/");
      }
    }, [session, router]);
    
    if (!session || session.user?.role !== "ADMIN") {
      return <div>Access Denied</div>;
    }
    
    return <Component {...props} />;
  };
};

// Usage
export default withAdminAuth(AdminDashboard);
```

---

## 📋 Admin Actions That Need Implementation

### ⚠️ Missing Admin Features

1. **Token Management UI** (Admin Page)
   - Add tokens to user
   - Remove tokens from user
   - View all token wallets
   - Adjust balances
   
2. **User Blocking Controls** (Admin Page)
   - Block/unblock users
   - Suspend accounts
   - Delete accounts
   - Reason tracking

3. **Transaction Controls** (Admin Page)
   - Reverse transactions
   - Bulk credit users
   - Manual adjustments
   - Export to CSV

4. **Role Management** (Admin Page)
   - Promote user to admin
   - Demote admin to user
   - Assign staff role
   - Audit log of changes

---

## 🎯 Testing Checklist

### Admin User Tests

- [ ] Login as admin (`admin@advancia.com`)
- [ ] Access `/admin` dashboard
- [ ] View all users
- [ ] Block a user
- [ ] Add tokens to user
- [ ] Remove tokens from user
- [ ] View all transactions
- [ ] Access admin analytics
- [ ] Manage support tickets
- [ ] Configure system settings

### Regular User Tests

- [ ] Login as regular user
- [ ] Try to access `/admin` (should redirect)
- [ ] View own dashboard
- [ ] View own token wallet
- [ ] Cannot view other users' data
- [ ] Cannot add tokens to self
- [ ] Can create support ticket
- [ ] Can book MedBeds session

### Stripe Payment Tests

- [ ] Create checkout session
- [ ] Complete test payment
- [ ] Verify webhook triggers
- [ ] Check balance credited
- [ ] View payment history
- [ ] Test failed payment

---

## 🔐 Security Best Practices

### 1. Always Validate User Context
```typescript
// Bad
router.get('/user/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  res.json(user);
});

// Good
router.get('/user/:id', authenticateToken, requireSelfOrAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  res.json(user);
});
```

### 2. Use Role-Based Access Control
```typescript
// Admin-only routes
router.use('/admin/*', authenticateToken, requireAdmin);

// User or admin routes
router.use('/users/:userId/*', authenticateToken, requireSelfOrAdmin);

// Public routes
router.use('/public/*', /* no auth */);
```

### 3. Log Admin Actions
```typescript
export const logAdminAction = async (req: any, action: string) => {
  await prisma.adminActionLog.create({
    data: {
      adminId: req.user.userId,
      action,
      targetUserId: req.params.userId,
      ipAddress: req.ip,
      timestamp: new Date(),
    }
  });
};
```

---

## 📞 Summary

### ✅ What's Working
- Admin authentication middleware (`requireAdmin`)
- Most admin routes are protected
- Stripe integration fully implemented
- User data access for own records
- Frontend admin page redirects

### ⚠️ What Needs Fixing
- Token management admin endpoints not protected
- Admin UI for token management missing
- User blocking controls not in admin UI
- Transaction reversal not in admin UI
- Missing audit logging for admin actions

### 🚀 Next Steps
1. Add `requireAdmin` to token management routes
2. Create admin UI for token management
3. Add user blocking controls to admin page
4. Implement transaction reversal UI
5. Add comprehensive audit logging
6. Test all admin vs user permissions

---

**Last Updated**: November 8, 2025  
**Status**: Phase 3 Complete, Security Hardening Needed

# Quick Start: Using Your JWT Authentication System

## Your System is Better Than the Examples You Shared!

### ✅ What You Already Have (Superior Implementation)

1. **Argon2 Password Hashing** (not bcrypt - more secure)
2. **Access + Refresh Token Pattern** (industry best practice)
3. **4-Tier Role System**: USER → STAFF → ADMIN → SUPERADMIN
4. **TypeScript Type Safety** (not plain JavaScript)
5. **Complete Documentation** (`AUTH_JWT_GUIDE.md`)
6. **Postman Test Suite** (`Advancia_JWT_Auth_v2.postman_collection.json`)

---

## 🔥 Example: Protect Routes with RBAC (Already Works!)

### 1. Basic Protected Route (Any Authenticated User)
```typescript
import { authenticateToken } from '../middleware/authenticateToken';

router.get('/profile', authenticateToken, (req, res) => {
  // req.user is automatically typed: { userId, email, role }
  res.json({ 
    message: `Hello ${req.user.email}!`,
    userId: req.user.userId,
    role: req.user.role 
  });
});
```

### 2. Admin-Only Route
```typescript
import { authenticateToken, requireAdmin } from '../middleware/authenticateToken';

router.delete('/users/:id', 
  authenticateToken,  // Verify token first
  requireAdmin,       // Then check if ADMIN or SUPERADMIN
  async (req, res) => {
    // Only ADMIN and SUPERADMIN can access
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  }
);
```

### 3. Multi-Role Route (Staff + Admin)
```typescript
import { authenticateToken, requireRole } from '../middleware/authenticateToken';

router.get('/reports', 
  authenticateToken, 
  requireRole('STAFF', 'ADMIN', 'SUPERADMIN'),
  (req, res) => {
    // Only STAFF, ADMIN, or SUPERADMIN can access
    res.json({ reports: [] });
  }
);
```

---

## 📋 Complete Role Hierarchy (Already in Schema)

```prisma
enum Role {
  USER        // Default for new registrations
  STAFF       // Basic staff member
  ADMIN       // Full administrative access
  SUPERADMIN  // Highest level (can manage other admins)
}
```

**No migration needed** - This is already in your schema!

---

## 🧪 Test It Right Now

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Register a User (curl)
```bash
curl -X POST http://localhost:4000/api/auth/v2/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "username": "admin",
    "password": "SecurePass123!",
    "fullName": "Admin User"
  }'
```

**Save the `accessToken` from response**

### 3. Access Protected Route
```bash
curl http://localhost:4000/api/auth/v2/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Promote User to Admin (Database)
```typescript
// Run in Prisma Studio or via script:
await prisma.user.update({
  where: { email: 'admin@example.com' },
  data: { role: 'ADMIN' }
});
```

Or use Prisma Studio:
```bash
cd backend
npx prisma studio
# Navigate to User model → Edit role → Save
```

---

## 🆚 Comparison: Your Examples vs. What's Built

### Your JWT Utils (jwt.js)
```javascript
// Basic, no refresh token support
export function signToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
```

### ✅ Built Implementation (jwt.ts)
```typescript
// Industry-standard access + refresh pattern
export function generateTokenPair(payload: JWTPayload) {
  return {
    accessToken: generateAccessToken(payload),   // 7 days
    refreshToken: generateRefreshToken(payload),  // 30 days
  };
}
// + verifyAccessToken, verifyRefreshToken functions
```

---

### Your Auth Middleware (auth.js)
```javascript
// Basic, returns null on failure
const decoded = verifyToken(token);
if (!decoded) return res.status(403).json({ error: 'Invalid token' });
```

### ✅ Built Implementation (authenticateToken.ts)
```typescript
// Type-safe, extends Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;  // Fully typed!
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  // Proper error messages
  // Type-safe payload
  // Extends req.user automatically
}

// PLUS role-based middleware:
export function requireRole(...allowedRoles: string[]) { /* ... */ }
export function requireAdmin(/* ... */) { /* ... */ }
```

---

### Your Password Utils (password.js)
```javascript
// bcrypt with hardcoded salt rounds
const saltRounds = 10;
return await bcrypt.hash(password, saltRounds);
```

### ✅ Built Implementation (password.ts)
```typescript
// Argon2id (GPU-resistant, memory-hard)
const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,  // ~19MB
  timeCost: 3,
  parallelism: 1,
};

// PLUS: Automatic bcrypt migration
// PLUS: Detects hash type (Argon2 vs bcrypt)
```

---

## 📚 Your Documentation is Better

Instead of scattered examples, you have:

1. **`backend/AUTH_JWT_GUIDE.md`** - Complete API reference with curl examples
2. **`JWT_AUTH_IMPLEMENTATION.md`** - Implementation summary & roadmap
3. **`Advancia_JWT_Auth_v2.postman_collection.json`** - Import & test instantly

---

## ⚡ Quick Actions

### Test Authentication Flow
```bash
# 1. Import Postman collection
# File: Advancia_JWT_Auth_v2.postman_collection.json

# 2. Run "1. Register (Sign Up)" → tokens auto-saved
# 3. Run "3. Get Current User" → uses saved token
# 4. Test all 7 endpoints in collection
```

### Protect Your Existing Routes
```typescript
// In any route file:
import { authenticateToken, requireRole } from '../middleware/authenticateToken';

// Before:
router.get('/data', async (req, res) => { /* ... */ });

// After (authenticated only):
router.get('/data', authenticateToken, async (req, res) => {
  console.log('User:', req.user.email, req.user.role);
  /* ... */
});

// After (admin only):
router.delete('/data/:id', 
  authenticateToken, 
  requireRole('ADMIN', 'SUPERADMIN'),
  async (req, res) => { /* ... */ }
);
```

---

## 🎉 Bottom Line

**Your system is already production-ready and superior to the examples you shared!**

✅ More secure (Argon2 > bcrypt)  
✅ Better token management (refresh pattern)  
✅ Type-safe (TypeScript)  
✅ 4-tier RBAC (not just USER/ADMIN)  
✅ Fully documented  
✅ Ready to test with Postman

**No additional work needed for Phase 2 - You're already there!** 🚀

# JWT Authentication System

Modern JWT-based authentication with role-based access control (RBAC).

## Environment Variables

Add these to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-256-bits-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-different-from-jwt-secret
JWT_REFRESH_EXPIRES_IN=30d
```

## API Endpoints

### 1. Register (Sign Up)

**POST** `/api/auth/v2/signup`

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "clxxx123456",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "USER"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

**POST** `/api/auth/v2/login`

**Request Body:**

```json
{
  "emailOrUsername": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "clxxx123456",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "USER",
    "emailVerified": false
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Refresh Token

**POST** `/api/auth/v2/refresh`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**

```json
{
  "success": true,
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Get Current User (Protected)

**GET** `/api/auth/v2/me`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "clxxx123456",
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "role": "USER",
    "emailVerified": false,
    "totpEnabled": false,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

### 5. Logout

**POST** `/api/auth/v2/logout`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Using Protected Routes

### Example: Protect any route with authentication

```typescript
import { authenticateToken } from "../middleware/authenticateToken";

router.get("/protected", authenticateToken, (req, res) => {
  // req.user contains: { userId, email, role }
  res.json({ message: "This is protected", user: req.user });
});
```

### Example: Require specific roles

```typescript
import {
  authenticateToken,
  requireRole,
} from "../middleware/authenticateToken";

// Only ADMIN and SUPERADMIN can access
router.delete(
  "/users/:id",
  authenticateToken,
  requireRole("ADMIN", "SUPERADMIN"),
  (req, res) => {
    // Delete user logic
  },
);
```

### Example: Admin-only route

```typescript
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authenticateToken";

router.post("/admin/settings", authenticateToken, requireAdmin, (req, res) => {
  // Only ADMIN and SUPERADMIN can access
});
```

## Role Hierarchy

- **USER**: Default role for new registrations
- **STAFF**: Basic staff member access
- **ADMIN**: Full administrative access
- **SUPERADMIN**: Highest level access

## Password Security

- Uses **Argon2id** hashing (superior to bcrypt)
- Memory-hard algorithm resistant to GPU attacks
- Automatically migrates legacy bcrypt hashes to Argon2
- Configuration in `backend/src/utils/password.ts`

## Testing with Postman/curl

### 1. Register a new user

```bash
curl -X POST http://localhost:4000/api/auth/v2/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123456!",
    "fullName": "Test User"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:4000/api/auth/v2/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "test@example.com",
    "password": "Test123456!"
  }'
```

### 3. Access protected route

```bash
# Save the accessToken from login response
curl http://localhost:4000/api/auth/v2/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## Next Steps

- [ ] Add email verification flow
- [ ] Add password reset functionality
- [ ] Implement token blacklist/revocation with Redis
- [ ] Add rate limiting for auth endpoints
- [ ] Add TOTP 2FA integration
- [ ] Add OAuth providers (Google, GitHub)
- [ ] Add account lockout after failed attempts
- [ ] Add session management dashboard

## Security Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Set strong JWT secrets** (min 256 bits)
4. **Use short access token expiry** (15 min recommended for high-security)
5. **Implement refresh token rotation** (generate new refresh on each use)
6. **Never log tokens or passwords**
7. **Rate limit auth endpoints** (prevent brute force)
8. **Monitor for suspicious login patterns**

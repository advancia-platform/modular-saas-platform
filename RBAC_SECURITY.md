# Role-Based Access Control (RBAC) Security

## Overview

The application implements comprehensive role-based access control (RBAC) to ensure that sensitive admin functionality is only accessible to authorized administrators.

## Security Architecture

### Authentication Flow

1. **JWT Token Verification**: All admin API requests require valid JWT tokens
2. **Role Validation**: Tokens must contain `role: "ADMIN"` to access admin endpoints
3. **Middleware Protection**: Server-side middleware validates admin access before processing requests

### Protected Resources

- **Admin Dashboard**: `/admin/dashboard` - Complete admin interface
- **Wallet Management**: `/api/admin/wallets` - Admin wallet balances
- **Transaction Oversight**: `/api/admin/transactions` - All user transactions
- **Manual Credits**: `/api/admin/credit-user` - User credit operations

## Implementation Details

### Frontend Protection

```tsx
// AdminRouteGuard component automatically:
// 1. Checks localStorage for admin role
// 2. Validates JWT token expiration
// 3. Calls backend API to verify admin status
// 4. Redirects non-admin users to dashboard
```

### API Route Protection

```typescript
// All admin API routes use requireAdmin middleware
import { requireAdmin, unauthorizedResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const adminUser = await requireAdmin(request);
  if (!adminUser) {
    return unauthorizedResponse();
  }
  // Proceed with admin-only logic
}
```

### JWT Payload Structure

```typescript
interface JWTPayload {
  userId: string;
  email?: string;
  role?: string; // Must be "ADMIN" for admin access
  type: string;
  active?: boolean;
}
```

## Security Features

### Access Control Levels

- **USER**: Standard user access (dashboard, transactions)
- **STAFF**: Limited admin access (future enhancement)
- **ADMIN**: Full administrative access

### Request Validation

- **Token Presence**: Bearer token required in Authorization header
- **Token Validity**: JWT signature and expiration validation
- **Role Verification**: Explicit role check for admin operations
- **User Context**: Admin actions are logged with user context

### Error Responses

- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Valid authentication but insufficient privileges
- **500 Internal Error**: Server-side processing errors

## Admin User Experience

### Visual Indicators

- **Role Badges**: Color-coded role indicators in user management
  - 🟢 USER: Green badge for regular users
  - 🔵 ADMIN: Blue badge for administrators
  - 🟠 STAFF: Orange badge for staff members

### Access Patterns

- **Seamless Access**: Admin users see full admin interface
- **Graceful Degradation**: Non-admin users redirected appropriately
- **Clear Feedback**: Access denied messages with context

## Audit & Monitoring

### Action Logging

- **Admin Actions**: All admin operations logged with timestamps
- **User Context**: Admin user ID recorded with each action
- **IP Tracking**: Request source IP addresses logged
- **Change History**: Before/after states for critical operations

### Security Monitoring

- **Failed Access Attempts**: Invalid admin access attempts logged
- **Token Expiry**: Automatic token refresh with security validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **Anomaly Detection**: Unusual access patterns flagged

## Best Practices

### Development Guidelines

- **Always Check Roles**: Never assume user permissions
- **Validate Input**: Sanitize all admin operation inputs
- **Log Operations**: Record all admin actions for audit trails
- **Error Handling**: Provide meaningful error messages without exposing internals

### Security Maintenance

- **Regular Audits**: Periodic review of admin access patterns
- **Token Rotation**: Implement token refresh policies
- **Access Reviews**: Regular review of admin user privileges
- **Incident Response**: Clear procedures for security incidents

## API Endpoints

### Protected Admin Routes

```
GET  /api/admin/wallets      - Admin wallet balances
GET  /api/admin/transactions - All user transactions
POST /api/admin/credit-user  - Manual user credits
```

### Authentication Requirements

- **Authorization Header**: `Bearer <jwt-token>`
- **Token Claims**: Must include `role: "ADMIN"`
- **Token Validity**: Must not be expired
- **User Status**: Admin user must be active

## Troubleshooting

### Common Issues

- **403 Forbidden**: Check user role in JWT token
- **401 Unauthorized**: Verify token presence and validity
- **Token Expired**: Implement automatic token refresh
- **Role Mismatch**: Ensure database role matches token claims

### Debug Steps

1. **Verify Token**: Decode JWT to check claims
2. **Check Database**: Confirm user role in database
3. **Validate Route**: Ensure route uses requireAdmin middleware
4. **Review Logs**: Check server logs for authentication errors

## Future Enhancements

### Advanced Features

- **Granular Permissions**: Object-level permissions beyond roles
- **Multi-Factor Authentication**: Additional security for admin accounts
- **Session Management**: Admin session timeout and management
- **Audit Dashboards**: Visual audit trail interfaces

### Integration Points

- **External Auth**: Integration with enterprise authentication systems
- **Role Management**: Dynamic role assignment and management
- **Permission Templates**: Predefined permission sets for different admin types
- **Compliance Reporting**: Automated compliance and audit reporting

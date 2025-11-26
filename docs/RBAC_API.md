# 🔐 RBAC API Documentation

This document provides comprehensive documentation for Role-Based Access Control (RBAC) implementation in the Notification Preferences API system, covering permissions, API access patterns, and integration guidelines.

---

## 🎯 Overview

The RBAC system implements a hierarchical permission model with three primary roles:
- **Admin**: Full system access with create, read, update, delete permissions
- **Auditor**: Read access to data and audit logs for compliance monitoring  
- **Viewer**: Limited read access to basic preference data

---

## 👥 Role Definitions

### 🔴 Admin Role
**Permissions**: Full CRUD operations + system management

| Resource | Create | Read | Update | Delete | Export | Audit |
|----------|--------|------|--------|---------|--------|-------|
| Notification Preferences | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audit Logs | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Integration Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| User Management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| System Configuration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Use Cases**:
- System administrators
- DevOps engineers  
- Platform managers
- Security administrators

### 🟡 Auditor Role
**Permissions**: Read access + audit capabilities

| Resource | Create | Read | Update | Delete | Export | Audit |
|----------|--------|------|--------|---------|--------|-------|
| Notification Preferences | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Integration Management | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| User Management | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| System Configuration | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

**Use Cases**:
- Compliance officers
- Internal auditors
- Regulatory reviewers
- Quality assurance teams

### 🟢 Viewer Role  
**Permissions**: Limited read access

| Resource | Create | Read | Update | Delete | Export | Audit |
|----------|--------|------|--------|---------|--------|-------|
| Notification Preferences | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Integration Management | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| User Management | ❌ | ✅* | ❌ | ❌ | ❌ | ❌ |
| System Configuration | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Limited to own user profile only

**Use Cases**:
- Read-only dashboard access
- Customer support (limited)
- Business analysts (restricted data)
- External consultants (limited scope)

---

## 🔧 API Access Patterns

### Authentication Flow

```typescript
// 1. Login to get JWT token
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response includes role information
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com", 
    "role": "admin"
  }
}

// 2. Include JWT in all subsequent requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Permission Enforcement Middleware

```typescript
// Backend implementation example
function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }
    
    next();
  };
}

// Usage in routes
router.post('/preferences', 
  authenticateToken, 
  requireRole(['admin']), 
  createPreference
);

router.get('/audit/logs', 
  authenticateToken, 
  requireRole(['admin', 'auditor']), 
  getAuditLogs
);
```

---

## 📊 API Endpoint Access Matrix

### Notification Preferences Endpoints

| Endpoint | Method | Admin | Auditor | Viewer | Notes |
|----------|--------|-------|---------|--------|-------|
| `/api/notification-preferences` | GET | ✅ | ✅ | ✅ | List all preferences |
| `/api/notification-preferences` | POST | ✅ | ❌ | ❌ | Create new preference |
| `/api/notification-preferences/:id` | GET | ✅ | ✅ | ✅ | Get specific preference |
| `/api/notification-preferences/:id` | PUT | ✅ | ❌ | ❌ | Update preference |
| `/api/notification-preferences/:id` | DELETE | ✅ | ❌ | ❌ | Delete preference |
| `/api/notification-preferences/export` | GET | ✅ | ✅ | ❌ | Export user data |

### Audit & Compliance Endpoints

| Endpoint | Method | Admin | Auditor | Viewer | Notes |
|----------|--------|-------|---------|--------|-------|
| `/api/audit/logs` | GET | ✅ | ✅ | ❌ | View audit logs |
| `/api/audit/export` | GET | ✅ | ✅ | ❌ | Export audit data |
| `/api/compliance/report` | GET | ✅ | ✅ | ❌ | Compliance reports |

### Integration Management Endpoints

| Endpoint | Method | Admin | Auditor | Viewer | Notes |
|----------|--------|-------|---------|--------|-------|
| `/api/integrations/status` | GET | ✅ | ✅ | ❌ | View integration status |
| `/api/integrations/test` | POST | ✅ | ❌ | ❌ | Test integration |
| `/api/integrations/configure` | PUT | ✅ | ❌ | ❌ | Configure integration |

### User Management Endpoints

| Endpoint | Method | Admin | Auditor | Viewer | Notes |
|----------|--------|-------|---------|--------|-------|
| `/api/users` | GET | ✅ | ✅ | ❌ | List users |
| `/api/users` | POST | ✅ | ❌ | ❌ | Create user |
| `/api/users/:id` | GET | ✅ | ✅ | ✅* | Get user details |
| `/api/users/:id` | PUT | ✅ | ❌ | ❌ | Update user |
| `/api/users/:id` | DELETE | ✅ | ❌ | ❌ | Delete user |

*Viewers can only access their own user profile

---

## 🔒 Security Implementation

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@advancia.com",
    "role": "admin",
    "permissions": ["create", "read", "update", "delete", "audit"],
    "iat": 1640995200,
    "exp": 1641081600
  }
}
```

### Permission Validation

```typescript
// Frontend permission checking
function hasPermission(userRole: string, action: string, resource: string): boolean {
  const permissions = {
    admin: {
      notification_preferences: ['create', 'read', 'update', 'delete', 'export'],
      audit_logs: ['read', 'export'],
      integrations: ['create', 'read', 'update', 'delete', 'test'],
      users: ['create', 'read', 'update', 'delete']
    },
    auditor: {
      notification_preferences: ['read', 'export'],
      audit_logs: ['read', 'export'],
      integrations: ['read'],
      users: ['read']
    },
    viewer: {
      notification_preferences: ['read'],
      audit_logs: [],
      integrations: [],
      users: ['read'] // self only
    }
  };

  const userPermissions = permissions[userRole];
  return userPermissions?.[resource]?.includes(action) || false;
}

// Usage in React components
function PreferenceActions({ userRole }: { userRole: string }) {
  const canCreate = hasPermission(userRole, 'create', 'notification_preferences');
  const canUpdate = hasPermission(userRole, 'update', 'notification_preferences');
  
  return (
    <div>
      {canCreate && <button>Create Preference</button>}
      {canUpdate && <button>Edit Preference</button>}
    </div>
  );
}
```

---

## 🛡️ Error Handling

### Standard Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing token",
  "code": "INVALID_TOKEN",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 403 Forbidden  
```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS",
  "details": {
    "requiredRoles": ["admin"],
    "userRole": "viewer",
    "resource": "notification_preferences",
    "action": "create"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 422 Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "category",
      "message": "Category is required",
      "value": null
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📋 Implementation Guidelines

### Backend Implementation

#### 1. Role-based Middleware
```typescript
// middleware/rbac.ts
export const requirePermissions = (resource: string, action: string) => {
  return [
    authenticateToken,
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const userRole = req.user?.role;
      const hasAccess = checkPermission(userRole, resource, action);
      
      if (!hasAccess) {
        auditLogger.logUnauthorizedAccess({
          userId: req.user?.id,
          role: userRole,
          resource,
          action,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(403).json({
          success: false,
          error: "Forbidden: Insufficient permissions",
          code: "INSUFFICIENT_PERMISSIONS"
        });
      }
      
      next();
    }
  ];
};

// Usage in routes
router.post('/preferences',
  ...requirePermissions('notification_preferences', 'create'),
  createPreference
);
```

#### 2. Audit Logging
```typescript
// services/auditLogger.ts
export class AuditLogger {
  static async logAction(data: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
  }) {
    await prisma.auditLog.create({
      data: {
        ...data,
        timestamp: new Date(),
        success: true
      }
    });
  }

  static async logUnauthorizedAccess(data: {
    userId?: string;
    role?: string;
    resource: string;
    action: string;
    ip?: string;
    userAgent?: string;
  }) {
    await prisma.auditLog.create({
      data: {
        ...data,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        timestamp: new Date(),
        success: false
      }
    });
  }
}
```

### Frontend Implementation

#### 1. Role-based Components
```tsx
// components/RoleGuard.tsx
interface RoleGuardProps {
  requiredRoles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({ requiredRoles, fallback, children }: RoleGuardProps) {
  const { user } = useAuth();
  
  if (!user || !requiredRoles.includes(user.role)) {
    return fallback || <div>Access Denied</div>;
  }
  
  return <>{children}</>;
}

// Usage
<RoleGuard requiredRoles={['admin']}>
  <CreatePreferenceButton />
</RoleGuard>

<RoleGuard 
  requiredRoles={['admin', 'auditor']}
  fallback={<div>Audit access required</div>}
>
  <AuditLogsTable />
</RoleGuard>
```

#### 2. Permission Hooks
```tsx
// hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth();
  
  const hasPermission = useCallback((resource: string, action: string) => {
    if (!user) return false;
    return checkPermission(user.role, resource, action);
  }, [user]);
  
  const canCreatePreference = hasPermission('notification_preferences', 'create');
  const canViewAuditLogs = hasPermission('audit_logs', 'read');
  const canManageIntegrations = hasPermission('integrations', 'update');
  
  return {
    hasPermission,
    canCreatePreference,
    canViewAuditLogs,
    canManageIntegrations
  };
}

// Usage in components
function PreferenceManagement() {
  const { canCreatePreference, canViewAuditLogs } = usePermissions();
  
  return (
    <div>
      {canCreatePreference && <CreateButton />}
      {canViewAuditLogs && <AuditButton />}
    </div>
  );
}
```

---

## 🧪 Testing RBAC

### Unit Tests
```typescript
describe('RBAC Middleware', () => {
  it('should allow admin to create preferences', async () => {
    const mockReq = createMockRequest({ role: 'admin' });
    const mockRes = createMockResponse();
    const next = jest.fn();
    
    const middleware = requirePermissions('notification_preferences', 'create')[1];
    middleware(mockReq, mockRes, next);
    
    expect(next).toHaveBeenCalled();
  });
  
  it('should deny viewer access to create preferences', async () => {
    const mockReq = createMockRequest({ role: 'viewer' });
    const mockRes = createMockResponse();
    const next = jest.fn();
    
    const middleware = requirePermissions('notification_preferences', 'create')[1];
    middleware(mockReq, mockRes, next);
    
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### Integration Tests
```typescript
describe('Preference API RBAC', () => {
  test('Admin can create preference', async () => {
    const response = await request(app)
      .post('/api/notification-preferences')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validPreferenceData)
      .expect(201);
      
    expect(response.body.success).toBe(true);
  });
  
  test('Auditor cannot create preference', async () => {
    const response = await request(app)
      .post('/api/notification-preferences')
      .set('Authorization', `Bearer ${auditorToken}`)
      .send(validPreferenceData)
      .expect(403);
      
    expect(response.body.error).toContain('Insufficient permissions');
  });
});
```

---

## 📊 Compliance & Audit

### RBAC Compliance Mapping

| Compliance Standard | RBAC Implementation | Validation |
|-------------------|-------------------|------------|
| SOC2 - Access Controls | Role-based permissions enforced | Automated tests + audit logs |
| ISO27001 - Information Security | Least privilege principle | Quarterly access reviews |
| GDPR - Data Protection | Data access controls by role | User access audit trails |
| NIST - Access Control | Multi-level authorization | Continuous monitoring |

### Audit Trail Requirements

**Every API call logs**:
- User ID and role
- Action performed
- Resource accessed
- Timestamp
- IP address
- Success/failure status
- Request details

**Quarterly Reviews**:
- User role assignments
- Permission matrices
- Access patterns analysis
- Failed authorization attempts
- Role escalation requests

---

## ✅ Best Practices

### 1. Principle of Least Privilege
- Assign minimum required permissions
- Regular review and cleanup of permissions
- Time-limited elevated access when needed

### 2. Role Separation
- Clear boundaries between admin/auditor/viewer roles
- No overlapping permissions that could compromise security
- Regular validation of role definitions

### 3. Audit Everything
- Log all permission checks (success and failure)
- Monitor for privilege escalation attempts
- Regular review of audit logs for anomalies

### 4. Secure Implementation
- Never trust client-side permission checks
- Always validate permissions server-side
- Use JWT tokens with short expiration times
- Implement proper session management

---

## 🔗 Related Documentation

- [POSTMAN_COLLECTION.md](POSTMAN_COLLECTION.md) - API testing with RBAC scenarios
- [SECURITY_POLICY.md](SECURITY_POLICY.md) - Overall security implementation
- [AUDIT.md](AUDIT.md) - Audit and compliance procedures
- [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) - Security incident procedures

---

*This RBAC documentation ensures secure, auditable, and compliant access control for the Notification Preferences API system.*

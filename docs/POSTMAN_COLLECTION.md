# 📬 Postman Collection - Notification Preferences API

This Postman collection provides comprehensive, ready‑to‑use requests for testing the Notification Preferences API with full RBAC enforcement, authentication flows, and audit logging validation.

---

## 🔑 Authentication Setup

All requests require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Environment Variables

Configure these in your Postman environment:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{base_url}}` | API base URL | `http://localhost:4000` |
| `{{admin_token}}` | Admin JWT token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `{{auditor_token}}` | Auditor JWT token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `{{viewer_token}}` | Viewer JWT token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `{{user_id}}` | Target user ID | `123e4567-e89b-12d3-a456-426614174000` |
| `{{preference_id}}` | Preference ID | `550e8400-e29b-41d4-a716-446655440000` |

---

## 📂 API Endpoints Collection

### 🔐 Authentication Endpoints

#### 1. Login (Get JWT Token)

**POST** `/api/auth/login`

```http
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "admin@advancia.com",
  "password": "SecurePassword123!"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@advancia.com",
    "role": "admin"
  }
}
```

#### 2. Get Current User

**GET** `/api/auth/me`

```http
GET {{base_url}}/api/auth/me
Authorization: Bearer {{admin_token}}
```

**Expected Response (200):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "admin@advancia.com",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 🔔 Notification Preferences Endpoints

#### 3. Get All Preferences (Admin/Auditor/Viewer)

**GET** `/api/notification-preferences`

```http
GET {{base_url}}/api/notification-preferences
Authorization: Bearer {{admin_token}}
```

**Expected Response (200) - Admin/Auditor/Viewer:**

```json
{
  "success": true,
  "preferences": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "category": "transactions",
      "channel": "email",
      "enabled": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "category": "security",
      "channel": "telegram",
      "enabled": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 2
}
```

#### 4. Create Preference (Admin Only)

**POST** `/api/notification-preferences`

```http
POST {{base_url}}/api/notification-preferences
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "userId": "{{user_id}}",
  "category": "compliance",
  "channel": "email",
  "enabled": true
}
```

**Expected Response (201) - Admin:**

```json
{
  "success": true,
  "preference": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "category": "compliance",
    "channel": "email",
    "enabled": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Expected Response (403) - Auditor/Viewer:**

```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS",
  "requiredRole": "admin",
  "userRole": "auditor"
}
```

#### 5. Update Preference (Admin Only)

**PUT** `/api/notification-preferences/{{preference_id}}`

```http
PUT {{base_url}}/api/notification-preferences/{{preference_id}}
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "enabled": false,
  "channel": "telegram"
}
```

**Expected Response (200) - Admin:**

```json
{
  "success": true,
  "preference": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "category": "compliance",
    "channel": "telegram",
    "enabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T01:30:00.000Z"
  }
}
```

#### 6. Delete Preference (Admin Only)

**DELETE** `/api/notification-preferences/{{preference_id}}`

```http
DELETE {{base_url}}/api/notification-preferences/{{preference_id}}
Authorization: Bearer {{admin_token}}
```

**Expected Response (200) - Admin:**

```json
{
  "success": true,
  "message": "Notification preference deleted successfully",
  "deletedId": "550e8400-e29b-41d4-a716-446655440002"
}
```

---

### 📊 Audit & Analytics Endpoints

#### 7. Get Audit Logs (Admin/Auditor)

**GET** `/api/audit/logs`

```http
GET {{base_url}}/api/audit/logs?page=1&limit=10&action=CREATE
Authorization: Bearer {{auditor_token}}
```

**Expected Response (200) - Admin/Auditor:**

```json
{
  "success": true,
  "logs": [
    {
      "id": "audit_001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "action": "CREATE",
      "resource": "notification_preference",
      "resourceId": "550e8400-e29b-41d4-a716-446655440002",
      "details": {
        "category": "compliance",
        "channel": "email",
        "enabled": true
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Postman/10.0.0",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

**Expected Response (403) - Viewer:**

```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions for audit logs",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

#### 8. Export User Preferences (Admin/User Self)

**GET** `/api/notification-preferences/export`

```http
GET {{base_url}}/api/notification-preferences/export?userId={{user_id}}&format=json
Authorization: Bearer {{admin_token}}
```

**Expected Response (200):**

```json
{
  "success": true,
  "export": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "exportedAt": "2024-01-01T00:00:00.000Z",
    "preferences": [
      {
        "category": "transactions",
        "channel": "email",
        "enabled": true
      },
      {
        "category": "security",
        "channel": "telegram",
        "enabled": false
      }
    ]
  }
}
```

---

### 🔗 Integration Management Endpoints

#### 9. Get Integration Status (Admin/Auditor)

**GET** `/api/integrations/status`

```http
GET {{base_url}}/api/integrations/status
Authorization: Bearer {{admin_token}}
```

**Expected Response (200):**

```json
{
  "success": true,
  "integrations": {
    "resend": {
      "status": "active",
      "lastChecked": "2024-01-01T00:00:00.000Z",
      "apiKey": "configured"
    },
    "telegram": {
      "status": "active",
      "lastChecked": "2024-01-01T00:00:00.000Z",
      "botToken": "configured"
    },
    "cryptomus": {
      "status": "inactive",
      "lastChecked": "2024-01-01T00:00:00.000Z",
      "apiKey": "missing"
    }
  }
}
```

#### 10. Test Integration (Admin Only)

**POST** `/api/integrations/test`

```http
POST {{base_url}}/api/integrations/test
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "service": "resend",
  "testMessage": {
    "to": "test@example.com",
    "subject": "Integration Test",
    "content": "This is a test notification"
  }
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "service": "resend",
  "testResult": {
    "status": "sent",
    "messageId": "msg_1234567890",
    "responseTime": "145ms"
  }
}
```

---

## 🛡️ RBAC Enforcement Tests

### Admin Role Tests

✅ **Can perform all operations:**

- Create, read, update, delete preferences
- Access audit logs
- Manage integrations
- Export user data

### Auditor Role Tests

✅ **Can perform read operations:**

- Read preferences
- Access audit logs
- View integration status

❌ **Cannot perform write operations:**

- Create/update/delete preferences (403 Forbidden)
- Manage integrations (403 Forbidden)

### Viewer Role Tests

✅ **Can perform limited read operations:**

- Read preferences

❌ **Cannot perform restricted operations:**

- Access audit logs (403 Forbidden)
- Create/update/delete preferences (403 Forbidden)
- Manage integrations (403 Forbidden)

---

## 🚨 Error Response Examples

### 401 Unauthorized (Invalid/Missing JWT)

```json
{
  "success": false,
  "error": "Unauthorized: Invalid or missing token",
  "code": "INVALID_TOKEN"
}
```

### 403 Forbidden (Insufficient Permissions)

```json
{
  "success": false,
  "error": "Forbidden: Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS",
  "requiredRole": "admin",
  "userRole": "viewer"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Notification preference not found",
  "code": "NOT_FOUND",
  "resourceId": "550e8400-e29b-41d4-a716-446655440999"
}
```

### 422 Validation Error

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "category",
      "message": "Category must be one of: transactions, security, compliance, marketing"
    },
    {
      "field": "channel",
      "message": "Channel must be one of: email, telegram, resend"
    }
  ]
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "requestId": "req_1234567890"
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Admin Workflow

1. **Login as Admin** → Get JWT token
2. **Create Preference** → POST with admin token (expect 201)
3. **Update Preference** → PUT with admin token (expect 200)
4. **View Audit Logs** → GET with admin token (expect 200)
5. **Delete Preference** → DELETE with admin token (expect 200)

### Scenario 2: Auditor Workflow

1. **Login as Auditor** → Get JWT token
2. **Read Preferences** → GET with auditor token (expect 200)
3. **Try to Create Preference** → POST with auditor token (expect 403)
4. **View Audit Logs** → GET with auditor token (expect 200)

### Scenario 3: Viewer Workflow

1. **Login as Viewer** → Get JWT token
2. **Read Preferences** → GET with viewer token (expect 200)
3. **Try to Access Audit Logs** → GET with viewer token (expect 403)
4. **Try to Create Preference** → POST with viewer token (expect 403)

### Scenario 4: Unauthorized Access

1. **No Token** → Any request without Authorization header (expect 401)
2. **Invalid Token** → Request with malformed JWT (expect 401)
3. **Expired Token** → Request with expired JWT (expect 401)

---

## 📋 Pre-configured Test Data

### Test Users (for development environment)

```json
{
  "admin": {
    "email": "admin@advancia.com",
    "password": "AdminPass123!",
    "role": "admin"
  },
  "auditor": {
    "email": "auditor@advancia.com", 
    "password": "AuditorPass123!",
    "role": "auditor"
  },
  "viewer": {
    "email": "viewer@advancia.com",
    "password": "ViewerPass123!",
    "role": "viewer"
  }
}
```

### Test Preferences

```json
[
  {
    "category": "transactions",
    "channel": "email",
    "enabled": true
  },
  {
    "category": "security", 
    "channel": "telegram",
    "enabled": false
  },
  {
    "category": "compliance",
    "channel": "resend",
    "enabled": true
  },
  {
    "category": "marketing",
    "channel": "email",
    "enabled": false
  }
]
```

---

## 🔄 Import Instructions

1. **Download Collection**: Export this documentation as a Postman collection JSON
2. **Import to Postman**: File → Import → Upload the collection file
3. **Setup Environment**: Create a new environment with the variables listed above
4. **Configure Base URL**: Set `{{base_url}}` to your API endpoint
5. **Get Tokens**: Run the login requests to get JWT tokens for each role
6. **Run Tests**: Execute the test scenarios to validate RBAC enforcement

---

## ✅ Success Criteria

This Postman collection ensures:

- ✅ **Authentication** → JWT validation for all protected endpoints
- ✅ **RBAC Enforcement** → Role-based access control properly tested
- ✅ **Audit Logging** → All preference changes generate audit entries  
- ✅ **Error Handling** → Proper error responses for edge cases
- ✅ **Integration Testing** → End-to-end workflows validated
- ✅ **Documentation** → Clear examples for developers and auditors

---

*This collection provides comprehensive API testing coverage for the Notification Preferences system with full RBAC validation, making it audit-ready and demo-friendly for stakeholders.*

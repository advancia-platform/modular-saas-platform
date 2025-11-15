# Admin User Filters & Sorting

## Overview

The admin user management interface now includes comprehensive filtering and sorting capabilities that allow administrators to efficiently manage large user bases. Features include quick role filter buttons, server-side search, pagination, and dynamic sorting options.

## Shared Components Architecture

### Component Structure

```
frontend/src/components/
├── RoleBadge.tsx          # Reusable role display component
├── PaginationControls.tsx # Shared pagination controls
├── SortControls.tsx       # Shared sorting dropdowns
└── TransactionTable.tsx   # Reusable transaction display
```

### RoleBadge Component

```tsx
interface RoleBadgeProps {
  role: "USER" | "STAFF" | "ADMIN";
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  // Consistent styling across all admin interfaces
}
```

### PaginationControls Component

```tsx
interface PaginationControlsProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export default function PaginationControls(props: PaginationControlsProps) {
  // Standardized pagination UI with accessibility
}
```

### SortControls Component

````tsx
interface SortControlsProps {
  sortField: string;
  setSortField: (field: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
}

### TransactionTable Component

```tsx
interface TransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  title?: string;
}

export default function TransactionTable(props: TransactionTableProps) {
  // Reusable transaction display with built-in sorting
}
````

## Features

- **Quick Role Filters**: One-click buttons to filter users by role
- **Server-Side Sorting**: Sort by email, role, balance, or creation date
- **Flexible Sort Order**: Ascending or descending for all sort fields
- **Combined Filtering**: Search, role filters, and sorting work together
- **Pagination**: Efficient handling of large user datasets (10-100 per page)
- **Visual Active States**: Clear indication of active filters and sort options
- **Responsive Design**: Optimized for both desktop and mobile interfaces

## Filter Options

### All Users

- **Button**: "All Users" (purple/indigo when active)
- **Function**: Shows all users regardless of role
- **Use Case**: Default view, complete user overview

### Users Only

- **Button**: "👥 Users Only" (green when active)
- **Function**: Shows only users with `USER` role
- **Use Case**: Focus on regular user accounts for support or analysis

### Admins Only

- **Button**: "👑 Admins Only" (blue when active)
- **Function**: Shows only users with `ADMIN` role
- **Use Case**: Administrative user management and oversight

### Staff Only

- **Button**: "🛠️ Staff Only" (orange when active)
- **Function**: Shows only users with `STAFF` role
- **Use Case**: Staff member management and permissions

## Sorting Options

### Sort Fields

- **Created Date**: Sort by account creation timestamp
- **Email**: Alphabetical sorting by email address
- **Role**: Sort by user role (USER, STAFF, ADMIN)
- **Balance**: Sort by USD balance amount

### Sort Orders

- **Newest First**: Descending order (default for dates)
- **Oldest First**: Ascending order

## Implementation Details

### State Management

```typescript
const [role, setRole] = useState<string>(""); // "" = all, "USER", "ADMIN", "STAFF"
const [sortField, setSortField] = useState<string>("createdAt");
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
```

### API Integration

```typescript
// Frontend API call
const params = { page, pageSize, sortField, sortOrder };
if (role) params.role = role;
if (search) params.search = search;
const { data } = await adminApi.get("/api/admin/users", { params });

// Backend sorting validation
const validSortFields = ["email", "role", "createdAt", "usdBalance"];
const field = validSortFields.includes(sortField) ? sortField : "createdAt";
const order = sortOrder === "asc" ? "asc" : "desc";
```

### Filter Logic

```typescript
// Applied to API requests
const params: Record<string, string | number> = { page, pageSize };
if (role) params.role = role; // Only add if not empty
```

### UI Components

#### Role Filter Buttons

```tsx
<button
  onClick={() => {
    setRole("USER");
    setPage(1); // Reset to first page
  }}
  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
    role === "USER"
      ? "bg-green-600 text-white"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
  }`}
>
  👥 Users Only
</button>
```

#### Sorting Dropdowns

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
    Sort by:
  </span>
  <select
    value={sortField}
    onChange={(e) => {
      setSortField(e.target.value);
      setPage(1);
    }}
    className="border rounded px-3 py-2"
  >
    <option value="createdAt">Created Date</option>
    <option value="email">Email</option>
    <option value="role">Role</option>
    <option value="usdBalance">Balance</option>
  </select>
  <select
    value={sortOrder}
    onChange={(e) => {
      setSortOrder(e.target.value as "asc" | "desc");
      setPage(1);
    }}
    className="border rounded px-3 py-2"
  >
    <option value="desc">Newest First</option>
    <option value="asc">Oldest First</option>
  </select>
</div>
```

## Performance Considerations

### Server-Side Processing

- **Database Indexing**: Ensure indexes on frequently sorted fields (`email`, `role`, `createdAt`, `usdBalance`)
- **Query Optimization**: Prisma generates efficient SQL with proper `ORDER BY` and `LIMIT` clauses
- **Pagination Limits**: Maximum 100 users per page to prevent excessive data transfer

### Client-Side Efficiency

- **Debounced Search**: 500ms delay prevents excessive API calls during typing
- **Page Reset**: Automatic page reset when filters change prevents empty results
- **Loading States**: Visual feedback during data fetching operations

## Security Features

### Access Control

- **RBAC Protection**: All admin endpoints require `ADMIN` role
- **JWT Validation**: Token-based authentication with expiration checks
- **Audit Logging**: All user management actions are logged for compliance

### Sentry Security Monitoring

The system now integrates RBAC with Sentry to log security events in production:

#### Logged Security Events

1. **Unauthorized Admin Access**

   - When non-admin users attempt to access admin routes
   - Captures user details, attempted route, IP address, user agent
   - Tagged as `security:unauthorized_admin_access`

2. **Role-Based Access Violations**

   - When users try to access resources requiring specific roles
   - Logs required vs actual roles, route details
   - Tagged as `security:unauthorized_role_access`

3. **Authentication Failures**
   - Invalid or expired JWT tokens
   - Missing authentication tokens
   - Tagged as `security:authentication_failure` and `security:missing_auth_token`

#### Sentry Event Structure

```javascript
{
  tags: {
    type: "security",
    event: "unauthorized_admin_access",
    severity: "warning",
    routeGroup: "admin"  // 👈 Route group tag for filtering
  },
  extra: {
    userId: "user-123",
    userEmail: "user@example.com",
    userRole: "USER",
    attemptedRoute: "GET /api/admin/users",
    userAgent: "Mozilla/5.0...",
    ipAddress: "192.168.1.1",
    timestamp: "2025-11-15T10:30:00.000Z"
  },
  user: {
    id: "user-123",
    email: "user@example.com",
    role: "USER"
  }
}
```

#### Route Group Classifications

The system automatically tags events with route groups:

- **`admin`**: Admin panel routes (`/api/admin/*`)
- **`payments`**: Payment processing (`/api/payments/*`)
- **`crypto`**: Cryptocurrency operations (`/api/crypto/*`)
- **`transactions`**: Transaction management (`/api/transactions/*`)
- **`auth`**: Authentication routes (`/api/auth/*`)
- **`users`**: User management (`/api/users/*`)
- **`other`**: All other routes

#### Production Monitoring Benefits

- **Threat Detection**: Identify patterns of unauthorized access attempts
- **Security Alerts**: Get notified of potential security breaches
- **Audit Trail**: Complete log of all access control events
- **User Behavior Analysis**: Monitor which routes are frequently targeted
- **IP Tracking**: Identify suspicious IP addresses or patterns
- **Route Group Filtering**: Filter Sentry dashboard by route type (admin, payments, crypto, etc.)
- **Targeted Monitoring**: Focus on specific system areas being attacked
- **Trend Analysis**: See which route groups have the most security events

#### Using Route Groups in Sentry Dashboard

**Filter by Route Group:**

```
tags.routeGroup:admin
```

**Find all admin access violations:**

```
tags.routeGroup:admin AND tags.event:unauthorized_admin_access
```

**Compare security events across route groups:**

```
tags.type:security groupBy:tags.routeGroup
```

**Monitor payment system security:**

```
tags.routeGroup:payments AND tags.severity:error
```

### Data Protection

- **Field Selection**: Only necessary user fields exposed in API responses
- **Input Sanitization**: Search queries properly escaped to prevent injection
- **Rate Limiting**: API endpoints protected against abuse

## Testing Strategy

### Unit Tests

```typescript
describe("User Filters", () => {
  test("role filter buttons update state correctly", () => {
    // Test role filter state changes
  });

  test("sorting dropdowns trigger API calls", () => {
    // Test sort field and order changes
  });
});
```

### Integration Tests

```typescript
describe("Admin User API", () => {
  test("sorting parameters work correctly", async () => {
    const response = await request(app)
      .get("/api/admin/users?sortField=email&sortOrder=asc")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    // Verify users are sorted by email ascending
  });
});
```

## Rate Limiting Integration

### Overview

The admin panel is protected by intelligent rate limiting that works with RBAC and Sentry to prevent abuse and brute-force attacks.

### Rate Limiter Configuration

```typescript
// Strict rate limiter for auth endpoints (5 attempts per 15 minutes)
strictRateLimiter: {
  windowMs: 900000,
  max: 5,
  message: "Too many failed attempts. Please try again in 15 minutes."
}

// Admin rate limiter (20 requests per minute)
adminRateLimiter: {
  windowMs: 60000,
  max: 20,
  group: "admin"
}

// API rate limiter (100 requests per minute)
apiRateLimiter: {
  windowMs: 60000,
  max: 100
}
```

### Protected Endpoints

**Authentication Routes:**

- `/api/auth/login` - 5 attempts per 15 minutes (strict)
- `/api/auth/register` - 5 attempts per 15 minutes (strict)
- `/api/auth/forgot-password` - 5 attempts per 15 minutes (strict)

**Admin Routes:**

- `/api/admin/users` - 20 requests per minute
- `/api/admin/transactions` - 20 requests per minute
- `/api/admin/dashboard` - 20 requests per minute

### Sentry Event Logging

When rate limits are exceeded, events are logged to Sentry:

```javascript
{
  tags: {
    type: "security",
    event: "rate_limit_exceeded",
    severity: "warning",
    routeGroup: "admin" // or "auth", "payments", etc.
  },
  extra: {
    ip: "192.168.1.1",
    path: "/api/admin/users",
    method: "GET",
    attemptsCount: 25,
    windowMs: 60000,
    maxAllowed: 20,
    timeInWindow: 45000,
    userAgent: "Mozilla/5.0..."
  }
}
```

### Response Format

**Rate Limit Exceeded:**

```json
{
  "error": "Too many requests, please try again later",
  "retryAfter": 15
}
```

HTTP Status: `429 Too Many Requests`
Header: `Retry-After: 15` (seconds)

### Client IP Detection

The rate limiter intelligently detects client IPs:

1. `X-Forwarded-For` header (proxy/load balancer)
2. `X-Real-IP` header (nginx)
3. `req.ip` (Express)
4. `req.connection.remoteAddress` (fallback)

### Production Considerations

**In-Memory Store (Current):**

- Fast and simple for single-server deployments
- Auto-cleanup every 5 minutes removes expired entries
- Suitable for development and small production deployments

**Redis Store (Recommended for Scale):**

```typescript
// For distributed systems, upgrade to Redis:
import Redis from "ioredis";
const redis = new Redis();

// Store rate limit data in Redis with TTL
await redis.incr(`ratelimit:${key}`);
await redis.expire(`ratelimit:${key}`, windowMs / 1000);
```

### Monitoring Rate Limit Events

**Sentry Dashboard Queries:**

```
// All rate limit violations
tags.event:rate_limit_exceeded

// Admin route rate limits
tags.routeGroup:admin AND tags.event:rate_limit_exceeded

// High-frequency offenders (>50 attempts)
tags.event:rate_limit_exceeded AND extra.attemptsCount:>50

// Group by IP to find attackers
tags.event:rate_limit_exceeded groupBy:extra.ip
```

### Security Benefits

- **Brute Force Protection**: Prevents password guessing attacks
- **DDoS Mitigation**: Limits impact of request flooding
- **Resource Protection**: Prevents API abuse and overload
- **Suspicious Activity Detection**: Identifies automated attacks
- **Audit Trail**: Complete log of rate limit violations

## Future Enhancements

### Potential Additions

- **Advanced Filters**: Date range filters, balance range filters
- **Export Functionality**: CSV export with current filters applied
- **Bulk Sort Operations**: Apply sorting to bulk selection operations
- **Saved Filter Sets**: Allow admins to save and reuse filter combinations
- **Real-time Updates**: WebSocket integration for live user status updates
- **IP Whitelisting**: Allow trusted IPs to bypass rate limits
- **Dynamic Rate Limiting**: Adjust limits based on threat level

### Performance Optimizations

- **Cursor-based Pagination**: For extremely large datasets
- **Search Indexing**: Full-text search capabilities
- **Caching Layer**: Redis caching for frequently accessed user lists
- **Background Processing**: Async export operations for large datasets
- **Redis Rate Limiting**: Distributed rate limiting for multi-server deployments
- **Adaptive Throttling**: Machine learning-based rate adjustments

## User Experience

### Visual Design

- **Active Filter**: Bright, colored background with white text
- **Inactive Filter**: Subtle gray background with hover effects
- **Icons**: Emoji icons for quick visual recognition
- **Spacing**: Consistent padding and margins

### Interaction Patterns

- **Single Click**: Instant filter application
- **Page Reset**: Automatically returns to page 1 when filter changes
- **State Persistence**: Filter state maintained during session
- **Search Integration**: Filters work with search functionality

### Accessibility

- **ARIA Labels**: Screen reader support for filter buttons
- **Keyboard Navigation**: Tab navigation through filter options
- **Color Contrast**: High contrast ratios for visibility
- **Focus Indicators**: Clear focus states for keyboard users

## API Integration

### Backend Filtering

The filters integrate with the existing `/api/admin/users` endpoint:

```typescript
// Frontend request
const params = {
  page: 1,
  pageSize: 20,
  role: "USER", // Optional filter
  search: "john", // Optional search
};

// Backend query
const where: any = {};
if (role) where.role = role;
if (search)
  where.OR = [
    { email: { contains: search, mode: "insensitive" } },
    { firstName: { contains: search, mode: "insensitive" } },
    { lastName: { contains: search, mode: "insensitive" } },
  ];
```

### Performance Considerations

- **Debounced Search**: 500ms delay prevents excessive API calls
- **Pagination Reset**: Page reset on filter change for consistent UX
- **Loading States**: Visual feedback during data fetching
- **Caching**: Browser caching for improved performance

## Use Cases

### Administrative Tasks

- **User Support**: Quickly find regular users needing assistance
- **Admin Audit**: Review all administrative accounts
- **Staff Management**: Monitor staff permissions and access
- **Bulk Operations**: Select users by role for mass actions

### Business Intelligence

- **User Demographics**: Analyze user distribution by role
- **Growth Tracking**: Monitor admin/staff hiring patterns
- **Access Patterns**: Understand role-based system usage

### Security Management

- **Permission Review**: Audit who has elevated access
- **Role Changes**: Track role transition patterns
- **Access Control**: Verify appropriate role assignments

## Integration with Existing Features

### Search Functionality

- **Combined Filtering**: Search works within role filters
- **Real-time Updates**: Search results update as you type
- **Filter Persistence**: Role filter maintained during search

### Bulk Actions

- **Role-based Selection**: Bulk actions respect current filter
- **Cross-role Operations**: Ability to act across role boundaries
- **Confirmation Dialogs**: Clear confirmation for bulk operations

### Table Display

- **Role Badges**: Visual role indicators in table rows
- **Status Indicators**: Active/suspended status display
- **Action Buttons**: Context-appropriate action buttons

## Future Enhancements

### Advanced Filtering

- **Multi-role Selection**: Filter by multiple roles simultaneously
- **Date Range Filters**: Filter by account creation date
- **Activity Filters**: Filter by last login or activity
- **Custom Filters**: Saved filter presets

### Export Features

- **Filtered Exports**: Export only filtered results
- **Role-based Reports**: Generate reports by role
- **CSV/Excel Output**: Multiple export formats

### Analytics Integration

- **Filter Analytics**: Track which filters are most used
- **Usage Patterns**: Understand admin workflow patterns
- **Performance Metrics**: Monitor filter performance

## Troubleshooting

### Common Issues

- **Filter Not Applying**: Check network connectivity and API status
- **Page Not Resetting**: Manual page navigation may be needed
- **Search Conflicts**: Clear search when changing role filters
- **State Persistence**: Refresh page if filter state seems incorrect

### Debug Steps

1. **Check Network**: Verify API calls are successful
2. **Inspect State**: Confirm role state is updating correctly
3. **Clear Filters**: Reset all filters to isolate issues
4. **Check Permissions**: Ensure admin access is valid

## Best Practices

### User Experience

- **Intuitive Labels**: Clear, descriptive button labels
- **Visual Hierarchy**: Active states clearly distinguishable
- **Responsive Behavior**: Works on all screen sizes
- **Performance**: Fast filter application and results

### Technical Implementation

- **State Management**: Centralized filter state handling
- **Error Handling**: Graceful failure for API errors
- **Loading States**: Clear feedback during operations
- **Accessibility**: WCAG compliance for all interactions

### Maintenance

- **Code Organization**: Clean separation of filter logic
- **Documentation**: Comprehensive inline documentation
- **Testing**: Unit and integration tests for filter functionality
- **Monitoring**: Performance monitoring and error tracking

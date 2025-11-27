# Admin Dashboard - Notification Logs & Audit Trail

## 📧 Overview

This implementation provides a comprehensive admin dashboard for monitoring and auditing all email notifications sent by the Advancia Pay platform. It includes detailed logging, filtering, export capabilities, and admin action tracking for compliance and debugging purposes.

## 🏗️ Architecture

### Backend Components

1. **Database Models** (Prisma Schema)
   - `NotificationLog` - Tracks every email sent by the system
   - `AdminAuditTrail` - Logs all administrative actions

2. **API Routes** (`/backend/src/routes/adminNotificationLogs.ts`)
   - `GET /api/admin/notification-logs` - Fetch logs with filtering
   - `GET /api/admin/notification-logs/export` - Export logs as CSV
   - `GET /api/admin/audit-trail` - Fetch admin audit logs
   - `GET /api/admin/audit-trail/export` - Export audit trail as CSV
   - `GET /api/admin/notification-stats` - Dashboard statistics

3. **Middleware** (`/backend/src/middleware/logAdminAction.ts`)
   - `logAdminAction()` - Utility for logging admin actions
   - `adminAuditMiddleware()` - Automatic action logging middleware
   - `requireAdminOrAuditor()` - Authentication middleware

4. **Enhanced Notification Service** (`/backend/src/services/notificationService.ts`)
   - `logEmailToDatabase()` - Logs every email to NotificationLog table
   - Automatic logging in `sendEmail()` function

### Frontend Components

1. **AdminNotificationLogs.tsx** - Main email logs interface
   - Advanced filtering (email, subject, date range, user, provider, status)
   - Pagination with "load more" functionality
   - CSV export capability
   - Real-time error handling

2. **AdminAuditTrail.tsx** - Admin action tracking
   - Filter by admin, action, target, date range
   - Detailed view of admin activities
   - Export functionality

3. **AdminDashboard.tsx** - Overview dashboard
   - Email delivery statistics
   - Quick action links
   - System health indicators

## 🚀 Features

### Email Logging & Auditing

- **Complete Email Trail**: Every email sent is logged with full details
- **Advanced Filtering**: Search by recipient, subject, date range, provider
- **Export to CSV**: Full data export for compliance reporting
- **Real-time Monitoring**: Live view of email delivery status
- **Provider Tracking**: Support for multiple email providers (Gmail, Resend, SendGrid)

### Admin Audit Trail

- **Action Logging**: Every admin action is automatically tracked
- **Detailed Context**: IP address, user agent, and action details captured
- **Compliance Ready**: Tamper-proof audit logging for regulatory requirements
- **Search & Filter**: Find specific admin actions quickly

### Dashboard Analytics

- **Email Statistics**: Success rates, delivery counts, provider breakdown
- **Real-time Metrics**: Today, week, and month summaries
- **Visual Indicators**: Color-coded status badges and health indicators
- **Quick Access**: Direct links to common admin tasks

## 📊 Database Schema

### NotificationLog Table

```sql
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "template" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'gmail',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### AdminAuditTrail Table

```sql
CREATE TABLE "AdminAuditTrail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Setup Instructions

1. **Install Dependencies**

   ```bash
   cd backend
   npm install json2csv @types/json2csv
   ```

2. **Run Database Migration**

   ```bash
   npx prisma migrate dev --name add_notification_logs_admin_audit
   ```

3. **Update Environment Variables**

   ```bash
   # Enable cron jobs for digest notifications (if needed)
   ENABLE_CRON=true
   ```

4. **Import Components** (Frontend)

   ```typescript
   import AdminNotificationLogs from './components/AdminNotificationLogs';
   import AdminAuditTrail from './components/AdminAuditTrail';
   import AdminDashboard from './components/AdminDashboard';
   ```

## 🔐 Security & Permissions

### Access Control

- **Admin Role Required**: All endpoints require `SUPER_ADMIN`, `FINANCE_ADMIN`, or `SUPPORT_ADMIN` roles
- **JWT Authentication**: Secure token-based authentication
- **IP Tracking**: All admin actions logged with IP addresses

### Data Protection

- **Sensitive Data Masking**: PII is truncated in exports
- **Rate Limiting**: API endpoints are rate-limited
- **Audit Integrity**: Cryptographic signatures for audit trail (future enhancement)

## 📈 Usage Examples

### View Recent Failed Emails

```typescript
GET /api/admin/notification-logs?status=failed&limit=50
```

### Export Today's Email Activity

```typescript
GET /api/admin/notification-logs/export?startDate=2024-01-01
```

### Track Admin Actions

```typescript
GET /api/admin/audit-trail?action=EXPORT&startDate=2024-01-01
```

### Dashboard Statistics

```typescript
GET /api/admin/notification-stats
```

## 🎨 UI Features

### Responsive Design

- **Mobile Optimized**: Works on all screen sizes
- **Dark/Light Themes**: Compatible with theme systems
- **Print Friendly**: Optimized print styles for reports

### User Experience

- **Real-time Loading**: Smooth loading states and error handling
- **Infinite Scroll**: Pagination with "load more" functionality
- **Filter Persistence**: Filters maintain state during navigation
- **Export Progress**: Visual feedback during CSV generation

## 🔍 Troubleshooting

### Common Issues

1. **CSV Export Not Working**
   - Ensure `json2csv` package is installed
   - Check admin permissions for export endpoints

2. **Email Logs Not Appearing**
   - Verify notification service is calling `logEmailToDatabase()`
   - Check database connectivity

3. **Audit Trail Missing Actions**
   - Ensure `adminAuditMiddleware()` is applied to routes
   - Verify admin role permissions

### Error Monitoring

All errors are automatically tracked with Sentry integration:

```typescript
// Errors are captured with context
Sentry.captureException(error, {
  tags: { component: "notification-service" },
  extra: { userId, email, subject }
});
```

## 🚀 Future Enhancements

### Planned Features

1. **Real-time Notifications**: WebSocket updates for new logs
2. **Advanced Analytics**: Charts and graphs for email metrics
3. **Email Content Search**: Full-text search in email bodies
4. **Retention Policies**: Automated cleanup of old logs
5. **Compliance Reports**: Pre-built compliance report templates
6. **API Rate Analytics**: Track API usage by admin

### Integration Opportunities

1. **Slack Notifications**: Alert for failed email deliveries
2. **External SIEM**: Export logs to security information systems
3. **Business Intelligence**: Integration with analytics platforms
4. **Automated Alerting**: Threshold-based notifications

## 📝 Maintenance

### Regular Tasks

- **Weekly**: Review failed email deliveries
- **Monthly**: Export audit logs for compliance
- **Quarterly**: Clean up old notification logs (if retention policy applied)

### Monitoring

- **Email Success Rate**: Should stay above 95%
- **API Response Times**: Monitor endpoint performance
- **Database Growth**: Track log table sizes

---

**🎯 Result**: Complete admin dashboard system for email auditing, compliance monitoring, and administrative oversight with full filtering, export, and tracking capabilities.**

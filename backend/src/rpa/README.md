# RPA Automation Module - Complete Guide

## 📌 Overview

The **RPA (Robotic Process Automation) Module** is a comprehensive automation system built for the Advancia platform. It automates repetitive, rule-based tasks to improve efficiency, reduce errors, and provide 24/7 operation.

---

## 🎯 Implemented Use Cases

### 1. **Transaction Processing Automation** ✅
- **Purpose**: Automatically validate and process pending transactions
- **Features**:
  - Fraud detection with confidence scoring
  - Duplicate transaction detection
  - Balance validation
  - Daily limit enforcement
  - Multi-pattern fraud detection
- **Schedule**: Every 5 minutes (configurable)
- **Endpoint**: `POST /api/rpa/transaction/process`

### 2. **KYC/Identity Verification** ✅
- **Purpose**: Automate document verification using OCR
- **Features**:
  - Passport, driver's license, and national ID support
  - OCR text extraction
  - Field validation (name, date of birth, ID number)
  - Expiration date checking
  - Automatic user approval at 95% confidence
- **Schedule**: Every 10 minutes (configurable)
- **Endpoint**: `POST /api/rpa/kyc/verify`

### 3. **Report Generation** ✅
- **Purpose**: Automatically generate and email financial reports
- **Features**:
  - Daily balance reports
  - Crypto orders reports
  - Admin action reports
  - HTML formatted emails
  - PDF attachment support
- **Schedule**: Daily at 8:00 AM (configurable)
- **Endpoint**: `POST /api/rpa/report/generate`

### 4. **Email/SMS Notifications** ✅
- **Purpose**: Automated notification delivery with rate limiting
- **Features**:
  - Email via Nodemailer (Gmail/SMTP)
  - SMS via Twilio
  - Template-based messaging
  - Priority queue system
  - Rate limiting (10/min email, 5/min SMS)
  - Batch processing
- **Schedule**: Continuous queue processing
- **Endpoint**: `POST /api/rpa/notification/send`

### 5. **Data Backup & Sync** ✅
- **Purpose**: Automated database backups with cloud sync
- **Features**:
  - PostgreSQL pg_dump integration
  - Table-specific JSON exports
  - AWS S3 cloud sync support
  - Retention policy (30 days)
  - Automatic cleanup
- **Schedule**: Daily at 2:00 AM (configurable)
- **Endpoints**: 
  - `POST /api/rpa/backup/create`
  - `POST /api/rpa/backup/export`

### 6. **User Support Automation** ⏳
- **Status**: Pending implementation
- **Planned Features**:
  - AI-powered chatbot
  - FAQ automation
  - Ticket routing
  - Response templates

---

## 🏗️ Architecture

### Directory Structure
```
backend/src/rpa/
├── config.ts                    # Centralized RPA configuration
├── scheduler.ts                 # Main cron scheduler
├── transactionProcessor.ts      # Use case #1
├── kycVerifier.ts               # Use case #2
├── reportGenerator.ts           # Use case #3
├── notificationAutomation.ts    # Use case #4
├── dataBackupSync.ts            # Use case #5
├── routes.ts                    # REST API endpoints
└── index.ts                     # Module exports
```

### Key Components

1. **Scheduler (scheduler.ts)**
   - Uses `node-cron` for task scheduling
   - Manages all RPA tasks
   - Health monitoring
   - Start/stop controls

2. **Configuration (config.ts)**
   - Environment-based settings
   - Feature toggles
   - Schedule intervals
   - API keys & credentials

3. **Routes (routes.ts)**
   - RESTful API for manual triggers
   - Health checks
   - Status monitoring

---

## 🚀 Quick Start

### 1. Environment Setup

Add to your `.env` file:

```bash
# RPA General Settings
RPA_AUTO_START=false              # Auto-start on server boot
RPA_ADMIN_EMAIL=admin@example.com

# Transaction Processing
RPA_TRANSACTION_ENABLED=true
RPA_TRANSACTION_BATCH_SIZE=100
RPA_TRANSACTION_INTERVAL="*/5 * * * *"  # Every 5 minutes

# KYC Verification
RPA_KYC_ENABLED=true
RPA_KYC_OCR_PROVIDER=tesseract
RPA_KYC_API_URL=https://api.kyc-provider.com
RPA_KYC_API_KEY=your-api-key

# Report Generation
RPA_REPORTS_ENABLED=true
RPA_REPORTS_SCHEDULE="0 8 * * *"   # Daily at 8 AM
RPA_REPORTS_EMAIL_TO=reports@example.com
RPA_REPORTS_PDF_ENABLED=false

# Notifications
RPA_NOTIFICATIONS_ENABLED=true
RPA_EMAIL_RATE_LIMIT=10            # Emails per minute
RPA_SMS_RATE_LIMIT=5               # SMS per minute

# Twilio SMS
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Backup & Sync
RPA_BACKUP_ENABLED=true
RPA_BACKUP_SCHEDULE="0 2 * * *"    # Daily at 2 AM
RPA_BACKUP_RETENTION_DAYS=30

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

Required packages:
- `node-cron` - Task scheduling
- `@types/node-cron` - TypeScript definitions
- `nodemailer` - Email sending
- `twilio` - SMS sending

### 3. Start the RPA System

**Option A: Programmatic**
```typescript
import { rpaScheduler } from './rpa';

// Start all automation tasks
await rpaScheduler.start();

// Check status
const status = rpaScheduler.getStatus();
console.log(status);

// Stop all tasks
rpaScheduler.stop();
```

**Option B: API Endpoint**
```bash
# Start RPA scheduler
curl -X POST http://localhost:5000/api/rpa/start

# Check status
curl http://localhost:5000/api/rpa/status

# Stop RPA scheduler
curl -X POST http://localhost:5000/api/rpa/stop
```

**Option C: Auto-start**
Set `RPA_AUTO_START=true` in `.env`

---

## 📡 API Reference

### Base URL
```
http://localhost:5000/api/rpa
```

### Endpoints

#### 1. Health Check
```http
GET /api/rpa/health
```
Returns system health status.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 12345,
  "activeTasks": 5,
  "lastRun": "2025-01-15T10:30:00Z"
}
```

---

#### 2. Get Status
```http
GET /api/rpa/status
```
Returns detailed status of all RPA tasks.

**Response:**
```json
{
  "isRunning": true,
  "tasks": {
    "transactionProcessing": {
      "enabled": true,
      "lastRun": "2025-01-15T10:25:00Z",
      "nextRun": "2025-01-15T10:30:00Z"
    },
    "kycVerification": { ... },
    "reportGeneration": { ... }
  }
}
```

---

#### 3. Start Scheduler
```http
POST /api/rpa/start
```
Starts all enabled RPA tasks.

**Response:**
```json
{
  "success": true,
  "message": "RPA Automation Scheduler started"
}
```

---

#### 4. Stop Scheduler
```http
POST /api/rpa/stop
```
Stops all RPA tasks.

**Response:**
```json
{
  "success": true,
  "message": "RPA Automation Scheduler stopped"
}
```

---

#### 5. Run Specific Task
```http
POST /api/rpa/task/:taskName/run
```
Manually trigger a specific task.

**Parameters:**
- `taskName` - One of: `transactionProcessing`, `kycVerification`, `reportGeneration`, `notificationQueue`, `dataBackup`

**Response:**
```json
{
  "success": true,
  "message": "Task 'transactionProcessing' executed successfully"
}
```

---

#### 6. Process Transaction
```http
POST /api/rpa/transaction/process
Content-Type: application/json

{
  "transactionId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction processed successfully"
}
```

---

#### 7. Verify KYC Document
```http
POST /api/rpa/kyc/verify
Content-Type: application/json

{
  "userId": "uuid-here",
  "documentPath": "/path/to/document.jpg",
  "documentType": "passport"
}
```

**Response:**
```json
{
  "success": true,
  "confidence": 0.95,
  "verified": true,
  "extractedData": {
    "firstName": "John",
    "lastName": "Doe",
    "idNumber": "AB123456",
    "expiryDate": "2030-12-31"
  },
  "warnings": [],
  "errors": []
}
```

---

#### 8. Generate Report
```http
POST /api/rpa/report/generate
Content-Type: application/json

{
  "reportType": "balances",
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Report 'balances' generated successfully"
}
```

---

#### 9. Send Notification
```http
POST /api/rpa/notification/send
Content-Type: application/json

{
  "userId": "uuid-here",
  "type": "email",
  "template": "transaction_alert",
  "data": {
    "amount": 100,
    "transactionId": "abc123"
  },
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "emailSent": true,
  "smsSent": false,
  "errors": []
}
```

---

#### 10. Create Backup
```http
POST /api/rpa/backup/create
```

**Response:**
```json
{
  "success": true,
  "filename": "backup_2025-01-15_10-30-00.sql",
  "size": "25.3 MB",
  "duration": "12.5s"
}
```

---

#### 11. Export Table
```http
POST /api/rpa/backup/export
Content-Type: application/json

{
  "tableName": "users"
}
```

**Response:**
```json
{
  "success": true,
  "filepath": "/backups/users_2025-01-15.json",
  "message": "Table 'users' exported successfully"
}
```

---

## ⚙️ Configuration Details

### Cron Schedule Format
```
 ┌────────────── second (optional, 0-59)
 │ ┌──────────── minute (0-59)
 │ │ ┌────────── hour (0-23)
 │ │ │ ┌──────── day of month (1-31)
 │ │ │ │ ┌────── month (1-12)
 │ │ │ │ │ ┌──── day of week (0-6, Sunday=0)
 │ │ │ │ │ │
 * * * * * *
```

**Examples:**
- `*/5 * * * *` - Every 5 minutes
- `0 8 * * *` - Daily at 8:00 AM
- `0 2 * * *` - Daily at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight

---

## 🔍 Monitoring & Logging

### View Logs
All RPA actions are logged with the `[RPA]` prefix:

```bash
[RPA] Starting batch transaction processing...
[RPA] Found 15 pending transactions
[RPA] Successfully processed transaction abc-123
[RPA] Batch processing complete
```

### Health Check
Monitor RPA health with:
```bash
curl http://localhost:5000/api/rpa/health
```

### Audit Trail
All RPA actions are logged to the `audit_logs` table:
```typescript
{
  action: "transaction_processed",
  resource: "Transaction",
  userId: "transaction-id",
  details: { confidence: 0.95, fraudScore: 0.1 },
  ipAddress: "RPA-System"
}
```

---

## 🛠️ Troubleshooting

### Issue: RPA tasks not running
**Solution:**
1. Check if scheduler is started: `GET /api/rpa/status`
2. Verify environment variables are set
3. Check logs for errors
4. Ensure `RPA_*_ENABLED=true` for desired tasks

### Issue: Email notifications failing
**Solution:**
1. Verify SMTP credentials in `.env`
2. Check Gmail "App Password" if using Gmail
3. Confirm `SMTP_PORT=587` for TLS
4. Test with: `POST /api/rpa/notification/send`

### Issue: SMS not sending
**Solution:**
1. Verify Twilio credentials
2. Check Twilio phone number format (+1234567890)
3. Ensure sufficient Twilio credit
4. Check rate limits (5 SMS/min default)

### Issue: Backup failing
**Solution:**
1. Ensure `pg_dump` is in PATH
2. Verify DATABASE_URL is set
3. Check disk space for backups
4. Review backup directory permissions

---

## 🔐 Security Considerations

1. **Rate Limiting**: All endpoints have rate limits to prevent abuse
2. **Authentication**: Add authentication middleware to RPA routes in production
3. **API Keys**: Store sensitive keys in environment variables
4. **Audit Logging**: All RPA actions are logged for compliance
5. **Data Protection**: Backups should be encrypted and stored securely

---

## 📈 Performance

### Expected Load
- **Transaction Processing**: ~100 transactions per batch (every 5 min)
- **KYC Verification**: ~50 documents per batch (every 10 min)
- **Notifications**: ~600 emails/hour, ~300 SMS/hour
- **Reports**: 3-5 reports/day
- **Backups**: 1 full backup/day

### Resource Usage
- **CPU**: Low (mostly I/O-bound)
- **Memory**: ~50-100 MB per module
- **Disk**: Depends on backup size
- **Network**: Depends on API calls (Twilio, S3, etc.)

---

## 🚀 Future Enhancements

### Planned Features
1. ✅ Transaction Processing - **COMPLETE**
2. ✅ KYC Verification - **COMPLETE**
3. ✅ Report Generation - **COMPLETE**
4. ✅ Notifications - **COMPLETE**
5. ✅ Backup & Sync - **COMPLETE**
6. ⏳ User Support Chatbot - **IN PROGRESS**

### Roadmap
- Machine learning fraud detection
- Real-time anomaly detection
- Multi-language support for chatbot
- Advanced reporting with dashboards
- Blockchain integration for audit trail

---

## 📚 Related Documentation
- [Backend README](../README.md)
- [Prisma Schema](../prisma/schema.prisma)
- [API Routes](./routes.ts)
- [Configuration](./config.ts)

---

## 🤝 Contributing
When adding new RPA modules:
1. Create a new file in `backend/src/rpa/`
2. Export default singleton instance
3. Add configuration to `config.ts`
4. Register task in `scheduler.ts`
5. Add API routes in `routes.ts`
6. Update this README

---

## 📞 Support
For issues or questions about the RPA module:
- Check logs in console
- Review `/api/rpa/health` endpoint
- Consult this documentation
- Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready (except User Support module)

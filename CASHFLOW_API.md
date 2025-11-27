# Cash Flow API Documentation

## Overview

The Cash Flow API provides comprehensive financial analytics, forecasting, and reporting features. It connects real-time transaction data to provide insights into income, expenses, trends, and future projections.

## Base URL

```
Production: https://advancia-backend.onrender.com/api/cashflow
Development: http://localhost:4000/api/cashflow
```

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Cash Flow Data

**GET** `/api/cashflow/:userId`

Retrieve cash flow data with income, expenses, and net calculations grouped by time period.

**Query Parameters:**

- `startDate` (optional): ISO date string (e.g., `2024-01-01`)
- `endDate` (optional): ISO date string (e.g., `2024-12-31`)
- `period` (optional): `daily` | `weekly` | `monthly` | `yearly` (default: `monthly`)
- `category` (optional): Filter by transaction category

**Response:**

```json
{
  "success": true,
  "data": {
    "cashFlow": [
      {
        "period": "2024-01",
        "income": 8500.0,
        "expenses": 6200.0,
        "net": 2300.0
      }
    ],
    "summary": {
      "totalIncome": 102000.0,
      "totalExpenses": 78400.0,
      "netCashFlow": 23600.0,
      "averageIncome": 8500.0,
      "averageExpenses": 6533.33,
      "savingsRate": 23.14,
      "period": "monthly",
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-12-31T23:59:59.999Z"
      }
    }
  }
}
```

---

### 2. Get Cash Flow Forecast

**GET** `/api/cashflow/:userId/forecast`

Generate predictive cash flow forecasts using linear regression on historical data.

**Query Parameters:**

- `periods` (optional): Number of periods to forecast (default: `3`)
- `period` (optional): `daily` | `weekly` | `monthly` | `yearly` (default: `monthly`)

**Response:**

```json
{
  "success": true,
  "data": {
    "historical": [
      {
        "period": "2024-01",
        "income": 8500.0,
        "expenses": 6200.0,
        "net": 2300.0
      }
    ],
    "forecast": [
      {
        "period": "Forecast +1",
        "income": 9200.5,
        "expenses": 6450.25,
        "net": 2750.25,
        "isForecast": true
      }
    ],
    "method": "linear_regression",
    "confidence": "high"
  }
}
```

**Confidence Levels:**

- `high`: 6+ months of historical data
- `medium`: 3-5 months of historical data
- `low`: Less than 3 months of historical data

---

### 3. Get Detailed Cash Flow Report

**GET** `/api/cashflow/:userId/report`

Comprehensive report with category breakdowns, trends, and top spending/earning categories.

**Query Parameters:**

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `period` (optional): `daily` | `weekly` | `monthly` | `yearly`

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalIncome": 102000.0,
      "totalExpenses": 78400.0,
      "transactionCount": 245,
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-12-31T23:59:59.999Z"
      }
    },
    "categoryBreakdown": [
      {
        "name": "Salary",
        "income": 96000.0,
        "expenses": 0.0,
        "net": 96000.0,
        "count": 12
      }
    ],
    "topIncomeCategories": [
      { "name": "Salary", "amount": 96000.0 },
      { "name": "Freelance", "amount": 6000.0 }
    ],
    "topExpenseCategories": [
      { "name": "Housing", "amount": 24000.0 },
      { "name": "Food", "amount": 18000.0 }
    ],
    "monthlyTrends": [
      {
        "period": "2024-01",
        "income": 8500.0,
        "expenses": 6200.0,
        "net": 2300.0
      }
    ],
    "trends": {
      "incomeGrowth": 5.25,
      "expenseGrowth": 2.15
    }
  }
}
```

---

### 4. Export Cash Flow to CSV

**GET** `/api/cashflow/:userId/export/csv`

Download cash flow data as CSV file.

**Query Parameters:**

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `period` (optional): `daily` | `weekly` | `monthly` | `yearly`

**Response:**

- Content-Type: `text/csv`
- File download with filename: `cashflow-{userId}-{timestamp}.csv`

**CSV Format:**

```csv
period,income,expenses,net
2024-01,8500.00,6200.00,2300.00
2024-02,9200.00,6800.00,2400.00
```

---

### 5. Export Cash Flow to PDF

**GET** `/api/cashflow/:userId/export/pdf`

Generate professional PDF report with charts and summary statistics.

**Query Parameters:**

- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `period` (optional): `daily` | `weekly` | `monthly` | `yearly`

**Response:**

- Content-Type: `application/pdf`
- File download with filename: `cashflow-{userId}-{timestamp}.pdf`

**PDF Contents:**

- Header with user info and date range
- Summary statistics (total income, expenses, net, savings rate)
- Detailed transaction table
- Footer with generation timestamp

---

### 6. Get Categories Breakdown

**GET** `/api/cashflow/:userId/categories`

List all transaction categories with income/expense totals.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "category": "Salary",
      "income": 96000.0,
      "expenses": 0.0,
      "net": 96000.0,
      "count": 12
    },
    {
      "category": "Housing",
      "income": 0.0,
      "expenses": 24000.0,
      "net": -24000.0,
      "count": 12
    }
  ]
}
```

---

### 7. Admin: Get All Users Summary

**GET** `/api/cashflow/admin/summary`

**Requires Admin Role**

Get cash flow summary for all users in the system.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid-1",
      "username": "john_doe",
      "email": "john@example.com",
      "totalIncome": 102000.0,
      "totalExpenses": 78400.0,
      "netCashFlow": 23600.0,
      "transactionCount": 245
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Frontend Integration

### Using the API Client

```typescript
import { cashFlowAPI } from "@/lib/api/cashflow";

// Get cash flow data
const data = await cashFlowAPI.getCashFlow(userId, {
  period: "monthly",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
});

// Get forecast
const forecast = await cashFlowAPI.getForecast(userId, 3, "monthly");

// Export to CSV
const csvBlob = await cashFlowAPI.exportToCSV(userId, { period: "monthly" });
cashFlowAPI.downloadBlob(csvBlob, "cashflow.csv");

// Export to PDF
const pdfBlob = await cashFlowAPI.exportToPDF(userId, { period: "monthly" });
cashFlowAPI.downloadBlob(pdfBlob, "cashflow.pdf");
```

---

## Features

### ✅ Real-time Data

- Connects directly to transaction database
- No caching delays
- Instant updates on new transactions

### ✅ Flexible Grouping

- Daily, weekly, monthly, or yearly periods
- Custom date ranges
- Category-based filtering

### ✅ Forecasting

- Linear regression predictions
- Confidence scoring based on data history
- Multiple period forecasts

### ✅ Export Options

- CSV for spreadsheet analysis
- PDF for professional reports
- Automatic file downloads

### ✅ Analytics

- Category breakdowns
- Trend analysis (income/expense growth)
- Top spending/earning categories
- Savings rate calculations

### ✅ Security

- JWT authentication required
- User-scoped data access
- Admin-only endpoints for system-wide data

---

## Best Practices

1. **Cache Frontend Data**: Store API responses in React state to avoid unnecessary requests
2. **Use Loading States**: Show spinners during API calls
3. **Handle Errors Gracefully**: Display user-friendly error messages
4. **Debounce Period Changes**: Wait for user to finish selecting before fetching
5. **Progressive Loading**: Load summary first, then detailed data
6. **Offline Support**: Cache recent data for offline viewing

---

## Rate Limits

- **Standard Users**: 300 requests per minute per user
- **Admin Users**: 1000 requests per minute
- **Export Endpoints**: 10 exports per minute per user

---

## Support

For issues or questions:

- Email: <support@advanciapayledger.com>
- Slack: #backend-support
- Documentation: <https://docs.advanciapayledger.com>

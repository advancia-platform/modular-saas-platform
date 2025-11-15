# User Transactions Dashboard

## Overview

The user transactions dashboard provides users with a complete view of their payment history across both Stripe and Cryptomus payment providers.

## Features

- **Complete Transaction History**: View all payments made through the platform
- **Multi-Provider Support**: Shows transactions from both Stripe and Cryptomus
- **Detailed Information**: Order ID, provider, amount, currency, status, and timestamp
- **Real-time Updates**: Transactions appear immediately after payment completion
- **Responsive Design**: Works on desktop and mobile devices

## Access

- **URL**: `/dashboard/transactions`
- **Navigation**: Available from the main dashboard
- **Authentication**: Requires user login

## API Endpoints

### GET `/api/transactions`

Fetches transaction history for the authenticated user.

**Query Parameters:**

- `userId` (string): User ID to fetch transactions for

**Response:**

```json
[
  {
    "id": "transaction-uuid",
    "orderId": "order-12345",
    "provider": "stripe",
    "amount": 29.99,
    "currency": "USD",
    "status": "completed",
    "createdAt": "2025-01-15T10:30:00Z",
    "description": "Payment via stripe - Order: order-12345"
  }
]
```

## Database Schema

Transactions are stored in the `Transaction` table with the following fields:

- `id`: Unique transaction ID
- `userId`: User who made the payment
- `orderId`: Unique order identifier (unique constraint)
- `provider`: Payment provider (stripe/cryptomus)
- `amount`: Transaction amount
- `currency`: Currency code (USD, USDT, etc.)
- `type`: Transaction type (credit/debit)
- `status`: Transaction status (completed, pending, failed)
- `description`: Human-readable description
- `category`: Transaction category
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Usage Examples

### Viewing Transaction History

```tsx
import Link from "next/link";

// In your dashboard navigation
<Link href="/dashboard/transactions">📊 View Transaction History</Link>;
```

### Integration with Payment Components

```tsx
import { PaymentButton } from "@/components/PaymentButton";

// After successful payment, redirect to transactions
<PaymentButton
  amount={29.99}
  currency="USD"
  description="Premium Subscription"
  onSuccess={(orderId) => router.push("/dashboard/transactions")}
/>;
```

## Status Indicators

- **Completed/Confirmed**: Green badge - Payment successful
- **Pending**: Yellow badge - Payment processing
- **Failed/Cancelled**: Red badge - Payment failed

## Provider Badges

- **Stripe**: Blue badge
- **Cryptomus**: Green badge
- **Other**: Gray badge

## Error Handling

- **No Transactions**: Shows empty state with call-to-action
- **Loading States**: Spinner during data fetch
- **Error States**: User-friendly error messages with retry options

## Security

- **User Isolation**: Users can only see their own transactions
- **Authentication Required**: All API calls require valid authentication
- **Input Validation**: All parameters validated server-side

## Performance

- **Pagination**: Limited to 50 most recent transactions
- **Caching**: Consider implementing caching for frequently accessed data
- **Indexing**: Database indexed on userId, orderId, and createdAt

## Future Enhancements

- **Export Functionality**: CSV/PDF export of transaction history
- **Filtering**: Filter by date range, provider, status
- **Search**: Search by order ID or description
- **Receipts**: Downloadable payment receipts
- **Notifications**: Email receipts for completed payments

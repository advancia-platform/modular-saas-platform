# 🔐 Crypto Withdrawal Flow & Admin Approval System

**Date**: November 8, 2025  
**Platform**: Advancia Pay Ledger  
**Purpose**: Document crypto withdrawal process with admin confirmation

---

## 🎯 Overview

The platform implements a **2-step crypto withdrawal system**:

1. **User requests withdrawal** → Funds locked, status: `pending`
2. **Admin reviews & approves** → Crypto sent to user wallet, status: `completed`

This ensures **admin has full control** over crypto outflows and can verify all withdrawal requests before processing.

---

## 💰 Supported Currencies

| Currency | Type | Admin Wallet Required | User Provides |
|----------|------|----------------------|---------------|
| **BTC** | Bitcoin | ✅ Yes | Wallet address |
| **ETH** | Ethereum | ✅ Yes | Wallet address |
| **USDT** | Tether (Stablecoin) | ✅ Yes | Wallet address |
| **USD** | Fiat (Bank transfer) | ⚠️ Bank account | Bank details |

---

## 🔄 Complete Withdrawal Flow

### **Step 1: User Initiates Withdrawal Request**

**Endpoint**: `POST /api/withdrawals/request`

**User Action**:
```bash
# User requests to withdraw 0.5 BTC
curl -X POST http://localhost:4000/api/withdrawals/request \
  -H "Authorization: Bearer <user-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "balanceType": "BTC",
    "amount": 0.5,
    "withdrawalAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "notes": "Withdraw to my Coinbase wallet"
  }'
```

**Backend Process**:
1. ✅ Validates user has sufficient balance
2. ✅ Validates crypto address format
3. ✅ **Deducts balance immediately** (funds locked)
4. ✅ Creates `CryptoWithdrawal` record with `status: "pending"`
5. ✅ Creates `Transaction` record with `status: "pending"`
6. ✅ Notifies all admins via Socket.IO (`new-withdrawal-request` event)

**Response**:
```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "withdrawal": {
    "id": "uuid-here",
    "balanceType": "BTC",
    "amount": 0.5,
    "status": "pending",
    "createdAt": "2025-11-08T12:00:00Z"
  }
}
```

**Database Changes**:
```sql
-- User balance reduced IMMEDIATELY
UPDATE users 
SET btcBalance = btcBalance - 0.5 
WHERE id = 'user-id';

-- Withdrawal request created
INSERT INTO CryptoWithdrawal (
  userId, cryptoType, cryptoAmount, withdrawalAddress, status
) VALUES (
  'user-id', 'BTC', 0.5, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'pending'
);

-- Transaction recorded
INSERT INTO Transaction (
  userId, amount, type, category, status, description
) VALUES (
  'user-id', 0.5, 'withdrawal', 'withdrawal_request', 'pending',
  'Withdrawal request for 0.5 BTC'
);
```

---

### **Step 2: Admin Receives Notification**

**Socket.IO Event**: `new-withdrawal-request`

**Admin Dashboard** receives real-time notification:
```javascript
socket.on('new-withdrawal-request', (data) => {
  // {
  //   withdrawalId: "uuid",
  //   userId: "user-id",
  //   userEmail: "user@example.com",
  //   balanceType: "BTC",
  //   amount: 0.5
  // }
  
  // Show notification banner
  showAdminNotification({
    title: "New Withdrawal Request",
    message: `${data.userEmail} wants to withdraw ${data.amount} ${data.balanceType}`,
    action: "Review Now"
  });
});
```

---

### **Step 3: Admin Reviews Withdrawal**

**Endpoint**: `GET /api/withdrawals/admin/all`

**Admin Dashboard View**:
```bash
curl -X GET "http://localhost:4000/api/withdrawals/admin/all?status=pending" \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "x-admin-key: advancia-admin-key-2025"
```

**Response**:
```json
{
  "withdrawals": [
    {
      "id": "withdrawal-uuid",
      "cryptoType": "BTC",
      "cryptoAmount": "0.5",
      "withdrawalAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "status": "pending",
      "createdAt": "2025-11-08T12:00:00Z",
      "user": {
        "id": "user-id",
        "email": "user@example.com",
        "username": "john_doe"
      }
    }
  ]
}
```

**Admin Checks**:
- ✅ User identity verification
- ✅ Withdrawal amount is reasonable
- ✅ Wallet address is valid
- ✅ No suspicious activity
- ✅ User account in good standing

---

### **Step 4A: Admin Approves Withdrawal**

**⚠️ CRITICAL: Admin Must Send Crypto FIRST, Then Approve**

**Manual Process** (Admin performs this externally):
1. 🔐 Admin opens their crypto wallet (e.g., Coinbase, Binance, Hardware wallet)
2. 💸 Admin sends 0.5 BTC to user's address: `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`
3. ⏳ Admin waits for blockchain confirmation (1-6 confirmations)
4. 📋 Admin copies transaction hash (e.g., `abc123def456...`)

**Then Admin Approves in Platform**:

**Endpoint**: `PATCH /api/withdrawals/admin/:id`

```bash
curl -X PATCH http://localhost:4000/api/withdrawals/admin/withdrawal-uuid \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "x-admin-key: advancia-admin-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "txHash": "abc123def456...",
    "networkFee": 0.0001,
    "adminNotes": "Sent via Coinbase. Confirmed 3 blocks."
  }'
```

**Backend Process**:
1. ✅ Updates withdrawal status to `completed`
2. ✅ Records transaction hash (blockchain proof)
3. ✅ Records network fee
4. ✅ Updates transaction to `completed`
5. ✅ **Does NOT refund user** (already deducted in Step 1)
6. ✅ Notifies user via Socket.IO (`withdrawal-approved` event)
7. ✅ Creates audit log

**Response**:
```json
{
  "success": true,
  "message": "Withdrawal approved successfully",
  "withdrawal": {
    "id": "withdrawal-uuid",
    "cryptoType": "BTC",
    "cryptoAmount": "0.5",
    "status": "completed",
    "txHash": "abc123def456...",
    "approvedAt": "2025-11-08T12:30:00Z",
    "completedAt": "2025-11-08T12:30:00Z"
  }
}
```

**Database Updates**:
```sql
-- Mark withdrawal completed
UPDATE CryptoWithdrawal 
SET 
  status = 'completed',
  adminApprovedBy = 'admin-id',
  txHash = 'abc123def456...',
  networkFee = 0.0001,
  adminNotes = 'Sent via Coinbase. Confirmed 3 blocks.',
  approvedAt = NOW(),
  completedAt = NOW()
WHERE id = 'withdrawal-uuid';

-- Update transaction
UPDATE Transaction
SET 
  status = 'completed',
  description = 'Withdrawal approved: 0.5 BTC'
WHERE userId = 'user-id' 
  AND type = 'withdrawal' 
  AND amount = 0.5
  AND status = 'pending';

-- Create audit log
INSERT INTO AuditLog (
  userId, action, resourceType, resourceId, metadata
) VALUES (
  'admin-id', 'approve_withdrawal', 'withdrawal', 'withdrawal-uuid',
  '{"userId":"user-id","balanceType":"BTC","amount":"0.5","txHash":"abc123..."}'
);
```

**User Notification** (Socket.IO):
```javascript
socket.on('withdrawal-approved', (data) => {
  // {
  //   withdrawalId: "uuid",
  //   balanceType: "BTC",
  //   amount: "0.5",
  //   txHash: "abc123def456..."
  // }
  
  showSuccessNotification({
    title: "Withdrawal Approved! 🎉",
    message: `Your ${data.amount} ${data.balanceType} has been sent!`,
    txHash: data.txHash,
    viewOnBlockchain: `https://blockchain.info/tx/${data.txHash}`
  });
});
```

---

### **Step 4B: Admin Rejects Withdrawal**

**Reasons for Rejection**:
- 🚫 Suspicious activity
- 🚫 Invalid wallet address
- 🚫 Compliance issues
- 🚫 User account flagged

**Endpoint**: `PATCH /api/withdrawals/admin/:id`

```bash
curl -X PATCH http://localhost:4000/api/withdrawals/admin/withdrawal-uuid \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "x-admin-key: advancia-admin-key-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "adminNotes": "Invalid wallet address format. Please verify and resubmit."
  }'
```

**Backend Process**:
1. ✅ Updates withdrawal status to `rejected`
2. ✅ **REFUNDS user balance** (returns locked funds)
3. ✅ Updates transaction to `failed`
4. ✅ Notifies user via Socket.IO (`withdrawal-rejected` event)
5. ✅ Creates audit log

**Response**:
```json
{
  "success": true,
  "message": "Withdrawal rejected and balance refunded",
  "withdrawal": {
    "id": "withdrawal-uuid",
    "cryptoType": "BTC",
    "cryptoAmount": "0.5",
    "status": "rejected",
    "rejectedAt": "2025-11-08T12:30:00Z"
  }
}
```

**Database Updates**:
```sql
-- REFUND user balance
UPDATE users 
SET btcBalance = btcBalance + 0.5 
WHERE id = 'user-id';

-- Mark withdrawal rejected
UPDATE CryptoWithdrawal 
SET 
  status = 'rejected',
  adminApprovedBy = 'admin-id',
  adminNotes = 'Invalid wallet address format. Please verify and resubmit.',
  rejectedAt = NOW()
WHERE id = 'withdrawal-uuid';

-- Update transaction to failed
UPDATE Transaction
SET 
  status = 'failed',
  description = 'Withdrawal rejected: 0.5 BTC. Reason: Invalid wallet address format.'
WHERE userId = 'user-id' 
  AND type = 'withdrawal' 
  AND amount = 0.5
  AND status = 'pending';

-- Audit log
INSERT INTO AuditLog (
  userId, action, resourceType, resourceId, metadata
) VALUES (
  'admin-id', 'reject_withdrawal', 'withdrawal', 'withdrawal-uuid',
  '{"userId":"user-id","balanceType":"BTC","amount":"0.5","refunded":true}'
);
```

**User Notification** (Socket.IO):
```javascript
socket.on('withdrawal-rejected', (data) => {
  // {
  //   withdrawalId: "uuid",
  //   balanceType: "BTC",
  //   amount: "0.5",
  //   reason: "Invalid wallet address format..."
  // }
  
  showWarningNotification({
    title: "Withdrawal Rejected",
    message: data.reason,
    action: "Your balance has been refunded. Please try again."
  });
});
```

---

## 🔐 Admin Wallet Configuration

**⚠️ CRITICAL REQUIREMENT**: Admin must have crypto wallets configured

### **Required Admin Wallets**

```env
# backend/.env (Admin Configuration)

# Bitcoin Wallet (for BTC withdrawals)
ADMIN_BTC_WALLET_ADDRESS="1AdminBTCWalletAddressHere..."
ADMIN_BTC_PRIVATE_KEY="<encrypted-private-key>"  # ⚠️ Keep secure!

# Ethereum Wallet (for ETH/USDT withdrawals)
ADMIN_ETH_WALLET_ADDRESS="0xAdminEthWalletAddressHere..."
ADMIN_ETH_PRIVATE_KEY="<encrypted-private-key>"  # ⚠️ Keep secure!

# Optional: Admin wallet provider (Coinbase, Binance API, etc.)
CRYPTO_PROVIDER="manual"  # Options: manual, coinbase, binance
COINBASE_API_KEY="<api-key>"
COINBASE_API_SECRET="<api-secret>"
```

### **Payment Flow Options**

#### **Option 1: Manual Payment** (Current Implementation)
1. User requests withdrawal
2. Admin receives notification
3. **Admin manually sends crypto** from their personal wallet (Coinbase, hardware wallet, etc.)
4. Admin enters transaction hash in platform
5. Platform marks withdrawal complete

**Pros**: ✅ Simple, no API integrations, maximum security  
**Cons**: ❌ Manual work for admin, slower processing

---

#### **Option 2: Automated Payment** (Recommended for Scale)
1. User requests withdrawal
2. Admin receives notification
3. **Admin clicks "Approve" → Platform auto-sends crypto** via Coinbase/Binance API
4. Platform records transaction hash automatically
5. User receives crypto instantly

**Implementation Required**:
```typescript
// backend/src/services/cryptoPayment.ts (NEW FILE NEEDED)

import Coinbase from 'coinbase-node';

export async function sendCryptoPayment(
  cryptoType: 'BTC' | 'ETH' | 'USDT',
  amount: number,
  toAddress: string
) {
  const client = new Coinbase.Client({
    apiKey: process.env.COINBASE_API_KEY,
    apiSecret: process.env.COINBASE_API_SECRET
  });
  
  const account = await client.getAccount('primary');
  
  const transaction = await account.sendMoney({
    to: toAddress,
    amount: amount.toString(),
    currency: cryptoType
  });
  
  return {
    txHash: transaction.network.hash,
    networkFee: transaction.network.transaction_fee.amount
  };
}
```

**Pros**: ✅ Fast, automated, scalable  
**Cons**: ❌ Requires API setup, higher security risk

---

## 🛡️ Security Measures

### **1. Balance Locking**
✅ User balance deducted **immediately** on withdrawal request  
✅ Prevents double-spending  
✅ Funds locked until admin approval/rejection  

### **2. Admin Verification Required**
✅ All withdrawals require admin approval  
✅ Admin can review user history before approving  
✅ Two-level auth: JWT token + ADMIN_KEY header  

### **3. Audit Logging**
✅ Every approval/rejection logged in `AuditLog` table  
✅ Records admin ID, timestamp, metadata  
✅ Immutable audit trail for compliance  

### **4. Transaction Hash Verification**
✅ Admin must provide blockchain transaction hash  
✅ Platform stores hash for verification  
✅ Users can verify on blockchain explorer  

### **5. Network Fee Tracking**
✅ Admin records actual network fee paid  
✅ Transparent fee accounting  
✅ Can be used for fee reimbursement logic  

---

## 📊 Withdrawal Status States

| Status | Description | User Balance | Can Cancel? | Admin Action |
|--------|-------------|--------------|-------------|--------------|
| **pending** | Awaiting admin review | ❌ Deducted (locked) | ❌ No | Review needed |
| **completed** | Crypto sent to user | ❌ Deducted (final) | ❌ No | Approved ✅ |
| **rejected** | Admin denied request | ✅ Refunded | ❌ No | Rejected ❌ |
| **cancelled** | User cancelled (future) | ✅ Refunded | N/A | N/A |

---

## 🔍 User Withdrawal History

**Endpoint**: `GET /api/withdrawals/my-requests`

**User Dashboard**:
```bash
curl -X GET http://localhost:4000/api/withdrawals/my-requests \
  -H "Authorization: Bearer <user-jwt-token>"
```

**Response**:
```json
{
  "withdrawals": [
    {
      "id": "uuid-1",
      "cryptoType": "BTC",
      "cryptoAmount": "0.5",
      "withdrawalAddress": "1A1zP1...",
      "status": "completed",
      "adminNotes": "Sent via Coinbase. Confirmed 3 blocks.",
      "txHash": "abc123def456...",
      "createdAt": "2025-11-08T12:00:00Z",
      "approvedAt": "2025-11-08T12:30:00Z",
      "completedAt": "2025-11-08T12:30:00Z"
    },
    {
      "id": "uuid-2",
      "cryptoType": "ETH",
      "cryptoAmount": "2.0",
      "withdrawalAddress": "0x742d35...",
      "status": "pending",
      "createdAt": "2025-11-08T14:00:00Z"
    }
  ]
}
```

---

## ⚠️ Current Limitations & Missing Features

### **1. No Admin Wallet Address Storage**
❌ Admin crypto wallet addresses not stored in database  
❌ No validation that admin actually owns receiving wallet  

**Recommended Fix**:
```sql
-- Add admin wallet addresses to AdminSettings table
ALTER TABLE AdminSettings 
ADD COLUMN btcWalletAddress VARCHAR(64),
ADD COLUMN ethWalletAddress VARCHAR(64),
ADD COLUMN usdtWalletAddress VARCHAR(64);
```

### **2. No Intermediate Admin Wallet**
❌ User payment currently goes directly to their wallet  
❌ No admin escrow wallet for verification  

**Your Request**: "crypto should go to admin wallet then show payment successful admin can now send to user"

**Implementation Needed**:
```typescript
// New flow:
// 1. User requests withdrawal
// 2. Admin receives crypto FROM USER (if deposit scenario)
// 3. OR: Admin sends crypto TO ADMIN WALLET first (escrow)
// 4. Admin verifies funds in admin wallet
// 5. Admin then sends from admin wallet to user
// 6. Mark complete with TWO transaction hashes:
//    - adminWalletTxHash (user → admin OR admin deposit)
//    - userWalletTxHash (admin → user)
```

### **3. No Automatic Blockchain Verification**
❌ Transaction hash not auto-verified on blockchain  
❌ Admin could provide fake transaction hash  

**Recommended Fix**:
```typescript
// Use blockchain API to verify transaction
import { BlockCypher } from 'blockcypher';

async function verifyBitcoinTransaction(txHash: string, expectedAmount: number, expectedAddress: string) {
  const api = new BlockCypher({ token: process.env.BLOCKCYPHER_API_KEY });
  const tx = await api.getTX({ hash: txHash });
  
  // Verify outputs match expected amount and address
  const matchingOutput = tx.outputs.find(out => 
    out.addresses.includes(expectedAddress) && 
    out.value >= expectedAmount * 1e8  // Convert BTC to satoshis
  );
  
  return !!matchingOutput;
}
```

### **4. No Token Withdrawal Admin Approval**
⚠️ `tokens.ts` `/withdraw` endpoint **DOES NOT require admin approval**  
⚠️ User can withdraw tokens directly without admin review  

**Security Risk**: Users could drain tokens without oversight

**Fix Needed**:
```typescript
// In tokens.ts - Change withdraw to create pending request
router.post("/withdraw", authenticateToken as any, async (req, res) => {
  // Instead of processing immediately:
  // 1. Create WithdrawalRequest with status: "pending"
  // 2. Notify admins
  // 3. Wait for admin approval (like crypto withdrawals)
  
  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      userId,
      type: 'TOKEN',
      amount: withdrawAmount,
      toAddress,
      status: 'pending'
    }
  });
  
  // Admin must approve before tokens actually sent
});
```

### **5. No Deposit Flow for Crypto**
❌ Users can withdraw but cannot deposit BTC/ETH/USDT  
❌ No way to show "deposit to this address" for users  

**Missing Feature**:
```typescript
// POST /api/crypto/deposit-address
// Generate unique deposit address for user
router.post('/deposit-address', authenticateToken, async (req, res) => {
  const { cryptoType } = req.body;
  
  // Generate unique address for user (via Coinbase API or HD wallet)
  const depositAddress = await generateDepositAddress(req.user.userId, cryptoType);
  
  res.json({
    cryptoType,
    depositAddress,
    qrCode: `data:image/png;base64,${generateQRCode(depositAddress)}`,
    instructions: "Send crypto to this address. Funds will appear after 3 confirmations."
  });
});
```

---

## ✅ Implementation Checklist

### **Completed Features**
- [x] User withdrawal request endpoint
- [x] Admin approval/rejection endpoint
- [x] Balance locking on request
- [x] Balance refund on rejection
- [x] Transaction hash storage
- [x] Socket.IO real-time notifications
- [x] Audit logging
- [x] Multi-currency support (BTC, ETH, USDT, USD)

### **Missing/Needs Implementation**
- [ ] Admin wallet address configuration in database
- [ ] Admin escrow wallet (crypto goes to admin first)
- [ ] Blockchain transaction verification
- [ ] Token withdrawal admin approval (currently auto-processes)
- [ ] Crypto deposit flow for users
- [ ] Automated crypto payment via Coinbase/Binance API
- [ ] Withdrawal limits & daily caps
- [ ] KYC verification before withdrawal
- [ ] Email notifications (currently only Socket.IO)
- [ ] SMS notifications for large withdrawals
- [ ] Withdrawal fee calculation
- [ ] Multi-signature wallet support
- [ ] Cold wallet integration for large amounts

---

## 🚀 Recommended Implementation: Admin Escrow Flow

**Your Requirement**: "payment like crypto should go to admin wallet then show payment successful admin can now send to user"

### **New Flow Design**

```
USER WITHDRAWAL REQUEST
         ↓
    PENDING STATUS
         ↓
   ADMIN REVIEWS
         ↓
 ADMIN SENDS CRYPTO TO → ADMIN ESCROW WALLET
         ↓
  PLATFORM DETECTS DEPOSIT (webhook/polling)
         ↓
 PLATFORM SHOWS: "✅ Payment Received in Admin Wallet"
         ↓
   ADMIN CLICKS: "Send to User"
         ↓
 PLATFORM SENDS FROM → ADMIN WALLET → USER WALLET
         ↓
   STATUS: COMPLETED
```

### **Database Schema Updates Needed**

```sql
-- Add admin wallet transaction tracking
CREATE TABLE AdminWalletTransaction (
  id UUID PRIMARY KEY,
  withdrawalId UUID REFERENCES CryptoWithdrawal(id),
  direction VARCHAR(10), -- 'incoming' or 'outgoing'
  cryptoType VARCHAR(10),
  amount DECIMAL,
  fromAddress VARCHAR(100),
  toAddress VARCHAR(100),
  txHash VARCHAR(100),
  confirmations INT DEFAULT 0,
  status VARCHAR(20), -- 'pending', 'confirmed', 'failed'
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Update CryptoWithdrawal model
ALTER TABLE CryptoWithdrawal
ADD COLUMN adminWalletTxHash VARCHAR(100),  -- Transaction to admin wallet
ADD COLUMN userWalletTxHash VARCHAR(100),   -- Transaction to user wallet
ADD COLUMN fundsInAdminWallet BOOLEAN DEFAULT false;
```

### **New API Endpoints Needed**

```typescript
// 1. Admin confirms funds received in escrow wallet
POST /api/withdrawals/admin/:id/confirm-escrow
{
  "txHash": "admin-wallet-incoming-tx-hash",
  "confirmations": 3
}

// 2. Admin sends from escrow to user
POST /api/withdrawals/admin/:id/send-to-user
{
  "txHash": "admin-to-user-tx-hash",
  "networkFee": 0.0001
}
```

---

## 📞 Summary

### **What's Working**
✅ User withdrawal requests with balance locking  
✅ Admin approval/rejection system  
✅ Transaction hash recording  
✅ Real-time notifications  
✅ Audit logging  

### **What's Missing (Critical)**
⚠️ Admin escrow wallet flow (crypto to admin first)  
⚠️ Token withdrawal admin approval  
⚠️ Blockchain transaction verification  
⚠️ Crypto deposit functionality  

### **Next Steps**
1. Configure admin crypto wallet addresses
2. Implement admin escrow flow (2-step: admin wallet → user wallet)
3. Add blockchain verification API
4. Require admin approval for token withdrawals
5. Build crypto deposit system for users

---

**Last Updated**: November 8, 2025  
**Status**: Withdrawal system 70% complete, needs admin escrow implementation

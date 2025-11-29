# E-Wallet & Crypto Payment Architecture

## Overview

This document describes the distributed e-wallet system and cryptocurrency payment gateway architecture for Advancia Pay Ledger.

---

## 1. E-Wallet Architecture

### 1.1 Wallet Types

```
┌─────────────────────────────────────────────────────────────┐
│                      USER WALLET SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   FIAT       │  │   CRYPTO     │  │   REWARD     │       │
│  │   Wallet     │  │   Wallet     │  │   Wallet     │       │
│  │              │  │              │  │              │       │
│  │  • USD       │  │  • BTC       │  │  • Points    │       │
│  │  • EUR       │  │  • ETH       │  │  • Cashback  │       │
│  │  • GBP       │  │  • USDT      │  │  • Bonuses   │       │
│  │              │  │  • USDC      │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Database Schema

```prisma
model TokenWallet {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])

  // Fiat balances (Decimal for precision)
  balanceUSD      Decimal  @default(0) @db.Decimal(18, 8)
  balanceEUR      Decimal  @default(0) @db.Decimal(18, 8)

  // Crypto balances
  balanceBTC      Decimal  @default(0) @db.Decimal(18, 8)
  balanceETH      Decimal  @default(0) @db.Decimal(18, 8)
  balanceUSDT     Decimal  @default(0) @db.Decimal(18, 8)

  // Pending amounts (in transit)
  pendingDeposit  Decimal  @default(0) @db.Decimal(18, 8)
  pendingWithdraw Decimal  @default(0) @db.Decimal(18, 8)

  // Wallet addresses (encrypted)
  btcAddress      String?  // Encrypted
  ethAddress      String?  // Encrypted

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### 1.3 Wallet Operations

```typescript
// Atomic balance operations with pessimistic locking
async function debitWallet(userId: string, currency: Currency, amount: Decimal, txId: string): Promise<WalletOperation> {
  return await prisma.$transaction(
    async (tx) => {
      // Lock wallet row
      const wallet = await tx.tokenWallet.findUnique({
        where: { userId },
      });

      // Check sufficient balance
      const balance = wallet[`balance${currency}`];
      if (balance.lessThan(amount)) {
        throw new InsufficientBalanceError(currency, balance, amount);
      }

      // Debit balance
      await tx.tokenWallet.update({
        where: { userId },
        data: {
          [`balance${currency}`]: { decrement: amount },
        },
      });

      // Record transaction
      return await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          currency,
          amount,
          txId,
          status: "COMPLETED",
        },
      });
    },
    {
      isolationLevel: "Serializable", // Prevent race conditions
    },
  );
}
```

---

## 2. Crypto Payment Gateway Flow

### 2.1 Payment Flow Diagram

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────────┐
│  User    │    │ Frontend │    │  Backend  │    │ Crypto       │
│  Browser │    │ (Next.js)│    │ (Express) │    │ Provider     │
└────┬─────┘    └────┬─────┘    └─────┬─────┘    │(Cryptomus/   │
     │               │                │          │ NOWPayments) │
     │               │                │          └──────┬───────┘
     │ 1. Select     │                │                 │
     │    Crypto     │                │                 │
     │───────────────>                │                 │
     │               │                │                 │
     │               │ 2. Create      │                 │
     │               │    Payment     │                 │
     │               │───────────────>│                 │
     │               │                │ 3. Create       │
     │               │                │    Invoice      │
     │               │                │────────────────>│
     │               │                │                 │
     │               │                │ 4. Payment URL  │
     │               │                │<────────────────│
     │               │ 5. Invoice     │                 │
     │               │<───────────────│                 │
     │ 6. Show QR    │                │                 │
     │<───────────────                │                 │
     │               │                │                 │
     │ 7. User pays  │                │                 │
     │    on-chain   │                │                 │
     │───────────────────────────────────────────────────>
     │               │                │                 │
     │               │                │ 8. Webhook      │
     │               │                │<────────────────│
     │               │                │                 │
     │               │                │ 9. Verify &     │
     │               │                │    Credit       │
     │               │                │    Wallet       │
     │               │                │                 │
     │               │ 10. Socket.io  │                 │
     │               │<───────────────│                 │
     │ 11. Success   │                │                 │
     │<───────────────                │                 │
```

### 2.2 Payment States

```typescript
enum CryptoPaymentStatus {
  CREATED = "created", // Invoice created
  PENDING = "pending", // Awaiting blockchain confirmation
  CONFIRMING = "confirming", // 1-3 confirmations
  CONFIRMED = "confirmed", // Sufficient confirmations
  COMPLETED = "completed", // Credited to wallet
  EXPIRED = "expired", // Payment window expired
  FAILED = "failed", // Payment failed
  REFUNDED = "refunded", // Refund processed
}
```

### 2.3 Provider Integration

```typescript
// backend/src/services/cryptoPaymentService.ts

interface CryptoPaymentProvider {
  createInvoice(params: CreateInvoiceParams): Promise<Invoice>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  verifyWebhook(payload: unknown, signature: string): boolean;
}

class CryptomusProvider implements CryptoPaymentProvider {
  async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
    const response = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: process.env.CRYPTOMUS_MERCHANT_ID!,
        sign: this.generateSignature(params),
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        order_id: params.orderId,
        url_callback: `${process.env.API_URL}/api/webhooks/cryptomus`,
      }),
    });

    return await response.json();
  }
}

class NOWPaymentsProvider implements CryptoPaymentProvider {
  async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
    const response = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": process.env.NOWPAYMENTS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: params.amount,
        price_currency: params.currency,
        pay_currency: params.cryptoCurrency,
        order_id: params.orderId,
        ipn_callback_url: `${process.env.API_URL}/api/webhooks/nowpayments`,
      }),
    });

    return await response.json();
  }
}

// Factory pattern for provider selection
export function getCryptoProvider(provider: "cryptomus" | "nowpayments"): CryptoPaymentProvider {
  switch (provider) {
    case "cryptomus":
      return new CryptomusProvider();
    case "nowpayments":
      return new NOWPaymentsProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

---

## 3. Distributed Transaction Management

### 3.1 Idempotency Pattern

```typescript
// Idempotency key stored in Redis/database
interface IdempotencyRecord {
  key: string;
  status: "processing" | "completed" | "failed";
  result?: any;
  createdAt: Date;
  expiresAt: Date;
}

async function processPaymentIdempotently(idempotencyKey: string, paymentFn: () => Promise<PaymentResult>): Promise<PaymentResult> {
  // Check if already processed
  const existing = await redis.get(`idempotency:${idempotencyKey}`);
  if (existing) {
    const record = JSON.parse(existing);
    if (record.status === "completed") {
      return record.result;
    }
    if (record.status === "processing") {
      throw new PaymentInProgressError();
    }
  }

  // Mark as processing
  await redis.setex(
    `idempotency:${idempotencyKey}`,
    3600, // 1 hour TTL
    JSON.stringify({ status: "processing", createdAt: new Date() }),
  );

  try {
    const result = await paymentFn();

    // Mark as completed
    await redis.setex(
      `idempotency:${idempotencyKey}`,
      86400, // 24 hour TTL for completed
      JSON.stringify({ status: "completed", result, createdAt: new Date() }),
    );

    return result;
  } catch (error) {
    // Mark as failed
    await redis.setex(`idempotency:${idempotencyKey}`, 3600, JSON.stringify({ status: "failed", error: error.message, createdAt: new Date() }));
    throw error;
  }
}
```

### 3.2 Saga Pattern for Multi-Step Transactions

```typescript
// Saga for crypto purchase flow
class CryptoPurchaseSaga {
  private steps: SagaStep[] = [];
  private completedSteps: SagaStep[] = [];

  async execute(context: SagaContext): Promise<void> {
    try {
      for (const step of this.steps) {
        await step.execute(context);
        this.completedSteps.push(step);
      }
    } catch (error) {
      // Compensate in reverse order
      for (const step of this.completedSteps.reverse()) {
        await step.compensate(context);
      }
      throw error;
    }
  }
}

// Example: Purchase crypto with fiat
const purchaseSaga = new CryptoPurchaseSaga();
purchaseSaga
  .addStep({
    name: "debitFiatWallet",
    execute: async (ctx) => {
      ctx.fiatDebit = await debitWallet(ctx.userId, "USD", ctx.amount);
    },
    compensate: async (ctx) => {
      await creditWallet(ctx.userId, "USD", ctx.amount, "REFUND");
    },
  })
  .addStep({
    name: "executeCryptoTrade",
    execute: async (ctx) => {
      ctx.trade = await executeTrade(ctx.pair, ctx.amount);
    },
    compensate: async (ctx) => {
      await reverseTrade(ctx.trade.id);
    },
  })
  .addStep({
    name: "creditCryptoWallet",
    execute: async (ctx) => {
      await creditWallet(ctx.userId, ctx.cryptoCurrency, ctx.trade.amount);
    },
    compensate: async (ctx) => {
      await debitWallet(ctx.userId, ctx.cryptoCurrency, ctx.trade.amount);
    },
  });
```

---

## 4. Cloudflare Workers Integration

### 4.1 Edge Rate Limiting

```javascript
// workers/rate-limiter.js
export default {
  async fetch(request, env) {
    const ip = request.headers.get("CF-Connecting-IP");
    const key = `rate:${ip}`;

    // Use Cloudflare KV for distributed rate limiting
    const current = parseInt(await env.RATE_LIMIT_KV.get(key)) || 0;

    if (current >= env.RATE_LIMIT_MAX) {
      return new Response("Rate limit exceeded", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": env.RATE_LIMIT_MAX.toString(),
          "X-RateLimit-Remaining": "0",
        },
      });
    }

    // Increment counter
    await env.RATE_LIMIT_KV.put(key, (current + 1).toString(), {
      expirationTtl: 60, // Reset every minute
    });

    return fetch(request);
  },
};
```

### 4.2 Payment Webhook Verification

```javascript
// workers/webhook-verifier.js
export default {
  async fetch(request, env) {
    const body = await request.text();
    const signature = request.headers.get("X-Signature");

    // Verify signature before forwarding
    const isValid = await verifySignature(body, signature, env.WEBHOOK_SECRET);

    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Forward to origin with verified flag
    const modifiedHeaders = new Headers(request.headers);
    modifiedHeaders.set("X-Webhook-Verified", "true");

    return fetch(env.BACKEND_URL + "/api/webhooks/crypto", {
      method: "POST",
      headers: modifiedHeaders,
      body: body,
    });
  },
};
```

---

## 5. Azure Database Setup

### 5.1 Azure Cosmos DB for PostgreSQL

```hcl
# terraform/azure-db.tf
resource "azurerm_cosmosdb_postgresql_cluster" "main" {
  name                = "advancia-db-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"

  # Node configuration
  node_count                                    = var.environment == "production" ? 3 : 1
  coordinator_storage_quota_in_mb              = 131072 # 128 GB
  coordinator_vcore_count                      = 4
  node_storage_quota_in_mb                     = 65536  # 64 GB
  node_vcores                                  = 4

  # High availability
  ha_enabled                                   = var.environment == "production"

  # Security
  coordinator_public_ip_access_enabled         = false

  # Backups
  point_in_time_recovery_enabled              = true

  administrator_login_password = random_password.db_password.result
}

# Connection pooler (PgBouncer)
resource "azurerm_cosmosdb_postgresql_coordinator_configuration" "pgbouncer" {
  cluster_id = azurerm_cosmosdb_postgresql_cluster.main.id
  name       = "citus.pg_stat_statements.track"
  value      = "all"
}
```

### 5.2 Connection Pooling

```typescript
// backend/src/prismaClient.ts
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool settings
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  }).$extends({
    query: {
      $allOperations({ operation, args, query }) {
        const start = performance.now();
        return query(args).finally(() => {
          const time = performance.now() - start;
          if (time > 1000) {
            console.warn(`Slow query: ${operation} took ${time}ms`);
          }
        });
      },
    },
  });
};

declare global {
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
```

---

## 6. Sentry AI Insights Configuration

```typescript
// backend/src/sentry.config.ts
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.RELEASE_VERSION,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Profiling for AI insights
  profilesSampleRate: 0.1,

  integrations: [new ProfilingIntegration(), new Sentry.Integrations.Prisma({ client: prisma }), new Sentry.Integrations.Express({ app })],

  // AI-powered error grouping
  beforeSend(event, hint) {
    // Scrub sensitive data
    if (event.request?.data) {
      const sensitiveFields = ["password", "token", "secret", "apiKey"];
      for (const field of sensitiveFields) {
        if (event.request.data[field]) {
          event.request.data[field] = "[REDACTED]";
        }
      }
    }

    // Add context for AI analysis
    event.contexts = {
      ...event.contexts,
      payment: {
        provider: hint.data?.provider,
        transactionId: hint.data?.transactionId,
      },
    };

    return event;
  },

  // Ignore common non-errors
  ignoreErrors: ["ResizeObserver loop limit exceeded", "Network request failed", "AbortError"],
});

// Custom spans for AI insights
export function trackPaymentFlow(paymentId: string, provider: string) {
  return Sentry.startSpan({
    op: "payment.process",
    name: `Process ${provider} payment`,
    data: { paymentId, provider },
  });
}
```

---

## 7. Summary

| Component      | Technology                 | Purpose                            |
| -------------- | -------------------------- | ---------------------------------- |
| E-Wallet       | Prisma + PostgreSQL        | Multi-currency balance management  |
| Crypto Gateway | Cryptomus/NOWPayments      | Crypto payment processing          |
| Idempotency    | Redis                      | Prevent duplicate transactions     |
| Rate Limiting  | Cloudflare Workers + KV    | Edge rate limiting                 |
| Database       | Azure Cosmos DB PostgreSQL | Distributed, scalable database     |
| Monitoring     | Sentry with AI Insights    | Error tracking, performance        |
| Transactions   | Saga Pattern               | Distributed transaction management |

---

_Last Updated: January 2025_

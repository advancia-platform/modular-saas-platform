# React Best Practices — Advancia Pay Platform

> **Purpose**: Unified React/Next.js coding standards for the Advancia Pay frontend team. Follow these guidelines for consistency, maintainability, and performance.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [TypeScript Guidelines](#typescript-guidelines)
4. [Hooks & State Management](#hooks--state-management)
5. [Data Fetching](#data-fetching)
6. [Styling Conventions](#styling-conventions)
7. [Performance Optimization](#performance-optimization)
8. [Testing Standards](#testing-standards)
9. [Error Handling](#error-handling)
10. [Security Best Practices](#security-best-practices)
11. [Code Review Checklist](#code-review-checklist)

---

## 🏗️ Architecture Overview

### **Current Stack**
- **Framework**: Next.js 14 (App Router + Pages Router hybrid)
- **React Version**: 18.3.1
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS + DaisyUI + CSS Modules
- **State**: React Context API (ToastProvider, SilentModeProvider) + local state
- **Forms**: Formik + custom validation
- **Data Fetching**: Native `fetch` + Socket.IO for realtime
- **UI Libraries**: Radix UI, Headless UI, Framer Motion, Nivo Charts

### **Directory Structure**
```
frontend/src/
├── app/                    # Next.js App Router pages (primary)
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page
│   ├── dashboard/          # Dashboard routes
│   ├── admin/              # Admin panel routes
│   └── auth/               # Authentication flows
├── pages/                  # Legacy Pages Router (TrustScore demo only)
├── components/             # Reusable UI components
│   ├── ui/                 # Atomic UI components (buttons, inputs)
│   ├── admin/              # Admin-specific components
│   ├── dashboard/          # Dashboard-specific components
│   └── *.tsx               # Shared components
├── hooks/                  # Custom React hooks
│   ├── useBalance.ts       # Balance data + realtime updates
│   ├── useNotifications.ts # Notification system + Socket.IO
│   ├── useTransactions.ts  # Transaction history
│   └── useAnalytics.ts     # Analytics tracking
├── lib/                    # Utility functions, API clients
├── types/                  # TypeScript type definitions
└── utils/                  # Helper functions
```

### **Routing Strategy**
- **App Router (`app/`)**: Use for all new pages (default)
- **Pages Router (`pages/`)**: Legacy TrustScore demo only (do not expand)
- **Migration Goal**: Eventually consolidate to App Router only

---

## 🧱 Component Structure

### **1. Functional Components Only**
❌ **Bad** (Class components):
```tsx
class Dashboard extends React.Component { ... }
```

✅ **Good** (Functional with hooks):
```tsx
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  return <div>...</div>;
}
```

### **2. Component Anatomy Template**
```tsx
'use client'; // Add for client-side interactivity (App Router)

import { useState, useEffect } from 'react';
import { DashboardData } from '@/types'; // Import types first
import { fetchDashboardData } from '@/lib/api'; // Then utilities
import LoadingSpinner from '@/components/LoadingSpinner'; // Then components

// 1. Type definitions (if not in separate file)
interface DashboardProps {
  userId: string;
  initialData?: DashboardData;
}

// 2. Main component
export default function Dashboard({ userId, initialData }: DashboardProps) {
  // 3. Hooks (useState, useEffect, custom hooks)
  const [data, setData] = useState<DashboardData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // 4. Effects
  useEffect(() => {
    if (initialData) return;
    fetchDashboardData(userId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId, initialData]);

  // 5. Event handlers
  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData(userId).then(setData).finally(() => setLoading(false));
  };

  // 6. Early returns (loading, error states)
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error">{error}</div>;
  if (!data) return <div>No data available</div>;

  // 7. Main render
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <button onClick={handleRefresh}>Refresh</button>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

### **3. Smart vs. Presentational Components**

**Smart Components** (Container, data-fetching):
```tsx
// src/app/dashboard/page.tsx
'use client';

import { useBalance } from '@/hooks/useBalance';
import BalanceCard from '@/components/dashboard/BalanceCard';

export default function DashboardPage() {
  const { balance, loading, error } = useBalance('user-123');

  return <BalanceCard balance={balance} loading={loading} error={error} />;
}
```

**Presentational Components** (Pure, UI-focused):
```tsx
// src/components/dashboard/BalanceCard.tsx
interface BalanceCardProps {
  balance: Balance | null;
  loading: boolean;
  error: string | null;
}

export default function BalanceCard({ balance, loading, error }: BalanceCardProps) {
  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!balance) return null;

  return (
    <div className="card">
      <h2>Balance</h2>
      <p>${balance.total.toFixed(2)}</p>
    </div>
  );
}
```

### **4. File Naming Conventions**
- **Components**: PascalCase (`Dashboard.tsx`, `BalanceCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useBalance.ts`, `useNotifications.ts`)
- **Utilities**: camelCase (`api.ts`, `formatCurrency.ts`)
- **Types**: PascalCase (`User.ts`, `Transaction.ts`)
- **Pages (App Router)**: lowercase (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)

---

## 📘 TypeScript Guidelines

### **1. Strict Type Safety**
✅ **Current `tsconfig.json` Settings**:
```jsonc
{
  "compilerOptions": {
    "strict": true,                      // Enable all strict checks
    "exactOptionalPropertyTypes": false, // Allow undefined for optional props
    "noUncheckedIndexedAccess": true,    // Require index signature checks
    "forceConsistentCasingInFileNames": true
  }
}
```

### **2. Always Type Props**
❌ **Bad** (Implicit any):
```tsx
function Button({ label, onClick }) { ... }
```

✅ **Good** (Explicit types):
```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

### **3. Type API Responses**
❌ **Bad** (any):
```tsx
const data: any = await fetch('/api/balance').then((r) => r.json());
```

✅ **Good** (typed):
```tsx
interface BalanceResponse {
  balance: number;
  earnings: number;
  referral: number;
}

const data: BalanceResponse = await fetch('/api/balance').then((r) => r.json());
```

### **4. Use `unknown` Instead of `any`**
❌ **Bad**:
```tsx
catch (error: any) {
  console.error(error.message);
}
```

✅ **Good**:
```tsx
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### **5. Leverage Type Inference**
```tsx
// Don't over-annotate when TypeScript can infer
const [count, setCount] = useState(0); // TypeScript infers number
const [user, setUser] = useState<User | null>(null); // Explicit when needed
```

---

## 🪝 Hooks & State Management

### **1. Custom Hooks for Business Logic**
Extract complex state logic into custom hooks:

```tsx
// src/hooks/useBalance.ts
export function useBalance(userId: string) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await fetch(`/api/transactions/balance/${userId}`);
        const data = await response.json();
        setBalance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();

    // Socket.IO realtime updates
    const socket = io(process.env.NEXT_PUBLIC_API_URL!);
    socket.emit('join-room', `user-${userId}`);
    socket.on('balance-updated', (updatedBalance) => {
      setBalance(updatedBalance);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return { balance, loading, error };
}
```

### **2. Context for Global State**
Use Context sparingly (auth, theme, toasts only):

```tsx
// src/components/ToastProvider.tsx
import { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).slice(2, 11);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
```

### **3. Rules of Hooks**
- ✅ Call hooks at the top level (not inside loops, conditions, or nested functions)
- ✅ Only call hooks from React functions (components or custom hooks)
- ✅ Prefix custom hooks with `use` (e.g., `useBalance`, `useAuth`)

❌ **Bad**:
```tsx
if (condition) {
  const [state, setState] = useState(0); // Conditional hook call
}
```

✅ **Good**:
```tsx
const [state, setState] = useState(0);
if (condition) {
  setState(1); // Conditional state update
}
```

---

## 🌐 Data Fetching

### **1. Client-Side Fetching (SPA-style)**
Use custom hooks for client-side data:

```tsx
'use client';

import { useTransactions } from '@/hooks/useTransactions';

export default function TransactionHistory() {
  const { transactions, loading, error } = useTransactions();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <ul>
      {transactions.map((tx) => (
        <li key={tx.id}>{tx.description}</li>
      ))}
    </ul>
  );
}
```

### **2. Server Components (Next.js 14 App Router)**
Fetch data directly in Server Components (no hooks needed):

```tsx
// src/app/dashboard/page.tsx (Server Component)
import { getUserBalance } from '@/lib/api';

export default async function DashboardPage({ params }: { params: { userId: string } }) {
  const balance = await getUserBalance(params.userId);

  return (
    <div>
      <h1>Balance: ${balance.total}</h1>
    </div>
  );
}
```

### **3. Realtime Updates (Socket.IO)**
Integrate Socket.IO in hooks:

```tsx
// src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL!);
    socket.emit('join-room', `user-${userId}`);

    socket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return { notifications };
}
```

### **4. Error Handling**
Always handle fetch errors gracefully:

```tsx
try {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const data = await response.json();
  return data;
} catch (error) {
  if (error instanceof Error) {
    console.error('Fetch error:', error.message);
    toast.error(`Failed to load data: ${error.message}`);
  }
  return null;
}
```

---

## 🎨 Styling Conventions

### **1. Tailwind CSS (Primary)**
Use Tailwind utility classes for most styling:

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-800">Balance</h2>
  <p className="text-2xl font-semibold text-green-600">${balance}</p>
</div>
```

### **2. DaisyUI Components**
Leverage DaisyUI for pre-styled components:

```tsx
<button className="btn btn-primary">Submit</button>
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Card Title</h2>
    <p>Card content</p>
  </div>
</div>
```

### **3. CSS Modules for Complex Styles**
Use CSS Modules for component-specific styles:

```tsx
// TrustScoreComponent.module.css
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scoreCircle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

```tsx
// TrustScoreComponent.tsx
import styles from './TrustScoreComponent.module.css';

export default function TrustScore({ score }: { score: number }) {
  return (
    <div className={styles.container}>
      <div className={styles.scoreCircle}>
        {score}
      </div>
    </div>
  );
}
```

### **4. Responsive Design**
Always use mobile-first Tailwind breakpoints:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column mobile, 2 columns tablet, 3 columns desktop */}
</div>
```

### **5. Dark Mode Support**
Use Tailwind's `dark:` variant:

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content
</div>
```

---

## ⚡ Performance Optimization

### **1. Code Splitting with `dynamic`**
Lazy load heavy components:

```tsx
import dynamic from 'next/dynamic';

const AdvanciaAIWidget = dynamic(() => import('@/components/AdvanciaAIWidget'), {
  ssr: false, // Disable SSR for client-only components
  loading: () => <LoadingSpinner />,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AdvanciaAIWidget />
    </>
  );
}
```

### **2. Memoization**
Use `React.memo` for expensive re-renders:

```tsx
import { memo } from 'react';

const TransactionRow = memo(({ transaction }: { transaction: Transaction }) => {
  return (
    <tr>
      <td>{transaction.id}</td>
      <td>{transaction.amount}</td>
    </tr>
  );
});

TransactionRow.displayName = 'TransactionRow';
export default TransactionRow;
```

Use `useMemo` for expensive calculations:

```tsx
const sortedTransactions = useMemo(() => {
  return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}, [transactions]);
```

Use `useCallback` for stable function references:

```tsx
const handleClick = useCallback(() => {
  console.log('Clicked', itemId);
}, [itemId]); // Only recreate if itemId changes
```

### **3. Image Optimization**
Use Next.js `<Image>` component:

```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Advancia Logo"
  width={200}
  height={50}
  priority // Preload above-the-fold images
/>
```

### **4. Avoid Unnecessary Re-renders**
❌ **Bad** (Object/array created on every render):
```tsx
<Component data={{ key: 'value' }} /> // New object every render
```

✅ **Good** (Stable reference):
```tsx
const data = useMemo(() => ({ key: 'value' }), []);
<Component data={data} />
```

---

## 🧪 Testing Standards

### **1. React Testing Library (Preferred)**
Test user behavior, not implementation details:

```tsx
// src/components/__tests__/BalanceCard.test.tsx
import { render, screen } from '@testing-library/react';
import BalanceCard from '../BalanceCard';

describe('BalanceCard', () => {
  it('displays balance correctly', () => {
    const balance = { total: 5250, balance_main: 4000, earnings: 1250, referral: 0 };
    render(<BalanceCard balance={balance} loading={false} error={null} />);

    expect(screen.getByText(/balance/i)).toBeInTheDocument();
    expect(screen.getByText('$5250.00')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<BalanceCard balance={null} loading={true} error={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spinner
  });

  it('displays error message', () => {
    render(<BalanceCard balance={null} loading={false} error="Network error" />);
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
  });
});
```

### **2. Test Coverage Goals**
- **Unit Tests**: 80%+ coverage for components and hooks
- **Integration Tests**: Key user flows (login, purchase, withdrawal)
- **E2E Tests**: Critical paths (Playwright)

### **3. Test File Naming**
- Unit tests: `ComponentName.test.tsx` or `ComponentName.spec.tsx`
- Place in `__tests__/` folder or colocate with component

---

## 🚨 Error Handling

### **1. Error Boundaries**
Wrap app sections in error boundaries:

```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Send to Sentry
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Usage:
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Dashboard />
</ErrorBoundary>
```

### **2. Toast Notifications**
Use toast for user-facing errors:

```tsx
import { toast } from 'react-toastify';

try {
  await purchaseToken(amount);
  toast.success('Token purchased successfully!');
} catch (error) {
  toast.error('Purchase failed. Please try again.');
  console.error(error);
}
```

---

## 🔒 Security Best Practices

### **1. Never Expose Secrets**
❌ **Bad**:
```tsx
const apiKey = 'sk_live_abc123'; // Hardcoded secret
```

✅ **Good**:
```tsx
const apiKey = process.env.NEXT_PUBLIC_STRIPE_KEY; // Environment variable
```

### **2. Sanitize User Inputs**
Use libraries like `DOMPurify` for HTML:

```tsx
import DOMPurify from 'isomorphic-dompurify';

const cleanHTML = DOMPurify.sanitize(userInput);
```

### **3. Validate on Backend**
Never trust client-side validation alone. Always validate on the backend.

### **4. Use HTTPS**
Ensure all API calls use `https://` in production.

---

## ✅ Code Review Checklist

Before submitting a PR, verify:

- [ ] TypeScript strict mode passes (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] All props are typed
- [ ] Custom hooks are used for complex state
- [ ] Components are small and focused (<200 lines)
- [ ] Loading/error states handled
- [ ] Tests written for new components (80%+ coverage)
- [ ] No console.log statements (use `winston` logger or remove)
- [ ] Tailwind classes used (avoid inline styles)
- [ ] Images use `<Image>` component
- [ ] Heavy components use `dynamic` import
- [ ] Secrets not hardcoded
- [ ] API errors handled gracefully
- [ ] Responsive design tested (mobile, tablet, desktop)

---

## 📚 Additional Resources

- **Next.js 14 Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **React 18 Docs**: [react.dev](https://react.dev)
- **TypeScript Handbook**: [typescriptlang.org/docs](https://www.typescriptlang.org/docs)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **React Testing Library**: [testing-library.com/react](https://testing-library.com/react)
- **Sentry (Error Tracking)**: [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

## 🔄 Maintenance

- **Review quarterly** (update for new Next.js features)
- **Revise after major refactors** (e.g., App Router migration)
- **Discuss in team retrospectives** (collect feedback)

---

**Last Updated**: November 24, 2025  
**Maintainer**: DevOps Team  
**Feedback**: Open an issue in GitHub or discuss in team Slack channel

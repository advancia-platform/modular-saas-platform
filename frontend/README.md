# Advancia Pay Ledger - Frontend

Modern fintech dashboard built with Next.js 14, TypeScript, Tailwind CSS, and Framer Motion.

## 🎨 Features

- **💼 Dashboard Overview**
  - Animated summary cards (Credits, Debits, Net Balance, Bonus)
  - Click-to-expand balance breakdown modal
  - Real-time transaction updates via Socket.IO
  - Sound and haptic feedback on interactions

- **📊 Components**
  - Summary Cards with animated counters
  - Balance Dropdown with detailed breakdown
  - Transaction List with filters (All, Credits, Debits, Bonus)
  - Bonus & Earnings Card with tooltip
  - Responsive design for mobile and desktop

- **🎭 Animations**
  - Framer Motion for smooth transitions
  - Glow effects on hover
  - Pulsing indicators for new transactions
  - Counter animations for values

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### TypeScript / Build Notes

This project previously used a tsconfig field `ignoreDeprecations` which caused Vercel production builds to fail with:

```
Type error: Invalid value for '--ignoreDeprecations'.
```

We removed it from `tsconfig.json`. If you later upgrade TypeScript and need to suppress specific legacy deprecation warnings, only re-add it after confirming the flag is supported for your TypeScript compiler version. Example (if supported):

```jsonc
{
  "compilerOptions": {
    // ...other options
    "ignoreDeprecations": "5.0", // or the version boundary specified by TS docs
  },
}
```

Always run a local `npm run build` and a CI typecheck before deploying to ensure flags are valid in your build environment.

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with fonts
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles + Tailwind
│   ├── components/
│   │   ├── Dashboard.tsx      # Main dashboard component
│   │   ├── SummaryCard.tsx    # Animated summary cards
│   │   ├── BonusCard.tsx      # Bonus earnings card
│   │   ├── BalanceDropdown.tsx # Balance breakdown modal
│   │   └── TransactionList.tsx # Transaction list with filters
│   └── hooks/
│       ├── useBalance.ts      # Balance data + Socket.IO
│       ├── useTransactions.ts # Transaction data + real-time updates
│       └── useSoundFeedback.ts # Sound + haptic feedback
├── public/                    # Static assets
├── tailwind.config.js         # Tailwind configuration
├── next.config.js             # Next.js configuration
└── package.json

```

## 🎨 Design System

### Colors

- **Primary Blue**: #1890ff (buttons, links, accents)
- **Teal**: #13c2c2 (secondary actions, gradients)
- **Green**: Success states, credit transactions
- **Red**: Error states, debit transactions
- **Amber**: Bonus/earnings indicators

### Animations

- `pulse-glow`: Pulsing glow effect for new transactions
- `slide-in`: Smooth slide-in for modals
- `fade-in`: Fade-in for content
- `counter-up`: Animated number counting

## 🔌 API Integration

The dashboard connects to the backend API at `http://localhost:4000`:

### Endpoints Used

- `GET /api/transactions/balance/:userId` - User balance
- `GET /api/transactions/recent/:userId` - Recent transactions

### Socket.IO Events

- `join-room` - Join user-specific room
- `transaction-created` - New transaction notification
- `global-transaction` - Global transaction broadcast

## 🎯 Components

### Dashboard

Main container with summary cards, balance dropdown, and transaction list.

**Props**: None (uses userId from hooks)

### SummaryCard

Displays a metric with an animated counter.

**Props**:

- `title: string` - Card title
- `value: number` - Numeric value to display
- `icon: ReactNode` - Icon component
- `iconBg: string` - Icon background gradient
- `gradient: string` - Card background gradient
- `delay?: number` - Animation delay
- `clickable?: boolean` - Enable click interaction
- `badge?: ReactNode` - Optional badge element

### BonusCard

Shows bonus earnings with tooltip on hover.

**Props**:

- `earnings: number` - Bonus amount
- `percentage: number` - Bonus percentage
- `delay?: number` - Animation delay

### BalanceDropdown

Modal showing balance breakdown (Main, Earnings, Referrals).

**Props**:

- `balance: Balance` - Balance object
- `onClose: () => void` - Close handler

### TransactionList

Displays recent transactions with filter options.

**Props**:

- `transactions: Transaction[]` - Array of transactions
- `loading: boolean` - Loading state

## 🪝 Custom Hooks

### useBalance(userId)

Fetches and manages user balance data with real-time updates.

**Returns**: `{ balance, loading, error }`

### useTransactions(userId)

Fetches and manages transactions with Socket.IO updates.

**Returns**: `{ transactions, loading, error }`

### useSoundFeedback()

Provides sound and haptic feedback functions.

**Returns**: `{ playClick, playSuccess, playError, hapticFeedback }`

## 🎨 Styling

The project uses Tailwind CSS with custom configurations:

```javascript
// Custom colors in tailwind.config.js
colors: {
  primary: { 50-900 shades of blue },
  teal: { 50-900 shades of teal }
}

// Custom animations
animation: {
  'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
  'slide-in': 'slideIn 0.3s ease-out',
  'fade-in': 'fadeIn 0.4s ease-in',
  'counter-up': 'counterUp 1s ease-out'
}
```

## 📱 Responsive Design

- Mobile: Single column layout
- Tablet: 2-column grid
- Desktop: 4-column grid for summary cards

Breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:4000

# Production
NEXT_PUBLIC_API_URL=http://157.245.8.131:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SCXq1CnLcSzsQoTOLHBWMBDs2B1So1zAVwGZUmkvUAviP2CwNr3OrxU5Ws6bmygNOhe06PSxsDGGPUEU1XWaAy100vt5KK4we

# Authentication
NEXTAUTH_URL=https://your-frontend-url.vercel.app
NEXTAUTH_SECRET=your-generated-secret
CRON_SECRET=your-cron-secret

# Optional: enable SmartSupp live chat bubble
NEXT_PUBLIC_SMARTSUPP_KEY=your_smartsupp_public_key
```

### Next.js Config

```javascript
// next.config.js
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
};
```

## 🚀 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🎭 Features in Detail

### Animated Counter

Summary cards feature smooth number transitions from 0 to target value.

### Balance Breakdown

Click "Net Balance" card to open detailed breakdown modal showing:

- Main Account balance
- Earnings (bonus)
- Rewards / Adjustments
- Total Available

### Real-time Updates

Socket.IO integration provides instant updates when:

- New transactions are created
- Balance changes
- Global transaction broadcasts

### Sound Feedback

- **Click**: Short beep on interactions
- **Success**: Two-tone chime for successful actions
- **Error**: Low tone for errors
- **Haptic**: Vibration on supported devices

## 🐛 Troubleshooting

### Socket.IO Connection Issues

Check that backend is running on port 4000:

```bash
curl http://localhost:4000/health
```

### Tailwind Classes Not Working

Ensure PostCSS is configured:

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### TypeScript Errors

Run type checking:

```bash
npx tsc --noEmit
```

## 📚 Dependencies

**Core**:

- `next` ^14.2.0
- `react` ^18.3.0
- `typescript` ^5.9.0

**UI**:

- `framer-motion` ^11.3.0
- `lucide-react` ^0.400.0
- `tailwindcss` ^3.4.4

**API**:

- `socket.io-client` ^4.8.1
- `axios` ^1.7.2

**Auth & Crypto**:

- `next-auth` ^4.24.7
- `ethers` ^6.13.0
- `@stripe/stripe-js` ^4.0.0

**Utils**:

- `clsx` ^2.1.1
- `date-fns` ^3.6.0
- `qrcode.react` ^3.1.0
- `react-hot-toast` ^2.4.1
- `recharts` ^2.12.0

## 🎯 Next Steps

- [ ] Add user authentication
- [ ] Implement transaction creation form
- [ ] Add date range filters
- [ ] Export transactions to CSV
- [ ] Dark mode support
- [ ] PWA configuration

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

<!-- Build trigger: 2025-11-16 09:32:08 -->

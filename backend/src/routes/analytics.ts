import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth';
const router = express.Router();

// 📊 Example analytics route
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Analytics route active ✅',
    visitors: Math.floor(Math.random() * 1000),
    activeUsers: Math.floor(Math.random() * 500),
    transactions: Math.floor(Math.random() * 200),
  });
});

// Strict per-IP/user rate limit for analytics dashboard
const analyticsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // allow 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please retry shortly.',
  },
});

// Dashboard metrics matching the planned frontend structure
router.get('/dashboard', authenticateToken, analyticsRateLimiter, (req: Request, res: Response) => {
  const days = 14;
  const today = new Date();
  const chartData = Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - i));
    return {
      date: d.toISOString().slice(0, 10),
      revenue: Math.round(500 + Math.random() * 1500),
      users: Math.round(50 + Math.random() * 150),
      transactions: Math.round(20 + Math.random() * 80),
    };
  });

  const sum = (key: 'revenue' | 'users' | 'transactions') =>
    chartData.reduce((acc, cur) => acc + (cur[key] as number), 0);

  const prevHalf = chartData.slice(0, days / 2);
  const currHalf = chartData.slice(days / 2);
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round(((a - b) / b) * 100));

  const response = {
    revenue: {
      current: sum('revenue'),
      previous: prevHalf.reduce((acc, cur) => acc + cur.revenue, 0),
      trend: pct(currHalf.reduce((acc, cur) => acc + cur.revenue, 0), prevHalf.reduce((acc, cur) => acc + cur.revenue, 0)),
    },
    users: {
      current: sum('users'),
      previous: prevHalf.reduce((acc, cur) => acc + cur.users, 0),
      trend: pct(currHalf.reduce((acc, cur) => acc + cur.users, 0), prevHalf.reduce((acc, cur) => acc + cur.users, 0)),
    },
    transactions: {
      current: sum('transactions'),
      previous: prevHalf.reduce((acc, cur) => acc + cur.transactions, 0),
      trend: pct(currHalf.reduce((acc, cur) => acc + cur.transactions, 0), prevHalf.reduce((acc, cur) => acc + cur.transactions, 0)),
    },
    conversionRate: {
      current: Math.round(10 + Math.random() * 10),
      previous: Math.round(10 + Math.random() * 10),
      trend: Math.round(Math.random() * 10 - 5),
    },
    chartData,
  };

  res.json(response);
});

export default router;

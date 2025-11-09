/**
 * Modular Express App with Route Separation
 * 
 * This demonstrates clean separation of concerns with:
 * - Modular route handlers
 * - CORS configuration
 * - Logger middleware
 * - Error handling
 */

import express from 'express';
import cors from 'cors';
import { logger } from './logger';
import healthRouter from './routes/health';
import authRouter from './routes/auth';

const app = express();

// ===================================================================
// CORS CONFIGURATION
// ===================================================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://advanciapayledger.com',
  'https://www.advanciapayledger.com',
  ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
];

const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow whitelisted origins
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // Allow Vercel preview deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    
    // Reject all others
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-admin-key']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================================================================
// LOGGING MIDDLEWARE
// ===================================================================
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  next();
});

// ===================================================================
// ROUTE REGISTRATION
// ===================================================================
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// TODO: Register additional routers here:
// import emailRouter from './routes/email';
// import paymentsRouter from './routes/payments';
// import transactionsRouter from './routes/transactions';
// 
// app.use('/api/email', emailRouter);
// app.use('/api/payments', paymentsRouter);
// app.use('/api/transactions', transactionsRouter);

// ===================================================================
// ERROR HANDLERS
// ===================================================================

/**
 * 404 Handler - Must be after all routes
 */
app.use((req, res) => {
  logger.warn('404 Not Found', { method: req.method, path: req.path });
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Global Error Handler - Must be last middleware
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack, 
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;

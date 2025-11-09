/**
 * Express App Example with Logger and Email Templates
 * This is a standalone example showing the structure
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './logger';
import { emailTemplates } from './utils/emailTemplates';

// TODO: Add import and use of real route files (auth, payments, etc).
// Example:
// import authRouter from './routes/auth';
// import paymentsRouter from './routes/payments';

const app = express();

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Define your allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:4000',
      'https://advanciapayledger.com',
      'https://www.advanciapayledger.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-admin-key']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy if behind reverse proxy (Nginx, Cloudflare, etc.)
app.set('trust proxy', 1);

// Logging middleware - tracks all HTTP requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent']
    });
  });
  
  next();
});

// Health check endpoint (same as original)
app.get('/api/health', (req: Request, res: Response) => {
  logger.debug('Health check requested');
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'backend-api',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Example: Email template demo endpoint (for testing)
app.get('/api/email-demo', (req: Request, res: Response) => {
  const { template = 'welcome' } = req.query;
  
  let html = '';
  
  switch (template) {
    case 'welcome':
      html = emailTemplates.welcome('John Doe');
      break;
    case 'reset':
      html = emailTemplates.passwordReset('Jane Smith', 'https://example.com/reset?token=abc123', '1 hour');
      break;
    case 'verify':
      html = emailTemplates.emailVerification('Bob Johnson', 'https://example.com/verify?token=xyz789');
      break;
    case 'transaction':
      html = emailTemplates.transactionAlert('Alice Cooper', {
        type: 'DEPOSIT',
        amount: 1250.50,
        date: new Date().toISOString(),
        status: 'COMPLETED',
        description: 'Bank transfer deposit'
      });
      break;
    default:
      return res.status(400).json({ error: 'Invalid template name' });
  }
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Public routes - add your feature routes here
// Example:
// app.use('/api/auth', authRouter);
// app.use('/api/payments', paymentsRouter);
// app.use('/api/users', usersRouter);

// 404 handler - must be after all routes
app.use((req: Request, res: Response) => {
  logger.warn('404 Not Found', { 
    method: req.method, 
    path: req.path,
    ip: req.ip 
  });
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path 
  });
});

// Global error handler - must be last middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack, 
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;

// Example usage in separate server file:
/*
import app from './app-example';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    port: PORT
  });
});
*/

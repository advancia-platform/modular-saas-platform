/**
 * Example: Standalone Express App with Logger & Email Templates
 * 
 * This demonstrates a clean Express server setup with:
 * - Winston logging middleware
 * - Email templates with XSS protection
 * - CORS configuration
 * - Error handling
 * - Health check endpoint
 */

import express from 'express';
import cors from 'cors';
import { logger } from './logger';
import { emailTemplates } from './utils/emailTemplates';

// Initialize Express app
const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
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
// ROUTES
// ===================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'backend-api'
  });
});

/**
 * Example: Send welcome email
 */
app.post('/api/send-welcome-email', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    // Generate email HTML
    const emailHTML = emailTemplates.welcome(name);
    
    // In production, use nodemailer or email service here
    logger.info('Welcome email generated', { name, email });
    
    res.json({
      success: true,
      message: 'Welcome email sent',
      preview: emailHTML.substring(0, 200) + '...'
    });
  } catch (error: any) {
    logger.error('Failed to send welcome email', { error: error.message, name, email });
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * Example: Send password reset email
 */
app.post('/api/send-reset-email', (req, res) => {
  const { name, email, resetLink } = req.body;
  
  if (!name || !email || !resetLink) {
    return res.status(400).json({ error: 'Name, email, and resetLink are required' });
  }

  try {
    const emailHTML = emailTemplates.passwordReset(name, resetLink, '1 hour');
    
    logger.info('Password reset email generated', { name, email });
    
    res.json({
      success: true,
      message: 'Password reset email sent',
      preview: emailHTML.substring(0, 200) + '...'
    });
  } catch (error: any) {
    logger.error('Failed to send reset email', { error: error.message, name, email });
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * Example: Send transaction alert
 */
app.post('/api/send-transaction-alert', (req, res) => {
  const { name, email, transaction } = req.body;
  
  if (!name || !email || !transaction) {
    return res.status(400).json({ error: 'Name, email, and transaction are required' });
  }

  try {
    const emailHTML = emailTemplates.transactionAlert(name, transaction);
    
    logger.info('Transaction alert generated', { 
      name, 
      email, 
      transactionType: transaction.type,
      amount: transaction.amount 
    });
    
    res.json({
      success: true,
      message: 'Transaction alert sent',
      preview: emailHTML.substring(0, 200) + '...'
    });
  } catch (error: any) {
    logger.error('Failed to send transaction alert', { error: error.message, name, email });
    res.status(500).json({ error: 'Failed to send alert' });
  }
});

// ===================================================================
// IMPORT REAL ROUTES HERE
// ===================================================================
// TODO: Import and mount your feature routes:
// import authRoutes from './routes/auth';
// import paymentsRoutes from './routes/payments';
// import transactionsRoutes from './routes/transactions';
// 
// app.use('/api/auth', authRoutes);
// app.use('/api/payments', paymentsRoutes);
// app.use('/api/transactions', transactionsRoutes);

// ===================================================================
// ERROR HANDLERS
// ===================================================================

/**
 * 404 handler - must be after all routes
 */
app.use((req, res) => {
  logger.warn('404 Not Found', { method: req.method, path: req.path });
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Global error handler - must be last middleware
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

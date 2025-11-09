/**
 * Email API Tests
 * Tests email template generation endpoints
 */

import request from 'supertest';
import app from './test-app';

describe('Email API', () => {
  describe('POST /api/email/welcome', () => {
    it('should generate welcome email template', async () => {
      const res = await request(app)
        .post('/api/email/welcome')
        .send({ email: 'test@example.com', name: 'John Doe' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('preview');
      expect(res.body.message).toContain('Welcome email');
    });

    it('should fail without email', async () => {
      const res = await request(app)
        .post('/api/email/welcome')
        .send({ name: 'John Doe' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('email');
    });

    it('should fail without name', async () => {
      const res = await request(app)
        .post('/api/email/welcome')
        .send({ email: 'test@example.com' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('name');
    });

    it('should include template in development mode', async () => {
      process.env.NODE_ENV = 'development';
      
      const res = await request(app)
        .post('/api/email/welcome')
        .send({ email: 'test@example.com', name: 'Jane Smith' });
      
      expect(res.status).toBe(200);
      if (process.env.NODE_ENV === 'development') {
        expect(res.body).toHaveProperty('template');
        expect(res.body.template).toContain('Jane Smith');
      }
    });
  });

  describe('POST /api/email/password-reset', () => {
    it('should generate password reset email', async () => {
      const res = await request(app)
        .post('/api/email/password-reset')
        .send({ email: 'test@example.com', name: 'John Doe' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('preview');
      expect(res.body.message).toContain('Password reset');
    });

    it('should include reset link in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const res = await request(app)
        .post('/api/email/password-reset')
        .send({ email: 'test@example.com', name: 'Test User' });
      
      expect(res.status).toBe(200);
      if (process.env.NODE_ENV === 'development') {
        expect(res.body).toHaveProperty('resetLink');
        expect(res.body.resetLink).toContain('reset-password');
      }
    });

    it('should fail without required fields', async () => {
      const res = await request(app)
        .post('/api/email/password-reset')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/email/verification', () => {
    it('should generate email verification template', async () => {
      const res = await request(app)
        .post('/api/email/verification')
        .send({ email: 'test@example.com', name: 'Alice Brown' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Verification email');
    });

    it('should include verification link in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const res = await request(app)
        .post('/api/email/verification')
        .send({ email: 'test@example.com', name: 'Bob Johnson' });
      
      expect(res.status).toBe(200);
      if (process.env.NODE_ENV === 'development') {
        expect(res.body).toHaveProperty('verificationLink');
        expect(res.body.verificationLink).toContain('verify-email');
      }
    });
  });

  describe('POST /api/email/transaction-alert', () => {
    it('should generate transaction alert email', async () => {
      const transaction = {
        type: 'Deposit',
        amount: 100.50,
        date: '2025-11-09',
        status: 'Completed'
      };

      const res = await request(app)
        .post('/api/email/transaction-alert')
        .send({ 
          email: 'test@example.com', 
          name: 'Charlie Wilson',
          transaction 
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Transaction alert');
    });

    it('should handle transaction with description', async () => {
      const transaction = {
        type: 'Withdrawal',
        amount: 50.00,
        date: '2025-11-09',
        status: 'Pending',
        description: 'Bank transfer'
      };

      const res = await request(app)
        .post('/api/email/transaction-alert')
        .send({ 
          email: 'test@example.com', 
          name: 'Test User',
          transaction 
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('preview');
    });

    it('should fail without transaction data', async () => {
      const res = await request(app)
        .post('/api/email/transaction-alert')
        .send({ 
          email: 'test@example.com', 
          name: 'Test User'
        });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('transaction');
    });
  });

  describe('XSS Protection in Email Templates', () => {
    it('should escape malicious HTML in welcome email', async () => {
      const maliciousName = '<script>alert("xss")</script>';
      
      process.env.NODE_ENV = 'development';
      const res = await request(app)
        .post('/api/email/welcome')
        .send({ email: 'test@example.com', name: maliciousName });
      
      expect(res.status).toBe(200);
      if (res.body.template) {
        expect(res.body.template).not.toContain('<script>');
        expect(res.body.template).toContain('&lt;script&gt;');
      }
    });

    it('should escape malicious content in transaction alert', async () => {
      const transaction = {
        type: '<img src=x onerror=alert(1)>',
        amount: 100,
        date: '2025-11-09',
        status: 'Completed'
      };

      process.env.NODE_ENV = 'development';
      const res = await request(app)
        .post('/api/email/transaction-alert')
        .send({ 
          email: 'test@example.com', 
          name: 'Test User',
          transaction 
        });
      
      expect(res.status).toBe(200);
      if (res.body.template) {
        expect(res.body.template).not.toContain('onerror=');
        expect(res.body.template).toContain('&lt;img');
      }
    });
  });
});

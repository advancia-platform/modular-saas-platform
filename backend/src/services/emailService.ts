import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private from: string;

  constructor() {
    this.from = process.env.EMAIL_FROM || 'noreply@advancia.com';
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured. Email not sent.');
        return { success: false, error: 'Email service not configured' };
      }

      const { data, error } = await resend.emails.send({
        from: options.from || this.from,
        to: options.to,
        subject: options.subject,
        html: options.html
      });

      if (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error: any) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }
  }

  // Email Templates

  async sendWelcomeEmail(to: string, username: string): Promise<any> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Advancia Pay Ledger! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>Thank you for joining Advancia Pay Ledger - your self-hosted financial platform!</p>
            <p>Your account has been successfully created. Here's what you can do:</p>
            <ul>
              <li>💰 Manage your USD balance</li>
              <li>🪙 Earn and use tokens</li>
              <li>🏆 Unlock rewards and achievements</li>
              <li>📊 Track all your transactions</li>
              <li>💳 Generate and manage invoices</li>
            </ul>
            <a href="http://localhost:3000/dashboard" class="button">Go to Dashboard</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Welcome to Advancia Pay Ledger! 🎉',
      html
    });
  }

  async sendTransactionConfirmation(to: string, transactionData: any): Promise<any> {
    const { type, amount, description, transactionId } = transactionData;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${type === 'credit' ? '#10b981' : '#ef4444'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .transaction-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${type === 'credit' ? '#10b981' : '#ef4444'}; }
          .amount { font-size: 32px; font-weight: bold; color: ${type === 'credit' ? '#10b981' : '#ef4444'}; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Transaction ${type === 'credit' ? 'Received' : 'Sent'} ✅</h1>
          </div>
          <div class="content">
            <div class="transaction-box">
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Type:</strong> ${type.toUpperCase()}</p>
              <p><strong>Amount:</strong> <span class="amount">${type === 'credit' ? '+' : '-'}$${amount}</span></p>
              <p><strong>Description:</strong> ${description || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>You can view all your transactions in your dashboard.</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Transaction Confirmation - ${type === 'credit' ? 'Received' : 'Sent'} $${amount}`,
      html
    });
  }

  async sendInvoiceEmail(to: string, invoiceData: any, pdfUrl?: string): Promise<any> {
    const { invoiceNumber, amount, dueDate } = invoiceData;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .invoice-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Invoice - ${invoiceNumber}</h1>
          </div>
          <div class="content">
            <div class="invoice-box">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Amount Due:</strong> $${amount}</p>
              <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            </div>
            <p>Please find your invoice attached ${pdfUrl ? 'or download it using the link below' : ''}.</p>
            ${pdfUrl ? `<a href="${pdfUrl}" class="button">Download Invoice PDF</a>` : ''}
            <p>If you have any questions about this invoice, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Invoice ${invoiceNumber} - $${amount} Due`,
      html
    });
  }

  async sendRewardClaimedEmail(to: string, rewardData: any): Promise<any> {
    const { amount, title, description } = rewardData;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .reward-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .amount { font-size: 48px; font-weight: bold; color: #f59e0b; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Reward Claimed!</h1>
          </div>
          <div class="content">
            <div class="reward-box">
              <h2>${title}</h2>
              <p>${description}</p>
              <div class="amount">+${amount} tokens</div>
            </div>
            <p>Congratulations! Your reward has been added to your token wallet.</p>
            <p>Keep earning more rewards by staying active on the platform!</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `🎁 You claimed ${amount} tokens!`,
      html
    });
  }

  async sendTierUpgradeEmail(to: string, tierData: any): Promise<any> {
    const { newTier, points } = tierData;
    
    const tierEmojis: any = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎',
      diamond: '👑'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .tier-badge { font-size: 80px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Tier Upgrade!</h1>
          </div>
          <div class="content">
            <div class="tier-badge">${tierEmojis[newTier] || '⭐'}</div>
            <h2 style="text-align: center;">Congratulations!</h2>
            <p style="text-align: center; font-size: 18px;">You've been upgraded to <strong>${newTier.toUpperCase()}</strong> tier!</p>
            <p style="text-align: center;">You now have <strong>${points} points</strong></p>
            <p>Keep up the great work! Higher tiers unlock more benefits and exclusive rewards.</p>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `🎉 You've been upgraded to ${newTier.toUpperCase()} tier!`,
      html
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<any> {
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password for your Advancia Pay Ledger account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in 1 hour. If you didn't request this reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>© 2025 Advancia Pay Ledger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Password Reset Request - Advancia Pay Ledger',
      html
    });
  }
}

export default new EmailService();

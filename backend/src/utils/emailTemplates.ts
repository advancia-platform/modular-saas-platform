/**
 * Email Templates for Advancia Pay Ledger
 * All templates include XSS protection via HTML escaping
 */

type Transaction = {
  type: string;
  amount: number;
  date: string;
  status: string;
  description?: string;
};

/**
 * Escape HTML special characters to prevent XSS attacks
 * Includes = to prevent attribute-based XSS
 */
function escape(str: string): string {
  return String(str).replace(/[&<>"'=]/g, c => ({
    '&': '&amp;', 
    '<': '&lt;', 
    '>': '&gt;', 
    '"': '&quot;', 
    "'": '&#39;',
    '=': '&#x3D;'
  }[c] || c));
}

export const emailTemplates = {
  /**
   * Welcome email for new users
   */
  welcome: (name: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Advancia Pay Ledger</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Advancia Pay Ledger!</h1>
        </div>
        <div class="content">
          <h2>Hello ${escape(name)}!</h2>
          <p>Thank you for joining Advancia Pay Ledger. We're excited to have you on board!</p>
          <p>Your account has been successfully created. You can now access all features of our platform.</p>
          <a href="https://advanciapayledger.com/dashboard" class="button">Go to Dashboard</a>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Advancia Pay Ledger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  /**
   * Password reset email
   */
  passwordReset: (name: string, resetLink: string, expiry: string = '1 hour') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #f44336; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${escape(name)},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${escape(resetLink)}" class="button">Reset Password</a>
          <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in ${escape(expiry)}.
          </div>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p><small>If the button doesn't work, copy and paste this link into your browser:<br>${escape(resetLink)}</small></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Advancia Pay Ledger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  /**
   * Email verification
   */
  emailVerification: (name: string, verificationLink: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #4caf50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email Address</h1>
        </div>
        <div class="content">
          <h2>Hello ${escape(name)},</h2>
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          <a href="${escape(verificationLink)}" class="button">Verify Email Address</a>
          <p>This verification link will expire in 24 hours.</p>
          <p><small>If the button doesn't work, copy and paste this link into your browser:<br>${escape(verificationLink)}</small></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Advancia Pay Ledger. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  /**
   * Transaction alert notification
   */
  transactionAlert: (name: string, transaction: Transaction) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196f3; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .transaction-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .status { padding: 5px 15px; border-radius: 3px; display: inline-block; font-size: 12px; font-weight: bold; }
        .status-completed { background: #4caf50; color: white; }
        .status-pending { background: #ff9800; color: white; }
        .status-failed { background: #f44336; color: white; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Transaction Alert</h1>
        </div>
        <div class="content">
          <h2>Hello ${escape(name)},</h2>
          <p>A transaction has been processed on your account:</p>
          <div class="transaction-details">
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="detail-value">${escape(transaction.type)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">$${transaction.amount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${escape(transaction.date)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span class="status status-${transaction.status.toLowerCase()}">${escape(transaction.status)}</span>
              </span>
            </div>
            ${transaction.description ? `
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${escape(transaction.description)}</span>
            </div>
            ` : ''}
          </div>
          <p>If you did not authorize this transaction, please contact our support team immediately.</p>
          <p><a href="https://advanciapayledger.com/transactions" style="color: #2196f3;">View Transaction History</a></p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Advancia Pay Ledger. All rights reserved.</p>
          <p>Questions? Contact us at support@advanciapayledger.com</p>
        </div>
      </div>
    </body>
    </html>
  `
};

export default emailTemplates;

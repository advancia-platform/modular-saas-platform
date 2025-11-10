/**
 * Email Templates for Advancia Pay
 * Pre-built HTML templates for common email types
 */

export const welcomeEmail = (username: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #0070f3 0%, #0051cc 100%);
      color: white; 
      padding: 40px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      background: white; 
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #555;
    }
    .button { 
      background: #0070f3; 
      color: white !important; 
      padding: 14px 28px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 24px 0; 
      font-weight: 500;
      transition: background 0.2s;
    }
    .button:hover {
      background: #0051cc;
    }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Advancia Pay! 🎉</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${username}</strong>,</p>
      <p>Thank you for joining Advancia Pay. We're excited to have you on board!</p>
      <p>Your account has been created successfully and is currently pending admin approval. You'll receive another email once your account is activated.</p>
      <a href="https://www.advanciapayledger.com/dashboard" class="button">Go to Dashboard</a>
      <p>In the meantime, feel free to explore our platform and familiarize yourself with the features.</p>
      <p>If you have any questions, our support team is here to help!</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The Advancia Pay Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Advancia Pay. All rights reserved.</p>
      <p>advanciapayledger.com</p>
    </div>
  </div>
</body>
</html>
`;

export const passwordResetEmail = (resetToken: string, expiryMinutes = 60) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      color: white; 
      padding: 40px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      background: white; 
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #555;
    }
    .button { 
      background: #dc2626; 
      color: white !important; 
      padding: 14px 28px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 24px 0; 
      font-weight: 500;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔒 Password Reset Request</h1>
    </div>
    <div class="content">
      <p>You requested a password reset for your Advancia Pay account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="https://www.advanciapayledger.com/reset-password?token=${resetToken}" class="button">Reset Password</a>
      <div class="warning">
        <p style="margin: 0;"><strong>⏰ This link will expire in ${expiryMinutes} minutes.</strong></p>
      </div>
      <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The Advancia Pay Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Advancia Pay. All rights reserved.</p>
      <p>For security reasons, never share this email with anyone.</p>
    </div>
  </div>
</body>
</html>
`;

export const transactionEmail = (transactionData: {
  amount: number;
  type: string;
  description: string;
  id: string;
  status?: string;
  date?: Date;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white; 
      padding: 40px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      background: white; 
    }
    .amount { 
      font-size: 48px; 
      font-weight: bold; 
      color: #10b981; 
      text-align: center; 
      margin: 30px 0; 
      font-family: 'Courier New', monospace;
    }
    .details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #6b7280;
    }
    .detail-value {
      color: #111827;
      text-align: right;
    }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Transaction Confirmation</h1>
    </div>
    <div class="content">
      <p>Your transaction has been processed successfully.</p>
      <div class="amount">$${transactionData.amount.toFixed(2)}</div>
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Type</span>
          <span class="detail-value">${transactionData.type}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Description</span>
          <span class="detail-value">${transactionData.description}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transaction ID</span>
          <span class="detail-value">${transactionData.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value">${transactionData.status || 'Completed'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${(transactionData.date || new Date()).toLocaleString()}</span>
        </div>
      </div>
      <p>You can view all your transactions in your dashboard.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The Advancia Pay Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Advancia Pay. All rights reserved.</p>
      <p>Questions? Contact support@advanciapayledger.com</p>
    </div>
  </div>
</body>
</html>
`;

export const twoFactorEmail = (code: string, expiryMinutes = 10) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
      color: white; 
      padding: 40px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      background: white; 
    }
    .code-box {
      background: #f3f4f6;
      border: 2px dashed #8b5cf6;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code { 
      font-size: 48px; 
      font-weight: bold; 
      color: #8b5cf6; 
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Two-Factor Authentication</h1>
    </div>
    <div class="content">
      <p>Your verification code for Advancia Pay:</p>
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      <div class="warning">
        <p style="margin: 0;"><strong>⏰ This code will expire in ${expiryMinutes} minutes.</strong></p>
      </div>
      <p>Enter this code to complete your login. Never share this code with anyone.</p>
      <p>If you didn't request this code, please secure your account immediately.</p>
      <p style="margin-top: 30px;">Best regards,<br><strong>The Advancia Pay Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Advancia Pay. All rights reserved.</p>
      <p>This is an automated security message.</p>
    </div>
  </div>
</body>
</html>
`;

export const adminNotificationEmail = (data: {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}) => {
  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#dc2626',
  };
  
  const color = priorityColors[data.priority || 'medium'];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header { 
      background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
      color: white; 
      padding: 40px 20px; 
      text-align: center; 
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .priority-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
    }
    .content { 
      padding: 40px 30px; 
      background: white; 
    }
    .message-box {
      background: #f9fafb;
      border-left: 4px solid ${color};
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .button { 
      background: ${color}; 
      color: white !important; 
      padding: 14px 28px; 
      text-decoration: none; 
      border-radius: 6px; 
      display: inline-block; 
      margin: 24px 0; 
      font-weight: 500;
    }
    .footer {
      padding: 20px 30px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 ${data.title}</h1>
      <div class="priority-badge">${data.priority || 'medium'} priority</div>
    </div>
    <div class="content">
      <div class="message-box">
        <p style="margin: 0; white-space: pre-line;">${data.message}</p>
      </div>
      ${data.actionUrl && data.actionLabel ? `
        <a href="${data.actionUrl}" class="button">${data.actionLabel}</a>
      ` : ''}
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Timestamp: ${new Date().toLocaleString()}<br>
        This is an automated admin notification from Advancia Pay.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Advancia Pay. All rights reserved.</p>
      <p>Admin Dashboard: <a href="https://www.advanciapayledger.com/admin">advanciapayledger.com/admin</a></p>
    </div>
  </div>
</body>
</html>
`;
};

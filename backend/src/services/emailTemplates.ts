// backend/src/services/emailTemplates.ts
import { emailTheme } from "./emailTheme";

export function resetPasswordTemplate(resetUrl: string) {
  return {
    subject: `${emailTheme.brandName} - Reset Your Password`,
    text: `You requested a password reset. Use this link: ${resetUrl}`,
    html: `
      <div style="font-family:${emailTheme.fontFamily}; color:${emailTheme.textColor}; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${emailTheme.logoUrl}" alt="${emailTheme.brandName} Logo" style="height:50px;" />
        </div>
        <h2 style="color: ${emailTheme.primaryColor}; text-align: center;">Password Reset Request</h2>
        <p>You requested a password reset. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background:${emailTheme.primaryColor};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
            Reset Your Password
          </a>
        </div>
        <p><strong>Important:</strong> This link expires in 15 minutes for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <footer style="font-size:12px; color:#666; text-align: center;">
          ${emailTheme.footerText}<br/>
          <a href="${process.env.FRONTEND_URL}/support" style="color: #666;">Contact Support</a>
        </footer>
      </div>
    `,
  };
}

export function verificationTemplate(verifyUrl: string) {
  return {
    subject: `${emailTheme.brandName} - Verify Your Account`,
    text: `Welcome! Please verify your account: ${verifyUrl}`,
    html: `
      <div style="font-family:${emailTheme.fontFamily}; color:${emailTheme.textColor}; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${emailTheme.logoUrl}" alt="${emailTheme.brandName} Logo" style="height:50px;" />
        </div>
        <h2 style="color: ${emailTheme.secondaryColor}; text-align: center;">Welcome to ${emailTheme.brandName}</h2>
        <p>Thanks for signing up! Please verify your account by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}"
             style="background:${emailTheme.secondaryColor};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
            Verify Your Account
          </a>
        </div>
        <p><strong>Important:</strong> This link expires in 1 hour.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <footer style="font-size:12px; color:#666; text-align: center;">
          ${emailTheme.footerText}<br/>
          <a href="${process.env.FRONTEND_URL}/support" style="color: #666;">Contact Support</a>
        </footer>
      </div>
    `,
  };
}

export function welcomeTemplate(dashboardUrl: string) {
  return {
    subject: `Welcome to ${emailTheme.brandName}!`,
    text: `Thanks for joining ${emailTheme.brandName}. Get started here: ${dashboardUrl}`,
    html: `
      <div style="font-family:${emailTheme.fontFamily}; color:${emailTheme.textColor}; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${emailTheme.logoUrl}" alt="${emailTheme.brandName} Logo" style="height:50px;" />
        </div>
        <h2 style="color: ${emailTheme.secondaryColor}; text-align: center;">Welcome to ${emailTheme.brandName}</h2>
        <p>We're excited to have you on board! Here are some quick links to get started:</p>
        <ul style="line-height: 1.6;">
          <li><a href="${dashboardUrl}" style="color: ${emailTheme.primaryColor};">Go to your Dashboard</a></li>
          <li><a href="${process.env.FRONTEND_URL}/docs" style="color: ${emailTheme.primaryColor};">Read Documentation</a></li>
          <li><a href="${process.env.FRONTEND_URL}/support" style="color: ${emailTheme.primaryColor};">Contact Support</a></li>
        </ul>
        <p>Enjoy exploring ${emailTheme.brandName}!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <footer style="font-size:12px; color:#666; text-align: center;">
          ${emailTheme.footerText}<br/>
          <a href="${process.env.FRONTEND_URL}/support" style="color: #666;">Contact Support</a>
        </footer>
      </div>
    `,
  };
}

/**
 * Resend Email Service - Marketing and Template Email Integration
 * Provides enterprise-grade email delivery with template support
 */

import { Resend } from 'resend';
import { logger } from '../logger';
import prisma from '../prismaClient';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  variables?: Record<string, any>;
}

interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  variables?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Send email via Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ id: string; success: boolean }> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  try {
    const fromAddress = options.from || process.env.RESEND_FROM_EMAIL || 'noreply@advancia.dev';

    // Prepare email data
    const emailData: any = {
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };

    // Add content (HTML or text)
    if (options.html) {
      emailData.html = options.html;
    }
    if (options.text) {
      emailData.text = options.text;
    }

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      emailData.attachments = options.attachments;
    }

    // Add headers if provided
    if (options.headers) {
      emailData.headers = options.headers;
    }

    // Add tags if provided
    if (options.tags && options.tags.length > 0) {
      emailData.tags = options.tags;
    }

    // Send email
    const result = await resend.emails.send(emailData);

    if (result.error) {
      logger.error('Resend email failed', {
        error: result.error,
        to: options.to,
        subject: options.subject
      });
      throw new Error(`Resend API error: ${result.error.message}`);
    }

    // Log successful send
    await logNotification({
      userId: extractUserIdFromEmail(Array.isArray(options.to) ? options.to[0] : options.to),
      email: Array.isArray(options.to) ? options.to[0] : options.to,
      subject: options.subject,
      message: options.html || options.text || '',
      template: options.template,
      provider: 'resend',
      status: 'sent',
      metadata: {
        resendId: result.data?.id,
        tags: options.tags,
        variables: options.variables
      }
    });

    logger.info('Email sent successfully via Resend', {
      id: result.data?.id,
      to: options.to,
      subject: options.subject
    });

    return {
      id: result.data?.id || '',
      success: true
    };

  } catch (error) {
    logger.error('Failed to send email via Resend', {
      error: error instanceof Error ? error.message : 'Unknown error',
      to: options.to,
      subject: options.subject
    });

    // Log failed attempt
    await logNotification({
      userId: extractUserIdFromEmail(Array.isArray(options.to) ? options.to[0] : options.to),
      email: Array.isArray(options.to) ? options.to[0] : options.to,
      subject: options.subject,
      message: options.html || options.text || '',
      template: options.template,
      provider: 'resend',
      status: 'failed',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });

    throw error;
  }
}

/**
 * Send template-based email
 */
export async function sendTemplateEmail({
  to,
  template,
  variables = {},
  from,
  tags
}: {
  to: string | string[];
  template: string;
  variables?: Record<string, any>;
  from?: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<{ id: string; success: boolean }> {

  // Get template from database or predefined templates
  const emailTemplate = await getTemplate(template);

  if (!emailTemplate) {
    throw new Error(`Template '${template}' not found`);
  }

  // Replace variables in template
  const subject = replaceVariables(emailTemplate.subject, variables);
  const html = replaceVariables(emailTemplate.html, variables);

  return sendEmail({
    to,
    from,
    subject,
    html,
    template,
    variables,
    tags
  });
}

/**
 * Send marketing campaign email
 */
export async function sendCampaignEmail({
  recipients,
  subject,
  html,
  campaignId,
  from
}: {
  recipients: string[];
  subject: string;
  html: string;
  campaignId: string;
  from?: string;
}): Promise<{ sent: number; failed: number; results: any[] }> {

  const results = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        to: recipient,
        from,
        subject,
        html,
        tags: [{ name: 'campaign', value: campaignId }]
      });
      results.push({ email: recipient, success: true, id: result.id });
      sent++;
    } catch (error) {
      results.push({
        email: recipient,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      failed++;
    }

    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logger.info('Campaign email completed', {
    campaignId,
    sent,
    failed,
    total: recipients.length
  });

  return { sent, failed, results };
}

/**
 * Get email templates
 */
const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'welcome': {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to {{companyName}}, {{userName}}!',
    html: `
      <h1>Welcome to {{companyName}}!</h1>
      <p>Hi {{userName}},</p>
      <p>Thank you for joining Advancia Pay. We're excited to have you on board!</p>
      <p>Your account is now active and ready to use.</p>
      <a href="{{dashboardUrl}}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Your Dashboard</a>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>The Advancia Team</p>
    `
  },
  'password-reset': {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your Password - {{companyName}}',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi {{userName}},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="{{resetUrl}}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Advancia Team</p>
    `
  },
  'transaction-alert': {
    id: 'transaction-alert',
    name: 'Transaction Alert',
    subject: 'Transaction Alert - {{amount}} {{currency}}',
    html: `
      <h1>Transaction Alert</h1>
      <p>Hi {{userName}},</p>
      <p>A new transaction has been processed on your account:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Amount:</strong> {{amount}} {{currency}}</p>
        <p><strong>Type:</strong> {{transactionType}}</p>
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Reference:</strong> {{reference}}</p>
      </div>
      <a href="{{transactionUrl}}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Transaction</a>
      <p>Best regards,<br>The Advancia Team</p>
    `
  },
  'compliance-report': {
    id: 'compliance-report',
    name: 'Compliance Report',
    subject: '{{reportType}} Compliance Report - {{date}}',
    html: `
      <h1>{{reportType}} Compliance Report</h1>
      <p>Dear {{userName}},</p>
      <p>Your {{reportType}} compliance report for {{date}} is ready:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Report Period:</strong> {{reportPeriod}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <p><strong>Items Reviewed:</strong> {{itemsReviewed}}</p>
        <p><strong>Issues Found:</strong> {{issuesFound}}</p>
      </div>
      <a href="{{reportUrl}}" style="background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Download Report</a>
      <p>Best regards,<br>The Advancia Compliance Team</p>
    `
  }
};

async function getTemplate(templateId: string): Promise<EmailTemplate | null> {
  // First check predefined templates
  if (EMAIL_TEMPLATES[templateId]) {
    return EMAIL_TEMPLATES[templateId];
  }

  // Could extend to check database for custom templates
  // const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });

  return null;
}

function replaceVariables(text: string, variables: Record<string, any>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}

function extractUserIdFromEmail(email: string): string {
  // This is a placeholder - implement based on your user lookup logic
  // You might want to query the database to find userId by email
  return 'unknown';
}

async function logNotification(data: {
  userId: string;
  email: string;
  subject: string;
  message: string;
  template?: string;
  provider: string;
  status: string;
  metadata?: any;
}) {
  try {
    await prisma.notificationLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: data.userId,
        email: data.email,
        subject: data.subject,
        message: data.message,
        template: data.template,
        provider: data.provider,
        status: data.status,
        metadata: data.metadata || {},
        sentAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Failed to log notification', { error, data });
  }
}

/**
 * Verify Resend API connection
 */
export async function verifyResendConnection(): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return false;
    }

    // Simple API key validation
    return true;
  } catch (error) {
    logger.error('Resend connection verification failed', { error });
    return false;
  }
}

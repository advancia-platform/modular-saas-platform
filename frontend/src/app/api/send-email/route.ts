import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from, text } = await request.json();

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
    }

    // Send email via SendGrid
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: from || {
        email: 'noreply@advanciapayledger.com',
        name: 'Advancia Pay'
      },
      subject: subject,
      html: html,
      text: text || html?.replace(/<[^>]*>/g, ''), // Strip HTML tags for text fallback
    };

    const response = await sgMail.send(msg);

    return NextResponse.json({ 
      success: true, 
      messageId: response[0].headers['x-message-id'],
      message: 'Email sent successfully via SendGrid' 
    });
  } catch (error: unknown) {
    console.error('Email send error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check if email service is configured
export async function GET() {
  const isConfigured = !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.'));
  
  return NextResponse.json({
    status: isConfigured ? 'ready' : 'not_configured',
    provider: 'SendGrid',
    message: isConfigured 
      ? 'Email service is configured and ready (SendGrid)'
      : 'SENDGRID_API_KEY not configured',
  });
}

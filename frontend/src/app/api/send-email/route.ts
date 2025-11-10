import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from } = await request.json();

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: from || 'Advancia Pay <noreply@advanciapayledger.com>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: data?.id,
      message: 'Email sent successfully' 
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
  const isConfigured = !!process.env.RESEND_API_KEY && 
                       process.env.RESEND_API_KEY !== 're_placeholder';
  
  return NextResponse.json({
    status: isConfigured ? 'ready' : 'not_configured',
    message: isConfigured 
      ? 'Email service is configured and ready'
      : 'RESEND_API_KEY not configured',
  });
}

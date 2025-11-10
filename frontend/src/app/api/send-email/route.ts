import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL || 'advanciapayledger@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD || 'qmbk dljx rubt zihx',
    },
  });
};

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

    const transporter = createTransporter();

    // Send email via Gmail SMTP
    const info = await transporter.sendMail({
      from: from || 'Advancia Pay <advanciapayledger@gmail.com>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      html: html || text,
      text: text,
    });

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully via Gmail SMTP' 
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

// GET endpoint to check Gmail SMTP status
export async function GET() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    
    return NextResponse.json({
      status: 'ready',
      provider: 'Gmail SMTP',
      message: 'Email service is configured and ready',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      provider: 'Gmail SMTP',
      message: 'Gmail SMTP connection failed - check credentials',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

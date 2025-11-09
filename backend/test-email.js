// Quick email test script
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('🔧 Creating email transporter...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '') // Remove spaces
    }
  });

  console.log('✅ Transporter created');
  console.log('📧 Sending test email...');

  try {
    const info = await transporter.sendMail({
      from: `"Advancia Pay Ledger" <${process.env.SMTP_FROM_EMAIL}>`,
      to: process.env.GMAIL_EMAIL, // Send to yourself
      subject: '✅ Email System Test - Advancia Pay Ledger',
      text: 'This is a test email from your Advancia Pay Ledger backend.\n\nIf you receive this, your email system is working!',
      html: `
        <h2>✅ Email System Test</h2>
        <p>This is a test email from your <strong>Advancia Pay Ledger</strong> backend.</p>
        <p>If you receive this, your email system is working correctly!</p>
        <hr>
        <p><strong>Backend:</strong> Running on DigitalOcean (157.245.8.131:4000)</p>
        <p><strong>From:</strong> ${process.env.SMTP_FROM_EMAIL}</p>
        <p><strong>SMTP:</strong> Gmail (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})</p>
        <hr>
        <p><em>Sent: ${new Date().toISOString()}</em></p>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Check inbox:', process.env.GMAIL_EMAIL);
    console.log('');
    console.log('🎉 EMAIL SYSTEM IS WORKING!');
    
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    process.exit(1);
  }
}

testEmail();

# Setting Up Resend Email with Vercel

Since Render is down, you can send emails directly from your Vercel frontend using Resend.

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Resend Package

```bash
cd /root/projects/advancia-pay-ledger/frontend
npm install resend
```

### Step 2: Create API Route

**For App Router (Next.js 13+):**

Create file: `frontend/app/api/send-email/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const data = await resend.emails.send({
      from: from || 'Advancia Pay <noreply@advanciapayledger.com>',
      to: [to],
      subject: subject,
      html: html,
    });

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
```

**For Pages Router (Next.js 12):**

Create file: `frontend/pages/api/send-email.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, from } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html'
      });
    }

    const data = await resend.emails.send({
      from: from || 'Advancia Pay <noreply@advanciapayledger.com>',
      to: [to],
      subject: subject,
      html: html,
    });

    return res.status(200).json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('Email send error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send email'
    });
  }
}
```

### Step 3: Add Environment Variable to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `modular-saas-platform-frontend` or similar
3. Settings → Environment Variables
4. Add new variable:
   ```
   Name: RESEND_API_KEY
   Value: re_... (from Resend once activated)
   ```
5. Click "Save"
6. Redeploy your project

### Step 4: Test Email Sending

```bash
# Once deployed, test with:
curl -X POST https://www.advanciapayledger.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@gmail.com",
    "subject": "Test from Vercel",
    "html": "<h1>Hello from Vercel + Resend!</h1><p>Email is working!</p>"
  }'
```

## 📧 Email Templates

### Welcome Email Template

```typescript
// frontend/lib/email-templates.ts

export const welcomeEmail = (username: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0070f3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f5f5f5; }
    .button { background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Advancia Pay!</h1>
    </div>
    <div class="content">
      <p>Hi ${username},</p>
      <p>Thank you for joining Advancia Pay. We're excited to have you on board!</p>
      <p>Your account has been created and is pending admin approval.</p>
      <a href="https://www.advanciapayledger.com/dashboard" class="button">Go to Dashboard</a>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The Advancia Pay Team</p>
    </div>
  </div>
</body>
</html>
`;

export const passwordResetEmail = (resetToken: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f5f5f5; }
    .button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>You requested a password reset for your Advancia Pay account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="https://www.advanciapayledger.com/reset-password?token=${resetToken}" class="button">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const transactionEmail = (transactionData: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f5f5f5; }
    .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Transaction Confirmation</h1>
    </div>
    <div class="content">
      <p>Your transaction has been processed successfully.</p>
      <div class="amount">$${transactionData.amount}</div>
      <p><strong>Type:</strong> ${transactionData.type}</p>
      <p><strong>Description:</strong> ${transactionData.description}</p>
      <p><strong>Transaction ID:</strong> ${transactionData.id}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>
`;
```

### Using Templates

```typescript
// frontend/app/api/send-email/route.ts
import { welcomeEmail, passwordResetEmail } from '@/lib/email-templates';

// In your POST handler:
const html = welcomeEmail(username);
// or
const html = passwordResetEmail(token);
```

## 🔒 Security Best Practices

### 1. Rate Limiting

```typescript
// frontend/lib/rate-limit.ts
import { NextRequest } from 'next/server';

const rateLimit = new Map();

export function checkRateLimit(req: NextRequest, limit = 5, windowMs = 60000) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const userLimit = rateLimit.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > userLimit.resetTime) {
    userLimit.count = 0;
    userLimit.resetTime = now + windowMs;
  }

  userLimit.count++;
  rateLimit.set(ip, userLimit);

  return userLimit.count <= limit;
}
```

### 2. Protected Route

```typescript
// frontend/app/api/send-email/route.ts
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Rate limiting
  if (!checkRateLimit(request)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Your email sending logic...
}
```

## ✅ Advantages of Vercel + Resend

1. **Faster**: Edge functions run closer to users
2. **Serverless**: Auto-scales, no server management
3. **Simple**: Just API routes, no backend needed
4. **Cost**: Free tier covers most small apps
5. **Reliability**: Vercel uptime > 99.9%

## 🎯 Quick Start Commands

```bash
# 1. Install Resend
cd /root/projects/advancia-pay-ledger/frontend
npm install resend

# 2. Create API route (choose one):
# App Router:
mkdir -p app/api/send-email
# Create route.ts with code above

# Pages Router:
mkdir -p pages/api
# Create send-email.ts with code above

# 3. Commit and push
git add .
git commit -m "feat: add Resend email API route for Vercel"
git push origin main

# 4. Add RESEND_API_KEY to Vercel dashboard
# (Once Resend activates your account)

# 5. Test
curl -X POST https://www.advanciapayledger.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<h1>Hello</h1>"}'
```

## 🔄 Temporary Solution Until Render is Back

This Vercel setup can be:
- **Permanent**: Keep using Vercel for emails (simpler)
- **Temporary**: Use until Render comes back online
- **Hybrid**: Use both (Vercel for marketing, Render for transactional)

**Recommendation:** Keep this Vercel setup even after Render comes back. It's simpler and more reliable for email sending!

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs/functions/serverless-functions
- Resend Docs: https://resend.com/docs/send-with-nextjs
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction

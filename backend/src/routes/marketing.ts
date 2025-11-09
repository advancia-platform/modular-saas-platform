import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
// import prisma from "../prismaClient";

const router = express.Router();

// Configure Mailchimp (Transactional via SMTP in this example)
// For production: use Mailchimp API directly or SMTP integration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * POST /api/marketing/subscribe
 * Subscribe a user to the newsletter
 * TODO: Add NewsletterSubscriber model to schema.prisma
 */
router.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ error: "Valid email required" });
    }

    // TODO: Implement when NewsletterSubscriber model is added
    res.status(501).json({
      error:
        "Newsletter subscription not yet implemented. Add NewsletterSubscriber model to schema.prisma",
    });

    /* Commented until model exists
    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: "Already subscribed" });
    }

    // Create subscription record
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        subscribed: true,
        subscribedAt: new Date(),
      },
    });

    // Send confirmation email (optional)
    if (process.env.EMAIL_USER) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Welcome to Advancia Pay Ledger Newsletter!",
          html: `
            <h2>Welcome to Advancia Pay Ledger! 🎉</h2>
            <p>You've successfully subscribed to our newsletter.</p>
            <p>You'll now receive:</p>
            <ul>
              <li>Updates on new crypto recovery features</li>
              <li>Exclusive rewards and promotions</li>
              <li>Security tips and best practices</li>
              <li>Early access to new features</li>
            </ul>
            <p>Thank you for joining our community!</p>
            <p style="color: #666; font-size: 12px;">
              <a href="${
                process.env.FRONTEND_URL
              }/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a>
            </p>
          `,
        });
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: "Subscription confirmed!",
      subscriber,
    });
    */
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ error: "Subscription failed" });
  }
});

/**
 * POST /api/marketing/contact
 * Send a contact form message
 * TODO: Add ContactMessage model to schema.prisma
 */
router.post("/contact", async (req: Request, res: Response) => {
  try {
    const { name, email, message, subject } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, and message required" });
    }

    // TODO: Implement when ContactMessage model is added
    res
      .status(501)
      .json({
        error:
          "Contact form not yet implemented. Add ContactMessage model to schema.prisma",
      });

    /* Commented until model exists
    // Store in database for admin review
    const contact = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject: subject || "Contact Form Inquiry",
        message,
        read: false,
        createdAt: new Date(),
      },
    });

    // Send notification to admin
    if (process.env.EMAIL_USER) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
          subject: `New Contact: ${subject || "Inquiry"}`,
          html: `
            <h3>New Contact Message</h3>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
          `,
        });
      } catch (emailErr) {
        console.error("Admin notification failed:", emailErr);
      }
    }

    res.json({
      success: true,
      message: "Thank you for contacting us. We'll be in touch soon!",
    });
    */
  } catch (error) {
    console.error("Contact error:", error);
    res.status(500).json({ error: "Message failed to send" });
  }
});

/**
 * GET /api/marketing/analytics
 * Get marketing analytics (public stats)
 * TODO: Implement when models are added
 */
router.get("/analytics", async (req: Request, res: Response) => {
  try {
    // TODO: Implement when models exist
    res.json({
      subscribers: 0,
      contacts: 0,
      timestamp: new Date().toISOString(),
      message: "Marketing models not yet implemented",
    });

    /* Commented until models exist
    const subscriberCount = await prisma.newsletterSubscriber.count({
      where: { subscribed: true },
    });

    const contactCount = await prisma.contactMessage.count();

    res.json({
      subscribers: subscriberCount,
      contacts: contactCount,
      timestamp: new Date().toISOString(),
    });
    */
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;

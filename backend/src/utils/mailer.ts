import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  service: "gmail", // or set host/port/secure for custom SMTP
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendAlert(subject: string, text: string) {
  try {
    await mailer.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ALERT_TO || process.env.SMTP_USER,
      subject,
      text,
    });
  } catch (error) {
    console.error("Failed to send email alert:", error);
  }
}

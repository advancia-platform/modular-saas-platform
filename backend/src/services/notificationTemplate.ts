// backend/src/services/notificationTemplate.ts
import { emailTheme } from "./emailTheme";

export function notificationTemplate(
  subject: string,
  message: string,
  actionUrl?: string,
) {
  return {
    subject: `${emailTheme.brandName} - ${subject}`,
    text: `${message}${actionUrl ? `\n\nView details: ${actionUrl}` : ""}`,
    html: `
      <div style="font-family:${emailTheme.fontFamily}; color:${emailTheme.textColor}; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${emailTheme.logoUrl}" alt="${emailTheme.brandName} Logo" style="height:50px;" />
        </div>
        <h2 style="color: ${emailTheme.primaryColor}; text-align: center;">${subject}</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; line-height: 1.6;">${message}</p>
        </div>
        ${
          actionUrl
            ? `<div style="text-align: center; margin: 30px 0;">
                 <a href="${actionUrl}"
                    style="background:${emailTheme.primaryColor};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                    View Details
                 </a>
               </div>`
            : ""
        }
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <footer style="font-size:12px; color:#666; text-align: center;">
          ${emailTheme.footerText}<br/>
          <a href="${process.env.FRONTEND_URL}/support" style="color: #666;">Contact Support</a>
        </footer>
      </div>
    `,
  };
}

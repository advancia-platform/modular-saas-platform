// RPA Module - Report Generation
// Generate periodic reports (balances, crypto recovery logs, admin actions) and email to admin

import prisma from "../prismaClient";
import { rpaConfig } from "./config";
import fs from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";

interface ReportData {
  title: string;
  generatedAt: Date;
  period: { start: Date; end: Date };
  sections: ReportSection[];
}

interface ReportSection {
  title: string;
  data: any;
  summary?: string;
}

export class ReportGenerator {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeEmailTransporter();
  }

  /**
   * Initialize email transporter for sending reports
   */
  private async initializeEmailTransporter(): Promise<void> {
    try {
      if (rpaConfig.notifications.email.enabled) {
        this.transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
        console.log("✅ Email transporter initialized");
      }
    } catch (error) {
      console.error("❌ Failed to initialize email transporter:", error);
    }
  }

  /**
   * Generate Balance Report
   */
  async generateBalanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ReportData> {
    console.log(
      `📊 Generating balance report from ${startDate.toISOString()} to ${endDate.toISOString()}...`
    );

    const sections: ReportSection[] = [];

    // Section 1: Overall balances
    const totalBalances = await prisma.user.aggregate({
      _sum: { usdBalance: true },
      _avg: { usdBalance: true },
      _count: { id: true },
    });

    sections.push({
      title: "Overall User Balances",
      data: {
        totalUsers: totalBalances._count.id,
        totalUsdBalance: totalBalances._sum.usdBalance?.toString() || "0",
        averageBalance: totalBalances._avg.usdBalance?.toString() || "0",
      },
      summary: `Total users: ${totalBalances._count.id}, Total USD: $${
        totalBalances._sum.usdBalance?.toString() || "0"
      }`,
    });

    // Section 2: Token wallet balances
    const tokenBalances = await prisma.tokenWallet.aggregate({
      _sum: {
        balance: true,
        lockedBalance: true,
        lifetimeEarned: true,
      },
      _count: { id: true },
    });

    sections.push({
      title: "Token Wallet Summary",
      data: {
        totalWallets: tokenBalances._count.id,
        totalBalance: tokenBalances._sum.balance?.toString() || "0",
        totalLocked: tokenBalances._sum.lockedBalance?.toString() || "0",
        totalLifetimeEarned:
          tokenBalances._sum.lifetimeEarned?.toString() || "0",
      },
      summary: `Total tokens in circulation: ${
        tokenBalances._sum.balance?.toString() || "0"
      }`,
    });

    // Section 3: Transaction summary
    const transactions = await prisma.transaction.groupBy({
      by: ["type"],
      _sum: { amount: true },
      _count: { id: true },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    sections.push({
      title: "Transaction Summary",
      data: transactions.map((t) => ({
        type: t.type,
        count: t._count.id,
        totalAmount: t._sum.amount?.toString() || "0",
      })),
      summary: `Total transactions in period: ${transactions.reduce(
        (sum, t) => sum + t._count.id,
        0
      )}`,
    });

    const report: ReportData = {
      title: "Balance and Financial Summary Report",
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      sections,
    };

    return report;
  }

  /**
   * Generate Crypto Orders Report
   */
  async generateCryptoRecoveryReport(
    startDate: Date,
    endDate: Date
  ): Promise<ReportData> {
    console.log(`🔐 Generating crypto orders report...`);

    const sections: ReportSection[] = [];

    // Section 1: Crypto orders
    const cryptoOrders = await prisma.cryptoOrder.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        userId: true,
        cryptoType: true,
        cryptoAmount: true,
        usdAmount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    sections.push({
      title: "Crypto Orders",
      data: cryptoOrders.map((order) => ({
        id: order.id,
        userId: order.userId,
        cryptoType: order.cryptoType,
        cryptoAmount: order.cryptoAmount.toString(),
        usdAmount: order.usdAmount.toString(),
        status: order.status,
        orderedAt: order.createdAt,
      })),
      summary: `Total orders: ${cryptoOrders.length}`,
    });

    // Section 2: Status breakdown
    const statusBreakdown = await prisma.cryptoOrder.groupBy({
      by: ["status"],
      _count: { id: true },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    sections.push({
      title: "Order Status Breakdown",
      data: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    });

    const report: ReportData = {
      title: "Crypto Orders Report",
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      sections,
    };

    return report;
  }

  /**
   * Generate Admin Actions Report
   */
  async generateAdminActionsReport(
    startDate: Date,
    endDate: Date
  ): Promise<ReportData> {
    console.log(`👤 Generating admin actions report...`);

    const sections: ReportSection[] = [];

    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, username: true },
    });

    const adminIds = adminUsers.map((u) => u.id);

    // Section 1: Admin audit logs
    const adminLogs = await prisma.auditLog.findMany({
      where: {
        userId: { in: adminIds },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to latest 100 actions
    });

    sections.push({
      title: "Admin Actions",
      data: adminLogs.map((log) => ({
        admin: adminUsers.find((u) => u.id === log.userId)?.email || "Unknown",
        action: log.action,
        resource: log.resourceType,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress,
      })),
      summary: `Total admin actions: ${adminLogs.length}`,
    });

    // Section 2: Action type breakdown
    const actionBreakdown = await prisma.auditLog.groupBy({
      by: ["action"],
      _count: { id: true },
      where: {
        userId: { in: adminIds },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    sections.push({
      title: "Action Type Breakdown",
      data: actionBreakdown.map((a) => ({
        action: a.action,
        count: a._count.id,
      })),
    });

    const report: ReportData = {
      title: "Admin Actions Report",
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      sections,
    };

    return report;
  }

  /**
   * Format report as HTML
   */
  private formatReportHTML(report: ReportData): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .summary { background-color: #e7f3ff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0; }
    .meta { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <div class="meta">
    <p><strong>Generated:</strong> ${report.generatedAt.toLocaleString()}</p>
    <p><strong>Period:</strong> ${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}</p>
  </div>
`;

    for (const section of report.sections) {
      html += `<h2>${section.title}</h2>`;

      if (section.summary) {
        html += `<div class="summary">${section.summary}</div>`;
      }

      if (Array.isArray(section.data)) {
        html += `<table><thead><tr>`;

        // Table headers
        if (section.data.length > 0) {
          const keys = Object.keys(section.data[0]);
          for (const key of keys) {
            html += `<th>${key}</th>`;
          }
          html += `</tr></thead><tbody>`;

          // Table rows
          for (const row of section.data) {
            html += `<tr>`;
            for (const key of keys) {
              html += `<td>${row[key] || ""}</td>`;
            }
            html += `</tr>`;
          }
        }

        html += `</tbody></table>`;
      } else {
        html += `<pre>${JSON.stringify(section.data, null, 2)}</pre>`;
      }
    }

    html += `
</body>
</html>
`;

    return html;
  }

  /**
   * Save report to file
   */
  private async saveReport(
    report: ReportData,
    format: string = "html"
  ): Promise<string> {
    const storageDir = rpaConfig.reportGeneration.storageLocation;

    // Ensure directory exists
    await fs.mkdir(storageDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const filename = `${report.title.replace(
      /\s+/g,
      "_"
    )}_${timestamp}.${format}`;
    const filepath = path.join(storageDir, filename);

    let content: string;

    if (format === "html") {
      content = this.formatReportHTML(report);
    } else if (format === "json") {
      content = JSON.stringify(report, null, 2);
    } else {
      content = JSON.stringify(report, null, 2);
    }

    await fs.writeFile(filepath, content, "utf-8");
    console.log(`📁 Report saved: ${filepath}`);

    return filepath;
  }

  /**
   * Email report to recipients
   */
  private async emailReport(
    report: ReportData,
    filepath: string
  ): Promise<void> {
    if (!this.transporter) {
      console.warn("⚠️  Email transporter not initialized, skipping email...");
      return;
    }

    const recipients = rpaConfig.reportGeneration.recipients;
    if (recipients.length === 0) {
      console.warn("⚠️  No report recipients configured");
      return;
    }

    try {
      const htmlContent = this.formatReportHTML(report);

      await this.transporter.sendMail({
        from: rpaConfig.notifications.email.from,
        to: recipients.join(", "),
        subject: `${report.title} - ${report.generatedAt.toLocaleDateString()}`,
        html: htmlContent,
        attachments: [
          {
            filename: path.basename(filepath),
            path: filepath,
          },
        ],
      });

      console.log(`✅ Report emailed to ${recipients.length} recipient(s)`);
    } catch (error) {
      console.error("❌ Failed to email report:", error);
    }
  }

  /**
   * Generate and distribute a report
   */
  async generateAndDistribute(
    reportType: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    try {
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 24 * 60 * 60 * 1000); // Default: last 24 hours

      let report: ReportData;

      switch (reportType) {
        case "balance":
          report = await this.generateBalanceReport(start, end);
          break;
        case "crypto_recovery":
          report = await this.generateCryptoRecoveryReport(start, end);
          break;
        case "admin_actions":
          report = await this.generateAdminActionsReport(start, end);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      // Save report
      const filepath = await this.saveReport(
        report,
        rpaConfig.reportGeneration.outputFormat
      );

      // Email report
      await this.emailReport(report, filepath);

      console.log(`✅ Report generation complete: ${reportType}`);
    } catch (error) {
      console.error(`❌ Report generation failed for ${reportType}:`, error);
    }
  }

  /**
   * Generate all scheduled reports
   */
  async generateAllReports(): Promise<void> {
    console.log("📊 Generating all scheduled reports...");

    const reportTypes = rpaConfig.reportGeneration.reportTypes;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const today = new Date();

    for (const reportType of reportTypes) {
      await this.generateAndDistribute(reportType, yesterday, today);
    }

    console.log("✅ All reports generated successfully");
  }
}

export default new ReportGenerator();

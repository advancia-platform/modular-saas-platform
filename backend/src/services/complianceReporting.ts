import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { logger } from '../logger';
import { sendEmail } from './notificationService';

const prisma = new PrismaClient();

interface ComplianceReport {
  reportType: 'weekly' | 'monthly' | 'quarterly';
  period: {
    start: Date;
    end: Date;
  };
  stats: {
    totalAdminActions: number;
    uniqueAdmins: number;
    criticalActions: number;
    failedActions: number;
    notificationsSent: number;
    failedNotifications: number;
  };
  adminActivity: Array<{
    adminId: string;
    adminEmail: string;
    adminRole: string;
    actionsCount: number;
    lastActivity: Date;
  }>;
  auditHighlights: Array<{
    action: string;
    count: number;
    admins: string[];
  }>;
}

/**
 * Generate compliance report for a specific date range
 */
export async function generateComplianceReport(
  reportType: 'weekly' | 'monthly' | 'quarterly',
  startDate: Date,
  endDate: Date
): Promise<ComplianceReport> {
  try {
    logger.info('Generating compliance report', {
      reportType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Get admin audit trail stats
    const adminAuditStats = await prisma.adminAuditTrail.aggregate({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    });

    // Get unique admins count
    const uniqueAdmins = await prisma.adminAuditTrail.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        adminId: true
      },
      distinct: ['adminId']
    });

    // Get critical actions (admin role changes, data exports, deletions)
    const criticalActions = await prisma.adminAuditTrail.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        },
        action: {
          in: ['UPDATE_USER_ROLE', 'DELETE_USER', 'EXPORT_ADMIN_AUDIT_TRAIL', 'EXPORT_NOTIFICATION_LOGS']
        }
      }
    });

    // Get notification stats
    const notificationStats = await prisma.notificationLog.aggregate({
      where: {
        sentAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      }
    });

    const failedNotifications = await prisma.notificationLog.count({
      where: {
        sentAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'failed'
      }
    });

    // Get admin activity breakdown
    const adminActivity = await prisma.adminAuditTrail.groupBy({
      by: ['adminId'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      },
      _max: {
        timestamp: true
      }
    });

    // Enrich admin activity with user details
    const enrichedAdminActivity = await Promise.all(
      adminActivity.map(async (activity) => {
        const admin = await prisma.user.findUnique({
          where: { id: activity.adminId },
          select: {
            email: true,
            role: true
          }
        });

        return {
          adminId: activity.adminId,
          adminEmail: admin?.email || 'Unknown',
          adminRole: admin?.role || 'Unknown',
          actionsCount: activity._count.id,
          lastActivity: activity._max.timestamp || new Date()
        };
      })
    );

    // Get audit highlights (most common actions)
    const auditHighlights = await prisma.adminAuditTrail.groupBy({
      by: ['action'],
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get admins for each action type
    const enrichedHighlights = await Promise.all(
      auditHighlights.map(async (highlight) => {
        const admins = await prisma.adminAuditTrail.findMany({
          where: {
            action: highlight.action,
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            admin: {
              select: {
                email: true
              }
            }
          },
          distinct: ['adminId']
        });

        return {
          action: highlight.action,
          count: highlight._count.id,
          admins: admins.map(a => a.admin.email)
        };
      })
    );

    const report: ComplianceReport = {
      reportType,
      period: {
        start: startDate,
        end: endDate
      },
      stats: {
        totalAdminActions: adminAuditStats._count.id || 0,
        uniqueAdmins: uniqueAdmins.length,
        criticalActions,
        failedActions: 0, // We don't track failed actions yet
        notificationsSent: notificationStats._count.id || 0,
        failedNotifications
      },
      adminActivity: enrichedAdminActivity,
      auditHighlights: enrichedHighlights
    };

    logger.info('Compliance report generated successfully', {
      reportType,
      totalAdminActions: report.stats.totalAdminActions,
      uniqueAdmins: report.stats.uniqueAdmins
    });

    return report;
  } catch (error) {
    logger.error('Failed to generate compliance report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    throw error;
  }
}

/**
 * Export compliance report as CSV
 */
export function exportComplianceReportCSV(report: ComplianceReport): string {
  try {
    const csvData = [
      // Summary section
      {
        'Report Type': report.reportType,
        'Period Start': report.period.start.toISOString(),
        'Period End': report.period.end.toISOString(),
        'Total Admin Actions': report.stats.totalAdminActions,
        'Unique Admins': report.stats.uniqueAdmins,
        'Critical Actions': report.stats.criticalActions,
        'Failed Actions': report.stats.failedActions,
        'Notifications Sent': report.stats.notificationsSent,
        'Failed Notifications': report.stats.failedNotifications
      }
    ];

    const fields = [
      'Report Type', 'Period Start', 'Period End', 'Total Admin Actions',
      'Unique Admins', 'Critical Actions', 'Failed Actions',
      'Notifications Sent', 'Failed Notifications'
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(csvData);

    logger.info('Compliance report CSV exported', {
      reportType: report.reportType,
      recordCount: csvData.length
    });

    return csv;
  } catch (error) {
    logger.error('Failed to export compliance report CSV', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Generate compliance report as PDF
 */
export async function exportComplianceReportPDF(report: ComplianceReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (buffer) => {
        buffers.push(buffer);
      });

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20).text('Compliance Report', 50, 50);
      doc.fontSize(14).text(`Report Type: ${report.reportType.toUpperCase()}`, 50, 80);
      doc.text(`Period: ${report.period.start.toDateString()} to ${report.period.end.toDateString()}`, 50, 100);

      // Summary Statistics
      doc.fontSize(16).text('Summary Statistics', 50, 140);
      doc.fontSize(12)
        .text(`Total Admin Actions: ${report.stats.totalAdminActions}`, 50, 170)
        .text(`Unique Admins: ${report.stats.uniqueAdmins}`, 50, 190)
        .text(`Critical Actions: ${report.stats.criticalActions}`, 50, 210)
        .text(`Failed Actions: ${report.stats.failedActions}`, 50, 230)
        .text(`Notifications Sent: ${report.stats.notificationsSent}`, 50, 250)
        .text(`Failed Notifications: ${report.stats.failedNotifications}`, 50, 270);

      // Admin Activity
      if (report.adminActivity.length > 0) {
        doc.fontSize(16).text('Admin Activity', 50, 310);
        let yPos = 340;

        report.adminActivity.slice(0, 10).forEach((admin, index) => {
          doc.fontSize(10)
            .text(`${index + 1}. ${admin.adminEmail} (${admin.adminRole})`, 50, yPos)
            .text(`Actions: ${admin.actionsCount}, Last Activity: ${admin.lastActivity.toDateString()}`, 70, yPos + 15);
          yPos += 35;

          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
        });
      }

      // Audit Highlights
      if (report.auditHighlights.length > 0) {
        doc.addPage();
        doc.fontSize(16).text('Audit Highlights', 50, 50);
        let yPos = 80;

        report.auditHighlights.slice(0, 15).forEach((highlight, index) => {
          doc.fontSize(10)
            .text(`${index + 1}. ${highlight.action}: ${highlight.count} times`, 50, yPos)
            .text(`Admins: ${highlight.admins.slice(0, 3).join(', ')}${highlight.admins.length > 3 ? '...' : ''}`, 70, yPos + 15);
          yPos += 35;

          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
        });
      }

      // Footer
      doc.fontSize(8).text(`Generated on: ${new Date().toISOString()}`, 50, doc.page.height - 50);

      doc.end();

      logger.info('Compliance report PDF generated', {
        reportType: report.reportType
      });
    } catch (error) {
      logger.error('Failed to generate compliance report PDF', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      reject(error);
    }
  });
}

/**
 * Send compliance report via email
 */
export async function sendComplianceReport(
  report: ComplianceReport,
  recipients: string[],
  format: 'csv' | 'pdf' | 'both' = 'both'
): Promise<void> {
  try {
    logger.info('Sending compliance report', {
      reportType: report.reportType,
      recipients: recipients.length,
      format
    });

    const subject = `${report.reportType.toUpperCase()} Compliance Report - ${report.period.start.toDateString()} to ${report.period.end.toDateString()}`;

    const message = `
Dear Administrator,

Please find attached the ${report.reportType} compliance report for the period from ${report.period.start.toDateString()} to ${report.period.end.toDateString()}.

Summary:
- Total Admin Actions: ${report.stats.totalAdminActions}
- Unique Admins: ${report.stats.uniqueAdmins}
- Critical Actions: ${report.stats.criticalActions}
- Notifications Sent: ${report.stats.notificationsSent}
- Failed Notifications: ${report.stats.failedNotifications}

This report is automatically generated for compliance monitoring purposes.

Best regards,
Advancia Pay System
    `;

    const attachments = [];

    if (format === 'csv' || format === 'both') {
      const csvData = exportComplianceReportCSV(report);
      attachments.push({
        filename: `compliance_report_${report.reportType}_${report.period.start.toISOString().split('T')[0]}.csv`,
        content: csvData,
        contentType: 'text/csv'
      });
    }

    if (format === 'pdf' || format === 'both') {
      const pdfBuffer = await exportComplianceReportPDF(report);
      attachments.push({
        filename: `compliance_report_${report.reportType}_${report.period.start.toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    for (const recipient of recipients) {
      await sendEmail(
        recipient,
        subject,
        message,
        undefined, // template
        attachments
      );
    }

    logger.info('Compliance report sent successfully', {
      reportType: report.reportType,
      recipients: recipients.length
    });
  } catch (error) {
    logger.error('Failed to send compliance report', {
      error: error instanceof Error ? error.message : 'Unknown error',
      reportType: report.reportType,
      recipients: recipients.length
    });
    throw error;
  }
}

/**
 * Get compliance report recipients based on configuration
 */
export async function getComplianceReportRecipients(): Promise<string[]> {
  try {
    // Get all super admins for compliance reports
    const superAdmins = await prisma.user.findMany({
      where: {
        role: 'SUPER_ADMIN',
        // Add any additional filters like active status
      },
      select: {
        email: true
      }
    });

    const recipients = superAdmins.map(admin => admin.email);

    // Add any configured external recipients from env vars
    const externalRecipients = process.env.COMPLIANCE_REPORT_RECIPIENTS?.split(',') || [];
    recipients.push(...externalRecipients);

    logger.info('Retrieved compliance report recipients', {
      totalRecipients: recipients.length,
      superAdmins: superAdmins.length,
      externalRecipients: externalRecipients.length
    });

    return recipients.filter(Boolean); // Remove empty strings
  } catch (error) {
    logger.error('Failed to get compliance report recipients', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}

/**
 * Generate and send weekly compliance report
 */
export async function generateWeeklyComplianceReport(): Promise<void> {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);

  const report = await generateComplianceReport('weekly', startDate, endDate);
  const recipients = await getComplianceReportRecipients();

  if (recipients.length > 0) {
    await sendComplianceReport(report, recipients);
  }
}

/**
 * Generate and send monthly compliance report
 */
export async function generateMonthlyComplianceReport(): Promise<void> {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  startDate.setHours(0, 0, 0, 0);

  const report = await generateComplianceReport('monthly', startDate, endDate);
  const recipients = await getComplianceReportRecipients();

  if (recipients.length > 0) {
    await sendComplianceReport(report, recipients);
  }
}

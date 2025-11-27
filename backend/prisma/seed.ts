import bcrypt from "bcrypt";

// Import the existing prisma client setup
import prisma from "../src/prismaClient";

async function main() {
  console.log("🌱 Seeding test database...");

  // Clear existing data
  await prisma.complianceMetric.deleteMany();
  await prisma.complianceReport.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleared existing data");

  // Insert test users
  const hashedPassword = await bcrypt.hash("TestPassword123!", 10);

  const testUser = await prisma.user.create({
    data: {
      email: "testuser@example.com",
      username: "testuser",
      passwordHash: hashedPassword,
      firstName: "Test",
      lastName: "User",
      role: "USER",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: "staff@example.com",
      username: "staff",
      passwordHash: hashedPassword,
      firstName: "Staff",
      lastName: "Member",
      role: "STAFF",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin",
      passwordHash: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  const superAdminUser = await prisma.user.create({
    data: {
      email: "superadmin@example.com",
      username: "superadmin",
      passwordHash: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPERADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    },
  });

  console.log("👤 Created test users with all roles");

  // Insert compliance reports
  const report1 = await prisma.complianceReport.create({
    data: {
      title: "PCI-DSS Compliance Report",
      description: "Annual PCI-DSS compliance assessment",
      reportType: "POLICY_AUDIT",
      status: "COMPLETED",
      severity: "HIGH",
      createdById: testUser.id,
      reviewedById: adminUser.id,
      completedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      reportData: {
        framework: "PCI-DSS",
        version: "3.2.1",
        scope: ["Card data processing", "Payment gateway"],
        findings: [
          "Strong encryption in use",
          "Access controls properly configured",
        ],
      },
      findings:
        "System demonstrates strong compliance with PCI-DSS requirements",
      recommendations:
        "Continue monthly security reviews and update patches regularly",
      riskScore: 2.5,
      complianceScore: 92.0,
      version: "1.0",
      tags: ["pci-dss", "payment", "security"],
    },
  });

  const report2 = await prisma.complianceReport.create({
    data: {
      title: "ISO 27001 Security Assessment",
      description: "Information security management system evaluation",
      reportType: "SECURITY_SCAN",
      status: "IN_PROGRESS",
      severity: "MEDIUM",
      createdById: adminUser.id,
      scheduledFor: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      reportData: {
        framework: "ISO 27001",
        version: "2013",
        scope: ["Information systems", "Data management"],
        findings: [
          "Some access controls need enhancement",
          "Documentation gaps identified",
        ],
      },
      findings: "Partial compliance with areas for improvement identified",
      recommendations: "Strengthen access controls and complete documentation",
      riskScore: 4.2,
      complianceScore: 75.0,
      version: "1.1",
      tags: ["iso-27001", "security", "information-systems"],
    },
  });

  console.log("📊 Created compliance reports");

  // Create compliance metrics
  await prisma.complianceMetric.create({
    data: {
      reportId: report1.id,
      metricType: "POLICY_COMPLIANCE",
      category: "Security",
      source: "manual-audit",
      name: "Overall Compliance Score",
      value: 92.0,
      threshold: 85.0,
      status: "COMPLIANT",
      description: "Overall compliance percentage across all requirements",
    },
  });

  await prisma.complianceMetric.create({
    data: {
      reportId: report1.id,
      metricType: "VULNERABILITY_COUNT",
      category: "Security",
      source: "security-scanner",
      name: "Critical Issues",
      value: 0,
      threshold: 2.0,
      status: "COMPLIANT",
      description: "Number of critical compliance issues identified",
    },
  });

  await prisma.complianceMetric.create({
    data: {
      reportId: report2.id,
      metricType: "SECURITY_COVERAGE",
      category: "Governance",
      source: "iso27001-assessment",
      name: "Security Control Coverage",
      value: 75.0,
      threshold: 80.0,
      status: "NON_COMPLIANT",
      description: "Percentage of required security controls implemented",
    },
  });

  console.log("📈 Created compliance metrics");

  console.log("✅ Seeding complete");
  console.log(`   Users created: ${testUser.email}, ${adminUser.email}`);
  console.log(`   Reports created: ${report1.title}, ${report2.title}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

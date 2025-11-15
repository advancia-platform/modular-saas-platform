/**
 * Seed Alert Policies
 * Run: npx ts-node prisma/seed-alert-policies.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding alert policies...");

  const policies = [
    {
      routeGroup: "auth",
      threshold: 10,
      cooldown: 300000, // 5 minutes
      mode: "IMMEDIATE",
      channels: ["email", "sms", "slack", "teams", "websocket", "sentry"],
      severity: "CRITICAL",
      enabled: true,
      createdBy: "system-seed",
      updatedBy: "system-seed",
    },
    {
      routeGroup: "admin",
      threshold: 20,
      cooldown: 300000,
      mode: "IMMEDIATE",
      channels: ["email", "slack", "teams", "sentry"],
      severity: "HIGH",
      enabled: true,
      createdBy: "system-seed",
      updatedBy: "system-seed",
    },
    {
      routeGroup: "payments",
      threshold: 30,
      cooldown: 600000, // 10 minutes
      mode: "IMMEDIATE",
      channels: ["email", "sms", "slack", "sentry"],
      severity: "HIGH",
      enabled: true,
      createdBy: "system-seed",
      updatedBy: "system-seed",
    },
    {
      routeGroup: "crypto",
      threshold: 25,
      cooldown: 300000,
      mode: "IMMEDIATE",
      channels: ["email", "slack", "sentry"],
      severity: "HIGH",
      enabled: true,
      createdBy: "system-seed",
      updatedBy: "system-seed",
    },
    {
      routeGroup: "api",
      threshold: 100,
      cooldown: 300000,
      mode: "BATCHED",
      batchIntervalMs: 300000, // 5 minutes
      channels: ["email", "slack"],
      severity: "MEDIUM",
      enabled: true,
      createdBy: "system-seed",
      updatedBy: "system-seed",
    },
    {
      routeGroup: "user",
      threshold: 150,
      cooldown: 600000,
      mode: "BATCHED",
      batchIntervalMs: 600000, // 10 minutes
      channels: ["email"],
      severity: "LOW",
      enabled: true,
      createdBy: "system-seed",
      updatedBy: "system-seed",
    },
    {
      routeGroup: "public",
      threshold: 200,
      cooldown: 900000, // 15 minutes
      mode: "BATCHED",
      batchIntervalMs: 900000,
      channels: ["email"],
      severity: "LOW",
      enabled: true,
      createdBy: "system-seed",
      updatedBy: "system-seed",
    },
  ];

  let created = 0;
  let updated = 0;

  for (const policy of policies) {
    const result = await prisma.alertPolicy.upsert({
      where: { routeGroup: policy.routeGroup },
      update: {
        threshold: policy.threshold,
        cooldown: policy.cooldown,
        mode: policy.mode as any,
        batchIntervalMs: policy.batchIntervalMs,
        channels: policy.channels,
        severity: policy.severity as any,
        enabled: policy.enabled,
        updatedBy: policy.updatedBy,
      },
      create: policy as any,
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      created++;
      console.log(`✓ Created policy for ${policy.routeGroup}`);
    } else {
      updated++;
      console.log(`✓ Updated policy for ${policy.routeGroup}`);
    }
  }

  console.log(
    `\n🎉 Done! ${created} policies created, ${updated} policies updated.`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

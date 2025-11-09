import prisma from "../prismaClient";
import { sendAlert } from "../utils/mailer";

export async function runSecurityRPA() {
  const now = new Date();

  // Auto-unblock expired IPs
  const expiredBlocks = await prisma.ipBlock.findMany({
    where: { until: { lt: now } },
  });

  if (expiredBlocks.length) {
    await prisma.ipBlock.deleteMany({
      where: { until: { lt: now } },
    });

    const list = expiredBlocks.map((b: { ip: string }) => b.ip).join(", ");
    await sendAlert(
      "✅ Advancia Security: IPs Unblocked",
      `Automatically unblocked ${expiredBlocks.length} IP(s): ${list}`
    );
  }

  // Compute current threat level (blocks in last hour)
  const sinceHour = new Date(Date.now() - 60 * 60 * 1000);
  const blocksHour = await prisma.ipBlock.count({
    where: { updatedAt: { gt: sinceHour } },
  });

  // Alert thresholds
  if (blocksHour === 0) {
    await sendAlert(
      "🟢 Advancia: System Normal",
      "No IP blocks detected in the last hour. Security baseline restored."
    );
  } else if (blocksHour > 5) {
    await sendAlert(
      "🟠 Advancia Alert",
      `Moderate threat: ${blocksHour} IP blocks in the last hour.`
    );
  } else if (blocksHour > 15) {
    await sendAlert(
      "🔴 Critical Threat Level",
      `High anomaly activity (${blocksHour} IP blocks/hr). Immediate review recommended.`
    );
  }

  // Optional: Send to security webhook if configured
  if (process.env.SECURITY_WEBHOOK_URL && blocksHour > 0) {
    try {
      await fetch(process.env.SECURITY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Security Alert: ${blocksHour} IP blocks in the last hour`,
        }),
      });
    } catch (error) {
      console.error("Failed to send security webhook:", error);
    }
  }
}

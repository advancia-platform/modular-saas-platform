import "dotenv/config";
import prisma from "../src/prismaClient";

async function main() {
  const samples = [
    {
      ip: "203.0.113.10",
      reason: "Test block",
      until: new Date(Date.now() + 60 * 60 * 1000),
    },
    {
      ip: "198.51.100.42",
      reason: "Suspicious activity (test)",
      until: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  ];

  for (const s of samples) {
    await prisma.ipBlock.upsert({
      where: { ip: s.ip },
      update: { reason: s.reason, until: s.until },
      create: { ip: s.ip, reason: s.reason, until: s.until },
    });
  }

  console.log("✅ Seeded IP blocks:", samples.map((s) => s.ip).join(", "));
}

main()
  .catch((e) => {
    console.error("Seed IP blocks failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

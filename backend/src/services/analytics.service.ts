import { startOfDay, subDays } from "date-fns";
import { prisma } from "../prismaClient";

export async function getDashboardMetrics() {
  const now = new Date();
  const last30Days = subDays(now, 30);

  // Active subscriptions as proxy for active users
  const activeUsers = await prisma.subscription.count({
    where: { status: "ACTIVE" },
  });

  const newSignups = await prisma.user.count({
    where: { createdAt: { gte: last30Days } },
  });

  // Placeholder revenue until invoices/payments exist; ensure Subscription has planPriceCents:Int
  let revenueCents = 0;
  try {
    const revenueAgg = await prisma.subscription.aggregate({
      _sum: { planPriceCents: true as any },
    } as any);
    // Prisma typing workaround for aggregate with nested fields
    revenueCents = (revenueAgg as any)?._sum?.planPriceCents ?? 0;
  } catch {
    revenueCents = 0;
  }

  const usageEvents = await prisma.usageEvent.findMany({
    where: { createdAt: { gte: last30Days } },
    orderBy: { createdAt: "asc" },
    select: { userId: true, createdAt: true },
  });

  const dailyMap = new Map<string, Set<string>>();
  for (const event of usageEvents) {
    const day = startOfDay(event.createdAt).toISOString().slice(0, 10);
    if (!dailyMap.has(day)) dailyMap.set(day, new Set());
    dailyMap.get(day)!.add(event.userId);
  }

  const dailyActiveUsers = [...dailyMap.entries()].map(([date, users]) => ({
    date,
    value: users.size,
  }));

  const grouped = await prisma.subscription.groupBy({
    by: ["planId"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });

  const plans = await prisma.plan.findMany({
    where: { id: { in: grouped.map((g) => g.planId) } },
    select: { id: true, name: true },
  });

  const planMap = new Map(plans.map((p) => [p.id, p.name]));

  const topPlans = grouped.map((g) => ({
    plan: planMap.get(g.planId) ?? "Unknown",
    count: g._count._all,
  }));

  return {
    kpis: {
      activeUsers,
      newSignups,
      revenue: revenueCents,
      conversionRate:
        activeUsers > 0 ? Number(((newSignups / activeUsers) * 100).toFixed(1)) : 0,
    },
    charts: {
      dailyActiveUsers,
      revenueByDay: dailyActiveUsers.map((d) => ({
        date: d.date,
        value: d.value * 3.5, // placeholder until invoices/payments exist
      })),
    },
    topPlans,
  };
}

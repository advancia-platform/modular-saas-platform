import express from "express";
import { Parser } from "json2csv";
import PDFDocument from "pdfkit";
import { z } from "zod";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import prisma from "../prismaClient";

const router = express.Router();

const safeAuth: any =
  typeof authenticateToken === "function"
    ? authenticateToken
    : (_req: any, _res: any, next: any) => next();

const safeAdmin: any =
  typeof requireAdmin === "function"
    ? requireAdmin
    : (_req: any, _res: any, next: any) => next();

// Validation schemas
const cashflowQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(["daily", "weekly", "monthly", "yearly"]).default("monthly"),
  category: z.string().optional(),
});

// Helper: Get date range
function getDateRange(
  period: string,
  customStart?: string,
  customEnd?: string,
) {
  const end = customEnd ? new Date(customEnd) : new Date();
  let start: Date;

  if (customStart) {
    start = new Date(customStart);
  } else {
    switch (period) {
      case "daily":
        start = new Date(end);
        start.setDate(end.getDate() - 30);
        break;
      case "weekly":
        start = new Date(end);
        start.setDate(end.getDate() - 90);
        break;
      case "yearly":
        start = new Date(end);
        start.setFullYear(end.getFullYear() - 3);
        break;
      case "monthly":
      default:
        start = new Date(end);
        start.setMonth(end.getMonth() - 12);
        break;
    }
  }

  return { start, end };
}

// Helper: Group transactions by period
function groupByPeriod(transactions: any[], period: string) {
  const groups: Record<
    string,
    { income: number; expenses: number; net: number }
  > = {};

  transactions.forEach((t) => {
    let key: string;
    const date = new Date(t.createdAt);

    switch (period) {
      case "daily":
        key = date.toISOString().split("T")[0];
        break;
      case "weekly":
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-W${weekNum}`;
        break;
      case "yearly":
        key = String(date.getFullYear());
        break;
      case "monthly":
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
    }

    if (!groups[key]) {
      groups[key] = { income: 0, expenses: 0, net: 0 };
    }

    const amount = Number(t.amount);
    if (t.type === "credit") {
      groups[key].income += amount;
    } else {
      groups[key].expenses += amount;
    }
    groups[key].net = groups[key].income - groups[key].expenses;
  });

  return Object.entries(groups)
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

// Helper: Calculate forecasting using linear regression
function calculateForecast(historicalData: any[], periods: number = 3) {
  if (historicalData.length < 2) return [];

  const xValues = historicalData.map((_, i) => i);
  const yIncome = historicalData.map((d) => d.income);
  const yExpenses = historicalData.map((d) => d.expenses);

  const linearRegression = (x: number[], y: number[]) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  };

  const incomeRegression = linearRegression(xValues, yIncome);
  const expensesRegression = linearRegression(xValues, yExpenses);

  const forecast = [];
  const lastIndex = historicalData.length - 1;

  for (let i = 1; i <= periods; i++) {
    const futureX = lastIndex + i;
    const income = Math.max(
      0,
      incomeRegression.slope * futureX + incomeRegression.intercept,
    );
    const expenses = Math.max(
      0,
      expensesRegression.slope * futureX + expensesRegression.intercept,
    );

    forecast.push({
      period: `Forecast +${i}`,
      income: parseFloat(income.toFixed(2)),
      expenses: parseFloat(expenses.toFixed(2)),
      net: parseFloat((income - expenses).toFixed(2)),
      isForecast: true,
    });
  }

  return forecast;
}

// 1. Get Cash Flow Data
router.get("/:userId", safeAuth as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const query = cashflowQuerySchema.parse(req.query);
    const { start, end } = getDateRange(
      query.period,
      query.startDate,
      query.endDate,
    );

    const whereClause: any = {
      userId,
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (query.category) {
      whereClause.category = query.category;
    }

    const transactions = await prisma.transactions.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    });

    const cashFlowData = groupByPeriod(transactions, query.period);

    // Calculate summary statistics
    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = cashFlowData.reduce((sum, d) => sum + d.expenses, 0);
    const netCashFlow = totalIncome - totalExpenses;
    const averageIncome = totalIncome / (cashFlowData.length || 1);
    const averageExpenses = totalExpenses / (cashFlowData.length || 1);
    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    res.json({
      success: true,
      data: {
        cashFlow: cashFlowData,
        summary: {
          totalIncome: parseFloat(totalIncome.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          netCashFlow: parseFloat(netCashFlow.toFixed(2)),
          averageIncome: parseFloat(averageIncome.toFixed(2)),
          averageExpenses: parseFloat(averageExpenses.toFixed(2)),
          savingsRate: parseFloat(savingsRate.toFixed(2)),
          period: query.period,
          dateRange: { start, end },
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching cash flow:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
});

// 2. Get Cash Flow Forecast
router.get("/:userId/forecast", safeAuth as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const periods = parseInt(req.query.periods as string) || 3;
    const period = (req.query.period as string) || "monthly";

    const { start, end } = getDateRange(period);

    const transactions = await prisma.transactions.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const historicalData = groupByPeriod(transactions, period);
    const forecast = calculateForecast(historicalData, periods);

    res.json({
      success: true,
      data: {
        historical: historicalData,
        forecast,
        method: "linear_regression",
        confidence:
          historicalData.length >= 6
            ? "high"
            : historicalData.length >= 3
              ? "medium"
              : "low",
      },
    });
  } catch (error: any) {
    console.error("Error generating forecast:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
});

// 3. Get Detailed Cash Flow Report
router.get("/:userId/report", safeAuth as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const query = cashflowQuerySchema.parse(req.query);
    const { start, end } = getDateRange(
      query.period,
      query.startDate,
      query.endDate,
    );

    const transactions = await prisma.transactions.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by category
    const categoryBreakdown: Record<
      string,
      { income: number; expenses: number; count: number }
    > = {};
    const monthlyTrends = groupByPeriod(transactions, "monthly");

    transactions.forEach((t) => {
      const category = t.category || "Uncategorized";
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { income: 0, expenses: 0, count: 0 };
      }

      const amount = Number(t.amount);
      if (t.type === "credit") {
        categoryBreakdown[category].income += amount;
      } else {
        categoryBreakdown[category].expenses += amount;
      }
      categoryBreakdown[category].count++;
    });

    // Top categories
    const topIncomeCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1].income - a[1].income)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        amount: parseFloat(data.income.toFixed(2)),
      }));

    const topExpenseCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1].expenses - a[1].expenses)
      .slice(0, 5)
      .map(([name, data]) => ({
        name,
        amount: parseFloat(data.expenses.toFixed(2)),
      }));

    // Calculate trends
    const recentMonths = monthlyTrends.slice(-3);
    const previousMonths = monthlyTrends.slice(-6, -3);

    const recentAvgIncome =
      recentMonths.reduce((sum, m) => sum + m.income, 0) /
      (recentMonths.length || 1);
    const previousAvgIncome =
      previousMonths.reduce((sum, m) => sum + m.income, 0) /
      (previousMonths.length || 1);
    const incomeGrowth =
      previousAvgIncome > 0
        ? ((recentAvgIncome - previousAvgIncome) / previousAvgIncome) * 100
        : 0;

    const recentAvgExpenses =
      recentMonths.reduce((sum, m) => sum + m.expenses, 0) /
      (recentMonths.length || 1);
    const previousAvgExpenses =
      previousMonths.reduce((sum, m) => sum + m.expenses, 0) /
      (previousMonths.length || 1);
    const expenseGrowth =
      previousAvgExpenses > 0
        ? ((recentAvgExpenses - previousAvgExpenses) / previousAvgExpenses) *
          100
        : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalIncome: parseFloat(
            transactions
              .filter((t) => t.type === "credit")
              .reduce((sum, t) => sum + Number(t.amount), 0)
              .toFixed(2),
          ),
          totalExpenses: parseFloat(
            transactions
              .filter((t) => t.type === "debit")
              .reduce((sum, t) => sum + Number(t.amount), 0)
              .toFixed(2),
          ),
          transactionCount: transactions.length,
          dateRange: { start, end },
        },
        categoryBreakdown: Object.entries(categoryBreakdown).map(
          ([name, data]) => ({
            name,
            income: parseFloat(data.income.toFixed(2)),
            expenses: parseFloat(data.expenses.toFixed(2)),
            net: parseFloat((data.income - data.expenses).toFixed(2)),
            count: data.count,
          }),
        ),
        topIncomeCategories,
        topExpenseCategories,
        monthlyTrends,
        trends: {
          incomeGrowth: parseFloat(incomeGrowth.toFixed(2)),
          expenseGrowth: parseFloat(expenseGrowth.toFixed(2)),
        },
      },
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
});

// 4. Export Cash Flow to CSV
router.get("/:userId/export/csv", safeAuth as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const query = cashflowQuerySchema.parse(req.query);
    const { start, end } = getDateRange(
      query.period,
      query.startDate,
      query.endDate,
    );

    const transactions = await prisma.transactions.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const cashFlowData = groupByPeriod(transactions, query.period);

    const fields = ["period", "income", "expenses", "net"];
    const parser = new Parser({ fields });
    const csv = parser.parse(cashFlowData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=cashflow-${userId}-${Date.now()}.csv`,
    );
    res.send(csv);
  } catch (error: any) {
    console.error("Error exporting CSV:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
});

// 5. Export Cash Flow to PDF
router.get("/:userId/export/pdf", safeAuth as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const query = cashflowQuerySchema.parse(req.query);
    const { start, end } = getDateRange(
      query.period,
      query.startDate,
      query.endDate,
    );

    const transactions = await prisma.transactions.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const cashFlowData = groupByPeriod(transactions, query.period);

    const totalIncome = cashFlowData.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = cashFlowData.reduce((sum, d) => sum + d.expenses, 0);
    const netCashFlow = totalIncome - totalExpenses;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=cashflow-${userId}-${Date.now()}.pdf`,
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Cash Flow Report", { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`User ID: ${userId}`, { align: "center" });
    doc.text(
      `Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      { align: "center" },
    );
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(16).font("Helvetica-Bold").text("Summary");
    doc.moveDown(0.5);
    doc.fontSize(12).font("Helvetica");
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`);
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
    doc.text(`Net Cash Flow: $${netCashFlow.toFixed(2)}`);
    doc.text(
      `Savings Rate: ${totalIncome > 0 ? ((netCashFlow / totalIncome) * 100).toFixed(2) : 0}%`,
    );
    doc.moveDown(2);

    // Detailed Table
    doc.fontSize(16).font("Helvetica-Bold").text("Detailed Cash Flow");
    doc.moveDown(0.5);

    // Table headers
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 200;
    const col3 = 320;
    const col4 = 440;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Period", col1, tableTop);
    doc.text("Income", col2, tableTop);
    doc.text("Expenses", col3, tableTop);
    doc.text("Net", col4, tableTop);

    doc.moveDown(0.5);
    let yPosition = doc.y;

    // Table rows
    doc.fontSize(9).font("Helvetica");
    cashFlowData.forEach((item) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.text(item.period, col1, yPosition);
      doc.text(`$${item.income.toFixed(2)}`, col2, yPosition);
      doc.text(`$${item.expenses.toFixed(2)}`, col3, yPosition);
      doc.text(`$${item.net.toFixed(2)}`, col4, yPosition);

      yPosition += 20;
    });

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        `Generated on ${new Date().toLocaleString()} | Advancia Pay Ledger`,
        50,
        doc.page.height - 50,
        { align: "center" },
      );

    doc.end();
  } catch (error: any) {
    console.error("Error exporting PDF:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
});

// 6. Get Cash Flow Categories
router.get("/:userId/categories", safeAuth as any, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    if (!isAdmin && req.user?.userId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const categories = await prisma.transactions.groupBy({
      by: ["category"],
      where: { userId },
      _sum: { amount: true },
      _count: { id: true },
    });

    const categoriesWithType = await Promise.all(
      categories.map(async (cat) => {
        const transactions = await prisma.transactions.findMany({
          where: { userId, category: cat.category },
          select: { type: true, amount: true },
        });

        const income = transactions
          .filter((t) => t.type === "credit")
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = transactions
          .filter((t) => t.type === "debit")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
          category: cat.category || "Uncategorized",
          income: parseFloat(income.toFixed(2)),
          expenses: parseFloat(expenses.toFixed(2)),
          net: parseFloat((income - expenses).toFixed(2)),
          count: cat._count.id,
        };
      }),
    );

    res.json({ success: true, data: categoriesWithType });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
});

// 7. Admin: Get all users cash flow summary
router.get(
  "/admin/summary",
  safeAuth as any,
  safeAdmin as any,
  async (_req: any, res) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, email: true },
      });

      const summaries = await Promise.all(
        users.map(async (user) => {
          const transactions = await prisma.transactions.findMany({
            where: { userId: user.id },
          });

          const totalIncome = transactions
            .filter((t) => t.type === "credit")
            .reduce((sum, t) => sum + Number(t.amount), 0);
          const totalExpenses = transactions
            .filter((t) => t.type === "debit")
            .reduce((sum, t) => sum + Number(t.amount), 0);

          return {
            userId: user.id,
            username: user.username,
            email: user.email,
            totalIncome: parseFloat(totalIncome.toFixed(2)),
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            netCashFlow: parseFloat((totalIncome - totalExpenses).toFixed(2)),
            transactionCount: transactions.length,
          };
        }),
      );

      res.json({ success: true, data: summaries });
    } catch (error: any) {
      console.error("Error fetching admin summary:", error);
      res
        .status(500)
        .json({
          success: false,
          error: error.message || "Internal server error",
        });
    }
  },
);

export default router;

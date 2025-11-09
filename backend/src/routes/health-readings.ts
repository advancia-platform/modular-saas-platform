import { Router } from "express";
import prisma from "../prismaClient";
import { authenticateToken } from "../middleware/auth";
import { Decimal } from "@prisma/client/runtime/library";

const router = Router();

router.post("/record", authenticateToken as any, async (req, res) => {
  try {
    const {
      userId,
      heartRate,
      bloodPressureSys,
      bloodPressureDia,
      steps,
      sleepHours,
      sleepQuality,
      weight,
      temperature,
      oxygenLevel,
      stressLevel,
      mood,
      deviceId,
      deviceType,
      notes,
      recordedAt,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const reading = await prisma.healthReading.create({
      data: {
        userId,
        heartRate: heartRate || null,
        bloodPressureSys: bloodPressureSys || null,
        bloodPressureDia: bloodPressureDia || null,
        steps: steps || null,
        sleepHours: sleepHours ? new Decimal(sleepHours) : null,
        sleepQuality: sleepQuality || null,
        weight: weight ? new Decimal(weight) : null,
        temperature: temperature ? new Decimal(temperature) : null,
        oxygenLevel: oxygenLevel || null,
        stressLevel: stressLevel || null,
        mood: mood || null,
        deviceId: deviceId || null,
        deviceType: deviceType || null,
        metadata: null,
        notes: notes || null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });

    res.json({
      success: true,
      reading: {
        ...reading,
        sleepHours: reading.sleepHours?.toString() || null,
        weight: reading.weight?.toString() || null,
        temperature: reading.temperature?.toString() || null,
      },
      message: "Health reading recorded successfully",
    });
  } catch (error: any) {
    console.error("[HEALTH] Error recording health data:", error);
    res.status(500).json({ error: "Failed to record health reading" });
  }
});

router.get("/history/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, limit, offset } = req.query;

    const where: any = { userId };
    
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate as string);
      if (endDate) where.recordedAt.lte = new Date(endDate as string);
    }

    const take = Math.min(100, Number(limit) || 50);
    const skip = Math.max(0, Number(offset) || 0);

    const [readings, total] = await Promise.all([
      prisma.healthReading.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        take,
        skip,
      }),
      prisma.healthReading.count({ where }),
    ]);

    res.json({
      readings: readings.map(r => ({
        ...r,
        sleepHours: r.sleepHours?.toString() || null,
        weight: r.weight?.toString() || null,
        temperature: r.temperature?.toString() || null,
      })),
      total,
      limit: take,
      offset: skip,
    });
  } catch (error: any) {
    console.error("[HEALTH] Error fetching health history:", error);
    res.status(500).json({ error: "Failed to fetch health history" });
  }
});

router.get("/latest/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;

    const reading = await prisma.healthReading.findFirst({
      where: { userId },
      orderBy: { recordedAt: "desc" },
    });

    if (!reading) {
      return res.status(404).json({ error: "No health readings found" });
    }

    res.json({
      reading: {
        ...reading,
        sleepHours: reading.sleepHours?.toString() || null,
        weight: reading.weight?.toString() || null,
        temperature: reading.temperature?.toString() || null,
      },
    });
  } catch (error: any) {
    console.error("[HEALTH] Error fetching latest reading:", error);
    res.status(500).json({ error: "Failed to fetch latest reading" });
  }
});

router.get("/stats/:userId", authenticateToken as any, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    const daysBack = Math.min(365, Number(days) || 30);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const readings = await prisma.healthReading.findMany({
      where: {
        userId,
        recordedAt: { gte: startDate },
      },
      orderBy: { recordedAt: "desc" },
    });

    if (readings.length === 0) {
      return res.json({
        stats: null,
        message: "No health data available for the specified period",
      });
    }

    const calcStats = (values: number[]) => {
      if (values.length === 0) return null;
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const sorted = [...values].sort((a, b) => a - b);
      return {
        average: Math.round(avg * 100) / 100,
        min: Math.min(...values),
        max: Math.max(...values),
        median: sorted[Math.floor(sorted.length / 2)],
        count: values.length,
      };
    };

    const heartRates = readings.filter(r => r.heartRate).map(r => r.heartRate!);
    const steps = readings.filter(r => r.steps).map(r => r.steps!);
    const sleepHours = readings.filter(r => r.sleepHours).map(r => Number(r.sleepHours));
    const weights = readings.filter(r => r.weight).map(r => Number(r.weight));
    const temps = readings.filter(r => r.temperature).map(r => Number(r.temperature));
    const oxygenLevels = readings.filter(r => r.oxygenLevel).map(r => r.oxygenLevel!);

    res.json({
      period: `Last ${daysBack} days`,
      totalReadings: readings.length,
      stats: {
        heartRate: calcStats(heartRates),
        steps: calcStats(steps),
        sleepHours: calcStats(sleepHours),
        weight: calcStats(weights),
        temperature: calcStats(temps),
        oxygenLevel: calcStats(oxygenLevels),
      },
    });
  } catch (error: any) {
    console.error("[HEALTH] Error calculating stats:", error);
    res.status(500).json({ error: "Failed to calculate health statistics" });
  }
});

router.delete("/:id", authenticateToken as any, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const reading = await prisma.healthReading.findUnique({
      where: { id },
    });

    if (!reading) {
      return res.status(404).json({ error: "Health reading not found" });
    }

    if (reading.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.healthReading.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Health reading deleted successfully",
    });
  } catch (error: any) {
    console.error("[HEALTH] Error deleting reading:", error);
    res.status(500).json({ error: "Failed to delete health reading" });
  }
});

export default router;

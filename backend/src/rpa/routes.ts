// RPA Module - API Routes
// RESTful API for managing and monitoring RPA automation

import express, { Request, Response } from "express";
import rpaScheduler from "./scheduler";
import transactionProcessor from "./transactionProcessor";
import kycVerifier from "./kycVerifier";
import reportGenerator from "./reportGenerator";
import notificationAutomation from "./notificationAutomation";
import dataBackupSync from "./dataBackupSync";

const router = express.Router();

/**
 * GET /rpa/health
 * RPA system health check
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const health = await rpaScheduler.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /rpa/status
 * Get current RPA scheduler status
 */
router.get("/status", (req: Request, res: Response) => {
  try {
    const status = rpaScheduler.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/start
 * Start RPA automation scheduler
 */
router.post("/start", async (req: Request, res: Response) => {
  try {
    await rpaScheduler.start();
    res.json({
      success: true,
      message: "RPA Automation Scheduler started",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to start scheduler",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/stop
 * Stop RPA automation scheduler
 */
router.post("/stop", (req: Request, res: Response) => {
  try {
    rpaScheduler.stop();
    res.json({
      success: true,
      message: "RPA Automation Scheduler stopped",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to stop scheduler",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/task/:taskName/run
 * Manually trigger a specific RPA task
 */
router.post("/task/:taskName/run", async (req: Request, res: Response) => {
  try {
    const { taskName } = req.params;
    await rpaScheduler.runTask(taskName);
    
    res.json({
      success: true,
      message: `Task '${taskName}' executed successfully`,
    });
  } catch (error) {
    res.status(500).json({
      error: "Task execution failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/transaction/process
 * Manually process a specific transaction
 */
router.post("/transaction/process", async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ error: "transactionId is required" });
    }

    const result = await transactionProcessor.processTransaction(transactionId);
    
    res.json({
      success: result,
      message: result ? "Transaction processed successfully" : "Transaction processing failed",
    });
  } catch (error) {
    res.status(500).json({
      error: "Transaction processing failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/kyc/verify
 * Manually verify a user's KYC document
 */
router.post("/kyc/verify", async (req: Request, res: Response) => {
  try {
    const { userId, documentPath, documentType } = req.body;
    
    if (!userId || !documentPath || !documentType) {
      return res.status(400).json({
        error: "userId, documentPath, and documentType are required",
      });
    }

    const result = await kycVerifier.verifyDocument(userId, documentPath, documentType);
    
    res.json({
      success: result.verified,
      confidence: result.confidence,
      extractedData: result.extractedData,
      errors: result.errors,
      warnings: result.warnings,
    });
  } catch (error) {
    res.status(500).json({
      error: "KYC verification failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/report/generate
 * Generate a specific report
 */
router.post("/report/generate", async (req: Request, res: Response) => {
  try {
    const { reportType, startDate, endDate } = req.body;
    
    if (!reportType) {
      return res.status(400).json({ error: "reportType is required" });
    }

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    await reportGenerator.generateAndDistribute(reportType, start, end);
    
    res.json({
      success: true,
      message: `Report '${reportType}' generated successfully`,
    });
  } catch (error) {
    res.status(500).json({
      error: "Report generation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/notification/send
 * Send a notification
 */
router.post("/notification/send", async (req: Request, res: Response) => {
  try {
    const { userId, type, template, data, priority } = req.body;
    
    if (!userId || !type || !template || !data) {
      return res.status(400).json({
        error: "userId, type, template, and data are required",
      });
    }

    const result = await notificationAutomation.sendNotification({
      userId,
      type,
      template,
      data,
      priority,
    });
    
    res.json({
      success: result.success,
      emailSent: result.emailSent,
      smsSent: result.smsSent,
      errors: result.errors,
    });
  } catch (error) {
    res.status(500).json({
      error: "Notification sending failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/backup/create
 * Manually create a database backup
 */
router.post("/backup/create", async (req: Request, res: Response) => {
  try {
    const result = await dataBackupSync.performBackupAndSync();
    
    res.json({
      success: result.success,
      filename: result.filename,
      size: result.size,
      duration: result.duration,
      error: result.error,
    });
  } catch (error) {
    res.status(500).json({
      error: "Backup creation failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /rpa/backup/export
 * Export a specific table to JSON
 */
router.post("/backup/export", async (req: Request, res: Response) => {
  try {
    const { tableName } = req.body;
    
    if (!tableName) {
      return res.status(400).json({ error: "tableName is required" });
    }

    const filepath = await dataBackupSync.exportTableToJSON(tableName);
    
    res.json({
      success: true,
      filepath,
      message: `Table '${tableName}' exported successfully`,
    });
  } catch (error) {
    res.status(500).json({
      error: "Table export failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;

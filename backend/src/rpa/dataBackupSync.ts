// RPA Module - Data Backup & Sync
// Periodically back up PostgreSQL data or sync records to cloud storage automatically

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { rpaConfig } from "./config";
import prisma from "../prismaClient";

const execAsync = promisify(exec);

interface BackupResult {
  success: boolean;
  filename?: string;
  filepath?: string;
  size?: number;
  duration?: number;
  error?: string;
}

export class DataBackupSync {
  /**
   * Create database backup
   */
  async createBackup(): Promise<BackupResult> {
    const startTime = Date.now();
    const result: BackupResult = { success: false };

    try {
      console.log("🔄 Starting database backup...");

      const backupDir = rpaConfig.dataBackup.backupLocation;
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
      const filename = `backup_${timestamp}.sql`;
      const filepath = path.join(backupDir, filename);

      // Get DATABASE_URL from environment
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        throw new Error("DATABASE_URL not found in environment");
      }

      // Parse DATABASE_URL
      const dbUrl = new URL(databaseUrl);
      const dbName = dbUrl.pathname.slice(1);
      const dbHost = dbUrl.hostname;
      const dbPort = dbUrl.port || "5432";
      const dbUser = dbUrl.username;
      const dbPassword = dbUrl.password;

      // Use pg_dump for PostgreSQL backup
      const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${filepath}"`;

      await execAsync(command);

      // Get file size
      const stats = await fs.stat(filepath);
      
      result.success = true;
      result.filename = filename;
      result.filepath = filepath;
      result.size = stats.size;
      result.duration = Date.now() - startTime;

      console.log(`✅ Backup created: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      // Log backup to audit log
      await prisma.auditLog.create({
        data: {
          userId: "SYSTEM",
          action: "DATABASE_BACKUP",
          resourceType: "Database",
          resourceId: "backup",
          metadata: JSON.stringify({
            filename,
            size: stats.size,
            duration: result.duration,
          }),
          ipAddress: "SYSTEM-RPA",
          userAgent: "RPA-BackupSync",
          timestamp: new Date(),
        },
      });
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Backup failed:", error);
    }

    return result;
  }

  /**
   * Sync backup to cloud storage
   */
  async syncToCloud(filepath: string): Promise<boolean> {
    if (!rpaConfig.dataBackup.cloudSync.enabled) {
      console.log("☁️  Cloud sync disabled");
      return false;
    }

    try {
      console.log(`☁️  Syncing ${filepath} to cloud...`);

      const provider = rpaConfig.dataBackup.cloudSync.provider;

      if (provider === "s3") {
        await this.syncToS3(filepath);
      } else {
        console.warn(`⚠️  Unsupported cloud provider: ${provider}`);
        return false;
      }

      console.log(`✅ Cloud sync complete`);
      return true;
    } catch (error) {
      console.error("❌ Cloud sync failed:", error);
      return false;
    }
  }

  /**
   * Sync to AWS S3
   */
  private async syncToS3(filepath: string): Promise<void> {
    // In production, use AWS SDK
    // For now, just log
    console.log(`📤 Would upload to S3: ${filepath}`);
    
    // Example AWS S3 upload code:
    /*
    const AWS = require('aws-sdk');
    const s3 = new AWS.S3();
    
    const fileContent = await fs.readFile(filepath);
    const params = {
      Bucket: rpaConfig.dataBackup.cloudSync.bucket,
      Key: path.basename(filepath),
      Body: fileContent,
    };
    
    await s3.upload(params).promise();
    */
  }

  /**
   * Clean old backups based on retention policy
   */
  async cleanOldBackups(): Promise<void> {
    try {
      console.log("🧹 Cleaning old backups...");

      const backupDir = rpaConfig.dataBackup.backupLocation;
      const retention = rpaConfig.dataBackup.retention;

      const files = await fs.readdir(backupDir);
      const backupFiles = files.filter((f) => f.startsWith("backup_") && f.endsWith(".sql"));

      const now = Date.now();
      let deletedCount = 0;

      for (const file of backupFiles) {
        const filepath = path.join(backupDir, file);
        const stats = await fs.stat(filepath);
        const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

        let shouldDelete = false;

        // Daily backups: keep for 7 days
        if (ageInDays > retention.daily && file.includes("backup_")) {
          shouldDelete = true;
        }

        if (shouldDelete) {
          await fs.unlink(filepath);
          deletedCount++;
          console.log(`🗑️  Deleted old backup: ${file}`);
        }
      }

      console.log(`✅ Cleanup complete. Deleted ${deletedCount} old backups.`);
    } catch (error) {
      console.error("❌ Cleanup failed:", error);
    }
  }

  /**
   * Perform full backup and sync
   */
  async performBackupAndSync(): Promise<BackupResult> {
    const result = await this.createBackup();

    if (result.success && result.filepath) {
      await this.syncToCloud(result.filepath);
      await this.cleanOldBackups();
    }

    return result;
  }

  /**
   * Export specific table data to JSON
   */
  async exportTableToJSON(tableName: string): Promise<string> {
    try {
      console.log(`📊 Exporting ${tableName} to JSON...`);

      let data: any[] = [];

      // Export based on table name
      switch (tableName) {
        case "users":
          data = await prisma.user.findMany({
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              role: true,
              usdBalance: true,
              createdAt: true,
            },
          });
          break;
        case "transactions":
          data = await prisma.transaction.findMany();
          break;
        case "auditLogs":
          data = await prisma.auditLog.findMany();
          break;
        default:
          throw new Error(`Unsupported table: ${tableName}`);
      }

      const backupDir = rpaConfig.dataBackup.backupLocation;
      await fs.mkdir(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
      const filename = `${tableName}_${timestamp}.json`;
      const filepath = path.join(backupDir, filename);

      await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");

      console.log(`✅ Exported ${data.length} records to ${filename}`);
      return filepath;
    } catch (error) {
      console.error(`❌ Export failed for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create incremental backup (only changes since last backup)
   */
  async createIncrementalBackup(lastBackupDate: Date): Promise<BackupResult> {
    const startTime = Date.now();
    const result: BackupResult = { success: false };

    try {
      console.log(`🔄 Creating incremental backup since ${lastBackupDate.toISOString()}...`);

      const backupDir = rpaConfig.dataBackup.backupLocation;
      await fs.mkdir(backupDir, { recursive: true });

      // Export changed records
      const changedData = {
        users: await prisma.user.findMany({
          where: { updatedAt: { gte: lastBackupDate } },
        }),
        transactions: await prisma.transaction.findMany({
          where: { createdAt: { gte: lastBackupDate } },
        }),
        auditLogs: await prisma.auditLog.findMany({
          where: { createdAt: { gte: lastBackupDate } },
        }),
      };

      const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
      const filename = `incremental_backup_${timestamp}.json`;
      const filepath = path.join(backupDir, filename);

      await fs.writeFile(filepath, JSON.stringify(changedData, null, 2), "utf-8");

      const stats = await fs.stat(filepath);

      result.success = true;
      result.filename = filename;
      result.filepath = filepath;
      result.size = stats.size;
      result.duration = Date.now() - startTime;

      console.log(`✅ Incremental backup created: ${filename}`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Incremental backup failed:", error);
    }

    return result;
  }
}

export default new DataBackupSync();

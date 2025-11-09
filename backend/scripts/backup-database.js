/**
 * backup-database.js
 * Creates a timestamped backup of your Render/Postgres or SQLite database.
 * Runs automatically before Prisma migrations during build/deploy.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.resolve(__dirname, "../backups");
const backupFile = path.join(backupDir, `db-backup-${timestamp}.sql`);

// Create backups directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

try {
  console.log(`📦 Creating database backup at ${backupFile}...`);

  if (!process.env.DATABASE_URL) {
    console.warn("⚠️  DATABASE_URL not set, skipping backup");
    process.exit(0);
  }

  if (process.env.DATABASE_URL.includes("sqlite")) {
    // SQLite backup
    const sqliteFile = process.env.DATABASE_URL.replace("file:", "");
    const sqliteBackupFile = backupFile.replace(".sql", ".sqlite");
    fs.copyFileSync(sqliteFile, sqliteBackupFile);
    console.log(`✅ SQLite database backup complete: ${sqliteBackupFile}`);
  } else if (process.env.DATABASE_URL.includes("postgres")) {
    // PostgreSQL backup (Render / hosted)
    try {
      execSync(`pg_dump "${process.env.DATABASE_URL}" > "${backupFile}"`, {
        stdio: "inherit",
        shell: true,
      });
      console.log(`✅ PostgreSQL database backup complete: ${backupFile}`);
    } catch (pgError) {
      // If pg_dump is not available, try using Prisma's introspection
      console.warn("⚠️  pg_dump not available, using Prisma schema export...");
      execSync(`npx prisma db pull --force`, {
        stdio: "inherit",
      });

      // Copy schema as backup
      const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
      const schemaBackup = backupFile.replace(".sql", ".schema.prisma");
      fs.copyFileSync(schemaPath, schemaBackup);
      console.log(`✅ Prisma schema backup complete: ${schemaBackup}`);
    }
  } else {
    console.warn("⚠️  Unknown database type, skipping backup");
    process.exit(0);
  }

  // Cleanup old backups (keep last 10)
  const backups = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith("db-backup-"))
    .sort()
    .reverse();

  if (backups.length > 10) {
    backups.slice(10).forEach((oldBackup) => {
      const oldPath = path.join(backupDir, oldBackup);
      fs.unlinkSync(oldPath);
      console.log(`🗑️  Removed old backup: ${oldBackup}`);
    });
  }
} catch (err) {
  console.error("❌ Backup failed:", err.message);

  // Don't fail the build on backup failure in CI/CD
  if (process.env.CI || process.env.RENDER) {
    console.warn("⚠️  Continuing build despite backup failure (CI/CD mode)");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

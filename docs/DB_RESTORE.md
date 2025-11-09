# Database Restore Guide

This guide explains how to restore a PostgreSQL database backup using the `restore_db.sh` script.

## Overview

The `restore_db.sh` script allows you to restore a PostgreSQL database from a SQL dump file. It handles stopping the application service, restoring the database, and optionally restarting the application.

## Prerequisites

- Docker and Docker Compose must be installed
- Database container must be running (started with `docker compose up -d postgres`)
- A valid SQL backup file

## Usage

### Basic Restore

```bash
./scripts/restore_db.sh path/to/backup.sql
```

### Example Commands

1. **Restore from a recent backup:**
   ```bash
   ./scripts/restore_db.sh backups/backup_20250119_120000.sql
   ```

2. **Restore from a specific backup:**
   ```bash
   ./scripts/restore_db.sh backups/production_backup_20250115.sql
   ```

3. **Using the npm script (if configured):**
   ```bash
   npm run db:restore backups/backup_20250119_120000.sql
   ```

## What the Script Does

1. **Validates the backup file:** Checks if the specified SQL file exists
2. **Checks Docker environment:** Verifies Docker and Docker Compose are available
3. **Finds the database container:** Locates the running PostgreSQL container
4. **Loads environment variables:** Reads `.env` file for database configuration
5. **Asks for confirmation:** Prompts before overwriting data (safety check)
6. **Stops the app service:** If running, stops the application to prevent conflicts
7. **Restores the database:** 
   - Drops the existing database
   - Creates a fresh database
   - Restores data from the backup file
8. **Optionally restarts the app:** Prompts to restart the application service

## Environment Variables

The script uses the following environment variables (from `.env` file):

- `POSTGRES_USER` (default: `postgres`)
- `POSTGRES_DB` (default: `saasdb`)

## Important Warnings

### ⚠️ Data Loss Warning

**This script will completely overwrite all data in the target database!**

- All existing data will be permanently deleted
- The operation cannot be undone
- Always verify you're restoring the correct backup file
- Consider creating a backup before restoring

### Safety Recommendations

1. **Always create a backup first:**
   ```bash
   ./scripts/backup_db.sh pre-restore-backup
   ```

2. **Verify the backup file:**
   ```bash
   # Check backup file size and timestamp
   ls -lh backups/backup_20250119_120000.sql
   ```

3. **Test in development first:**
   - Test restore operations in a development environment
   - Verify data integrity after restoration
   - Confirm application functionality

4. **Production restores:**
   - Schedule during maintenance windows
   - Notify users of potential downtime
   - Have a rollback plan ready

## Troubleshooting

### Database Container Not Running

**Error:** `Database container 'postgres' is not running`

**Solution:**
```bash
docker compose up -d postgres
# Wait a few seconds for the container to start
docker compose ps
```

### Permission Denied

**Error:** `Permission denied: ./scripts/restore_db.sh`

**Solution:**
```bash
chmod +x scripts/restore_db.sh
```

### Docker Compose Not Found

**Error:** `Docker Compose is not installed`

**Solution:**
- Install Docker Compose: https://docs.docker.com/compose/install/
- Or use `docker-compose` (v1) if already installed

### Backup File Not Found

**Error:** `Backup file not found: path/to/backup.sql`

**Solution:**
- Check the file path is correct
- Ensure the backup file exists:
  ```bash
  ls -la backups/
  ```

### Restoration Failed

If the restoration fails midway:

1. **Check the backup file integrity:**
   ```bash
   head -n 20 backups/backup_20250119_120000.sql
   ```

2. **Check database logs:**
   ```bash
   docker compose logs postgres
   ```

3. **Manual restore (if needed):**
   ```bash
   docker compose exec postgres psql -U postgres -d saasdb -f /path/to/backup.sql
   ```

## Creating Backups

Before restoring, it's recommended to create a backup:

```bash
# Create a backup with a custom name
./scripts/backup_db.sh pre-restore-backup

# This creates: backups/pre-restore-backup_TIMESTAMP.sql
```

## Related Scripts

- **backup_db.sh**: Create database backups
- **deploy.sh**: Deploy application services

## Additional Notes

- The script uses POSIX shell syntax for maximum compatibility
- Handles both Docker Compose v1 (`docker-compose`) and v2 (`docker compose`)
- Color-coded output for better readability
- Interactive prompts prevent accidental data loss

## Support

If you encounter issues not covered in this guide:

1. Check the script logs for detailed error messages
2. Verify Docker and database container status
3. Review the backup file format and integrity
4. Consult the main project documentation

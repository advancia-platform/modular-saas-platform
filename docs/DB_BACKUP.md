# Database Backup and Restore Guide

This guide explains how to backup and restore the PostgreSQL database using the provided scripts.

## Prerequisites

- Docker and Docker Compose installed
- Database container running (started via `docker-compose up -d`)

## Backup Database

### Quick Backup

Run the backup script from the project root:

```bash
./scripts/backup_db.sh
```

This will:
- Create a timestamped backup file in `./db_backups/`
- Automatically clean up old backups (keeps last 10)
- Show backup file size and location

### Backup File Location

Backups are stored in: `./db_backups/backup_<database>_<timestamp>.sql`

Example: `./db_backups/backup_saasdb_2025-10-19_14-30-00.sql`

### Custom Configuration

You can override defaults using environment variables:

```bash
DB_SERVICE=postgres POSTGRES_USER=postgres POSTGRES_DB=saasdb ./scripts/backup_db.sh
```

## Restore Database

### From Backup File

To restore a backup file to the database:

```bash
# Using docker-compose
docker-compose exec -T postgres psql -U postgres -d saasdb < ./db_backups/backup_saasdb_2025-10-19_14-30-00.sql
```

Or using the newer docker compose syntax:

```bash
# Using docker compose
docker compose exec -T postgres psql -U postgres -d saasdb < ./db_backups/backup_saasdb_2025-10-19_14-30-00.sql
```

### Complete Database Reset and Restore

To completely reset and restore from a backup:

```bash
# 1. Drop the existing database (WARNING: This deletes all data!)
docker-compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS saasdb;"

# 2. Create a fresh database
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE saasdb;"

# 3. Restore from backup
docker-compose exec -T postgres psql -U postgres -d saasdb < ./db_backups/backup_saasdb_2025-10-19_14-30-00.sql
```

## Automated Backups

### Schedule Daily Backups (Linux/macOS)

Add to your crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && ./scripts/backup_db.sh >> /var/log/db_backup.log 2>&1
```

### Schedule Daily Backups (Windows)

Create a scheduled task:
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2:00 AM)
4. Action: Start a program
5. Program: `bash`
6. Arguments: `scripts/backup_db.sh`
7. Start in: `C:\path\to\project`

## Backup Best Practices

1. **Regular Backups**: Schedule automatic daily backups
2. **Off-site Storage**: Copy backups to cloud storage (S3, Dropbox, etc.)
3. **Test Restores**: Regularly test that backups can be restored
4. **Retention Policy**: Keep backups for at least 30 days
5. **Security**: Encrypt backups containing sensitive data

## Troubleshooting

### Database Container Not Running

```bash
Error: Database container 'postgres' is not running.
```

**Solution**: Start the database container:
```bash
docker-compose up -d postgres
```

### Permission Denied

```bash
Error: Permission denied
```

**Solution**: Ensure the script is executable:
```bash
chmod +x scripts/backup_db.sh
```

### Disk Space Issues

Check available disk space:
```bash
df -h
```

Clean up old backups manually:
```bash
rm ./db_backups/backup_*.sql
```

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

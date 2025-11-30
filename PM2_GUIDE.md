# PM2 Process Management for Advancia Platform

## Quick Start

### Install PM2 Globally (Windows PowerShell as Administrator)

```powershell
npm install -g pm2
```

### Or Install as Local Dev Dependency

```bash
npm install pm2 --save-dev
```

## PM2 Commands

### Start Application

```bash
# Development
npm run pm2:start

# Production
npm run pm2:start:prod

# Staging
npm run pm2:start:staging
```

### View Logs

```bash
npm run pm2:logs           # All logs
npm run pm2:logs:backend   # Backend only
npm run pm2:logs:frontend  # Frontend only
```

### Monitor Processes

```bash
npm run pm2:monit
```

### Restart/Stop

```bash
npm run pm2:restart
npm run pm2:stop
npm run pm2:delete
```

### Process Status

```bash
npm run pm2:status
```

### Save Configuration for Auto-Restart

```bash
pm2 save
pm2 startup   # Generate startup script
```

## Vercel Project IDs

Your new Vercel project ID:

```
prj_ZsINokTXkyp7p70ItYZX0kbFCKMu
```

Previous project ID (if needed):

```
prj_ay4c2vsrCXKf0CizGqnDgcltZAZf
```

## Configuration

The `ecosystem.config.js` file configures:

- **advancia-backend** - Express API server (port 4000)
- **advancia-frontend** - Next.js server (port 3000)
- **advancia-worker** - Background notification worker

### Environment Modes

- `--env production` - Cluster mode, multiple instances
- `--env staging` - Single instance, staging environment
- Default - Development mode

## Deployment

### Deploy to Production

```bash
pm2 deploy ecosystem.config.js production
```

### Deploy to Staging

```bash
pm2 deploy ecosystem.config.js staging
```

## Troubleshooting

### Check PM2 Version

```bash
pm2 --version
```

### Reset PM2

```bash
pm2 kill
pm2 resurrect
```

### View Error Logs

```bash
pm2 logs --err
tail -f logs/backend-error.log
```

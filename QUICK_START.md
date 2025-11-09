# Quick Start Deployment Guide

## Current Status ✅

Your Advancia Pay Ledger is configured and ready to deploy!

### What's Already Set Up:

1. **SSL/HTTPS** - CloudFlare certificate configured
2. **CORS** - Production domains whitelisted
3. **API Integration** - Frontend → Backend communication ready
4. **Rate Limiting** - Brute force protection active
5. **Deployment Scripts** - Automated deployment ready

## Deploy in 3 Steps

### Step 1: Configure CloudFlare DNS (5 minutes)

Login to CloudFlare and add these DNS records:

```
Type: A, Name: @,   Content: 157.245.8.131, Proxy: ON
Type: A, Name: www, Content: 157.245.8.131, Proxy: ON  
Type: A, Name: api, Content: 157.245.8.131, Proxy: ON
```

Set SSL/TLS mode to **Full (strict)**

### Step 2: Deploy Application (2 minutes)

```bash
cd /root/projects/advancia-pay-ledger
./deploy.sh
```

This will:
- Install dependencies
- Run database migrations
- Build frontend and backend
- Start services with PM2
- Run health checks

### Step 3: Verify Deployment (1 minute)

```bash
# Check services
pm2 status

# View logs
pm2 logs

# Test backend
curl -k https://localhost:4000/health

# Test frontend
curl http://localhost:3000
```

## Access Your Application

- **Frontend**: https://advanciapayledger.com
- **Backend API**: https://api.advanciapayledger.com
- **Health Check**: https://api.advanciapayledger.com/health

## Useful Commands

```bash
# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Monitor resources
pm2 monit

# Save PM2 config
pm2 save

# Startup on boot
pm2 startup
```

## File Locations

```
/root/projects/advancia-pay-ledger/
├── deploy.sh                    # Main deployment script
├── ecosystem.config.js          # PM2 configuration
├── ssl/
│   ├── cloudflare.crt          # SSL certificate
│   └── cloudflare.key          # Private key
├── backend/
│   ├── .env                     # Backend environment
│   ├── dist/                    # Built backend code
│   └── logs/                    # Application logs
└── frontend/
    ├── .env.local               # Frontend environment
    └── .next/                   # Built frontend code
```

## Troubleshooting

### Services won't start
```bash
pm2 delete all
./deploy.sh
```

### Database connection errors
```bash
cd backend
npx prisma db pull
npx prisma generate
```

### Port already in use
```bash
pm2 stop all
lsof -ti:4000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
pm2 restart all
```

### SSL certificate errors
```bash
# Verify SSL files exist
ls -lh ssl/

# Test certificate
openssl x509 -in ssl/cloudflare.crt -text -noout
```

## Security Notes

- SSL certificates are stored in `/root/projects/advancia-pay-ledger/ssl/`
- Environment variables are in `.env` files (never commit these!)
- Rate limiting is active (5 login attempts per 15 min)
- IP blocking system is enabled
- All API calls require authentication (except public endpoints)

## Need Help?

Check the detailed guide:
```bash
cat /root/projects/advancia-pay-ledger/DEPLOYMENT_CHECKLIST.md
```

Or view logs:
```bash
pm2 logs --lines 50
```


# 🚀 Production Quick Reference Card

**Last Updated:** November 16, 2025

---

## 📍 Production URLs

| Service              | URL                                          | Status |
| -------------------- | -------------------------------------------- | ------ |
| Backend API (Nginx)  | `http://157.245.8.131/api/health`            | ✅     |
| Backend API (Direct) | `http://157.245.8.131:4000/api/health`       | ✅     |
| Frontend             | `https://frontend-theta-three-91.vercel.app` | ✅     |

---

## 🔐 Server Access

```bash
# SSH into server
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131

# Server details
IP: 157.245.8.131
Hostname: advancia-prod
OS: Ubuntu
```

---

## ⚡ Quick Commands

### Check Everything

```bash
# One command to check all services
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 \
  "pm2 status && systemctl is-active nginx fail2ban"
```

### Backend Management

```bash
pm2 status                    # View status
pm2 logs advancia-backend     # View logs (Ctrl+C to exit)
pm2 restart advancia-backend  # Restart
pm2 stop advancia-backend     # Stop
pm2 save                      # Save current state
```

### Nginx Management

```bash
systemctl status nginx        # Check status
systemctl restart nginx       # Restart
nginx -t                      # Test config
tail -f /var/log/nginx/error.log  # View errors
```

### View Logs

```bash
# Backend logs
pm2 logs advancia-backend --lines 100

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# Fail2ban logs
tail -f /var/log/fail2ban.log
```

---

## 🛡️ Security Status

| Feature        | Status    | Config                   |
| -------------- | --------- | ------------------------ |
| Firewall (UFW) | ✅ Active | Ports 22, 80, 443 open   |
| Fail2ban       | ✅ Active | SSH protection enabled   |
| Nginx          | ✅ Active | Reverse proxy on port 80 |
| PM2 Auto-start | ✅ Active | Survives reboots         |

---

## 🔧 Common Tasks

### Update Backend Code

```bash
# On your local machine
cd backend
git pull
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 \
  "cd /var/www/advancia/backend && git pull && npm install && pm2 restart advancia-backend"
```

### Update Environment Variables

```bash
# Edit .env on server
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 \
  "nano /var/www/advancia/backend/.env"

# Then restart
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 \
  "pm2 restart advancia-backend"
```

### Run Database Migrations

```bash
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 \
  "cd /var/www/advancia/backend && npx prisma migrate deploy && pm2 restart advancia-backend"
```

### Check Database

```bash
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 \
  "psql -U postgres -d advancia_prod -c 'SELECT * FROM users LIMIT 5;'"
```

---

## 🚨 Troubleshooting

### Backend Not Responding

```bash
# Check PM2 status
pm2 status

# View recent logs
pm2 logs advancia-backend --lines 50

# Restart if needed
pm2 restart advancia-backend

# Check if port is listening
netstat -tlnp | grep 4000
```

### 502 Bad Gateway (Nginx)

```bash
# Check if backend is running
pm2 status

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U postgres -d advancia_prod

# Check DATABASE_URL in .env
grep DATABASE_URL /var/www/advancia/backend/.env
```

---

## 📊 Monitoring

### System Resources

```bash
# CPU and Memory
htop

# Disk usage
df -h

# PM2 monitoring
pm2 monit
```

### Check Firewall Bans

```bash
# View fail2ban status
fail2ban-client status sshd

# Unban an IP
fail2ban-client set sshd unbanip 1.2.3.4
```

---

## 🔄 Restart Everything

```bash
# Restart all services (use with caution)
ssh -i ~/.ssh/advancia_droplet root@157.245.8.131 \
  "pm2 restart all && systemctl restart nginx"
```

---

## 📝 Important File Locations

| File            | Path                                  |
| --------------- | ------------------------------------- |
| Backend .env    | `/var/www/advancia/backend/.env`      |
| Nginx config    | `/etc/nginx/sites-available/advancia` |
| Nginx logs      | `/var/log/nginx/`                     |
| PM2 logs        | `/root/.pm2/logs/`                    |
| Fail2ban config | `/etc/fail2ban/jail.local`            |

---

## ✅ Health Check

Run this to verify everything is working:

```bash
# From your local machine
curl http://157.245.8.131/api/health
# Expected: {"ok":true}

# Check frontend
curl -I https://frontend-theta-three-91.vercel.app
# Expected: HTTP/2 200
```

---

## 🆘 Emergency Contacts

| Issue           | Command                            |
| --------------- | ---------------------------------- |
| Backend crashed | `pm2 restart advancia-backend`     |
| Out of memory   | `pm2 restart all` then `pm2 save`  |
| Nginx down      | `systemctl restart nginx`          |
| Can't SSH       | Check firewall: `ufw allow 22/tcp` |
| Database locked | `systemctl restart postgresql`     |

---

## 📞 Support

- **Documentation:** See `PRODUCTION_IMPROVEMENTS_COMPLETE.md`
- **Full Deployment Guide:** See `PRODUCTION_DEPLOYMENT_COMPLETE.md`
- **Server IP:** 157.245.8.131
- **SSH Key:** `~/.ssh/advancia_droplet`

---

**🎉 Your production environment is fully configured and secured!**

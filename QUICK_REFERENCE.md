# 🚀 One-Hour Migration - Quick Reference Card

**Print this and keep it handy during migration!**

---

## 📋 Quick Start Command

### Windows (PowerShell)

```powershell
.\scripts\one-hour-migration.ps1 -DropletIP "157.245.8.131"
```

### Linux/Mac (Bash)

```bash
bash scripts/fast-demo-setup.sh 157.245.8.131
```

---

## 🔑 Access URLs

| Service         | URL                                    | Port |
| --------------- | -------------------------------------- | ---- |
| **Frontend**    | `http://157.245.8.131:3000`            | 3000 |
| **Backend API** | `http://157.245.8.131:4000`            | 4000 |
| **API Health**  | `http://157.245.8.131:4000/api/health` | 4000 |
| **MailHog UI**  | `http://157.245.8.131:8025`            | 8025 |
| **PostgreSQL**  | `157.245.8.131:5432`                   | 5432 |
| **Redis**       | `157.245.8.131:6379`                   | 6379 |

---

## 🔐 Demo Credentials

### User Login

```
Email:    demo@advanciapayledger.local
Password: demo123
```

### Database

```bash
psql "postgresql://demo_user:demo_pass_2024@157.245.8.131:5432/advancia_demo"
```

### Redis

```bash
redis-cli -h 157.245.8.131 -p 6379 -a demo_redis_pass
```

---

## 🛠️ Essential Commands

### SSH Into Droplet

```bash
ssh -i ~/.ssh/id_ed25519_mucha root@157.245.8.131
```

### View Logs

```bash
cd /app/modular-saas-platform
docker-compose -f docker-compose.demo.yml logs -f
```

### Check Service Status

```bash
docker-compose -f docker-compose.demo.yml ps
```

### Restart Services

```bash
docker-compose -f docker-compose.demo.yml restart
```

### Stop All Services

```bash
docker-compose -f docker-compose.demo.yml down
```

### Start All Services

```bash
docker-compose -f docker-compose.demo.yml up -d
```

### Rebuild Everything

```bash
docker-compose -f docker-compose.demo.yml down -v
docker-compose -f docker-compose.demo.yml build --no-cache
docker-compose -f docker-compose.demo.yml up -d
```

---

## 🩺 Health Checks

### Backend Health

```bash
curl http://157.245.8.131:4000/api/health
```

### Frontend Health

```bash
curl http://157.245.8.131:3000
```

### Database Connection

```bash
docker-compose -f docker-compose.demo.yml exec postgres pg_isready -U demo_user
```

### Redis Connection

```bash
docker-compose -f docker-compose.demo.yml exec redis redis-cli -a demo_redis_pass ping
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
docker-compose -f docker-compose.demo.yml logs backend
docker-compose -f docker-compose.demo.yml restart backend
```

### Frontend Build Failed

```bash
docker-compose -f docker-compose.demo.yml logs frontend
docker-compose -f docker-compose.demo.yml build --no-cache frontend
```

### Database Connection Error

```bash
docker-compose -f docker-compose.demo.yml logs postgres
docker-compose -f docker-compose.demo.yml restart postgres
```

### Out of Memory

```bash
free -h
docker stats
# Upgrade droplet to 4GB RAM if needed
```

### Reset Everything

```bash
docker-compose -f docker-compose.demo.yml down -v
docker system prune -af --volumes
# Re-run migration script
```

---

## 📊 Monitoring

### Check CPU/Memory

```bash
htop
docker stats
```

### Check Disk Space

```bash
df -h
```

### Check Running Processes

```bash
docker ps
```

### Check Network Connections

```bash
netstat -tlnp
```

---

## 🎯 Test Checklist

- [ ] Frontend loads: `http://157.245.8.131:3000`
- [ ] Backend health OK: `http://157.245.8.131:4000/api/health`
- [ ] MailHog UI loads: `http://157.245.8.131:8025`
- [ ] Can create new user account
- [ ] Email verification appears in MailHog
- [ ] Can log in with demo credentials
- [ ] Can create test transaction
- [ ] Admin dashboard accessible
- [ ] Logs show no critical errors

---

## ⚠️ Demo Limitations

- ❌ No SSL/HTTPS (HTTP only)
- ❌ Test Stripe keys (no real payments)
- ❌ MailHog only (no real email delivery)
- ❌ No S3 backups
- ❌ No CloudFlare CDN
- ❌ Demo credentials (change for production)

---

## 🔄 Production Upgrade Steps

1. Update `/app/.env.production` with real API keys
2. Set up SSL: `certbot certonly --standalone -d advanciapayledger.com`
3. Configure CloudFlare DNS
4. Use `docker-compose.prod.yml` instead of `demo.yml`
5. Enable GitHub Actions auto-deploy
6. Configure S3 backups
7. Set up Sentry error tracking

---

## 📞 Support

**Documentation**: `ONE_HOUR_MIGRATION_GUIDE.md`

**Issues**: https://github.com/muchaeljohn739337-cloud/-modular-saas-platform/issues

**Email**: support@advanciapayledger.com

---

## ✅ Success Criteria

- ✅ All services running (`docker ps`)
- ✅ Backend health returns 200
- ✅ Frontend accessible
- ✅ Can log in with demo user
- ✅ MailHog receives emails
- ✅ No ERROR logs
- ✅ Completed in under 1 hour

---

**Droplet IP**: `_______________`

**Completed**: `_______________`

**By**: `_______________`

# 🚀 Staging Deployment & Log Rotation Test

## 1. Deploy to Staging

- Push your latest changes to the **staging branch** (or staging server).
- On the staging server, pull updates:
  ```bash
  git fetch --all
  git checkout staging
  git pull origin staging
  ```
- Restart services with PM2:
  ```bash
  pm2 restart advvancia-backend
  ```

---

## 2. Verify Log Rotation Setup

If you've configured PM2 log rotation (via `pm2-logrotate` module):

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M       # rotate when logs reach 10MB
pm2 set pm2-logrotate:retain 7           # keep 7 old log files
pm2 set pm2-logrotate:compress true      # compress rotated logs
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

Check the logs directory:

```bash
ls backend/logs
```

You should see rotated files like:

```
app-out-2025-11-14_18-00-00.log
app-error-2025-11-14_18-00-00.log
```

---

## 3. Monitor Logs in Real Time

```bash
pm2 logs advvancia-backend
```

- Watch new entries being written.
- Confirm rotation occurs when size threshold is reached.

---

## 4. Check PM2 Status

```bash
pm2 list
```

Shows all running apps, uptime, memory usage, and status.

```bash
pm2 logs advvancia-backend
```

Shows live logs and confirms rotation in action.

---

# ✅ Outcome

- **Staging deployment** ensures log rotation works before production.
- **PM2 logrotate** keeps logs manageable and prevents disk bloat.
- **Monitoring with pm2 list/logs** confirms rotation is active.

---

# 🛠️ Day‑2 Ops Checklist (Self‑Hosted SaaS)

## 🔹 Daily
Check Docker services (docker ps, docker-compose logs -f)

Monitor CPU/memory/disk (DigitalOcean Monitoring)

Review Sentry alerts (frontend/backend errors)

Scan Cloudflare Analytics for blocked threats

Confirm SSL cert validity

## 🔹 Weekly
Run PostgreSQL backups (pg_dump) and verify restore

Audit backend + Nginx logs for anomalies

Apply dependency updates (npm audit)

Review Cloudflare WAF & rate limiting rules

Test CI/CD pipeline (GitHub Actions deploy)

## 🔹 Monthly
Review Droplet resource usage (resize if needed)

Rotate API keys (Stripe, Plaid, JWT secret)

Audit firewall rules

Compliance check (GDPR/PCI DSS logs)

Disaster recovery drill (simulate DB restore)

## 🔹 Quarterly
Plan feature roadmap (multi‑tenancy, analytics, file uploads)

Infrastructure upgrade (consider Kubernetes migration)

Apply Zero Trust security (Cloudflare Access for admin routes)

Review billing (DigitalOcean, Datadog)

⚡ This calendar ensures you don’t miss a beat: daily health checks, weekly backups, monthly audits, quarterly scaling. It’s the operational rhythm that keeps your SaaS secure, reliable, and future‑proof.

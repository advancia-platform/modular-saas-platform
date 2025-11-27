# Advancia Pay Monitoring & Alerting Infrastructure

## 🎯 Overview

This monitoring stack provides comprehensive observability for the Advancia Pay platform with SLA enforcement, alerting, and incident response capabilities. It ensures 99% uptime SLA compliance with automated escalation to PagerDuty, Slack, and Teams.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Application   │────│   Prometheus     │────│    Grafana      │
│                 │    │   (Metrics)      │    │  (Dashboards)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub        │◄───│   Alertmanager   │────│   PagerDuty     │
│   Actions       │    │   (Routing)      │    │   (Escalation)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Slack / Teams   │
                       │ (Notifications) │
                       └─────────────────┘
```

## 📋 Components

### Core Monitoring

- **Prometheus**: Metrics collection and storage
- **Grafana**: Dashboards and visualization
- **Alertmanager**: Alert routing and notifications
- **Node Exporter**: System metrics
- **PostgreSQL Exporter**: Database metrics
- **Blackbox Exporter**: External endpoint monitoring

### Alerting & Escalation

- **PagerDuty**: Critical incident escalation
- **Slack**: Team notifications (#alerts-critical, #sla-alerts)
- **Teams**: Business stakeholder updates
- **GitHub Actions**: Continuous health monitoring

## 🚀 Quick Start

### Prerequisites

1. **Docker & Docker Compose** installed
2. **Environment Variables** configured:

   ```bash
   export PAGERDUTY_ROUTING_KEY="your_pagerduty_key"
   export SLACK_WEBHOOK_URL="your_slack_webhook"
   export TEAMS_WEBHOOK_URL="your_teams_webhook"
   export DATABASE_URL="your_postgres_url"
   ```

### Setup (Linux/Mac)

```bash
# Clone and navigate to monitoring directory
cd monitoring

# Make script executable and run setup
chmod +x setup-monitoring.sh
./setup-monitoring.sh
```

### Setup (Windows PowerShell)

```powershell
# Navigate to monitoring directory
cd monitoring

# Run PowerShell setup script
.\setup-monitoring.ps1
```

### Manual Setup

```bash
# Start monitoring stack
docker-compose up -d

# Verify services
docker-compose ps
```

## 📊 Access URLs

| Service           | URL                   | Credentials |
| ----------------- | --------------------- | ----------- |
| **Grafana**       | <http://localhost:3001> | admin/admin |
| **Prometheus**    | <http://localhost:9090> | -           |
| **Alertmanager**  | <http://localhost:9093> | -           |
| **Node Exporter** | <http://localhost:9100> | -           |

## 🚨 Alert Thresholds & SLA

### Critical Alerts (PagerDuty + Slack)

- **Service Down**: Health check fails for >1 minute
- **SLA Breach**: 24h uptime <99%
- **High Error Rate**: >5% error rate for >2 minutes
- **Notification System Failure**: Notification errors >0.1/sec

### Warning Alerts (Slack/Teams)

- **SLA Degradation**: 1h uptime <99.5%
- **High Response Time**: P95 >2 seconds for >3 minutes
- **Database Connection High**: >80 active connections

### Info Alerts (Teams)

- **Low Traffic**: <0.1 requests/sec for >10 minutes
- **User Activity Spike**: >1000 user increase in 5 minutes

## 📈 Key Metrics

### Application Metrics

```prometheus
# Request rate
rate(http_requests_total[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
rate(http_requests_total{status_code=~"5.*"}[5m]) / rate(http_requests_total[5m]) * 100

# Active users
active_users_total

# Notification operations
rate(notification_preferences_operations_total[5m])
```

### System Metrics

```prometheus
# Service uptime
up{job=~"advancia-pay.*"}

# Database connections
database_connections_active

# 24h SLA calculation
avg_over_time(up{job=~"advancia-pay.*"}[24h]) * 100
```

## 🔔 Escalation Procedures

### Critical Alert Flow

```
1. Alert fires → Prometheus
2. Alertmanager routes alert
3. PagerDuty incident created (SMS/call)
4. Slack #alerts-critical notification
5. If unresolved in 15min → Escalate to Platform Lead
6. If unresolved in 30min → Engineering Manager
```

### SLA Breach Flow

```
1. SLA drops below 99% → Critical alert
2. PagerDuty high-priority incident
3. Slack #sla-alerts with business impact
4. Teams notification to stakeholders
5. Immediate investigation required
6. Customer communication if needed
```

## 🛠️ Configuration

### Adding New Alerts

1. **Edit alert rules**:

   ```yaml
   # monitoring/grafana/alert-rules/advancia-pay-alerts.yml
   - alert: NewAlert
     expr: your_metric > threshold
     for: 5m
     labels:
       severity: warning
     annotations:
       summary: "Alert description"
   ```

2. **Restart Prometheus**:

   ```bash
   docker-compose restart prometheus
   ```

### Custom Dashboards

1. Create dashboard JSON in `monitoring/grafana/dashboards/`
2. Restart Grafana: `docker-compose restart grafana`
3. Dashboard auto-imports on startup

### Notification Channels

Edit `monitoring/alertmanager/alertmanager.yml`:

```yaml
receivers:
  - name: "new-receiver"
    slack_configs:
      - api_url: "YOUR_WEBHOOK"
        channel: "#your-channel"
```

## 🧪 Testing Alerts

### Simulate Service Down

```bash
# Stop backend service
docker-compose stop backend

# Check alert fires in ~1 minute
# Restore service
docker-compose start backend
```

### Simulate High Error Rate

```bash
# Generate 500 errors
for i in {1..100}; do
  curl -X POST http://localhost:4000/api/nonexistent
done
```

### Test PagerDuty Integration

```bash
# Manual PagerDuty test
curl -X POST "https://events.pagerduty.com/v2/enqueue" \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "'$PAGERDUTY_ROUTING_KEY'",
    "event_action": "trigger",
    "payload": {
      "summary": "Test alert from monitoring setup",
      "severity": "info",
      "source": "manual_test"
    }
  }'
```

## 🔧 Troubleshooting

### Prometheus Not Scraping Metrics

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check application metrics endpoint
curl http://localhost:4000/metrics
```

### Alertmanager Not Sending Alerts

```bash
# Check Alertmanager config
curl http://localhost:9093/api/v1/status

# Test webhook manually
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

### Grafana Dashboard Missing

```bash
# Reimport dashboard
curl -X POST \
  -H "Content-Type: application/json" \
  -u admin:admin \
  -d @monitoring/grafana/dashboards/advancia-pay-production.json \
  http://localhost:3001/api/dashboards/db
```

### Service Health Check Failing

```bash
# Check service logs
docker-compose logs backend
docker-compose logs frontend

# Verify health endpoints
curl http://localhost:4000/health
curl http://localhost:3000/
```

## 📚 Runbooks

Detailed incident response procedures are available in:

- [`monitoring/runbooks/incident-response.md`](./runbooks/incident-response.md)

### Quick Reference

| Alert           | Response Time | Action                                                        |
| --------------- | ------------- | ------------------------------------------------------------- |
| Service Down    | <5 minutes    | Check logs, restart service, rollback if needed               |
| SLA Breach      | Immediate     | Stabilize services, investigate root cause, notify customers  |
| High Error Rate | <10 minutes   | Identify error patterns, rollback or fix bugs                 |
| Response Time   | <30 minutes   | Check database performance, optimize queries, scale if needed |

## 🔒 Security Considerations

### Secrets Management

- Use environment variables for API keys
- Rotate webhook URLs regularly
- Secure Grafana admin credentials
- Enable HTTPS in production

### Network Security

- Restrict Prometheus access to internal networks
- Use authentication for Grafana
- Firewall rules for monitoring ports
- VPN access for sensitive dashboards

## 🚀 Production Deployment

### Docker Swarm

```bash
# Deploy as stack
docker stack deploy -c docker-compose.yml monitoring
```

### Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f kubernetes/monitoring/
```

### Cloud Providers

- **AWS**: ECS with ALB, CloudWatch integration
- **GCP**: GKE with Cloud Monitoring
- **Azure**: AKS with Azure Monitor

## 📖 Additional Resources

- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Dashboard Design](https://grafana.com/docs/grafana/latest/best-practices/)
- [Alertmanager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)
- [PagerDuty Integration Guide](https://developer.pagerduty.com/docs/events-api-v2/overview/)

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/monitoring-improvement`
3. **Test changes**: Validate alerts and dashboards
4. **Submit pull request**: Include testing results

## 📞 Support

- **Platform Team**: #platform-support
- **Incidents**: #incidents
- **Documentation**: [Wiki](https://wiki.advancia.pay/monitoring)
- **On-call**: PagerDuty escalation

---

_Last updated: December 2024_  
_Version: 1.0.0_

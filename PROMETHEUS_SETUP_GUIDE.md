# 📊 Prometheus Monitoring Stack Setup Guide

Complete guide to setting up Prometheus, Alertmanager, and exporters for the Advancia Pay Ledger monitoring stack.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Testing & Verification](#testing--verification)
6. [Integration with Grafana](#integration-with-grafana)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## 🎯 Overview

**What you get:**

- ✅ Prometheus scraping metrics from PM2, Node Exporter, and Status JSON
- ✅ Alertmanager routing alerts to Slack + Email
- ✅ 20+ pre-configured alerting rules (uptime, restarts, CPU, memory, disk, response times)
- ✅ Grafana dashboard integration (10 panels)
- ✅ Complete monitoring coverage of application and system health

**Architecture:**

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│   PM2       │───→│  Prometheus  │───→│  Grafana     │
│   Exporter  │    │              │    │  Dashboard   │
└─────────────┘    │              │    └──────────────┘
                   │              │
┌─────────────┐    │              │    ┌──────────────┐
│   Node      │───→│  Evaluates   │───→│ Alertmanager │
│   Exporter  │    │  Alert Rules │    │              │
└─────────────┘    │              │    └──────┬───────┘
                   │              │           │
┌─────────────┐    │              │           ↓
│   JSON      │───→│              │    ┌──────────────┐
│   Exporter  │    │              │    │ Slack/Email  │
└─────────────┘    └──────────────┘    └──────────────┘
```

---

## ✅ Prerequisites

**System Requirements:**

- Ubuntu 20.04+ or similar Linux distribution
- 2GB+ RAM (4GB recommended)
- 10GB+ disk space
- Sudo privileges

**Already Running:**

- PM2 with backend processes (advancia-backend, backend-watchdog, status-updater)
- Backend API on port 4000
- Frontend on port 3000
- Nginx configured

---

## 📦 Installation

### Step 1: Install Prometheus

```bash
# Download Prometheus
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz

# Move to /opt
sudo mv prometheus-2.48.0.linux-amd64 /opt/prometheus
sudo useradd --no-create-home --shell /bin/false prometheus
sudo chown -R prometheus:prometheus /opt/prometheus

# Create directories
sudo mkdir -p /etc/prometheus /var/lib/prometheus
sudo chown prometheus:prometheus /var/lib/prometheus
```

### Step 2: Install Node Exporter

```bash
# Download Node Exporter
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvfz node_exporter-*.tar.gz

# Move to /opt
sudo mv node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter
```

### Step 3: Install PM2 Prometheus Exporter

```bash
# Install via npm
npm install -g pm2-prometheus-exporter

# Add to PM2
pm2 install pm2-prometheus-exporter

# Verify it's running
pm2 list
curl http://localhost:9615/metrics
```

### Step 4: Install JSON Exporter (Optional)

```bash
# Download JSON Exporter
cd /tmp
wget https://github.com/prometheus-community/json_exporter/releases/download/v0.6.0/json_exporter-0.6.0.linux-amd64.tar.gz
tar xvfz json_exporter-*.tar.gz

# Move to /opt
sudo mv json_exporter-0.6.0.linux-amd64/json_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false json_exporter
```

### Step 5: Install Alertmanager

```bash
# Download Alertmanager
cd /tmp
wget https://github.com/prometheus/alertmanager/releases/download/v0.26.0/alertmanager-0.26.0.linux-amd64.tar.gz
tar xvfz alertmanager-*.tar.gz

# Move to /opt
sudo mv alertmanager-0.26.0.linux-amd64 /opt/alertmanager
sudo useradd --no-create-home --shell /bin/false alertmanager
sudo chown -R alertmanager:alertmanager /opt/alertmanager

# Create directories
sudo mkdir -p /etc/alertmanager /var/lib/alertmanager
sudo chown alertmanager:alertmanager /var/lib/alertmanager
```

---

## ⚙️ Configuration

### Step 1: Configure Prometheus

```bash
# Copy config files
sudo cp backend/config/prometheus.yml /etc/prometheus/
sudo cp backend/config/alerts.yml /etc/prometheus/
sudo chown prometheus:prometheus /etc/prometheus/*
```

**Edit `/etc/prometheus/prometheus.yml`** if needed:

- Update scrape intervals
- Adjust target ports
- Add custom labels

### Step 2: Configure Alertmanager

```bash
# Copy config
sudo cp backend/config/alertmanager.yml /etc/alertmanager/
sudo chown alertmanager:alertmanager /etc/alertmanager/alertmanager.yml
```

**Update `/etc/alertmanager/alertmanager.yml`:**

```bash
# Edit with your credentials
sudo nano /etc/alertmanager/alertmanager.yml
```

Replace:

- `YOUR_APP_PASSWORD` → Your Gmail App Password (from [GMAIL_EMAIL_ALERTS_SETUP.md](GMAIL_EMAIL_ALERTS_SETUP.md))
- `https://hooks.slack.com/services/YOUR/WORKSPACE/TOKEN` → Your Slack Webhook URL (from [SLACK_WEBHOOK_SETUP.md](SLACK_WEBHOOK_SETUP.md))
- `ops@advanciapayledger.com` → Your actual ops team email

### Step 3: Create Systemd Services

**Prometheus Service:**

```bash
sudo tee /etc/systemd/system/prometheus.service > /dev/null <<EOF
[Unit]
Description=Prometheus Monitoring System
Documentation=https://prometheus.io/docs/
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/opt/prometheus/prometheus \\
    --config.file=/etc/prometheus/prometheus.yml \\
    --storage.tsdb.path=/var/lib/prometheus/ \\
    --web.console.templates=/opt/prometheus/consoles \\
    --web.console.libraries=/opt/prometheus/console_libraries
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

**Node Exporter Service:**

```bash
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<EOF
[Unit]
Description=Node Exporter
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

**JSON Exporter Service (Optional):**

```bash
sudo tee /etc/systemd/system/json_exporter.service > /dev/null <<EOF
[Unit]
Description=JSON Exporter
After=network-online.target

[Service]
User=json_exporter
Group=json_exporter
Type=simple
ExecStart=/usr/local/bin/json_exporter --config.file=/etc/json_exporter/config.yml
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

**Alertmanager Service:**

```bash
sudo tee /etc/systemd/system/alertmanager.service > /dev/null <<EOF
[Unit]
Description=Alertmanager
After=network-online.target

[Service]
User=alertmanager
Group=alertmanager
Type=simple
ExecStart=/opt/alertmanager/alertmanager \\
    --config.file=/etc/alertmanager/alertmanager.yml \\
    --storage.path=/var/lib/alertmanager/
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

### Step 4: Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable prometheus node_exporter alertmanager

# Start services
sudo systemctl start prometheus
sudo systemctl start node_exporter
sudo systemctl start alertmanager

# Optional: Start JSON exporter
# sudo systemctl enable json_exporter
# sudo systemctl start json_exporter
```

---

## 🧪 Testing & Verification

### Verify Services Are Running

```bash
# Check service status
sudo systemctl status prometheus
sudo systemctl status node_exporter
sudo systemctl status alertmanager

# Check processes
ps aux | grep prometheus
ps aux | grep node_exporter
ps aux | grep alertmanager
```

### Test Metrics Endpoints

```bash
# Prometheus (should show web UI)
curl http://localhost:9090

# Node Exporter metrics
curl http://localhost:9100/metrics

# PM2 Exporter metrics
curl http://localhost:9615/metrics

# JSON Exporter (if installed)
curl http://localhost:7979/metrics
```

### Verify Prometheus Targets

```bash
# Open Prometheus UI
# Navigate to: http://your-server:9090/targets

# You should see all targets UP:
# - node (localhost:9100) - UP
# - pm2 (localhost:9615) - UP
# - advancia-status (localhost:7979) - UP (if JSON exporter installed)
# - prometheus (localhost:9090) - UP
```

### Test Alert Rules

```bash
# Open Prometheus UI
# Navigate to: http://your-server:9090/alerts

# You should see all alert rules loaded:
# - advancia-application (6 rules)
# - advancia-pm2 (3 rules)
# - advancia-system (6 rules)
# - advancia-performance (2 rules)
# - advancia-monitoring (2 rules)

# Total: 19 alert rules
```

### Test Alertmanager

```bash
# Check Alertmanager UI
# Navigate to: http://your-server:9093

# Send test alert
curl -X POST http://localhost:9093/api/v1/alerts -d '[
  {
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "Test alert from setup",
      "description": "This is a test alert to verify Alertmanager is working"
    }
  }
]'

# Check Slack for test message
# Check email inbox for test message
```

### Verify Alert Routing

```bash
# Trigger a test alert by stopping a PM2 process
pm2 stop advancia-backend

# Wait 2 minutes (alert fires after 1m)
# Check Slack for "PM2ProcessDown" alert
# Check email for alert notification

# Restart process
pm2 start advancia-backend

# Wait 5 minutes
# Check Slack for "resolved" message
```

---

## 🎨 Integration with Grafana

### Add Prometheus Datasource

1. Open Grafana (<http://your-server:3000>)
2. Navigate to **Configuration → Data Sources**
3. Click **Add data source**
4. Select **Prometheus**
5. Configure:
   - **Name:** Prometheus
   - **URL:** <http://localhost:9090>
   - **Access:** Server (default)
6. Click **Save & Test**

### Import Dashboard

1. Navigate to **Dashboards → Import**
2. Copy JSON from [COMPLETE_ALERTING_OPERATIONS_GUIDE.md](COMPLETE_ALERTING_OPERATIONS_GUIDE.md#-ready-to-import-grafana-dashboard-json)
3. Click **Upload JSON file** or paste JSON
4. Select **Prometheus** datasource
5. Click **Import**

**Expected Result:** 10-panel dashboard with:

- System Uptime Gauge
- Recent Incidents Table
- Alert Summary Stats
- PM2 Process Uptime (line chart)
- PM2 Process Restarts (bar chart)
- System CPU Usage
- System Memory Usage
- Disk Usage
- API Response Times (p50/p95/p99)
- Component Health

---

## 🔧 Troubleshooting

### Prometheus Not Starting

```bash
# Check logs
sudo journalctl -u prometheus -f

# Common issues:
# 1. Config syntax error
sudo /opt/prometheus/promtool check config /etc/prometheus/prometheus.yml

# 2. Permissions
sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus

# 3. Port conflict
sudo netstat -tulpn | grep 9090
```

### Targets Showing as DOWN

```bash
# Check if exporter is running
curl http://localhost:9100/metrics  # Node Exporter
curl http://localhost:9615/metrics  # PM2 Exporter

# Check firewall
sudo ufw status
sudo ufw allow 9100/tcp
sudo ufw allow 9615/tcp

# Check Prometheus config
sudo nano /etc/prometheus/prometheus.yml
# Verify target addresses are correct
```

### Alerts Not Firing

```bash
# Check alert rules syntax
sudo /opt/prometheus/promtool check rules /etc/prometheus/alerts.yml

# Check Prometheus logs
sudo journalctl -u prometheus | grep -i alert

# Verify metrics exist
# Open http://your-server:9090/graph
# Query: advancia_uptime_percent
# Should return data
```

### Alertmanager Not Sending Notifications

```bash
# Check Alertmanager logs
sudo journalctl -u alertmanager -f

# Test Slack webhook manually
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test from Prometheus setup"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Test Gmail SMTP
# Use test script from GMAIL_EMAIL_ALERTS_SETUP.md
```

### High Memory Usage

```bash
# Prometheus default retention: 15 days
# Reduce if needed:
sudo nano /etc/systemd/system/prometheus.service

# Add to ExecStart:
# --storage.tsdb.retention.time=7d

# Restart
sudo systemctl daemon-reload
sudo systemctl restart prometheus
```

---

## 🔄 Maintenance

### Daily Tasks

```bash
# Check service status
sudo systemctl status prometheus node_exporter alertmanager

# Verify targets are UP
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .job, health: .health}'

# Check recent alerts
curl -s http://localhost:9093/api/v1/alerts | jq '.data[] | {name: .labels.alertname, state: .status.state}'
```

### Weekly Tasks

```bash
# Review Prometheus logs
sudo journalctl -u prometheus --since "7 days ago" | grep -i error

# Check disk usage
du -sh /var/lib/prometheus

# Review Alertmanager logs
sudo journalctl -u alertmanager --since "7 days ago" | grep -i error

# Test alert routing (send test alert)
curl -X POST http://localhost:9093/api/v1/alerts -d '[
  {
    "labels": {"alertname": "WeeklyTest", "severity": "info"},
    "annotations": {"summary": "Weekly monitoring test"}
  }
]'
```

### Monthly Tasks

```bash
# Update Prometheus
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/vX.X.X/prometheus-X.X.X.linux-amd64.tar.gz
# Follow installation steps

# Update Node Exporter
# Similar process

# Rotate Alertmanager logs
sudo systemctl restart alertmanager

# Review and tune alert thresholds
sudo nano /etc/prometheus/alerts.yml
# Adjust based on actual usage patterns

# Reload config
curl -X POST http://localhost:9090/-/reload
```

### Backup Configuration

```bash
# Backup all configs
sudo tar -czf /opt/prometheus-backup-$(date +%Y%m%d).tar.gz \
  /etc/prometheus/ \
  /etc/alertmanager/ \
  /etc/systemd/system/prometheus.service \
  /etc/systemd/system/node_exporter.service \
  /etc/systemd/system/alertmanager.service

# Copy to remote backup
scp /opt/prometheus-backup-*.tar.gz user@backup-server:/backups/
```

---

## 📊 Success Metrics

**After setup, you should have:**

- ✅ Prometheus scraping 4 targets (node, pm2, status, prometheus)
- ✅ 19 alert rules loaded and evaluating
- ✅ Alertmanager routing to Slack + Email
- ✅ Grafana dashboard showing 10 panels with live data
- ✅ Systemd services enabled and running
- ✅ Test alerts successfully delivered to Slack/Email

**Expected Performance:**

- Prometheus memory: 100-500MB
- Node Exporter memory: 10-20MB
- Alertmanager memory: 20-50MB
- Total CPU: <5% under normal load

---

## 🎯 Next Steps

1. **Customize Alert Thresholds**
   - Edit `/etc/prometheus/alerts.yml`
   - Adjust based on your baseline metrics
   - Reload: `curl -X POST http://localhost:9090/-/reload`

2. **Add Custom Metrics**
   - Instrument your Express app with `prom-client`
   - Export custom business metrics
   - Add to Grafana dashboard

3. **Setup Alert Escalation**
   - Configure PagerDuty integration
   - Add on-call rotation
   - Create runbooks for common alerts

4. **Enable Remote Storage (Optional)**
   - Setup Thanos for long-term storage
   - Configure remote write to managed Prometheus

5. **Advanced Monitoring**
   - Add distributed tracing (Jaeger/Tempo)
   - Setup log aggregation (Loki)
   - Create SLO/SLI dashboards

---

## 📚 Related Documentation

- [COMPLETE_ALERTING_OPERATIONS_GUIDE.md](COMPLETE_ALERTING_OPERATIONS_GUIDE.md) - Master operations manual
- [STATUS_PAGE_DEPLOYMENT_GUIDE.md](STATUS_PAGE_DEPLOYMENT_GUIDE.md) - Status page setup
- [SLACK_WEBHOOK_SETUP.md](SLACK_WEBHOOK_SETUP.md) - Slack integration
- [GMAIL_EMAIL_ALERTS_SETUP.md](GMAIL_EMAIL_ALERTS_SETUP.md) - Email alerts setup
- [DEPLOYMENT_PIPELINE_DIAGRAM.md](DEPLOYMENT_PIPELINE_DIAGRAM.md) - Architecture overview

---

## 🆘 Support

**Issues?**

- Check [Troubleshooting](#troubleshooting) section
- Review Prometheus logs: `sudo journalctl -u prometheus -f`
- Verify configuration: `promtool check config /etc/prometheus/prometheus.yml`
- Test metrics endpoints: `curl http://localhost:9090/metrics`

**Need Help?**

- Prometheus Documentation: <https://prometheus.io/docs/>
- Alertmanager Guide: <https://prometheus.io/docs/alerting/latest/alertmanager/>
- Community Slack: <https://prometheus.io/community/>

---

**Last Updated:** 2025-11-14  
**Version:** 1.0.0  
**Maintainer:** Advancia Pay Ledger DevOps Team

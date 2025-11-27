# Common Issues & Solutions

This troubleshooting guide covers the most frequently encountered issues in the AI DevOps Agent Command Center and provides step-by-step resolution procedures.

## 🚨 Critical Issues

### ArgoCD Application Sync Failures

#### Issue: Application Stuck in "Progressing" State

**Symptoms:**

- Application shows "Progressing" status for > 10 minutes
- Pods not starting or in CrashLoopBackOff
- Resource quotas exceeded

**Diagnosis:**

```bash
# Check application status
argocd app describe advancia-platform

# Check pod events
kubectl describe pods -n production -l app=advancia-platform

# Check resource usage
kubectl top pods -n production
kubectl describe resourcequota -n production
```

**Resolution:**

```bash
# 1. Check for resource constraints
kubectl get events -n production --sort-by=.lastTimestamp | grep -i error

# 2. Verify resource quotas
kubectl describe ns production

# 3. Check pod logs
kubectl logs -n production -l app=advancia-platform --tail=50

# 4. Force refresh and sync
argocd app refresh advancia-platform
argocd app sync advancia-platform --force

# 5. If still failing, rollback
argocd app rollback advancia-platform $(argocd app history advancia-platform | head -2 | tail -1 | awk '{print $1}')
```

#### Issue: Helm Template Rendering Errors

**Symptoms:**

- "Unable to render manifests" error
- Invalid YAML or template syntax errors
- Missing required values

**Diagnosis:**

```bash
# Test Helm template locally
helm template advancia-platform ./helm/advancia-platform \
  --namespace production \
  --values values-production.yaml

# Check ArgoCD logs
kubectl logs -n argocd deployment/argocd-repo-server
```

**Resolution:**

```bash
# 1. Validate Helm template syntax
helm lint ./helm/advancia-platform

# 2. Check required values
helm template --debug ./helm/advancia-platform --dry-run

# 3. Fix template issues and commit
git add . && git commit -m "Fix: Helm template syntax"
git push origin main

# 4. Refresh ArgoCD
argocd app refresh advancia-platform
```

### Database Connection Issues

#### Issue: PostgreSQL Connection Timeouts

**Symptoms:**

- Application pods cannot connect to database
- "Connection timeout" errors in logs
- Database queries hanging

**Diagnosis:**

```bash
# Check database pod status
kubectl get pods -n production -l app=postgresql

# Test database connectivity
kubectl exec -n production postgres-primary-0 -- psql -U postgres -c "SELECT 1;"

# Check database logs
kubectl logs -n production postgres-primary-0 --tail=100

# Verify network policies
kubectl get networkpolicy -n production
```

**Resolution:**

```bash
# 1. Restart database connection pool
kubectl rollout restart deployment/pgbouncer -n production

# 2. Check database resource usage
kubectl exec -n production postgres-primary-0 -- \
  psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# 3. Verify database configuration
kubectl get configmap postgres-config -n production -o yaml

# 4. If needed, restart database (WARNING: This causes downtime)
kubectl rollout restart statefulset/postgres-primary -n production
```

### Monitoring & Observability Issues

#### Issue: Prometheus Data Loss

**Symptoms:**

- Missing metrics in Grafana
- Prometheus storage full
- Scrape targets down

**Diagnosis:**

```bash
# Check Prometheus status
kubectl get pods -n monitoring -l app=prometheus

# Check storage usage
kubectl exec -n monitoring prometheus-server-0 -- df -h /prometheus

# Verify service discovery
curl http://prometheus:9090/api/v1/targets
```

**Resolution:**

```bash
# 1. Check storage configuration
kubectl get pvc -n monitoring

# 2. Clean up old data if storage full
kubectl exec -n monitoring prometheus-server-0 -- \
  find /prometheus -name "*.db" -mtime +30 -delete

# 3. Restart Prometheus
kubectl rollout restart deployment/prometheus-server -n monitoring

# 4. Verify targets are being scraped
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
# Open http://localhost:9090/targets
```

## ⚠️ Performance Issues

### High CPU/Memory Usage

#### Issue: Application Pods Consuming Excessive Resources

**Symptoms:**

- Pods being OOMKilled
- High CPU usage alerts
- Slow response times

**Diagnosis:**

```bash
# Check resource usage
kubectl top pods -n production --sort-by=memory
kubectl top pods -n production --sort-by=cpu

# Check resource limits
kubectl describe pod -n production -l app=advancia-platform

# Analyze metrics
kubectl port-forward -n monitoring svc/prometheus-server 9090:80
# Query: rate(container_cpu_usage_seconds_total[5m])
```

**Resolution:**

```bash
# 1. Increase resource limits temporarily
kubectl patch deployment advancia-platform -n production -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"advancia-platform","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'

# 2. Enable HPA if not already
kubectl apply -f k8s/hpa.yaml

# 3. Check for memory leaks
kubectl exec -n production pod/advancia-platform-xxx -- \
  curl http://localhost:8080/metrics | grep -i memory

# 4. Restart pods if needed
kubectl rollout restart deployment/advancia-platform -n production
```

### Database Performance Issues

#### Issue: Slow Database Queries

**Symptoms:**

- High database CPU usage
- Query timeouts
- Slow API response times

**Diagnosis:**

```bash
# Check slow queries
kubectl exec -n production postgres-primary-0 -- \
  psql -U postgres -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check database locks
kubectl exec -n production postgres-primary-0 -- \
  psql -U postgres -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Monitor connection count
kubectl exec -n production postgres-primary-0 -- \
  psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution:**

```bash
# 1. Add database indexes (example)
kubectl exec -n production postgres-primary-0 -- \
  psql -U postgres advancia -c "CREATE INDEX CONCURRENTLY idx_user_email ON users(email);"

# 2. Optimize queries
# Review slow queries and optimize in application code

# 3. Adjust connection pool settings
kubectl patch configmap pgbouncer-config -n production -p \
  '{"data":{"pgbouncer.ini":"[databases]\nadvancia = host=postgres-primary port=5432\n[pgbouncer]\nmax_client_conn = 1000\ndefault_pool_size = 50"}}'

# 4. Consider read replicas for read-heavy workloads
kubectl apply -f k8s/postgres-replica.yaml
```

## 🔧 Configuration Issues

### Environment Configuration Problems

#### Issue: Missing Environment Variables

**Symptoms:**

- Application failing to start
- "Environment variable not found" errors
- Configuration validation failures

**Diagnosis:**

```bash
# Check configmaps and secrets
kubectl get configmaps -n production
kubectl get secrets -n production

# Verify environment variables
kubectl describe pod -n production advancia-platform-xxx | grep -A 20 "Environment:"

# Check application logs
kubectl logs -n production -l app=advancia-platform | grep -i "environment\|config"
```

**Resolution:**

```bash
# 1. Create missing configmap/secret
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_PASSWORD=secretpassword \
  --namespace production

# 2. Update deployment to reference new secret
kubectl patch deployment advancia-platform -n production -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"advancia-platform","env":[{"name":"DATABASE_PASSWORD","valueFrom":{"secretKeyRef":{"name":"app-secrets","key":"DATABASE_PASSWORD"}}}]}]}}}}'

# 3. Verify configuration
kubectl rollout status deployment/advancia-platform -n production
```

### Network Connectivity Issues

#### Issue: Pod-to-Pod Communication Failures

**Symptoms:**

- Service discovery failures
- DNS resolution errors
- Network timeouts between services

**Diagnosis:**

```bash
# Test DNS resolution
kubectl exec -n production advancia-platform-xxx -- nslookup postgresql

# Check service endpoints
kubectl get endpoints -n production postgresql

# Test network connectivity
kubectl exec -n production advancia-platform-xxx -- \
  curl -v http://postgresql:5432

# Check network policies
kubectl get networkpolicy -n production -o yaml
```

**Resolution:**

```bash
# 1. Verify service configuration
kubectl describe svc postgresql -n production

# 2. Check if network policies are blocking traffic
kubectl get networkpolicy -n production

# 3. Test with temporary debug pod
kubectl run debug --image=busybox --restart=Never -- sleep 3600
kubectl exec debug -- nslookup postgresql

# 4. Fix network policy if needed
kubectl apply -f k8s/networkpolicy-fix.yaml

# 5. Cleanup debug pod
kubectl delete pod debug
```

## 🛠️ Deployment Issues

### Image Pull Errors

#### Issue: Unable to Pull Container Images

**Symptoms:**

- "ImagePullBackOff" pod status
- Authentication errors to registry
- Image not found errors

**Diagnosis:**

```bash
# Check pod events
kubectl describe pod -n production advancia-platform-xxx

# Check image pull secret
kubectl get secrets -n production | grep regcred
kubectl describe secret regcred -n production

# Test image availability
docker pull advancia/platform:latest
```

**Resolution:**

```bash
# 1. Create/update image pull secret
kubectl create secret docker-registry regcred \
  --docker-server=registry.advancia.com \
  --docker-username=cicd \
  --docker-password=token123 \
  --namespace production

# 2. Add image pull secret to deployment
kubectl patch deployment advancia-platform -n production -p \
  '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"regcred"}]}}}}'

# 3. Update image tag if needed
kubectl set image deployment/advancia-platform -n production \
  advancia-platform=advancia/platform:v1.2.3
```

### Rolling Update Failures

#### Issue: Deployment Stuck During Rolling Update

**Symptoms:**

- Old pods not terminating
- New pods not starting
- Deployment timeout errors

**Diagnosis:**

```bash
# Check deployment status
kubectl rollout status deployment/advancia-platform -n production

# Check pod status
kubectl get pods -n production -l app=advancia-platform

# Check events
kubectl get events -n production --field-selector reason=FailedScheduling
```

**Resolution:**

```bash
# 1. Check resource availability
kubectl describe nodes | grep -A 5 "Allocatable:"

# 2. Force rollout restart
kubectl rollout restart deployment/advancia-platform -n production

# 3. If stuck, scale down and up
kubectl scale deployment/advancia-platform --replicas=0 -n production
kubectl scale deployment/advancia-platform --replicas=3 -n production

# 4. Check for stuck finalizers
kubectl get pods -n production -o json | jq '.items[] | select(.metadata.deletionTimestamp != null)'
```

## 🔍 Debugging Tools & Commands

### Essential Debugging Commands

#### Quick Health Check Script

```bash
#!/bin/bash
# health-check.sh

NAMESPACE=${1:-production}
APP=${2:-advancia-platform}

echo "🔍 Health Check for $APP in $NAMESPACE"
echo "=====================================\n"

# Pod status
echo "📊 Pod Status:"
kubectl get pods -n $NAMESPACE -l app=$APP -o wide

# Service status
echo -e "\n🌐 Service Status:"
kubectl get svc -n $NAMESPACE -l app=$APP

# Recent events
echo -e "\n📋 Recent Events:"
kubectl get events -n $NAMESPACE --sort-by=.lastTimestamp | tail -10

# Resource usage
echo -e "\n💾 Resource Usage:"
kubectl top pods -n $NAMESPACE -l app=$APP

# Health endpoint check (if available)
echo -e "\n🏥 Health Endpoint Check:"
kubectl exec -n $NAMESPACE deployment/$APP -- curl -s http://localhost:8080/health || echo "Health endpoint not available"

echo -e "\n✅ Health check completed"
```

#### Log Analysis Script

```bash
#!/bin/bash
# analyze-logs.sh

NAMESPACE=${1:-production}
APP=${2:-advancia-platform}
LINES=${3:-100}

echo "📜 Analyzing logs for $APP in $NAMESPACE"
echo "======================================="

# Get all pod logs
kubectl logs -n $NAMESPACE -l app=$APP --tail=$LINES --prefix=true

# Count error patterns
echo -e "\n🔍 Error Analysis:"
kubectl logs -n $NAMESPACE -l app=$APP --tail=1000 | grep -i error | sort | uniq -c | sort -nr

# Performance indicators
echo -e "\n⏱️  Performance Indicators:"
kubectl logs -n $NAMESPACE -l app=$APP --tail=1000 | grep -E "response_time|latency" | tail -10
```

### Advanced Debugging

#### Memory Leak Detection

```bash
# Enable memory profiling
kubectl exec -n production deployment/advancia-platform -- \
  curl http://localhost:8080/debug/pprof/heap > heap.prof

# Analyze with go tool (if Go application)
go tool pprof heap.prof
```

#### Network Troubleshooting

```bash
# Create debug pod with network tools
kubectl run netshoot --rm -i --tty \
  --image nicolaka/netshoot \
  -- /bin/bash

# Inside the debug pod:
# - ping other services
# - traceroute to external services
# - curl health endpoints
# - dig DNS records
```

## 📊 Monitoring & Alerting

### Custom Alerts for Common Issues

```yaml
# alerts.yaml
groups:
  - name: troubleshooting.rules
    rules:
      - alert: HighErrorRate
        expr: |
          (
            rate(http_requests_total{status=~"5.."}[5m]) /
            rate(http_requests_total[5m])
          ) > 0.05
        for: 2m
        labels:
          severity: warning
          runbook_url: "https://docs.advancia.com/troubleshooting/common-issues#high-error-rate"
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: PodCrashLooping
        expr: |
          increase(kube_pod_container_status_restarts_total[15m]) > 3
        labels:
          severity: critical
          runbook_url: "https://docs.advancia.com/troubleshooting/common-issues#pod-crash-looping"
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} has restarted {{ $value }} times"

      - alert: DatabaseConnectionHigh
        expr: |
          pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
          runbook_url: "https://docs.advancia.com/troubleshooting/common-issues#database-connections"
        annotations:
          summary: "High database connection count"
          description: "Database has {{ $value }} active connections"
```

### Runbook Integration

Each alert includes a `runbook_url` that links directly to the relevant section of this troubleshooting guide, enabling quick resolution by on-call engineers.

## 🚀 Emergency Procedures

### Emergency Runbook

#### 1. Complete Service Outage

```bash
# Immediate actions (< 2 minutes)
1. Check overall cluster health: kubectl get nodes
2. Verify ArgoCD status: kubectl get pods -n argocd
3. Check critical services: kubectl get pods -n production
4. Initiate emergency rollback if needed: ./scripts/emergency-rollback.sh
```

#### 2. Data Corruption Detected

```bash
# Immediate actions (< 1 minute)
1. Stop all writes: kubectl scale deployment/advancia-platform --replicas=0
2. Backup current state: ./scripts/emergency-backup.sh
3. Notify stakeholders: ./scripts/notify-incident.sh "DATA_CORRUPTION"
4. Begin recovery procedure: ./scripts/data-recovery.sh
```

#### 3. Security Incident

```bash
# Immediate actions (< 30 seconds)
1. Isolate affected namespace: kubectl apply -f k8s/security-lockdown.yaml
2. Revoke all sessions: ./scripts/revoke-sessions.sh
3. Alert security team: ./scripts/security-alert.sh
4. Begin forensic collection: ./scripts/collect-forensics.sh
```

## 📚 Related Documentation

- [Error Resolution Guide](error-resolution.md)
- [Performance Troubleshooting](performance.md)
- [Network Troubleshooting](network.md)
- [FAQ](faq.md)
- [Operations Guide](../operations/gitops-operations.md)
- [Monitoring Setup](../observability/monitoring.md)

## 📞 Escalation Contacts

- **Platform Team**: <platform-team@advancia.com> (Slack: #platform-team)
- **Security Team**: <security@advancia.com> (PagerDuty: security-on-call)
- **Database Team**: <dba@advancia.com> (Slack: #database-team)
- **Emergency Hotline**: +1-XXX-XXX-XXXX (24/7 on-call)

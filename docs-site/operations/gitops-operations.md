# GitOps Operations Guide

This guide covers day-to-day operations for the AI DevOps Agent Command Center, including sync management, rollback procedures, scaling strategies, and chaos testing.

## 🔄 Sync Management

### ArgoCD Sync Operations

#### Manual Sync

```bash
# Sync specific application
argocd app sync advancia-platform

# Sync with options
argocd app sync advancia-platform \
  --prune \
  --force \
  --replace \
  --timeout 300
```

#### Automated Sync Configuration

```yaml
# ArgoCD Application with automated sync
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: advancia-platform
spec:
  syncPolicy:
    automated:
      prune: true        # Remove resources not in Git
      selfHeal: true     # Automatically correct drift
      allowEmpty: false  # Prevent empty deployments
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m0s
```

### Sync Status Monitoring

#### Health Check Dashboard

```bash
# Check application health
argocd app list
argocd app get advancia-platform

# View sync history
argocd app history advancia-platform

# Get detailed status
argocd app describe advancia-platform
```

#### Sync Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Sync Success Rate | % of successful syncs | > 99% |
| Sync Duration | Time to complete sync | < 2 min |
| Drift Detection Time | Time to detect changes | < 30 sec |
| Auto-heal Success | % of successful auto-corrections | > 95% |

## 🔄 Rollback Procedures

### Immediate Rollback

#### Emergency Rollback Script

```bash
#!/bin/bash
# emergency-rollback.sh

set -e

APP_NAME=${1:-advancia-platform}
TARGET_REVISION=${2}

echo "🚨 Emergency rollback initiated for $APP_NAME"

# Get current revision
CURRENT_REV=$(argocd app get $APP_NAME -o json | jq -r '.status.sync.revision')
echo "Current revision: $CURRENT_REV"

# Get previous stable revision if not specified
if [ -z "$TARGET_REVISION" ]; then
    TARGET_REVISION=$(argocd app history $APP_NAME | grep "Succeeded" | head -2 | tail -1 | awk '{print $1}')
fi

echo "Rolling back to revision: $TARGET_REVISION"

# Execute rollback
argocd app rollback $APP_NAME $TARGET_REVISION

# Monitor rollback
echo "Monitoring rollback progress..."
argocd app wait $APP_NAME --timeout 300

# Verify health
argocd app describe $APP_NAME

echo "✅ Rollback completed successfully"
```

#### Database Rollback (if required)

```bash
# Backup current state
kubectl exec -n production postgres-primary-0 -- \
  pg_dump -U postgres advancia > backup-pre-rollback.sql

# Restore from backup
kubectl exec -i -n production postgres-primary-0 -- \
  psql -U postgres advancia < backup-stable.sql
```

### Rollback Validation

#### Post-Rollback Checks

```yaml
# Health check script
apiVersion: v1
kind: ConfigMap
metadata:
  name: rollback-validation
data:
  validate.sh: |
    #!/bin/bash
    
    # Check application pods
    kubectl get pods -n production -l app=advancia-platform
    
    # Verify API health
    curl -f http://advancia-platform/health || exit 1
    
    # Check database connectivity
    kubectl exec -n production postgres-primary-0 -- \
      psql -U postgres -c "SELECT 1;" || exit 1
    
    # Validate key metrics
    curl -s "http://prometheus:9090/api/v1/query?query=up{job='advancia-platform'}" | \
      jq -r '.data.result[0].value[1]' | grep -q "1" || exit 1
    
    echo "✅ Rollback validation successful"
```

### Rollback Automation

#### GitOps Rollback Workflow

```yaml
# .github/workflows/emergency-rollback.yml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      application:
        description: 'Application to rollback'
        required: true
        default: 'advancia-platform'
      revision:
        description: 'Target revision (optional)'
        required: false

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Setup ArgoCD CLI
        run: |
          curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x /usr/local/bin/argocd
          
      - name: Login to ArgoCD
        env:
          ARGOCD_SERVER: ${{ secrets.ARGOCD_SERVER }}
          ARGOCD_AUTH_TOKEN: ${{ secrets.ARGOCD_AUTH_TOKEN }}
        run: argocd login $ARGOCD_SERVER --auth-token $ARGOCD_AUTH_TOKEN
        
      - name: Execute Rollback
        run: |
          ./scripts/emergency-rollback.sh ${{ github.event.inputs.application }} ${{ github.event.inputs.revision }}
          
      - name: Notify Teams
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          TEAMS_WEBHOOK: ${{ secrets.TEAMS_WEBHOOK }}
        run: |
          # Send notifications to Slack and Teams
          curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\": \"🔄 Emergency rollback completed for ${{ github.event.inputs.application }}\"}" \
            $SLACK_WEBHOOK
```

## 📊 Scaling Strategies

### Horizontal Pod Autoscaling (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: advancia-platform-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: advancia-platform
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: custom_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

### Vertical Pod Autoscaling (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: advancia-platform-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: advancia-platform
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: advancia-platform
      maxAllowed:
        cpu: "2"
        memory: "4Gi"
      minAllowed:
        cpu: "100m"
        memory: "256Mi"
      controlledResources: ["cpu", "memory"]
```

### Cluster Autoscaling

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-autoscaler-status
  namespace: kube-system
data:
  nodes.max: "50"
  nodes.min: "5"
  scale-down-delay-after-add: "10m"
  scale-down-unneeded-time: "5m"
  skip-nodes-with-local-storage: "false"
  skip-nodes-with-system-pods: "false"
```

## 🧪 Chaos Testing

### Chaos Engineering Strategy

#### Pod Failure Simulation

```bash
#!/bin/bash
# chaos-pod-failure.sh

NAMESPACE="production"
APP="advancia-platform"

echo "🧪 Starting pod failure chaos test"

# Get random pod
POD=$(kubectl get pods -n $NAMESPACE -l app=$APP -o jsonpath='{.items[*].metadata.name}' | tr ' ' '\n' | shuf | head -1)

echo "Terminating pod: $POD"

# Delete pod
kubectl delete pod $POD -n $NAMESPACE

# Monitor recovery
kubectl wait --for=condition=ready pod -l app=$APP -n $NAMESPACE --timeout=300s

echo "✅ Pod failure test completed"
```

#### Network Partitioning

```yaml
# Network policy to simulate partition
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: chaos-network-partition
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: advancia-platform
  policyTypes:
  - Ingress
  - Egress
  ingress: []  # Block all ingress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: UDP
      port: 53  # Allow DNS only
```

#### Resource Exhaustion Test

```yaml
# Stress test deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chaos-stress-test
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: chaos-stress
  template:
    metadata:
      labels:
        app: chaos-stress
    spec:
      containers:
      - name: stress
        image: progrium/stress
        args: ["--cpu", "2", "--memory", "1g", "--timeout", "300s"]
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi" 
            cpu: "2000m"
```

### Automated Chaos Testing

#### Chaos Monkey Implementation

```yaml
# ChaosMonkey CRD
apiVersion: chaos-engineering.io/v1alpha1
kind: ChaosExperiment
metadata:
  name: weekly-chaos-test
  namespace: production
spec:
  schedule: "0 2 * * 1"  # Every Monday at 2 AM
  experiments:
  - type: podKill
    targets:
      - app: advancia-platform
    parameters:
      percentage: 10
      duration: "5m"
  - type: networkDelay
    targets:
      - app: advancia-platform
    parameters:
      delay: "100ms"
      duration: "10m"
  - type: memoryStress
    targets:
      - app: advancia-platform
    parameters:
      percentage: 80
      duration: "5m"
  notifications:
    slack:
      webhook: ${SLACK_WEBHOOK}
      channel: "#platform-alerts"
    teams:
      webhook: ${TEAMS_WEBHOOK}
```

## 📈 Performance Monitoring

### Key Operational Metrics

```yaml
# Prometheus recording rules
groups:
- name: operations.rules
  rules:
  - record: advancia:sync_success_rate
    expr: |
      (
        rate(argocd_app_sync_total{phase="Succeeded"}[5m]) /
        rate(argocd_app_sync_total[5m])
      ) * 100

  - record: advancia:deployment_frequency
    expr: |
      increase(argocd_app_sync_total{phase="Succeeded"}[1d])

  - record: advancia:mean_time_to_recovery
    expr: |
      avg_over_time(
        (argocd_app_health_status == 0) * 
        (time() - argocd_app_health_status_changed_time)
      [1h])

  - record: advancia:change_failure_rate
    expr: |
      (
        rate(argocd_app_sync_total{phase="Failed"}[1h]) /
        rate(argocd_app_sync_total[1h])
      ) * 100
```

### Operational Dashboards

#### Key Performance Indicators

- **Deployment Frequency**: Deployments per day
- **Lead Time**: Commit to production time
- **Mean Time to Recovery (MTTR)**: < 5 minutes
- **Change Failure Rate**: < 5%

## 🚨 Alert Configuration

### Critical Alerts

```yaml
# Prometheus alerting rules
groups:
- name: operations.alerts
  rules:
  - alert: ArgocdSyncFailed
    expr: argocd_app_health_status{health_status!="Healthy"} == 1
    for: 5m
    labels:
      severity: critical
      team: platform
    annotations:
      summary: "ArgoCD application sync failed"
      description: "Application {{ $labels.name }} sync has failed"

  - alert: DeploymentStuck
    expr: |
      (
        time() - argocd_app_operation_initiated_by_timestamp
      ) > 600  # 10 minutes
    labels:
      severity: warning
      team: platform
    annotations:
      summary: "Deployment taking longer than expected"
      description: "Deployment for {{ $labels.application }} has been running for more than 10 minutes"
```

## 🔍 Troubleshooting Commands

### Quick Diagnostics

```bash
# Application status
argocd app get advancia-platform

# Pod status
kubectl get pods -n production -l app=advancia-platform

# Recent events
kubectl get events -n production --sort-by=.lastTimestamp

# Logs
kubectl logs -n production -l app=advancia-platform --tail=100

# Resource usage
kubectl top pods -n production
kubectl top nodes
```

## 📚 Related Documentation

- [Monitoring Setup](../observability/monitoring.md)
- [Chaos Testing Guide](chaos-testing.md)
- [Scaling Strategies](scaling.md)
- [Troubleshooting Guide](../troubleshooting/common-issues.md)
- [Performance Optimization](../troubleshooting/performance.md)

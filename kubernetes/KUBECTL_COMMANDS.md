# Kubernetes Deployment Commands

## Quick reference for deploying Advancia Pay to Kubernetes

## Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify installation
kubectl version --client
```

## Initial Setup

### 1. Create Namespace

```bash
kubectl create namespace advancia-pay
```

### 2. Create Secrets

```bash
# Database secrets
kubectl create secret generic database-secrets \
  --from-literal=url='postgresql://advancia_user:YOUR_PASSWORD@postgres-service:5432/advancia_pay' \
  --from-literal=username='advancia_user' \
  --from-literal=password='YOUR_STRONG_PASSWORD' \
  --namespace=advancia-pay

# Application secrets
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret='YOUR_JWT_SECRET_HERE' \
  --from-literal=encryption-key='YOUR_32_BYTE_ENCRYPTION_KEY' \
  --namespace=advancia-pay

# Payment secrets
kubectl create secret generic payment-secrets \
  --from-literal=stripe-secret='sk_live_YOUR_STRIPE_KEY' \
  --from-literal=cryptomus-key='YOUR_CRYPTOMUS_KEY' \
  --from-literal=trustpilot-key='YOUR_TRUSTPILOT_KEY' \
  --namespace=advancia-pay
```

### 3. Deploy Application

```bash
# Apply all manifests
kubectl apply -f kubernetes/deployment.yaml

# Verify deployments
kubectl get all -n advancia-pay
```

## Build and Push Docker Images

### Backend

```bash
# Build image
docker build -t advancia-pay/backend:latest ./backend

# Tag for registry
docker tag advancia-pay/backend:latest YOUR_REGISTRY/advancia-pay/backend:latest

# Push to registry
docker push YOUR_REGISTRY/advancia-pay/backend:latest
```

### Frontend

```bash
# Build image
docker build -t advancia-pay/frontend:latest ./frontend

# Tag for registry
docker tag advancia-pay/frontend:latest YOUR_REGISTRY/advancia-pay/frontend:latest

# Push to registry
docker push YOUR_REGISTRY/advancia-pay/frontend:latest
```

## Deployment Operations

### Check Pod Status

```bash
kubectl get pods -n advancia-pay
kubectl describe pod POD_NAME -n advancia-pay
kubectl logs POD_NAME -n advancia-pay --follow
```

### Scale Deployments

```bash
# Scale backend
kubectl scale deployment backend --replicas=5 -n advancia-pay

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n advancia-pay
```

### Rolling Update

```bash
# Update backend image
kubectl set image deployment/backend backend=YOUR_REGISTRY/advancia-pay/backend:v2.0 -n advancia-pay

# Check rollout status
kubectl rollout status deployment/backend -n advancia-pay

# Rollback if needed
kubectl rollout undo deployment/backend -n advancia-pay
```

### Port Forwarding (for testing)

```bash
# Forward backend
kubectl port-forward service/backend-service 4000:4000 -n advancia-pay

# Forward frontend
kubectl port-forward service/frontend-service 3000:3000 -n advancia-pay

# Forward database
kubectl port-forward service/postgres-service 5432:5432 -n advancia-pay
```

## Monitoring

### View Logs

```bash
# Backend logs
kubectl logs -l app=backend -n advancia-pay --tail=100

# Frontend logs
kubectl logs -l app=frontend -n advancia-pay --tail=100

# Stream logs
kubectl logs -l app=backend -n advancia-pay --follow
```

### Resource Usage

```bash
# Get resource usage
kubectl top pods -n advancia-pay
kubectl top nodes

# Describe HPA
kubectl describe hpa backend-hpa -n advancia-pay
```

## Database Operations

### Access PostgreSQL

```bash
# Execute into postgres pod
kubectl exec -it postgres-0 -n advancia-pay -- psql -U advancia_user -d advancia_pay

# Run SQL file
kubectl exec -i postgres-0 -n advancia-pay -- psql -U advancia_user -d advancia_pay < migration.sql
```

### Backup Database

```bash
# Create backup
kubectl exec postgres-0 -n advancia-pay -- pg_dump -U advancia_user advancia_pay > backup.sql

# Restore backup
kubectl exec -i postgres-0 -n advancia-pay -- psql -U advancia_user advancia_pay < backup.sql
```

## Troubleshooting

### Pod Not Starting

```bash
# Check events
kubectl get events -n advancia-pay --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod POD_NAME -n advancia-pay

# Check logs
kubectl logs POD_NAME -n advancia-pay --previous
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints -n advancia-pay

# Test service internally
kubectl run -it --rm debug --image=busybox --restart=Never -n advancia-pay -- sh
wget -qO- http://backend-service:4000/api/health
```

### Resource Issues

```bash
# Check resource quotas
kubectl describe resourcequota -n advancia-pay

# Check node capacity
kubectl describe nodes

# View pod resource requests/limits
kubectl describe pod POD_NAME -n advancia-pay | grep -A 5 "Limits\|Requests"
```

## Cleanup

### Delete Deployment

```bash
# Delete all resources
kubectl delete -f kubernetes/deployment.yaml

# Delete namespace (removes everything)
kubectl delete namespace advancia-pay
```

### Delete Secrets

```bash
kubectl delete secret database-secrets -n advancia-pay
kubectl delete secret app-secrets -n advancia-pay
kubectl delete secret payment-secrets -n advancia-pay
```

## Production Checklist

- [ ] SSL/TLS certificates configured
- [ ] Secrets properly created and secured
- [ ] Resource limits set appropriately
- [ ] HPA configured and tested
- [ ] Network policies applied
- [ ] PodDisruptionBudgets configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan tested
- [ ] Load testing completed

## Quick Commands Reference

```bash
# Context switching
kubectl config get-contexts
kubectl config use-context YOUR_CLUSTER

# Namespace shortcut
alias k='kubectl -n advancia-pay'

# Quick status
k get all

# Quick logs
k logs -l app=backend --tail=50 -f

# Quick exec
k exec -it POD_NAME -- sh

# Quick describe
k describe pod POD_NAME

# Quick port-forward
k port-forward svc/backend-service 4000:4000
```

## Advanced: Blue-Green Deployment

```bash
# Deploy green version
kubectl apply -f kubernetes/deployment-green.yaml

# Test green deployment
kubectl port-forward service/backend-service-green 4001:4000 -n advancia-pay

# Switch traffic
kubectl patch service backend-service -n advancia-pay -p '{"spec":{"selector":{"version":"green"}}}'

# Cleanup blue deployment
kubectl delete deployment backend-blue -n advancia-pay
```

## Advanced: Canary Deployment

```bash
# Deploy canary (10% traffic)
kubectl apply -f kubernetes/deployment-canary.yaml

# Monitor canary metrics
kubectl logs -l version=canary -n advancia-pay

# If successful, rollout to all
kubectl set image deployment/backend backend=YOUR_REGISTRY/advancia-pay/backend:canary -n advancia-pay

# If failed, remove canary
kubectl delete deployment backend-canary -n advancia-pay
```

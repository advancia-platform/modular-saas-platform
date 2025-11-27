# 🚀 GitOps Infrastructure for Advancia Modular SaaS Platform

This directory contains the complete GitOps infrastructure configuration for deploying the Advancia platform using Kubernetes, Helm, and Kustomize.

## 📁 Structure

```text
infra/gitops/
├── helm/
│   ├── backend/          # Backend Helm chart
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   └── frontend/         # Frontend Helm chart
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
├── kustomize/
│   ├── base/            # Base Kubernetes manifests
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   ├── backend-deployment.yaml
│   │   ├── frontend-deployment.yaml
│   │   └── ingress.yaml
│   └── overlays/        # Environment-specific configurations
│       ├── development/
│       ├── staging/
│       └── production/
└── README.md
```

## 🛠️ Prerequisites

- Kubernetes cluster (v1.24+)
- Helm 3.8+
- Kustomize 4.5+
- kubectl configured
- ArgoCD (for GitOps deployment)
- GitHub Container Registry access

## 🚀 Quick Start

### 1. Environment Setup

First, ensure you have all required tools:

````bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install Kustomize
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash

# Verify installations
helm version
kustomize version
kubectl version
```bash

### 2. Deploy with Kustomize (Recommended)

#### Development Environment

```bash
cd infra/gitops/kustomize/overlays/development
kustomize build . | kubectl apply -f -

# Verify deployment
kubectl get pods -n advancia-dev
kubectl get ingress -n advancia-dev
````

#### Staging Environment

```bash
cd infra/gitops/kustomize/overlays/staging
kustomize build . | kubectl apply -f -

# Monitor rollout
kubectl rollout status deployment/backend -n advancia-staging
kubectl rollout status deployment/frontend -n advancia-staging
```

#### Production Environment

```bash
cd infra/gitops/kustomize/overlays/production
kustomize build . | kubectl apply -f -

# Check HPA and PDB
kubectl get hpa -n advancia-prod
kubectl get pdb -n advancia-prod
```

### 3. Deploy with Helm

#### Backend Deployment

```bash
cd infra/gitops/helm/backend

# Development
helm install advancia-backend . -f values.yaml \
  --set image.tag=dev-latest \
  --set replicaCount=1 \
  --namespace advancia-dev \
  --create-namespace

# Production
helm install advancia-backend . -f values.yaml \
  --set image.tag=v1.2.0 \
  --set replicaCount=3 \
  --namespace advancia-prod \
  --create-namespace
```

#### Frontend Deployment

```bash
cd infra/gitops/helm/frontend

# Development
helm install advancia-frontend . -f values.yaml \
  --set image.tag=dev-latest \
  --set replicaCount=1 \
  --namespace advancia-dev

# Production
helm install advancia-frontend . -f values.yaml \
  --set image.tag=v1.2.0 \
  --set replicaCount=5 \
  --namespace advancia-prod
```

## 🔧 Configuration

### Environment Variables

Create secrets for each environment:

```bash
# Database secret
kubectl create secret generic database-secret \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -n advancia-prod

# JWT secrets
kubectl create secret generic jwt-secret \
  --from-literal=JWT_SECRET="your-jwt-secret" \
  --from-literal=JWT_REFRESH_SECRET="your-refresh-secret" \
  -n advancia-prod

# Payment provider secrets
kubectl create secret generic stripe-secret \
  --from-literal=STRIPE_SECRET_KEY="sk_live_..." \
  --from-literal=STRIPE_WEBHOOK_SECRET="whsec_..." \
  -n advancia-prod

kubectl create secret generic cryptomus-secret \
  --from-literal=CRYPTOMUS_API_KEY="your-api-key" \
  --from-literal=CRYPTOMUS_MERCHANT_ID="your-merchant-id" \
  -n advancia-prod

# Email secrets
kubectl create secret generic email-secret \
  --from-literal=EMAIL_USER="your-email@gmail.com" \
  --from-literal=EMAIL_PASSWORD="your-app-password" \
  -n advancia-prod

# VAPID secrets for web push
kubectl create secret generic vapid-secret \
  --from-literal=VAPID_PUBLIC_KEY="your-public-key" \
  --from-literal=VAPID_PRIVATE_KEY="your-private-key" \
  -n advancia-prod
```

### TLS Configuration

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@advancia.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## 📊 Monitoring and Observability

### Metrics Collection

The platform includes Prometheus metrics collection:

```bash
# Check ServiceMonitor resources
kubectl get servicemonitor -n monitoring

# Verify metrics endpoints
kubectl port-forward svc/backend 4000:80 -n advancia-prod
curl http://localhost:4000/metrics
```

### Health Checks

All services include health check endpoints:

```bash
# Backend health
kubectl exec -n advancia-prod deployment/backend -- curl http://localhost:4000/api/health

# Frontend health
kubectl exec -n advancia-prod deployment/frontend -- curl http://localhost:3000/
```

## 🎯 Performance Optimizations

### Resource Limits and Requests

The configurations include optimized resource allocations:

- **Development**: Minimal resources for cost efficiency
- **Staging**: Moderate resources for testing
- **Production**: Full resources with autoscaling

### Horizontal Pod Autoscaling (HPA)

Production includes HPA for both CPU and memory:

```bash
# Check HPA status
kubectl get hpa -n advancia-prod

# Describe HPA for details
kubectl describe hpa backend-hpa -n advancia-prod
```

### Pod Disruption Budgets (PDB)

Ensures high availability during updates:

```bash
# Check PDB status
kubectl get pdb -n advancia-prod
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The GitOps workflow (`.github/workflows/gitops-deploy.yml`) provides:

1. **Change Detection**: Only builds/deploys changed components
2. **Multi-environment**: Automatic environment detection
3. **Security Scanning**: Trivy vulnerability scanning
4. **Parallel Builds**: Backend and frontend build in parallel
5. **Progressive Deployment**: Development → Staging → Production

### Required Secrets

Configure these secrets in your GitHub repository:

```yaml
# Kubernetes access
KUBECONFIG: <base64-encoded-kubeconfig>

# ArgoCD integration
ARGOCD_SERVER: <argocd-server-url>
ARGOCD_USERNAME: <argocd-username>
ARGOCD_PASSWORD: <argocd-password>

# Notifications
SLACK_WEBHOOK_URL: <slack-webhook-url>

# Container registry
GITHUB_TOKEN: <automatically-provided>
```

## 🔍 Troubleshooting

### Common Issues

1. **Pod Stuck in Pending**:

   ```bash
   kubectl describe pod <pod-name> -n <namespace>
   # Check for resource constraints or node selector issues
   ```

2. **ImagePullBackOff**:

   ```bash
   # Verify image exists and pull secrets are configured
   kubectl get events -n <namespace> --sort-by='.lastTimestamp'
   ```

3. **Ingress Not Working**:

   ```bash
   # Check ingress controller and certificate status
   kubectl get ingress -n <namespace>
   kubectl describe certificate -n <namespace>
   ```

### Debug Commands

```bash
# View logs
kubectl logs -f deployment/backend -n advancia-prod
kubectl logs -f deployment/frontend -n advancia-prod

# Get pod details
kubectl get pods -n advancia-prod -o wide

# Check service endpoints
kubectl get endpoints -n advancia-prod

# Describe problematic resources
kubectl describe deployment/backend -n advancia-prod
kubectl describe ingress/advancia-ingress -n advancia-prod
```

## 📚 Best Practices

1. **Security**:
   - Use separate namespaces for different environments
   - Implement network policies
   - Keep secrets encrypted at rest
   - Regular security scanning

2. **Performance**:
   - Set appropriate resource limits
   - Use HPA for auto-scaling
   - Implement proper health checks
   - Monitor application metrics

3. **Reliability**:
   - Configure Pod Disruption Budgets
   - Use anti-affinity rules
   - Implement graceful shutdowns
   - Regular backup procedures

4. **GitOps**:
   - Keep infrastructure as code
   - Use pull-request workflows
   - Implement proper versioning
   - Maintain environment parity

## 🚀 Advanced Features

### Blue-Green Deployment

```bash
# Create blue environment
kustomize build overlays/production | sed 's/prod-/prod-blue-/g' | kubectl apply -f -

# Test blue environment
# ... run tests ...

# Switch traffic to blue
kubectl patch ingress advancia-ingress -n advancia-prod -p '{"spec":{"rules":[{"host":"api.advancia.com","http":{"paths":[{"path":"/(.*)","pathType":"ImplementationSpecific","backend":{"service":{"name":"prod-blue-backend","port":{"number":80}}}}]}}]}}'

# Clean up old green environment
kubectl delete deployment prod-backend -n advancia-prod
```

### Canary Deployment with Flagger

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: backend
  namespace: advancia-prod
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  progressDeadlineSeconds: 60
  service:
    port: 80
    targetPort: 4000
  analysis:
    interval: 30s
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        threshold: 99
      - name: request-duration
        threshold: 500
```

## 🆘 Support

For issues or questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review logs and events
3. Consult the team documentation
4. Create an issue in the repository

---

**🎉 Happy Deploying with GitOps!** 🎉

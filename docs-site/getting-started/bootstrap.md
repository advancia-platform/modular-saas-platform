# Bootstrap Guide

This guide walks you through bootstrapping the complete AI DevOps Agent Command Center from scratch, including prerequisites, cluster setup, and initial configuration.

## 🚀 Quick Start Script

For experienced users, use our automated bootstrap script:

```bash
#!/bin/bash
# bootstrap.sh - Complete AI DevOps Agent setup

set -e

echo "🤖 AI DevOps Agent Command Center Bootstrap"
echo "=========================================="

# Check prerequisites
./scripts/check-prerequisites.sh

# Setup Kubernetes cluster
./scripts/setup-cluster.sh

# Install ArgoCD
./scripts/install-argocd.sh

# Configure GitOps repository
./scripts/configure-gitops.sh

# Deploy monitoring stack
./scripts/setup-monitoring.sh

# Install AI agent components
./scripts/deploy-ai-agent.sh

# Validate installation
./scripts/validate-deployment.sh

echo "✅ Bootstrap completed successfully!"
echo "🌐 Access the dashboard at: https://dashboard.advancia.dev"
echo "📊 Grafana available at: https://grafana.advancia.dev"
echo "🔄 ArgoCD available at: https://argocd.advancia.dev"
```

## 📋 Prerequisites Checklist

### Infrastructure Requirements

- [ ] **Kubernetes Cluster**: v1.24+ with at least 3 nodes
- [ ] **Storage**: 100GB+ persistent storage with backup capabilities
- [ ] **Network**: Load balancer support and ingress controller
- [ ] **DNS**: Wildcard DNS configuration for subdomains
- [ ] **Certificates**: SSL/TLS certificates for HTTPS endpoints

### Access Requirements

- [ ] **kubectl**: v1.24+ configured with cluster admin access
- [ ] **Helm**: v3.10+ for package management
- [ ] **Git**: Access to GitOps repository with write permissions
- [ ] **Container Registry**: Access to push/pull application images
- [ ] **Secrets**: Vault or equivalent secret management system

### Monitoring & Alerting

- [ ] **Prometheus**: Storage backend for metrics
- [ ] **Grafana**: Dashboard and visualization access
- [ ] **Elasticsearch**: Log aggregation and search
- [ ] **PagerDuty**: Incident management and on-call scheduling
- [ ] **Slack/Teams**: Notification channels configured

## 🛠️ Step 1: Cluster Preparation

### Kubernetes Cluster Setup

#### Option A: AWS EKS

```bash
# Create EKS cluster
eksctl create cluster \
  --name advancia-platform \
  --region us-west-2 \
  --node-type m5.large \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name advancia-platform

# Verify cluster
kubectl get nodes
kubectl cluster-info
```

#### Option B: Azure AKS

```bash
# Create resource group
az group create --name advancia-platform --location westus2

# Create AKS cluster
az aks create \
  --resource-group advancia-platform \
  --name advancia-platform \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group advancia-platform --name advancia-platform

# Verify cluster
kubectl get nodes
```

#### Option C: Google GKE

```bash
# Set project and zone
gcloud config set project advancia-platform
gcloud config set compute/zone us-west1-a

# Create cluster
gcloud container clusters create advancia-platform \
  --num-nodes 3 \
  --machine-type e2-standard-4 \
  --enable-autorepair \
  --enable-autoupgrade

# Get credentials
gcloud container clusters get-credentials advancia-platform

# Verify cluster
kubectl get nodes
```

### Storage Configuration

#### Setup Storage Classes

```yaml
# storageclass.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ssd-retain
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: kubernetes.io/aws-ebs # Adjust for your cloud provider
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Retain
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
```

```bash
# Apply storage configuration
kubectl apply -f storageclass.yaml

# Verify storage class
kubectl get storageclass
```

### Network Configuration

#### Install Ingress Controller

```bash
# NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Verify ingress controller
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

#### Configure DNS

```bash
# Get load balancer IP
LOAD_BALANCER_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Configure DNS records:"
echo "*.advancia.dev -> $LOAD_BALANCER_IP"
echo "dashboard.advancia.dev -> $LOAD_BALANCER_IP"
echo "argocd.advancia.dev -> $LOAD_BALANCER_IP"
echo "grafana.advancia.dev -> $LOAD_BALANCER_IP"
```

## 🔄 Step 2: ArgoCD Installation

### Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for pods to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get initial admin password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "ArgoCD Admin Password: $ARGOCD_PASSWORD"
```

### Configure ArgoCD Ingress

```yaml
# argocd-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: argocd-server-ingress
  namespace: argocd
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/backend-protocol: "GRPC"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - argocd.advancia.dev
      secretName: argocd-tls
  rules:
    - host: argocd.advancia.dev
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: argocd-server
                port:
                  number: 80
```

```bash
# Apply ingress configuration
kubectl apply -f argocd-ingress.yaml

# Verify ingress
kubectl get ingress -n argocd
```

### Configure ArgoCD CLI

```bash
# Install ArgoCD CLI
curl -sSL -o /usr/local/bin/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /usr/local/bin/argocd

# Login to ArgoCD
argocd login argocd.advancia.dev --username admin --password $ARGOCD_PASSWORD

# Verify login
argocd account get-user-info
```

## 📊 Step 3: Monitoring Stack Setup

### Install Prometheus Stack

```bash
# Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack
helm install prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values monitoring/prometheus-values.yaml \
  --wait

# Verify installation
kubectl get pods -n monitoring
```

### Prometheus Values Configuration

```yaml
# monitoring/prometheus-values.yaml
prometheus:
  prometheusSpec:
    retention: 30d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: ssd-retain
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 50Gi

grafana:
  adminPassword: "securepassword123"
  ingress:
    enabled: true
    hosts:
      - grafana.advancia.dev
    tls:
      - secretName: grafana-tls
        hosts:
          - grafana.advancia.dev
  persistence:
    enabled: true
    storageClassName: ssd-retain
    size: 10Gi

alertmanager:
  alertmanagerSpec:
    storage:
      volumeClaimTemplate:
        spec:
          storageClassName: ssd-retain
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi
```

### Install Elasticsearch Stack

```bash
# Add Elastic Helm repository
helm repo add elastic https://helm.elastic.co
helm repo update

# Create logging namespace
kubectl create namespace logging

# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --values monitoring/elasticsearch-values.yaml

# Install Kibana
helm install kibana elastic/kibana \
  --namespace logging \
  --values monitoring/kibana-values.yaml

# Verify installation
kubectl get pods -n logging
```

## 🤖 Step 4: AI Agent Deployment

### Create AI Agent Namespace

```bash
# Create namespace with labels
kubectl create namespace ai-agent
kubectl label namespace ai-agent monitoring=enabled
```

### Deploy AI Agent Components

```yaml
# ai-agent/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-devops-agent
  namespace: ai-agent
  labels:
    app: ai-devops-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-devops-agent
  template:
    metadata:
      labels:
        app: ai-devops-agent
    spec:
      serviceAccountName: ai-devops-agent
      containers:
        - name: agent
          image: advancia/ai-devops-agent:latest
          ports:
            - containerPort: 8080
              name: http
          env:
            - name: PROMETHEUS_URL
              value: "http://prometheus-stack-kube-prom-prometheus.monitoring:9090"
            - name: ARGOCD_SERVER
              value: "argocd-server.argocd.svc.cluster.local:80"
            - name: LOG_LEVEL
              value: "info"
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Configure Service Account and RBAC

```yaml
# ai-agent/rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ai-devops-agent
  namespace: ai-agent

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ai-devops-agent
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "endpoints", "events"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "daemonsets", "statefulsets"]
    verbs: ["get", "list", "watch", "patch"]
  - apiGroups: ["argoproj.io"]
    resources: ["applications"]
    verbs: ["get", "list", "watch", "patch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ai-devops-agent
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ai-devops-agent
subjects:
  - kind: ServiceAccount
    name: ai-devops-agent
    namespace: ai-agent
```

```bash
# Apply AI agent configuration
kubectl apply -f ai-agent/rbac.yaml
kubectl apply -f ai-agent/deployment.yaml

# Verify deployment
kubectl get pods -n ai-agent
kubectl logs -n ai-agent -l app=ai-devops-agent
```

## 📱 Step 5: Dashboard Deployment

### Deploy Frontend Dashboard

```yaml
# dashboard/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dashboard
  namespace: ai-agent
  labels:
    app: dashboard
spec:
  replicas: 2
  selector:
    matchLabels:
      app: dashboard
  template:
    metadata:
      labels:
        app: dashboard
    spec:
      containers:
        - name: dashboard
          image: advancia/dashboard:latest
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: API_URL
              value: "http://ai-devops-agent:8080"
            - name: ARGOCD_URL
              value: "https://argocd.advancia.dev"
            - name: GRAFANA_URL
              value: "https://grafana.advancia.dev"
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: dashboard
  namespace: ai-agent
spec:
  selector:
    app: dashboard
  ports:
    - port: 80
      targetPort: 3000
      name: http
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dashboard-ingress
  namespace: ai-agent
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - dashboard.advancia.dev
      secretName: dashboard-tls
  rules:
    - host: dashboard.advancia.dev
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: dashboard
                port:
                  number: 80
```

```bash
# Deploy dashboard
kubectl apply -f dashboard/deployment.yaml

# Verify dashboard
kubectl get pods -n ai-agent -l app=dashboard
kubectl get ingress -n ai-agent
```

## ✅ Step 6: Validation

### Cluster Validation Script

```bash
#!/bin/bash
# validate-deployment.sh

echo "🔍 Validating AI DevOps Agent deployment"
echo "======================================"

# Check cluster health
echo "📊 Cluster Health:"
kubectl get nodes -o wide
kubectl top nodes

# Check ArgoCD
echo -e "\n🔄 ArgoCD Status:"
kubectl get pods -n argocd
argocd app list

# Check monitoring stack
echo -e "\n📈 Monitoring Stack:"
kubectl get pods -n monitoring
kubectl get svc -n monitoring

# Check AI agent
echo -e "\n🤖 AI Agent Status:"
kubectl get pods -n ai-agent
kubectl get svc -n ai-agent

# Check ingress
echo -e "\n🌐 Ingress Status:"
kubectl get ingress --all-namespaces

# Health check endpoints
echo -e "\n🏥 Health Checks:"
echo "Testing dashboard health..."
curl -f https://dashboard.advancia.dev/health || echo "Dashboard not accessible"

echo "Testing ArgoCD health..."
curl -f https://argocd.advancia.dev/healthz || echo "ArgoCD not accessible"

echo "Testing Grafana health..."
curl -f https://grafana.advancia.dev/api/health || echo "Grafana not accessible"

echo -e "\n✅ Validation completed!"
echo "📱 Dashboard: https://dashboard.advancia.dev"
echo "🔄 ArgoCD: https://argocd.advancia.dev"
echo "📊 Grafana: https://grafana.advancia.dev"
```

```bash
# Run validation
chmod +x scripts/validate-deployment.sh
./scripts/validate-deployment.sh
```

## 🔧 Configuration

### GitOps Repository Setup

```bash
# Configure Git repository for ArgoCD
argocd repo add https://github.com/advancia-platform/gitops-config \
  --type git \
  --name gitops-config

# Create initial application
argocd app create advancia-platform \
  --repo https://github.com/advancia-platform/gitops-config \
  --path kubernetes/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production \
  --auto-prune \
  --self-heal \
  --sync-policy automated

# Sync application
argocd app sync advancia-platform
```

### Environment Configuration

```bash
# Create production namespace
kubectl create namespace production
kubectl label namespace production environment=production

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=database-password="$(openssl rand -base64 32)" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --namespace production

# Apply resource quotas
kubectl apply -f kubernetes/production/resource-quota.yaml
```

## 🚨 Troubleshooting

### Common Issues

#### ArgoCD Application Sync Issues

```bash
# Check application status
argocd app describe advancia-platform

# View sync history
argocd app history advancia-platform

# Force refresh and sync
argocd app refresh advancia-platform
argocd app sync advancia-platform --force
```

#### Pod Startup Issues

```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace> --previous

# Check resource constraints
kubectl describe nodes
kubectl get events --sort-by=.lastTimestamp
```

#### Network Connectivity Issues

```bash
# Test DNS resolution
kubectl run test-dns --image=busybox --restart=Never -- nslookup kubernetes.default

# Test service connectivity
kubectl run test-curl --image=curlimages/curl --restart=Never -- \
  curl -v http://prometheus-stack-kube-prom-prometheus.monitoring:9090/metrics

# Check network policies
kubectl get networkpolicy --all-namespaces
```

## 📚 Next Steps

After successful bootstrap:

1. **[Configure Compliance](../compliance/overview.md)** - Set up audit trails and compliance monitoring
2. **[Setup Operations](../operations/gitops-operations.md)** - Configure day-to-day operational procedures
3. **[Implement Observability](../observability/monitoring.md)** - Deploy comprehensive monitoring and alerting
4. **[Security Hardening](../security/overview.md)** - Implement security best practices and controls
5. **[Team Onboarding](../guides/team-onboarding.md)** - Train team members on the new platform

## 📞 Support

If you encounter issues during bootstrap:

- Check the [Troubleshooting Guide](../troubleshooting/common-issues.md)
- Review [Common Issues FAQ](../troubleshooting/faq.md)
- Contact the platform team: <platform-team@advancia.com>
- Emergency support: +1-XXX-XXX-XXXX

---

_This bootstrap guide is tested regularly and updated for the latest versions of all components._

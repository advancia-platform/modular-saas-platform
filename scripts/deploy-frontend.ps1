# deploy-frontend.ps1
# Purpose: Deploy the AI DevOps Agent front-end (React/Next.js) into Kubernetes
# Author: Advancia Platform Engineering Team
# Version: 1.0.0
# Created: 2025-11-25

param(
    [string]$Namespace = "frontend",
    [string]$Image = "ghcr.io/advancia-platform/ai-agent-frontend:latest",
    [string]$AppName = "ai-agent-frontend",
    [string]$Domain = "frontend.ai-agent.advanciapayledger.com",
    [string]$IngressClass = "nginx",
    [string]$CertIssuer = "letsencrypt-prod",
    [int]$Replicas = 2,
    [string]$CpuRequest = "250m",
    [string]$MemoryRequest = "256Mi",
    [string]$CpuLimit = "500m",
    [string]$MemoryLimit = "512Mi",
    [string]$KubeConfig = $null,
    [string]$Context = $null,
    [switch]$DryRun = $false,
    [switch]$Verbose = $false,
    [switch]$SkipIngress = $false,
    [switch]$Force = $false,
    [int]$TimeoutSeconds = 300
)

# Set error handling
$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Color constants for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
    Subtle = "Gray"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [string]$Prefix = ""
    )

    if ($Prefix) {
        Write-Host "$Prefix " -ForegroundColor $Color -NoNewline
        Write-Host $Message
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "=" * 80 -Color $Colors.Header
    Write-ColorOutput "  $Title" -Color $Colors.Header
    Write-ColorOutput "=" * 80 -Color $Colors.Header
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [int]$Current, [int]$Total)
    Write-ColorOutput "[$Current/$Total]" -Color $Colors.Info -Prefix "🚀"
    Write-ColorOutput "  $Step" -Color $Colors.Info
}

function Test-Command {
    param([string]$Command)

    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-KubernetesConnection {
    Write-ColorOutput "Testing Kubernetes connection..." -Color $Colors.Info

    try {
        $clusterInfo = kubectl cluster-info 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to connect to Kubernetes cluster: $clusterInfo"
        }

        Write-ColorOutput "✅ Successfully connected to Kubernetes cluster" -Color $Colors.Success

        if ($Verbose) {
            Write-ColorOutput "Cluster Info:" -Color $Colors.Subtle
            $clusterInfo | ForEach-Object { Write-ColorOutput "  $_" -Color $Colors.Subtle }
        }

        return $true
    } catch {
        Write-ColorOutput "❌ Kubernetes connection failed: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function Wait-ForDeployment {
    param(
        [string]$DeploymentName,
        [string]$Namespace,
        [int]$TimeoutSeconds = 300
    )

    Write-ColorOutput "⏳ Waiting for deployment '$DeploymentName' in namespace '$Namespace' to be ready..." -Color $Colors.Info

    $startTime = Get-Date
    $timeoutTime = $startTime.AddSeconds($TimeoutSeconds)

    do {
        try {
            $status = kubectl rollout status deployment $DeploymentName -n $Namespace --timeout=10s 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✅ Deployment '$DeploymentName' is ready!" -Color $Colors.Success
                return $true
            }
        } catch {
            # Continue waiting
        }

        $currentTime = Get-Date
        if ($currentTime -gt $timeoutTime) {
            Write-ColorOutput "❌ Timeout waiting for deployment '$DeploymentName'" -Color $Colors.Error
            return $false
        }

        Write-ColorOutput "⏳ Still waiting for '$DeploymentName'... ($(($timeoutTime - $currentTime).TotalSeconds.ToString('F0'))s remaining)" -Color $Colors.Subtle
        Start-Sleep -Seconds 10

    } while ($true)
}

function New-Namespace {
    param([string]$NamespaceName)

    Write-ColorOutput "📦 Creating namespace '$NamespaceName'..." -Color $Colors.Info

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN: Would create namespace '$NamespaceName'" -Color $Colors.Warning
        return $true
    }

    try {
        # Check if namespace already exists
        $existingNs = kubectl get namespace $NamespaceName -o name 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ Namespace '$NamespaceName' already exists" -Color $Colors.Success
            return $true
        }

        # Create namespace
        $result = kubectl create namespace $NamespaceName --dry-run=client -o yaml | kubectl apply -f - 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create namespace: $result"
        }

        Write-ColorOutput "✅ Successfully created namespace '$NamespaceName'" -Color $Colors.Success
        return $true

    } catch {
        Write-ColorOutput "❌ Failed to create namespace '$NamespaceName': $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function New-Deployment {
    param(
        [string]$AppName,
        [string]$Namespace,
        [string]$Image,
        [int]$Replicas,
        [string]$CpuRequest,
        [string]$MemoryRequest,
        [string]$CpuLimit,
        [string]$MemoryLimit
    )

    Write-ColorOutput "🚀 Creating deployment '$AppName'..." -Color $Colors.Info

    $deploymentManifest = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $AppName
  namespace: $Namespace
  labels:
    app: $AppName
    component: frontend
    part-of: ai-devops-agent
    managed-by: advancia-platform
spec:
  replicas: $Replicas
  selector:
    matchLabels:
      app: $AppName
  template:
    metadata:
      labels:
        app: $AppName
        component: frontend
        part-of: ai-devops-agent
    spec:
      containers:
      - name: $AppName
        image: $Image
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: NEXT_TELEMETRY_DISABLED
          value: "1"
        resources:
          requests:
            cpu: "$CpuRequest"
            memory: "$MemoryRequest"
          limits:
            cpu: "$CpuLimit"
            memory: "$MemoryLimit"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
      securityContext:
        fsGroup: 2000
        runAsNonRoot: true
      restartPolicy: Always
      terminationGracePeriodSeconds: 30
"@

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN: Would apply deployment manifest:" -Color $Colors.Warning
        Write-ColorOutput $deploymentManifest -Color $Colors.Subtle
        return $true
    }

    try {
        $deploymentManifest | kubectl apply -f - 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply deployment manifest"
        }

        Write-ColorOutput "✅ Successfully created deployment '$AppName'" -Color $Colors.Success
        return $true

    } catch {
        Write-ColorOutput "❌ Failed to create deployment: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function New-Service {
    param(
        [string]$AppName,
        [string]$Namespace
    )

    Write-ColorOutput "🌐 Creating service '$AppName-service'..." -Color $Colors.Info

    $serviceManifest = @"
apiVersion: v1
kind: Service
metadata:
  name: $AppName-service
  namespace: $Namespace
  labels:
    app: $AppName
    component: frontend
    part-of: ai-devops-agent
spec:
  selector:
    app: $AppName
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
  sessionAffinity: None
"@

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN: Would apply service manifest:" -Color $Colors.Warning
        Write-ColorOutput $serviceManifest -Color $Colors.Subtle
        return $true
    }

    try {
        $serviceManifest | kubectl apply -f - 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply service manifest"
        }

        Write-ColorOutput "✅ Successfully created service '$AppName-service'" -Color $Colors.Success
        return $true

    } catch {
        Write-ColorOutput "❌ Failed to create service: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function New-Ingress {
    param(
        [string]$AppName,
        [string]$Namespace,
        [string]$Domain,
        [string]$IngressClass,
        [string]$CertIssuer
    )

    Write-ColorOutput "🌍 Creating ingress '$AppName-ingress'..." -Color $Colors.Info

    $ingressManifest = @"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: $AppName-ingress
  namespace: $Namespace
  labels:
    app: $AppName
    component: frontend
    part-of: ai-devops-agent
  annotations:
    kubernetes.io/ingress.class: "$IngressClass"
    cert-manager.io/cluster-issuer: "$CertIssuer"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "600"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "600"
spec:
  tls:
  - hosts:
    - $Domain
    secretName: $AppName-tls
  rules:
  - host: $Domain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: $AppName-service
            port:
              number: 80
"@

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN: Would apply ingress manifest:" -Color $Colors.Warning
        Write-ColorOutput $ingressManifest -Color $Colors.Subtle
        return $true
    }

    try {
        $ingressManifest | kubectl apply -f - 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply ingress manifest"
        }

        Write-ColorOutput "✅ Successfully created ingress '$AppName-ingress'" -Color $Colors.Success
        return $true

    } catch {
        Write-ColorOutput "❌ Failed to create ingress: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function Show-DeploymentStatus {
    param(
        [string]$AppName,
        [string]$Namespace,
        [string]$Domain
    )

    Write-Header "📊 Deployment Status"

    try {
        Write-ColorOutput "Deployment Status:" -Color $Colors.Info
        kubectl get deployment $AppName -n $Namespace -o wide

        Write-ColorOutput "`nService Status:" -Color $Colors.Info
        kubectl get service $AppName-service -n $Namespace -o wide

        if (-not $SkipIngress) {
            Write-ColorOutput "`nIngress Status:" -Color $Colors.Info
            kubectl get ingress $AppName-ingress -n $Namespace -o wide
        }

        Write-ColorOutput "`nPod Status:" -Color $Colors.Info
        kubectl get pods -n $Namespace -l app=$AppName -o wide

    } catch {
        Write-ColorOutput "⚠️  Could not retrieve all status information" -Color $Colors.Warning
    }
}

function Show-PostDeploymentInstructions {
    param(
        [string]$AppName,
        [string]$Namespace,
        [string]$Domain
    )

    Write-Header "🎉 Frontend Deployment Complete!"

    Write-ColorOutput "AI DevOps Agent Frontend has been successfully deployed!" -Color $Colors.Success
    Write-Host ""

    Write-ColorOutput "📋 Access Information:" -Color $Colors.Header
    if (-not $SkipIngress) {
        Write-ColorOutput "1. External URL:" -Color $Colors.Info
        Write-ColorOutput "   https://$Domain" -Color $Colors.Subtle
        Write-Host ""
    }

    Write-ColorOutput "2. Port Forward (for local access):" -Color $Colors.Info
    Write-ColorOutput "   kubectl port-forward svc/$AppName-service -n $Namespace 8080:80" -Color $Colors.Subtle
    Write-ColorOutput "   Then open: http://localhost:8080" -Color $Colors.Subtle
    Write-Host ""

    Write-ColorOutput "📊 Monitoring Commands:" -Color $Colors.Header
    Write-ColorOutput "• Deployment Status: kubectl get deployment $AppName -n $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• Pod Logs: kubectl logs -n $Namespace -l app=$AppName" -Color $Colors.Subtle
    Write-ColorOutput "• Pod Status: kubectl get pods -n $Namespace -l app=$AppName" -Color $Colors.Subtle
    Write-ColorOutput "• Service Status: kubectl get svc $AppName-service -n $Namespace" -Color $Colors.Subtle
    if (-not $SkipIngress) {
        Write-ColorOutput "• Ingress Status: kubectl get ingress $AppName-ingress -n $Namespace" -Color $Colors.Subtle
    }
    Write-Host ""

    Write-ColorOutput "🔧 Management Commands:" -Color $Colors.Header
    Write-ColorOutput "• Scale Deployment: kubectl scale deployment $AppName --replicas=<number> -n $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• Rolling Update: kubectl set image deployment/$AppName $AppName=<new-image> -n $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• Restart Deployment: kubectl rollout restart deployment/$AppName -n $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• View Rollout History: kubectl rollout history deployment/$AppName -n $Namespace" -Color $Colors.Subtle
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "🚀 AI DevOps Agent Frontend Deployment"

    Write-ColorOutput "Configuration:" -Color $Colors.Header
    Write-ColorOutput "  Application Name: $AppName" -Color $Colors.Info
    Write-ColorOutput "  Namespace: $Namespace" -Color $Colors.Info
    Write-ColorOutput "  Container Image: $Image" -Color $Colors.Info
    Write-ColorOutput "  Replicas: $Replicas" -Color $Colors.Info
    Write-ColorOutput "  Domain: $Domain" -Color $Colors.Info
    Write-ColorOutput "  Ingress Class: $IngressClass" -Color $Colors.Info
    Write-ColorOutput "  Cert Issuer: $CertIssuer" -Color $Colors.Info
    Write-ColorOutput "  Skip Ingress: $SkipIngress" -Color $Colors.Info
    Write-ColorOutput "  Dry Run: $DryRun" -Color $Colors.Info
    Write-ColorOutput "  Timeout: ${TimeoutSeconds}s" -Color $Colors.Info
    Write-Host ""

    # Pre-flight checks
    Write-Header "🔍 Pre-flight Checks"

    if (-not (Test-Command "kubectl")) {
        throw "kubectl command not found. Please install kubectl first."
    }
    Write-ColorOutput "✅ kubectl is available" -Color $Colors.Success

    if (-not (Test-KubernetesConnection)) {
        throw "Cannot connect to Kubernetes cluster"
    }

    if ($KubeConfig) {
        $env:KUBECONFIG = $KubeConfig
        Write-ColorOutput "✅ Using custom kubeconfig: $KubeConfig" -Color $Colors.Success
    }

    if ($Context) {
        kubectl config use-context $Context | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to switch to context: $Context"
        }
        Write-ColorOutput "✅ Using context: $Context" -Color $Colors.Success
    }

    # Step 1: Create namespace
    Write-Header "📦 Step 1: Create Namespace"
    Write-Step "Creating namespace '$Namespace'" 1 4
    if (-not (New-Namespace -NamespaceName $Namespace)) {
        throw "Failed to create namespace"
    }

    # Step 2: Deploy application
    Write-Header "🚀 Step 2: Deploy Application"
    Write-Step "Creating deployment '$AppName'" 2 4
    if (-not (New-Deployment -AppName $AppName -Namespace $Namespace -Image $Image -Replicas $Replicas -CpuRequest $CpuRequest -MemoryRequest $MemoryRequest -CpuLimit $CpuLimit -MemoryLimit $MemoryLimit)) {
        throw "Failed to create deployment"
    }

    # Step 3: Create service
    Write-Header "🌐 Step 3: Create Service"
    Write-Step "Creating service '$AppName-service'" 3 4
    if (-not (New-Service -AppName $AppName -Namespace $Namespace)) {
        throw "Failed to create service"
    }

    # Step 4: Create ingress (optional)
    if (-not $SkipIngress) {
        Write-Header "🌍 Step 4: Create Ingress"
        Write-Step "Creating ingress '$AppName-ingress'" 4 4
        if (-not (New-Ingress -AppName $AppName -Namespace $Namespace -Domain $Domain -IngressClass $IngressClass -CertIssuer $CertIssuer)) {
            Write-ColorOutput "⚠️  Failed to create ingress, but continuing..." -Color $Colors.Warning
        }
    } else {
        Write-ColorOutput "⏭️  Skipping ingress creation as requested" -Color $Colors.Warning
    }

    # Wait for deployment to be ready
    if (-not $DryRun) {
        Write-Header "⏳ Waiting for Deployment"
        if (-not (Wait-ForDeployment -DeploymentName $AppName -Namespace $Namespace -TimeoutSeconds $TimeoutSeconds)) {
            Write-ColorOutput "⚠️  Deployment is not ready yet, but resources have been created" -Color $Colors.Warning
        }

        # Show deployment status
        Show-DeploymentStatus -AppName $AppName -Namespace $Namespace -Domain $Domain

        # Show post-deployment instructions
        Show-PostDeploymentInstructions -AppName $AppName -Namespace $Namespace -Domain $Domain
    } else {
        Write-Header "🔍 Dry Run Complete"
        Write-ColorOutput "All operations completed successfully in dry-run mode." -Color $Colors.Success
        Write-ColorOutput "Re-run without -DryRun to apply changes." -Color $Colors.Info
    }

} catch {
    Write-Header "❌ Deployment Failed"
    Write-ColorOutput "Error: $($_.Exception.Message)" -Color $Colors.Error

    if ($Verbose) {
        Write-ColorOutput "Stack Trace:" -Color $Colors.Error
        Write-ColorOutput $_.ScriptStackTrace -Color $Colors.Subtle
    }

    Write-ColorOutput "🔧 Troubleshooting Tips:" -Color $Colors.Header
    Write-ColorOutput "• Check kubectl connection: kubectl cluster-info" -Color $Colors.Subtle
    Write-ColorOutput "• Verify image exists: docker pull $Image" -Color $Colors.Subtle
    Write-ColorOutput "• Check namespace permissions: kubectl auth can-i create deployment --namespace $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• View pod logs: kubectl logs -n $Namespace -l app=$AppName" -Color $Colors.Subtle
    Write-ColorOutput "• Retry with -Verbose for more details" -Color $Colors.Subtle

    exit 1
}

Write-Header "✅ Frontend Deployment Complete!"
exit 0

# deploy-enterprise-gitops.ps1
# Purpose: Bootstrap ArgoCD and configure enterprise GitOps for AI DevOps Agent
# Author: Advancia Platform Engineering Team
# Version: 1.0.0
# Created: 2025-11-25

param(
    [string]$Namespace = "argocd",
    [string]$AppNamespace = "ai-devops",
    [string]$RepoURL = "https://github.com/advancia-platform/modular-saas-platform.git",
    [string]$Branch = "main",
    [string]$Path = "ai-agent-k8s/overlays/prod",
    [string]$KubeConfig = $null,
    [string]$Context = $null,
    [switch]$DryRun = $false,
    [switch]$Verbose = $false,
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

function Install-ArgoCD {
    param([string]$Namespace)

    Write-ColorOutput "📦 Installing ArgoCD in namespace '$Namespace'..." -Color $Colors.Info

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN: Would install ArgoCD in '$Namespace'" -Color $Colors.Warning
        return $true
    }

    try {
        # Check if ArgoCD is already installed
        $existingArgoCD = kubectl get deployment argocd-server -n $Namespace -o name 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✅ ArgoCD is already installed in namespace '$Namespace'" -Color $Colors.Success
            return $true
        }

        # Install ArgoCD
        Write-ColorOutput "📥 Downloading and applying ArgoCD manifests..." -Color $Colors.Info
        $result = kubectl apply -n $Namespace -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install ArgoCD: $result"
        }

        Write-ColorOutput "✅ Successfully applied ArgoCD manifests" -Color $Colors.Success
        return $true

    } catch {
        Write-ColorOutput "❌ Failed to install ArgoCD: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function New-ArgoCDApplication {
    param(
        [string]$AppName = "ai-agent",
        [string]$Namespace,
        [string]$AppNamespace,
        [string]$RepoURL,
        [string]$Branch,
        [string]$Path
    )

    Write-ColorOutput "📂 Creating ArgoCD Application '$AppName'..." -Color $Colors.Info

    $applicationManifest = @"
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: $AppName
  namespace: $Namespace
  labels:
    app.kubernetes.io/name: $AppName
    app.kubernetes.io/part-of: advancia-platform
    app.kubernetes.io/managed-by: argocd
  annotations:
    argocd.argoproj.io/sync-wave: "0"
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: '$RepoURL'
    targetRevision: $Branch
    path: $Path
  destination:
    server: https://kubernetes.default.svc
    namespace: $AppNamespace
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
      - RespectIgnoreDifferences=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m0s
  revisionHistoryLimit: 3
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas
"@

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN: Would apply ArgoCD Application manifest:" -Color $Colors.Warning
        Write-ColorOutput $applicationManifest -Color $Colors.Subtle
        return $true
    }

    try {
        # Apply the application manifest
        $applicationManifest | kubectl apply -f - 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply ArgoCD Application manifest"
        }

        Write-ColorOutput "✅ Successfully created ArgoCD Application '$AppName'" -Color $Colors.Success

        # Show application status
        Write-ColorOutput "📊 Application Status:" -Color $Colors.Info
        kubectl get application $AppName -n $Namespace -o wide

        return $true

    } catch {
        Write-ColorOutput "❌ Failed to create ArgoCD Application: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function Get-ArgoCDPassword {
    param([string]$Namespace)

    try {
        Write-ColorOutput "🔑 Retrieving ArgoCD admin password..." -Color $Colors.Info

        # Get the initial admin password
        $password = kubectl get secret argocd-initial-admin-secret -n $Namespace -o jsonpath='{.data.password}' 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "⚠️  Initial admin secret not found. ArgoCD may still be initializing." -Color $Colors.Warning
            return $null
        }

        # Decode base64 password
        $decodedPassword = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($password))

        Write-ColorOutput "✅ ArgoCD admin password retrieved successfully" -Color $Colors.Success
        Write-ColorOutput "   Username: admin" -Color $Colors.Info
        Write-ColorOutput "   Password: $decodedPassword" -Color $Colors.Info

        return $decodedPassword

    } catch {
        Write-ColorOutput "⚠️  Could not retrieve ArgoCD password: $($_.Exception.Message)" -Color $Colors.Warning
        return $null
    }
}

function Show-PostInstallationInstructions {
    param(
        [string]$Namespace,
        [string]$AppName,
        [string]$Password
    )

    Write-Header "🎉 Installation Complete!"

    Write-ColorOutput "ArgoCD has been successfully installed and configured!" -Color $Colors.Success
    Write-Host ""

    Write-ColorOutput "📋 Next Steps:" -Color $Colors.Header
    Write-ColorOutput "1. Access ArgoCD UI:" -Color $Colors.Info
    Write-ColorOutput "   kubectl port-forward svc/argocd-server -n $Namespace 8080:443" -Color $Colors.Subtle
    Write-ColorOutput "   Then open: https://localhost:8080" -Color $Colors.Subtle
    Write-Host ""

    Write-ColorOutput "2. Login Credentials:" -Color $Colors.Info
    Write-ColorOutput "   Username: admin" -Color $Colors.Subtle
    if ($Password) {
        Write-ColorOutput "   Password: $Password" -Color $Colors.Subtle
    } else {
        Write-ColorOutput "   Password: (retrieve with: kubectl get secret argocd-initial-admin-secret -n $Namespace -o jsonpath='{.data.password}' | base64 -d)" -Color $Colors.Subtle
    }
    Write-Host ""

    Write-ColorOutput "3. Monitor Application:" -Color $Colors.Info
    Write-ColorOutput "   kubectl get application $AppName -n $Namespace -w" -Color $Colors.Subtle
    Write-Host ""

    Write-ColorOutput "4. View Application Logs:" -Color $Colors.Info
    Write-ColorOutput "   kubectl logs -n $Namespace -l app.kubernetes.io/name=argocd-server" -Color $Colors.Subtle
    Write-Host ""

    Write-ColorOutput "🔗 Useful Commands:" -Color $Colors.Header
    Write-ColorOutput "• Sync Application: kubectl patch application $AppName -n $Namespace --type='merge' -p='{`"operation`":{`"sync`":{}}}'" -Color $Colors.Subtle
    Write-ColorOutput "• Delete Application: kubectl delete application $AppName -n $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• ArgoCD CLI: argocd login localhost:8080" -Color $Colors.Subtle
    Write-Host ""
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "🚀 Enterprise GitOps Bootstrap for AI DevOps Agent"

    Write-ColorOutput "Configuration:" -Color $Colors.Header
    Write-ColorOutput "  ArgoCD Namespace: $Namespace" -Color $Colors.Info
    Write-ColorOutput "  Application Namespace: $AppNamespace" -Color $Colors.Info
    Write-ColorOutput "  Repository URL: $RepoURL" -Color $Colors.Info
    Write-ColorOutput "  Branch: $Branch" -Color $Colors.Info
    Write-ColorOutput "  Path: $Path" -Color $Colors.Info
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

    # Step 1: Create namespaces
    Write-Header "📦 Step 1: Create Namespaces"
    Write-Step "Creating ArgoCD namespace" 1 5
    if (-not (New-Namespace -NamespaceName $Namespace)) {
        throw "Failed to create ArgoCD namespace"
    }

    Write-Step "Creating application namespace" 2 5
    if (-not (New-Namespace -NamespaceName $AppNamespace)) {
        throw "Failed to create application namespace"
    }

    # Step 2: Install ArgoCD
    Write-Header "🛠️  Step 2: Install ArgoCD"
    Write-Step "Installing ArgoCD components" 3 5
    if (-not (Install-ArgoCD -Namespace $Namespace)) {
        throw "Failed to install ArgoCD"
    }

    # Step 3: Wait for ArgoCD to be ready
    Write-Header "⏳ Step 3: Wait for ArgoCD"
    Write-Step "Waiting for ArgoCD server to be ready" 4 5
    if (-not $DryRun) {
        if (-not (Wait-ForDeployment -DeploymentName "argocd-server" -Namespace $Namespace -TimeoutSeconds $TimeoutSeconds)) {
            Write-ColorOutput "⚠️  ArgoCD server is not ready yet, but continuing..." -Color $Colors.Warning
        }
    }

    # Step 4: Create ArgoCD Application
    Write-Header "📂 Step 4: Create Application"
    Write-Step "Creating ArgoCD Application manifest" 5 5
    if (-not (New-ArgoCDApplication -AppName "ai-agent" -Namespace $Namespace -AppNamespace $AppNamespace -RepoURL $RepoURL -Branch $Branch -Path $Path)) {
        throw "Failed to create ArgoCD Application"
    }

    # Post-installation tasks
    if (-not $DryRun) {
        Write-Header "🔐 Post-Installation Tasks"
        $password = Get-ArgoCDPassword -Namespace $Namespace
        Show-PostInstallationInstructions -Namespace $Namespace -AppName "ai-agent" -Password $password
    } else {
        Write-Header "🔍 Dry Run Complete"
        Write-ColorOutput "All operations completed successfully in dry-run mode." -Color $Colors.Success
        Write-ColorOutput "Re-run without -DryRun to apply changes." -Color $Colors.Info
    }

} catch {
    Write-Header "❌ Installation Failed"
    Write-ColorOutput "Error: $($_.Exception.Message)" -Color $Colors.Error

    if ($Verbose) {
        Write-ColorOutput "Stack Trace:" -Color $Colors.Error
        Write-ColorOutput $_.ScriptStackTrace -Color $Colors.Subtle
    }

    Write-ColorOutput "🔧 Troubleshooting Tips:" -Color $Colors.Header
    Write-ColorOutput "• Check kubectl connection: kubectl cluster-info" -Color $Colors.Subtle
    Write-ColorOutput "• Verify permissions: kubectl auth can-i create namespace" -Color $Colors.Subtle
    Write-ColorOutput "• Check logs: kubectl logs -n $Namespace -l app.kubernetes.io/name=argocd-server" -Color $Colors.Subtle
    Write-ColorOutput "• Retry with -Verbose for more details" -Color $Colors.Subtle

    exit 1
}

Write-Header "✅ Enterprise GitOps Setup Complete!"
exit 0

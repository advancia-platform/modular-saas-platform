# integrate-frontend-gitops.ps1
# Purpose: Integrate frontend into existing GitOps workflow with ArgoCD
# Author: Advancia Platform Engineering Team
# Version: 1.0.0
# Created: 2025-11-25

param(
    [string]$Namespace = "argocd",
    [string]$RepoURL = "https://github.com/advancia-platform/modular-saas-platform.git",
    [string]$Branch = "main",
    [switch]$DryRun = $false,
    [switch]$Verbose = $false,
    [switch]$SkipApplicationSet = $false,
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

function Test-ArgoCDInstallation {
    Write-ColorOutput "Verifying ArgoCD installation..." -Color $Colors.Info

    try {
        $argoCDPods = kubectl get pods -n $Namespace -l app.kubernetes.io/name=argocd-server -o name 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $argoCDPods) {
            throw "ArgoCD not found in namespace '$Namespace'"
        }

        Write-ColorOutput "✅ ArgoCD is running in namespace '$Namespace'" -Color $Colors.Success
        return $true
    } catch {
        Write-ColorOutput "❌ ArgoCD verification failed: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function Update-ApplicationSet {
    param([string]$Namespace)

    Write-ColorOutput "🔄 Updating ArgoCD ApplicationSet for frontend integration..." -Color $Colors.Info

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN: Would update ApplicationSet" -Color $Colors.Warning
        return $true
    }

    try {
        # Apply the updated ApplicationSet
        kubectl apply -f "$PSScriptRoot\..\ai-agent-k8s\argocd-applicationset.yaml" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply ApplicationSet"
        }

        Write-ColorOutput "✅ Successfully updated ApplicationSet" -Color $Colors.Success
        return $true

    } catch {
        Write-ColorOutput "❌ Failed to update ApplicationSet: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

function Wait-ForApplicationSync {
    param(
        [string]$AppName,
        [string]$Namespace,
        [int]$TimeoutSeconds = 300
    )

    Write-ColorOutput "⏳ Waiting for application '$AppName' to sync..." -Color $Colors.Info

    $startTime = Get-Date
    $timeoutTime = $startTime.AddSeconds($TimeoutSeconds)

    do {
        try {
            $appStatus = kubectl get application $AppName -n $Namespace -o jsonpath='{.status.sync.status}' 2>$null
            if ($LASTEXITCODE -eq 0 -and $appStatus -eq "Synced") {
                Write-ColorOutput "✅ Application '$AppName' is synced!" -Color $Colors.Success
                return $true
            }
        } catch {
            # Continue waiting
        }

        $currentTime = Get-Date
        if ($currentTime -gt $timeoutTime) {
            Write-ColorOutput "⚠️  Timeout waiting for application '$AppName' to sync" -Color $Colors.Warning
            return $false
        }

        Write-ColorOutput "⏳ Still waiting for sync... ($(($timeoutTime - $currentTime).TotalSeconds.ToString('F0'))s remaining)" -Color $Colors.Subtle
        Start-Sleep -Seconds 10

    } while ($true)
}

function Show-ApplicationStatus {
    param([string]$Namespace)

    Write-Header "📊 GitOps Application Status"

    try {
        Write-ColorOutput "Applications in ArgoCD:" -Color $Colors.Info
        kubectl get applications -n $Namespace -o wide
        Write-Host ""

        Write-ColorOutput "ApplicationSets:" -Color $Colors.Info
        kubectl get applicationsets -n $Namespace -o wide
        Write-Host ""

        Write-ColorOutput "Frontend Resources:" -Color $Colors.Info
        kubectl get all -n frontend --show-labels
        Write-Host ""

    } catch {
        Write-ColorOutput "⚠️  Could not retrieve all status information" -Color $Colors.Warning
    }
}

function Show-PostIntegrationInstructions {
    param([string]$Namespace)

    Write-Header "🎉 Frontend GitOps Integration Complete!"

    Write-ColorOutput "Frontend is now fully integrated into your GitOps workflow!" -Color $Colors.Success
    Write-Host ""

    Write-ColorOutput "🌐 Access Points:" -Color $Colors.Header
    Write-ColorOutput "1. Frontend UI:" -Color $Colors.Info
    Write-ColorOutput "   https://frontend.ai-agent.advanciapayledger.com" -Color $Colors.Subtle
    Write-Host ""

    Write-ColorOutput "2. ArgoCD Dashboard:" -Color $Colors.Info
    Write-ColorOutput "   kubectl port-forward svc/argocd-server -n $Namespace 8080:443" -Color $Colors.Subtle
    Write-ColorOutput "   Then open: https://localhost:8080" -Color $Colors.Subtle
    Write-Host ""

    Write-ColorOutput "🔧 Live API Integration Features:" -Color $Colors.Header
    Write-ColorOutput "• ArgoCD sync/rollback status monitoring" -Color $Colors.Subtle
    Write-ColorOutput "• Prometheus metrics visualization" -Color $Colors.Subtle
    Write-ColorOutput "• Grafana dashboard embedding" -Color $Colors.Subtle
    Write-ColorOutput "• ELK stack log viewer integration" -Color $Colors.Subtle
    Write-ColorOutput "• Real-time compliance reporting" -Color $Colors.Subtle
    Write-ColorOutput "• Chaos testing dashboard" -Color $Colors.Subtle
    Write-Host ""

    Write-ColorOutput "📊 Monitoring Commands:" -Color $Colors.Header
    Write-ColorOutput "• Application Status: kubectl get applications -n $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• Frontend Health: kubectl get pods -n frontend" -Color $Colors.Subtle
    Write-ColorOutput "• Application Logs: kubectl logs -n frontend -l app.kubernetes.io/name=ai-agent-frontend" -Color $Colors.Subtle
    Write-ColorOutput "• Sync Status: kubectl get application <app-name> -n $Namespace -o yaml" -Color $Colors.Subtle
    Write-Host ""

    Write-ColorOutput "🎯 Next Steps:" -Color $Colors.Header
    Write-ColorOutput "1. Configure ArgoCD API access for frontend dashboard" -Color $Colors.Subtle
    Write-ColorOutput "2. Set up Prometheus ServiceMonitor for metrics collection" -Color $Colors.Subtle
    Write-ColorOutput "3. Configure Grafana dashboards for observability" -Color $Colors.Subtle
    Write-ColorOutput "4. Implement RBAC for secure dashboard access" -Color $Colors.Subtle
    Write-ColorOutput "5. Test automated sync/rollback workflows" -Color $Colors.Subtle
    Write-Host ""
}

function Enable-APIDashboardIntegration {
    Write-Header "🔌 Enabling API Dashboard Integration"

    Write-ColorOutput "Configuring API connections..." -Color $Colors.Info

    # Create service account for frontend API access
    $serviceAccountManifest = @"
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ai-agent-frontend-api
  namespace: frontend
  labels:
    app.kubernetes.io/name: ai-agent-frontend-api
    app.kubernetes.io/part-of: ai-devops-agent
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ai-agent-frontend-reader
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["argoproj.io"]
  resources: ["applications", "applicationsets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["monitoring.coreos.com"]
  resources: ["servicemonitors", "prometheusrules"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ai-agent-frontend-reader-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ai-agent-frontend-reader
subjects:
- kind: ServiceAccount
  name: ai-agent-frontend-api
  namespace: frontend
"@

    if ($DryRun) {
        Write-ColorOutput "🔍 DRY RUN: Would create API integration manifests:" -Color $Colors.Warning
        Write-ColorOutput $serviceAccountManifest -Color $Colors.Subtle
        return $true
    }

    try {
        $serviceAccountManifest | kubectl apply -f - 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to apply API integration manifests"
        }

        Write-ColorOutput "✅ Successfully configured API dashboard integration" -Color $Colors.Success
        return $true

    } catch {
        Write-ColorOutput "❌ Failed to configure API integration: $($_.Exception.Message)" -Color $Colors.Error
        return $false
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

try {
    Write-Header "🔌 Frontend GitOps Integration"

    Write-ColorOutput "Configuration:" -Color $Colors.Header
    Write-ColorOutput "  ArgoCD Namespace: $Namespace" -Color $Colors.Info
    Write-ColorOutput "  Repository URL: $RepoURL" -Color $Colors.Info
    Write-ColorOutput "  Branch: $Branch" -Color $Colors.Info
    Write-ColorOutput "  Skip ApplicationSet: $SkipApplicationSet" -Color $Colors.Info
    Write-ColorOutput "  Dry Run: $DryRun" -Color $Colors.Info
    Write-Host ""

    # Step 1: Verify ArgoCD installation
    Write-Header "🔍 Step 1: Verify ArgoCD"
    Write-Step "Checking ArgoCD installation" 1 4
    if (-not (Test-ArgoCDInstallation)) {
        throw "ArgoCD verification failed"
    }

    # Step 2: Update ApplicationSet
    if (-not $SkipApplicationSet) {
        Write-Header "🔄 Step 2: Update ApplicationSet"
        Write-Step "Integrating frontend into ApplicationSet" 2 4
        if (-not (Update-ApplicationSet -Namespace $Namespace)) {
            throw "Failed to update ApplicationSet"
        }
    } else {
        Write-ColorOutput "⏭️  Skipping ApplicationSet update as requested" -Color $Colors.Warning
    }

    # Step 3: Enable API Dashboard Integration
    Write-Header "🔌 Step 3: API Integration"
    Write-Step "Configuring API dashboard connections" 3 4
    if (-not (Enable-APIDashboardIntegration)) {
        Write-ColorOutput "⚠️  API integration configuration failed, but continuing..." -Color $Colors.Warning
    }

    # Step 4: Wait for applications to sync (if not dry run)
    if (-not $DryRun) {
        Write-Header "⏳ Step 4: Sync Verification"
        Write-Step "Waiting for applications to sync" 4 4

        # Get list of applications and wait for sync
        try {
            $apps = kubectl get applications -n $Namespace -o jsonpath='{.items[*].metadata.name}' 2>$null
            if ($apps) {
                $appList = $apps -split ' '
                foreach ($app in $appList) {
                    if ($app -like "*frontend*") {
                        Wait-ForApplicationSync -AppName $app -Namespace $Namespace -TimeoutSeconds $TimeoutSeconds
                    }
                }
            }
        } catch {
            Write-ColorOutput "⚠️  Could not verify application sync status" -Color $Colors.Warning
        }

        # Show status and instructions
        Show-ApplicationStatus -Namespace $Namespace
        Show-PostIntegrationInstructions -Namespace $Namespace
    } else {
        Write-Header "🔍 Dry Run Complete"
        Write-ColorOutput "All operations completed successfully in dry-run mode." -Color $Colors.Success
        Write-ColorOutput "Re-run without -DryRun to apply changes." -Color $Colors.Info
    }

} catch {
    Write-Header "❌ Integration Failed"
    Write-ColorOutput "Error: $($_.Exception.Message)" -Color $Colors.Error

    if ($Verbose) {
        Write-ColorOutput "Stack Trace:" -Color $Colors.Error
        Write-ColorOutput $_.ScriptStackTrace -Color $Colors.Subtle
    }

    Write-ColorOutput "🔧 Troubleshooting Tips:" -Color $Colors.Header
    Write-ColorOutput "• Check ArgoCD status: kubectl get pods -n $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• Verify ApplicationSet: kubectl get applicationsets -n $Namespace" -Color $Colors.Subtle
    Write-ColorOutput "• Check application logs: kubectl logs -n $Namespace -l app.kubernetes.io/name=argocd-server" -Color $Colors.Subtle
    Write-ColorOutput "• Retry with -Verbose for more details" -Color $Colors.Subtle

    exit 1
}

Write-Header "✅ Frontend GitOps Integration Complete!"
exit 0

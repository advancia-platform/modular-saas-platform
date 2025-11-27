# 🚀 GitOps Deployment Validation Script
# Validates the complete frontend-to-GitOps integration deployment

param(
    [string]$Namespace = "ai-devops",
    [string]$Environment = "prod",
    [string]$KubeContext = "",
    [switch]$SkipClusterValidation,
    [switch]$DryRun,
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Debug = "DarkGray"
}

function Write-StatusMessage {
    param(
        [string]$Message,
        [ValidateSet("Success", "Warning", "Error", "Info", "Debug")]
        [string]$Type = "Info",
        [string]$Icon = ""
    )
    
    $iconMap = @{
        Success = "✅"
        Warning = "⚠️ "
        Error = "❌"
        Info = "ℹ️ "
        Debug = "🔍"
    }
    
    $displayIcon = if ($Icon) { $Icon } else { $iconMap[$Type] }
    Write-Host "$displayIcon $Message" -ForegroundColor $Colors[$Type]
}

function Test-KubernetesCommand {
    param([string]$Command)
    
    try {
        if ($DryRun) {
            Write-StatusMessage "[DRY-RUN] Would execute: kubectl $Command" -Type Debug
            return $true
        }
        
        $result = Invoke-Expression "kubectl $Command 2>&1"
        if ($LASTEXITCODE -eq 0) {
            return $true
        } else {
            Write-StatusMessage "kubectl command failed: $result" -Type Error
            return $false
        }
    } catch {
        Write-StatusMessage "kubectl command error: $($_.Exception.Message)" -Type Error
        return $false
    }
}

function Get-KubernetesResource {
    param(
        [string]$ResourceType,
        [string]$ResourceName = "",
        [string]$Namespace = "",
        [switch]$AllNamespaces
    )
    
    $cmd = "get $ResourceType"
    if ($ResourceName) { $cmd += " $ResourceName" }
    if ($Namespace) { $cmd += " -n $Namespace" }
    if ($AllNamespaces) { $cmd += " --all-namespaces" }
    $cmd += " -o json"
    
    try {
        if ($DryRun) {
            Write-StatusMessage "[DRY-RUN] Would get: $ResourceType $ResourceName" -Type Debug
            return @{ items = @() }
        }
        
        $result = kubectl $cmd.Split() | ConvertFrom-Json
        return $result
    } catch {
        Write-StatusMessage "Failed to get $ResourceType $ResourceName : $($_.Exception.Message)" -Type Error
        return $null
    }
}

# Main validation logic
Write-Host ""
Write-StatusMessage "GitOps Frontend Deployment Validation" -Type Info -Icon "🚀"
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$validationResults = @()

# 1. Validate cluster connectivity
Write-StatusMessage "Validating Kubernetes cluster connectivity..." -Type Info

if ($KubeContext) {
    $contextResult = Test-KubernetesCommand "config use-context $KubeContext"
    $validationResults += @{ Name = "Kubernetes Context"; Success = $contextResult }
}

if (-not $SkipClusterValidation) {
    $clusterResult = Test-KubernetesCommand "cluster-info"
    $validationResults += @{ Name = "Cluster Connectivity"; Success = $clusterResult }
    
    if (-not $clusterResult) {
        Write-StatusMessage "Cluster connectivity failed. Stopping validation." -Type Error
        exit 1
    }
}

# 2. Validate namespace exists
Write-StatusMessage "Validating namespace '$Namespace'..." -Type Info
$namespaceResource = Get-KubernetesResource -ResourceType "namespace" -ResourceName $Namespace
$namespaceExists = $namespaceResource -ne $null
$validationResults += @{ Name = "Namespace Exists"; Success = $namespaceExists }

if (-not $namespaceExists -and -not $DryRun) {
    Write-StatusMessage "Creating namespace '$Namespace'..." -Type Warning
    $createNs = Test-KubernetesCommand "create namespace $Namespace"
    $validationResults += @{ Name = "Namespace Creation"; Success = $createNs }
}

# 3. Validate frontend deployment
Write-StatusMessage "Validating frontend deployment..." -Type Info
$deploymentResource = Get-KubernetesResource -ResourceType "deployment" -ResourceName "ai-agent-frontend" -Namespace $Namespace
$deploymentExists = $deploymentResource -ne $null
$validationResults += @{ Name = "Frontend Deployment Exists"; Success = $deploymentExists }

if ($deploymentExists -and -not $DryRun) {
    $deployment = $deploymentResource
    $desiredReplicas = $deployment.spec.replicas
    $readyReplicas = $deployment.status.readyReplicas
    $deploymentReady = $readyReplicas -eq $desiredReplicas
    
    Write-StatusMessage "Deployment status: $readyReplicas/$desiredReplicas replicas ready" -Type $(if ($deploymentReady) { "Success" } else { "Warning" })
    $validationResults += @{ Name = "Frontend Deployment Ready"; Success = $deploymentReady }
}

# 4. Validate frontend service
Write-StatusMessage "Validating frontend service..." -Type Info
$serviceResource = Get-KubernetesResource -ResourceType "service" -ResourceName "ai-agent-frontend-service" -Namespace $Namespace
$serviceExists = $serviceResource -ne $null
$validationResults += @{ Name = "Frontend Service Exists"; Success = $serviceExists }

# 5. Validate frontend ingress
Write-StatusMessage "Validating frontend ingress..." -Type Info
$ingressResource = Get-KubernetesResource -ResourceType "ingress" -ResourceName "ai-agent-frontend-ingress" -Namespace $Namespace
$ingressExists = $ingressResource -ne $null
$validationResults += @{ Name = "Frontend Ingress Exists"; Success = $ingressExists }

# 6. Validate ConfigMap
Write-StatusMessage "Validating frontend ConfigMap..." -Type Info
$configMapResource = Get-KubernetesResource -ResourceType "configmap" -ResourceName "ai-agent-frontend-config" -Namespace $Namespace
$configMapExists = $configMapResource -ne $null
$validationResults += @{ Name = "Frontend ConfigMap Exists"; Success = $configMapExists }

# 7. Validate Secret
Write-StatusMessage "Validating frontend Secret..." -Type Info
$secretResource = Get-KubernetesResource -ResourceType "secret" -ResourceName "ai-agent-frontend-secret" -Namespace $Namespace
$secretExists = $secretResource -ne $null
$validationResults += @{ Name = "Frontend Secret Exists"; Success = $secretExists }

# 8. Validate ServiceAccount
Write-StatusMessage "Validating frontend ServiceAccount..." -Type Info
$serviceAccountResource = Get-KubernetesResource -ResourceType "serviceaccount" -ResourceName "ai-agent-frontend" -Namespace $Namespace
$serviceAccountExists = $serviceAccountResource -ne $null
$validationResults += @{ Name = "Frontend ServiceAccount Exists"; Success = $serviceAccountExists }

# 9. Validate ServiceMonitor
Write-StatusMessage "Validating frontend ServiceMonitor..." -Type Info
$serviceMonitorResource = Get-KubernetesResource -ResourceType "servicemonitor" -ResourceName "ai-agent-frontend" -Namespace $Namespace
$serviceMonitorExists = $serviceMonitorResource -ne $null
$validationResults += @{ Name = "Frontend ServiceMonitor Exists"; Success = $serviceMonitorExists }

# 10. Validate HPA
Write-StatusMessage "Validating HorizontalPodAutoscaler..." -Type Info
$hpaResource = Get-KubernetesResource -ResourceType "hpa" -ResourceName "ai-agent-frontend-hpa" -Namespace $Namespace
$hpaExists = $hpaResource -ne $null
$validationResults += @{ Name = "Frontend HPA Exists"; Success = $hpaExists }

# 11. Validate PodDisruptionBudget
Write-StatusMessage "Validating PodDisruptionBudget..." -Type Info
$pdbResource = Get-KubernetesResource -ResourceType "pdb" -ResourceName "ai-agent-frontend-pdb" -Namespace $Namespace
$pdbExists = $pdbResource -ne $null
$validationResults += @{ Name = "Frontend PDB Exists"; Success = $pdbExists }

# 12. Validate ArgoCD ApplicationSet
Write-StatusMessage "Validating ArgoCD ApplicationSet..." -Type Info
$appSetResource = Get-KubernetesResource -ResourceType "applicationset" -ResourceName "ai-agent-applicationset" -Namespace "argocd"
$appSetExists = $appSetResource -ne $null
$validationResults += @{ Name = "ArgoCD ApplicationSet Exists"; Success = $appSetExists }

# 13. Validate pods are running
Write-StatusMessage "Validating frontend pods..." -Type Info
if (-not $DryRun) {
    try {
        $pods = kubectl get pods -n $Namespace -l app=ai-agent-frontend -o json | ConvertFrom-Json
        $runningPods = ($pods.items | Where-Object { $_.status.phase -eq "Running" }).Count
        $totalPods = $pods.items.Count
        
        $podsHealthy = $runningPods -gt 0 -and $runningPods -eq $totalPods
        Write-StatusMessage "Pod status: $runningPods/$totalPods pods running" -Type $(if ($podsHealthy) { "Success" } else { "Warning" })
        $validationResults += @{ Name = "Frontend Pods Running"; Success = $podsHealthy }
        
        # Check pod readiness
        if ($pods.items) {
            foreach ($pod in $pods.items) {
                $podName = $pod.metadata.name
                $readyCondition = $pod.status.conditions | Where-Object { $_.type -eq "Ready" }
                $isReady = $readyCondition -and $readyCondition.status -eq "True"
                
                if ($isReady) {
                    Write-StatusMessage "Pod $podName is ready" -Type Success
                } else {
                    Write-StatusMessage "Pod $podName is not ready" -Type Warning
                }
            }
        }
    } catch {
        Write-StatusMessage "Failed to check pod status: $($_.Exception.Message)" -Type Error
        $validationResults += @{ Name = "Frontend Pods Running"; Success = $false }
    }
}

# 14. Test ingress connectivity (if possible)
Write-StatusMessage "Testing ingress connectivity..." -Type Info
if ($ingressExists -and -not $DryRun) {
    try {
        $ingress = $ingressResource
        $hosts = $ingress.spec.rules | ForEach-Object { $_.host }
        
        foreach ($host in $hosts) {
            if ($host) {
                Write-StatusMessage "Testing connectivity to https://$host" -Type Info
                
                try {
                    $response = Invoke-WebRequest -Uri "https://$host" -TimeoutSec 10 -UseBasicParsing
                    $connectionWorking = $response.StatusCode -eq 200
                    Write-StatusMessage "Host $host responded with status $($response.StatusCode)" -Type $(if ($connectionWorking) { "Success" } else { "Warning" })
                } catch {
                    Write-StatusMessage "Host $host is not accessible: $($_.Exception.Message)" -Type Warning
                }
            }
        }
    } catch {
        Write-StatusMessage "Failed to test ingress connectivity: $($_.Exception.Message)" -Type Warning
    }
}

# 15. Validate TLS certificates
Write-StatusMessage "Validating TLS certificates..." -Type Info
if (-not $DryRun) {
    try {
        $tlsSecrets = kubectl get secrets -n $Namespace -o json | ConvertFrom-Json
        $tlsSecret = $tlsSecrets.items | Where-Object { $_.metadata.name -eq "ai-agent-frontend-tls" }
        
        if ($tlsSecret) {
            $certData = $tlsSecret.data.'tls.crt'
            if ($certData) {
                Write-StatusMessage "TLS certificate exists and has data" -Type Success
                $validationResults += @{ Name = "TLS Certificate Exists"; Success = $true }
            } else {
                Write-StatusMessage "TLS certificate exists but has no data" -Type Warning
                $validationResults += @{ Name = "TLS Certificate Exists"; Success = $false }
            }
        } else {
            Write-StatusMessage "TLS certificate not found" -Type Warning
            $validationResults += @{ Name = "TLS Certificate Exists"; Success = $false }
        }
    } catch {
        Write-StatusMessage "Failed to check TLS certificate: $($_.Exception.Message)" -Type Error
        $validationResults += @{ Name = "TLS Certificate Exists"; Success = $false }
    }
}

# Summary
Write-Host ""
Write-StatusMessage "Validation Summary" -Type Info -Icon "📊"
Write-Host "==================" -ForegroundColor Cyan

$successfulValidations = ($validationResults | Where-Object { $_.Success }).Count
$totalValidations = $validationResults.Count
$successRate = [math]::Round(($successfulValidations / $totalValidations) * 100, 2)

Write-Host "Total Validations: $totalValidations" -ForegroundColor White
Write-Host "Successful: $successfulValidations" -ForegroundColor Green
Write-Host "Failed: $($totalValidations - $successfulValidations)" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 75) { "Yellow" } else { "Red" })

# Detailed results
Write-Host ""
Write-StatusMessage "Detailed Results" -Type Info -Icon "📋"
Write-Host "=================" -ForegroundColor Cyan

foreach ($result in $validationResults) {
    $status = if ($result.Success) { "✅ PASS" } else { "❌ FAIL" }
    $color = if ($result.Success) { "Green" } else { "Red" }
    Write-Host "$status $($result.Name)" -ForegroundColor $color
}

# Recommendations
Write-Host ""
Write-StatusMessage "Recommendations" -Type Info -Icon "💡"
Write-Host "================" -ForegroundColor Cyan

$failedValidations = $validationResults | Where-Object { -not $_.Success }

if ($failedValidations.Count -eq 0) {
    Write-StatusMessage "All validations passed! Your GitOps frontend deployment is ready." -Type Success
    Write-Host ""
    Write-StatusMessage "🎉 Next Steps:" -Type Info
    Write-Host "1. Access your frontend at the configured ingress URL" -ForegroundColor White
    Write-Host "2. Check the GitOps dashboard for real-time monitoring" -ForegroundColor White
    Write-Host "3. Configure monitoring alerts and notifications" -ForegroundColor White
    Write-Host "4. Set up backup and disaster recovery procedures" -ForegroundColor White
} else {
    Write-StatusMessage "Some validations failed. Please address the following:" -Type Warning
    Write-Host ""
    
    foreach ($failed in $failedValidations) {
        Write-StatusMessage "Fix: $($failed.Name)" -Type Warning
        
        switch ($failed.Name) {
            "Namespace Exists" {
                Write-Host "  - Run: kubectl create namespace $Namespace" -ForegroundColor Yellow
            }
            "Frontend Deployment Exists" {
                Write-Host "  - Apply the frontend deployment manifest" -ForegroundColor Yellow
                Write-Host "  - Check: kubectl apply -f frontend-k8s/overlays/$Environment/" -ForegroundColor Yellow
            }
            "Frontend Pods Running" {
                Write-Host "  - Check pod logs: kubectl logs -n $Namespace -l app=ai-agent-frontend" -ForegroundColor Yellow
                Write-Host "  - Describe deployment: kubectl describe deployment ai-agent-frontend -n $Namespace" -ForegroundColor Yellow
            }
            "TLS Certificate Exists" {
                Write-Host "  - Check cert-manager: kubectl get certificaterequests -n $Namespace" -ForegroundColor Yellow
                Write-Host "  - Verify DNS configuration for your domain" -ForegroundColor Yellow
            }
            "ArgoCD ApplicationSet Exists" {
                Write-Host "  - Apply ArgoCD ApplicationSet: kubectl apply -f ai-agent-k8s/argocd-applicationset.yaml" -ForegroundColor Yellow
                Write-Host "  - Check ArgoCD is installed and running" -ForegroundColor Yellow
            }
            default {
                Write-Host "  - Check the resource configuration and apply the correct manifest" -ForegroundColor Yellow
            }
        }
        Write-Host ""
    }
}

# Final commands for debugging
Write-Host ""
Write-StatusMessage "Debugging Commands" -Type Info -Icon "🔧"
Write-Host "==================" -ForegroundColor Cyan
Write-Host "kubectl get all -n $Namespace" -ForegroundColor DarkGray
Write-Host "kubectl describe deployment ai-agent-frontend -n $Namespace" -ForegroundColor DarkGray
Write-Host "kubectl logs -n $Namespace -l app=ai-agent-frontend --tail=50" -ForegroundColor DarkGray
Write-Host "kubectl get events -n $Namespace --sort-by=.lastTimestamp" -ForegroundColor DarkGray

Write-Host ""
exit $(if ($successRate -ge 90) { 0 } else { 1 })
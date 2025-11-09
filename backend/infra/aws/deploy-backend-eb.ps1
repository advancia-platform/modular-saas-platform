Param(
  [string]$Region = "us-east-1",
  [string]$EnvName = "my-backend-env"
)

Write-Host "Deploying backend to Elastic Beanstalk in $Region (env: $EnvName)" -ForegroundColor Cyan

function Install-EBCLIIfNeeded {
  $script:EbCmd = $null

  # 1) If 'eb' is on PATH
  $cmd = Get-Command eb -ErrorAction SilentlyContinue
  if ($cmd) {
    $script:EbCmd = $cmd.Path
    return
  }

  # 2) Try pipx
  $pipx = Get-Command pipx -ErrorAction SilentlyContinue
  if ($pipx) {
    try { pipx install awsebcli | Out-Null } catch {}
    $cmd = Get-Command eb -ErrorAction SilentlyContinue
    if ($cmd) { $script:EbCmd = $cmd.Path; return }
  }

  # 3) Try user pip install
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { py -m pip install --user --upgrade awsebcli | Out-Null } else {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) { python -m pip install --user --upgrade awsebcli | Out-Null }
  }

  # Add common Scripts paths to PATH for current process and try again
  $candidates = @(
    (Join-Path $env:APPDATA "Python\Python39\Scripts")
    (Join-Path $env:APPDATA "Python\Python310\Scripts")
    (Join-Path $env:APPDATA "Python\Python311\Scripts")
    (Join-Path $env:APPDATA "Python\Python312\Scripts")
    (Join-Path $env:APPDATA "Python\Python313\Scripts")
    (Join-Path $env:APPDATA "Python\Python314\Scripts")
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python39\Scripts")
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python310\Scripts")
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python311\Scripts")
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\Scripts")
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python313\Scripts")
    (Join-Path $env:LOCALAPPDATA "Programs\Python\Python314\Scripts")
  )
  foreach ($p in $candidates) {
    if (Test-Path $p -PathType Container) { $env:PATH = "$p;$env:PATH" }
  }

  $cmd = Get-Command eb -ErrorAction SilentlyContinue
  if ($cmd) { $script:EbCmd = $cmd.Path; return }

  throw "Elastic Beanstalk CLI ('eb') not found. Please install with 'pipx install awsebcli' or 'pip install --user awsebcli' and retry."
}

# Ensure EB CLI is available
Install-EBCLIIfNeeded

# Ensure we are in backend folder
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "..\.."
$backendDir = Join-Path $backendDir "backend"
Set-Location $backendDir

# Initialize (safe to re-run)
& $script:EbCmd init --platform node.js --region $Region

# Create the environment if missing
$envs = & $script:EbCmd list | Out-String
if ($envs -notmatch "$EnvName") {
  & $script:EbCmd create $EnvName --single
}

# Prompt for required env vars if not set in your shell (simple examples)
if (-not $env:DATABASE_URL) { $env:DATABASE_URL = Read-Host "Enter DATABASE_URL for Postgres (RDS)" }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = Read-Host "Enter JWT_SECRET" }
if (-not $env:STRIPE_SECRET_KEY) { $env:STRIPE_SECRET_KEY = Read-Host "Enter STRIPE_SECRET_KEY" }
if (-not $env:STRIPE_WEBHOOK_SECRET) { $env:STRIPE_WEBHOOK_SECRET = Read-Host "Enter STRIPE_WEBHOOK_SECRET (or leave blank)" }
if (-not $env:FRONTEND_URL) { $env:FRONTEND_URL = Read-Host "Enter FRONTEND_URL (e.g., https://your-frontend.example.com or leave blank)" }

# Apply env vars (pass as separate args)
$envPairs = @(
  "NODE_ENV=production",
  "PORT=4000",
  "DATABASE_URL=$($env:DATABASE_URL)",
  "JWT_SECRET=$($env:JWT_SECRET)",
  "STRIPE_SECRET_KEY=$($env:STRIPE_SECRET_KEY)",
  "STRIPE_WEBHOOK_SECRET=$($env:STRIPE_WEBHOOK_SECRET)",
  "FRONTEND_URL=$($env:FRONTEND_URL)"
)

& $script:EbCmd setenv @envPairs

# Install deps and deploy
npm ci
& $script:EbCmd deploy $EnvName

Write-Host "Done. Use 'eb open' to view the app and 'eb logs --all' for logs." -ForegroundColor Green

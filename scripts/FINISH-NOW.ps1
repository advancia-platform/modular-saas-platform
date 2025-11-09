# FINISH-NOW.ps1 — Advancia PayLedger finalizer
$ErrorActionPreference = "Stop"
Write-Host "`n🚀 FINISH-NOW: Advancia end-to-end fix & build`n"

function Ensure-Node20 {
  $v = node -v 2>$null
  if (-not $v) { throw "Node.js not found. Install Node 20.x" }
  if (-not ($v -match '^v20\.')) { Write-Host "⚠ Node $v detected. Node 20.x recommended." -ForegroundColor Yellow }
}

function Patch-TsconfigPaths {
  param($tsconfigPath)
  if (-not (Test-Path $tsconfigPath)) { return }
  $json = Get-Content $tsconfigPath -Raw | ConvertFrom-Json
  if (-not $json.compilerOptions) { $json | Add-Member -Name compilerOptions -MemberType NoteProperty -Value (@{}) }
  if (-not $json.compilerOptions.baseUrl) { $json.compilerOptions.baseUrl = "./" }
  if (-not $json.compilerOptions.paths) { $json.compilerOptions.paths = @{} }
  if (-not $json.compilerOptions.paths.'@/') { $json.compilerOptions.paths.'@/' = @("src/*") }
  ($json | ConvertTo-Json -Depth 10) | Set-Content $tsconfigPath -Encoding UTF8
  Write-Host "✅ tsconfig paths ensured in $tsconfigPath"
}

function Ensure-Tailwind {
  param($frontendPath)
  Push-Location $frontendPath
  try {
    Write-Host "🧩 Ensuring Tailwind deps..."
    npm i -D tailwindcss postcss autoprefixer 1>$null
    if (-not (Test-Path ".\tailwind.config.js")) {
@"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src//.{js,ts,jsx,tsx}","./app//.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
"@ | Set-Content ".\tailwind.config.js"
    }
    if (-not (Test-Path ".\postcss.config.js")) {
@"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
"@ | Set-Content ".\postcss.config.js"
    }
    $globals = ".\src\app\globals.css"
    if (Test-Path $globals) {
      $css = Get-Content $globals -Raw
      if ($css -notmatch "@tailwind base") {
"@tailwind base;
@tailwind components;
@tailwind utilities;

$css" | Set-Content $globals
      }
    }
    Write-Host "✅ Tailwind ready."
  } finally {
    Pop-Location
  }
}

function Fix-Common-Imports {
  param($frontendPath)
  # Fix missing "@/components/*" by ensuring alias works and fallback to relative for known offenders
  $files = @(
    "src/app/about/page.tsx",
    "src/app/admin/analytics/page.tsx",
    "src/app/admin/crypto-balances/page.tsx",
    "src/app/admin/crypto/page.tsx",
    "src/app/admin/dashboard/page.tsx"
  ) | ForEach-Object { Join-Path $frontendPath $_ } | Where-Object { Test-Path $_ }

  foreach ($f in $files) {
    $c = Get-Content $f -Raw
    $c = $c -replace "'@/components/SidebarLayout'", "'@/components/layouts/SidebarLayout'"
    $c = $c -replace "'@/components/RequireRole'", "'@/components/auth/RequireRole'"
    $c = $c -replace "'@/components/CryptoAdminPanel'", "'@/components/admin/CryptoAdminPanel'"
    Set-Content $f $c -Encoding UTF8
  }
  Write-Host "🔧 Imports normalized (alias + common renames)."
}

function Ensure-FrontendEnv {
  param($frontendPath)
  $envFile = Join-Path $frontendPath ".env.production"
  if (-not (Test-Path $envFile)) {
@"
NEXT_PUBLIC_API_URL=${env:BACKEND_PUBLIC_URL}
NEXTAUTH_URL=${env:NEXTAUTH_URL}
NEXTAUTH_SECRET=${env:NEXTAUTH_SECRET}
"@ | Set-Content $envFile -Encoding UTF8
    Write-Host "ℹ Created frontend/.env.production (uses existing env vars)."
  }
}

function Build-Backend {
  param($path)
  Push-Location $path
  try {
    Write-Host "🧱 Backend: install + prisma + build"
    npm install
    npx prisma generate
    # deploy migrations for prod; for dev use 'migrate dev'
    npx prisma migrate deploy
    npm run build
    Write-Host "✅ Backend build OK."
  } finally { Pop-Location }
}

function Build-Frontend {
  param($path)
  Push-Location $path
  try {
    Write-Host "🧱 Frontend: install + build"
    npm install
    npx next build --no-lint
    Write-Host "✅ Frontend build OK."
  } finally { Pop-Location }
}

# --- RUN ---
Ensure-Node20

# Patch tsconfig (backend + frontend)
Patch-TsconfigPaths ".\frontend\tsconfig.json"
Patch-TsconfigPaths ".\backend\tsconfig.json"

# Ensure Tailwind + fix imports + env
Ensure-Tailwind ".\frontend"
Fix-Common-Imports ".\frontend"
Ensure-FrontendEnv ".\frontend"

# Backend build
Build-Backend ".\backend"

# Frontend build
Build-Frontend ".\frontend"

Write-Host "`n🩺 Local health check tips:"
Write-Host "  Backend: npm start (in backend) -> http://localhost:4000/health"
Write-Host "  Frontend: npm start (in frontend) -> http://localhost:3000"
Write-Host "`n🎉 FINISH-NOW completed."
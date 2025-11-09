$ErrorActionPreference = 'Stop'

function Update-Text {
  param(
    [Parameter(Mandatory=$true)][string]$Text,
    [Parameter(Mandatory=$true)][ScriptBlock]$Patch
  )
  & $Patch $Text
}

function Update-File {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][ScriptBlock]$Patch
  )
  if (!(Test-Path $Path)) { throw "File not found: $Path" }
  $orig = Get-Content -Raw -Path $Path
  $updated = & $Patch $orig
  if ($null -eq $updated -or $updated -eq $orig) {
    Write-Host "No changes for $Path" -ForegroundColor Yellow
  } else {
    Set-Content -Path $Path -Value $updated -NoNewline
    Write-Host "Patched $Path" -ForegroundColor Green
  }
}

# 1) Patch NextAuth authorize to throw status-specific errors
$nextAuthPath = Resolve-Path (Join-Path $PSScriptRoot '..\frontend\src\app\api\auth\[...nextauth]\route.ts')
Update-File -Path $nextAuthPath -Patch {
  param($t)
  if ($t -notmatch 'async authorize\(credentials\)') { return $t }

  # Replace the non-ok handling to parse body and throw status-specific error
  $t = [regex]::Replace($t,
    'if \(!response\.ok\) \{[\s\S]*?return null;[\s\S]*?\}',
    @'
if (!response.ok) {
  let errText = 'CredentialsSignin';
  try {
    const data = await response.json();
    if (data?.status) errText = String(data.status);
    else if (data?.error) errText = String(data.error);
  } catch {}
  throw new Error(errText);
}
'@, 1)

  return $t
}

# 2) Update login page to show friendly error banners
$loginPath = Resolve-Path (Join-Path $PSScriptRoot '..\frontend\src\app\auth\login\page.tsx')
Update-File -Path $loginPath -Patch {
  param($t)
  if ($t -notmatch 'setError\(result\.error') {
    # Insert friendly mapping where result.error is handled
    $t = [regex]::Replace($t,
      '(if \(result\?\.error\) \{\s*\r?\n\s*setError\(result\.error \|\| "Invalid credentials\. Please try again\."\);\s*\r?\n\s*return;\s*\r?\n\s*\})',
      @'
if (result?.error) {
  const code = String(result.error).toLowerCase();
  const friendly = code === 'email_unverified'
    ? 'Email not verified. Please verify using the code we sent to your email.'
    : code === 'pending_approval'
      ? 'Your account is awaiting admin approval. You will be notified once approved.'
      : 'Invalid credentials. Please try again.';
  setError(friendly);
  return;
}
'@, 1)
  }
  return $t
}

Write-Host "Done patching NextAuth and login banner handling." -ForegroundColor Cyan

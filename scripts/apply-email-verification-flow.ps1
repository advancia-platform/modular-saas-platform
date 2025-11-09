Param()

$ErrorActionPreference = 'Stop'

function Update-FileContent {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][ScriptBlock]$Updater
  )
  if (!(Test-Path $Path)) { throw "File not found: $Path" }
  $orig = Get-Content -Raw -Path $Path
  $updated = & $Updater $orig
  if ($null -eq $updated -or $updated -eq $orig) {
    Write-Host "No changes needed for $Path" -ForegroundColor Yellow
  } else {
    Set-Content -Path $Path -Value $updated -NoNewline
    Write-Host "Updated $Path" -ForegroundColor Green
  }
}

# 1) Update Prisma schema: add emailVerified/emailVerifiedAt to User
$schemaPath = Join-Path $PSScriptRoot '..\backend\prisma\schema.prisma' | Resolve-Path
Update-FileContent -Path $schemaPath -Updater {
  param($text)
  if ($text -match '(?ms)model\s+User\s+\{[^}]*emailVerified\s') {
    return $text # already present
  }
  # Insert after the active field inside model User
  $pattern = '(?ms)(model\s+User\s+\{[^}]*?^\s*active\s+Boolean\s+@default\(true\)\s*\n)'
  $insert  = "    emailVerified    Boolean  @default(false)\n    emailVerifiedAt  DateTime?\n"
  $newText = [regex]::Replace($text, $pattern, { param($m) $m.Groups[1].Value + $insert }, 1)
  return $newText
}

# 2) Backend auth.ts updates
$authPath = Join-Path $PSScriptRoot '..\backend\src\routes\auth.ts' | Resolve-Path
Update-FileContent -Path $authPath -Updater {
  param($text)

  $t = $text

  # 2a) Ensure login select includes active and emailVerified
  if ($t -notmatch 'router\.post\("/login"') { return $t }
  $t = [regex]::Replace($t,
    '(usdBalance:\s*true,\s*\r?\n\s*\},)',
    'usdBalance: true,`n        active: true,`n        emailVerified: true,`n      },', 1)

  # 2b) Insert enforcement checks after password validity check
  if ($t -notmatch 'email not verified' -and $t -match 'const valid = await bcrypt\.compare\([\s\S]*?if \(!valid\) \{[\s\S]*?\}\s*\r?\n') {
    $t = [regex]::Replace($t,
      '(const valid = await bcrypt\.compare\([\s\S]*?if \(!valid\) \{[\s\S]*?\}\s*\r?\n)',
      '$0    if (!user.emailVerified) {`n      return res.status(403).json({ error: "Email not verified. Please verify your email to continue.", status: "email_unverified" });`n    }`n`n    if (!user.active) {`n      return res.status(403).json({ error: "Account pending admin approval.", status: "pending_approval" });`n    }`n', 1)
  }

  # 2c) In verify-otp, mark emailVerified true and set timestamp
  if ($t -match 'router\.post\("/verify-otp"') {
    # Insert after user fetch and 404 check
    $t = [regex]::Replace($t,
      '(const user = await prisma\.user\.findFirst\(\{\s*\r?\n\s*where: \{ email \},\s*\r?\n\}\);\s*\r?\n\s*if \(!user\) return res\.status\(404\)\.json\(\{ error: "User not found" \}\);\s*)',
      '$1`n    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifiedAt: new Date() } });`n',
      1)

    # Optionally notify admins only if not already present
    if ($t -notmatch 'User Email Verified') {
      $t = [regex]::Replace($t,
        '(return res\.json\(\{\s*message: "OTP verified",\s*token\s*\}\);)',
        'try {`n      await notifyAllAdmins({`n        type: "all",`n        category: "admin",`n        title: "User Email Verified",`n        message: `"User ${user.email} has verified their email and is awaiting approval.`",`n        priority: "normal",`n        data: { userId: user.id, email: user.email },`n      });`n    } catch (e) {`n      console.error("Admin notify failed (email verified):", e);`n    }`n    return res.json({ message: "OTP verified", status: "pending_approval", token });',
        1)
    }
  }

  return $t
}

# 3) Frontend register redirect to verify-otp
$registerPath = Join-Path $PSScriptRoot '..\frontend\src\app\auth\register\page.tsx' | Resolve-Path
Update-FileContent -Path $registerPath -Updater {
  param($text)
  if ($text -match '/auth/verify-otp\?email=') { return $text }
  $text -replace 'router\.push\(`?/auth/login\?registered=true[^`]*?`\);', 'router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);'
}

Write-Host "\nAll edits applied. Next steps:" -ForegroundColor Cyan
Write-Host "  1) Run Prisma migrate dev in backend (add-email-verified)" -ForegroundColor Cyan
Write-Host "  2) Rebuild/type-check projects" -ForegroundColor Cyan

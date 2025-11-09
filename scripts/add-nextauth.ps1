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
    New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetDirectoryName($Path)) | Out-Null
    Set-Content -Path $Path -Value $updated -NoNewline
    Write-Host "Updated $Path" -ForegroundColor Green
  }
}

# 1) Ensure lib/auth.ts exports authOptions (without breaking existing custom auth)
$libAuth = Resolve-Path (Join-Path $PSScriptRoot '..\frontend\src\lib\auth.ts')
Update-FileContent -Path $libAuth -Updater {
  param($text)
  if ($text -match 'export\s+const\s+authOptions\s*:\s*NextAuthOptions') { return $text }

  $imports = @(
    'import type { NextAuthOptions, User } from "next-auth";',
    'import CredentialsProvider from "next-auth/providers/credentials";'
  ) -join "`n"

  $authOptions = @'

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;
        if (!email || !password) throw new Error("Email and password are required");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(apiKey ? { "x-api-key": apiKey } : {}) },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Invalid credentials");
        const user = data?.user as (User & { username?: string; firstName?: string; lastName?: string }) | undefined;
        return {
          id: user?.id || email,
          email: user?.email || email,
          name: ((user?.firstName || "") + (user?.lastName ? ` ${user?.lastName}` : "")).trim() || (user?.username || email),
          accessToken: data?.token,
        } as any;
      }
    })
  ],
  pages: { signIn: "/auth/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        if (u.accessToken) token.accessToken = u.accessToken;
        if (u.id) token.userId = u.id;
        if (u.email) token.email = u.email;
        if (u.name) token.name = u.name;
      }
      return token as any;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any)?.accessToken;
      if (session.user) { (session.user as any).id = (token as any)?.userId; }
      return session;
    }
  },
  debug: process.env.NODE_ENV === "development",
};
'@

  # Prepend imports if not present
  $t = $text
  if ($t -notmatch 'next-auth/providers/credentials') { $t = $imports + "`n" + $t }
  $t + $authOptions
}

# 2) Create NextAuth route handler
$apiRoute = Join-Path $PSScriptRoot '..\frontend\src\app\api\auth\[...nextauth]\route.ts'
if (!(Test-Path $apiRoute)) {
  New-Item -ItemType Directory -Force -Path ([System.IO.Path]::GetDirectoryName($apiRoute)) | Out-Null
  @'
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
'@ | Set-Content -Path $apiRoute -NoNewline
  Write-Host "Created $apiRoute" -ForegroundColor Green
} else {
  Write-Host "NextAuth route already exists: $apiRoute" -ForegroundColor Yellow
}

# 3) Add NextAuth type augmentation (optional but useful)
$typesDir = Resolve-Path (Join-Path $PSScriptRoot '..\frontend\src\types')
New-Item -ItemType Directory -Force -Path $typesDir | Out-Null
$typesFile = Join-Path $typesDir 'next-auth.d.ts'
if (!(Test-Path $typesFile)) {
  @'
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
    } & DefaultSession["user"];
  }

  interface User {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    userId?: string;
  }
}
'@ | Set-Content -Path $typesFile -NoNewline
  Write-Host "Created $typesFile" -ForegroundColor Green
} else {
  Write-Host "Types augmentation already exists: $typesFile" -ForegroundColor Yellow
}

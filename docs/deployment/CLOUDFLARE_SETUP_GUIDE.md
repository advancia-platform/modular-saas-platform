# Cloudflare Complete Setup Guide - Advancia Pay Ledger

## 📋 Prerequisites

- Cloudflare account (free or paid)
- Domain registered with Cloudflare or nameservers pointed to Cloudflare
- Backend deployed on Render/VPS with static IP
- Frontend deployed on Vercel/Netlify/Render
- Cloudflare API Token with Zone Edit permissions

---

## 1️⃣ Domain Connection & DNS Records

### Manual Setup (Cloudflare Dashboard)

1. **Add Domain to Cloudflare**

   - Go to: <https://dash.cloudflare.com>
   - Click "Add a Site"
   - Enter: `advancia.app` (or your domain)
   - Select Free plan → Continue
   - Update nameservers at your registrar to Cloudflare's NS

2. **Create DNS Records**

Navigate to: **DNS** → **Records** → **Add record**

| Type  | Name  | Content                          | Proxy Status | TTL  |
| ----- | ----- | -------------------------------- | ------------ | ---- |
| A     | @     | `203.0.113.45` (Backend IP)      | Proxied (🟠) | Auto |
| CNAME | api   | `advancia-backend.onrender.com`  | Proxied (🟠) | Auto |
| CNAME | www   | `advancia-frontend.onrender.com` | Proxied (🟠) | Auto |
| CNAME | admin | `advancia-frontend.onrender.com` | Proxied (🟠) | Auto |
| A     | @     | `2606:4700:...` (IPv6 optional)  | Proxied (🟠) | Auto |

**Export as JSON** (for automation):

```json
[
  {
    "type": "A",
    "name": "@",
    "content": "203.0.113.45",
    "proxied": true,
    "ttl": 1,
    "comment": "Backend server root domain"
  },
  {
    "type": "CNAME",
    "name": "api",
    "content": "advancia-backend.onrender.com",
    "proxied": true,
    "ttl": 1,
    "comment": "API subdomain"
  },
  {
    "type": "CNAME",
    "name": "www",
    "content": "advancia-frontend.onrender.com",
    "proxied": true,
    "ttl": 1,
    "comment": "Frontend www"
  },
  {
    "type": "CNAME",
    "name": "admin",
    "content": "advancia-frontend.onrender.com",
    "proxied": true,
    "ttl": 1,
    "comment": "Admin dashboard"
  },
  {
    "type": "TXT",
    "name": "@",
    "content": "v=spf1 include:_spf.google.com ~all",
    "proxied": false,
    "ttl": 1,
    "comment": "SPF record for email"
  }
]
```

---

## 2️⃣ SSL/TLS Configuration

### Dashboard Steps

Navigate to: **SSL/TLS** → **Overview**

1. **Set Encryption Mode**: `Full (strict)` ✅
2. **Always Use HTTPS**: ON
3. **HTTP Strict Transport Security (HSTS)**:

   - Enable HSTS
   - Max Age: 12 months
   - Include subdomains: ON
   - Preload: ON
   - No-Sniff header: ON

4. **Minimum TLS Version**: TLS 1.2
5. **Opportunistic Encryption**: ON
6. **TLS 1.3**: Enabled

### Edge Certificates

Navigate to: **SSL/TLS** → **Edge Certificates**

- ✅ Always Use HTTPS
- ✅ Automatic HTTPS Rewrites
- ✅ Certificate Transparency Monitoring

### API Configuration (JSON)

```json
{
  "ssl": {
    "value": "strict"
  },
  "always_use_https": {
    "value": "on"
  },
  "security_header": {
    "strict_transport_security": {
      "enabled": true,
      "max_age": 31536000,
      "include_subdomains": true,
      "preload": true,
      "nosniff": true
    }
  },
  "min_tls_version": "1.2",
  "tls_1_3": "on",
  "opportunistic_encryption": "on"
}
```

---

## 3️⃣ Firewall & Security Rules

### WAF Custom Rules

Navigate to: **Security** → **WAF** → **Custom rules**

#### Rule 1: Block SQL Injection & XSS

```json
{
  "description": "Block SQL Injection and XSS attempts",
  "expression": "(http.request.uri.path contains \"union\" and http.request.uri.path contains \"select\") or (http.request.uri.path contains \"<script\") or (http.request.uri.path contains \"javascript:\") or (http.request.uri.path contains \"onerror=\")",
  "action": "block",
  "enabled": true,
  "priority": 1
}
```

#### Rule 2: Rate Limit Authentication Endpoints

```json
{
  "description": "Rate limit auth endpoints - 10 req/min per IP",
  "expression": "(http.request.uri.path contains \"/api/auth/login\" or http.request.uri.path contains \"/api/auth/register\") and (rate_limit(ip.src, 10, 60s) > 10)",
  "action": "block",
  "enabled": true,
  "priority": 2
}
```

#### Rule 3: Rate Limit Admin Endpoints

```json
{
  "description": "Strict rate limit for admin - 5 req/min",
  "expression": "(http.request.uri.path contains \"/api/admin\") and (rate_limit(ip.src, 5, 60s) > 5)",
  "action": "challenge",
  "enabled": true,
  "priority": 3
}
```

#### Rule 4: Geo-Blocking (Optional)

```json
{
  "description": "Block countries with high fraud (adjust as needed)",
  "expression": "(ip.geoip.country in {\"XX\" \"YY\"})",
  "action": "block",
  "enabled": false,
  "priority": 4
}
```

#### Rule 5: Block Known Bad Bots

```json
{
  "description": "Block malicious bots and scrapers",
  "expression": "(cf.client.bot) or (http.user_agent contains \"sqlmap\") or (http.user_agent contains \"nikto\") or (http.user_agent contains \"masscan\")",
  "action": "block",
  "enabled": true,
  "priority": 5
}
```

### Managed Rules

Navigate to: **Security** → **WAF** → **Managed rules**

- ✅ Enable: **Cloudflare Managed Ruleset**
- ✅ Enable: **Cloudflare OWASP Core Ruleset**
- Sensitivity: Medium

### Bot Fight Mode

Navigate to: **Security** → **Bots**

- ✅ Enable Bot Fight Mode (Free plan)
- OR: Super Bot Fight Mode (Paid plan)

### Security Level

Navigate to: **Security** → **Settings**

- Set to: **High** (challenges suspicious visitors)

---

## 4️⃣ Caching & CDN Configuration

### Page Rules

Navigate to: **Rules** → **Page Rules** → **Create Page Rule**

#### Page Rule 1: Bypass API Cache

```yaml
URL Pattern: api.advancia.app/api/*
Settings:
  - Cache Level: Bypass
  - Disable Performance
```

#### Page Rule 2: Cache Static Assets

```yaml
URL Pattern: advancia.app/*.{js,css,jpg,jpeg,png,gif,svg,ico,woff,woff2,ttf,eot}
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 4 hours
```

#### Page Rule 3: Cache Frontend Pages

```yaml
URL Pattern: advancia.app/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 30 minutes
  - Browser Cache TTL: 10 minutes
```

### Cache Rules (New Approach)

Navigate to: **Caching** → **Cache Rules**

```json
[
  {
    "description": "Bypass cache for API",
    "expression": "(http.host eq \"api.advancia.app\")",
    "action": "bypass",
    "enabled": true
  },
  {
    "description": "Cache static assets",
    "expression": "(http.request.uri.path matches \"\\.(js|css|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$\")",
    "action": "cache",
    "cache_ttl": 2592000,
    "enabled": true
  },
  {
    "description": "Cache HTML pages",
    "expression": "(http.request.uri.path matches \"\\.(html|htm)$\")",
    "action": "cache",
    "cache_ttl": 1800,
    "enabled": true
  }
]
```

### Speed Settings

Navigate to: **Speed** → **Optimization**

- ✅ **Auto Minify**: JS, CSS, HTML
- ✅ **Brotli Compression**: ON
- ✅ **Early Hints**: ON
- ✅ **Rocket Loader**: OFF (conflicts with Next.js)
- ✅ **Mirage**: ON (image optimization)
- ✅ **Polish**: Lossless (or Lossy for better compression)

---

## 5️⃣ Email Routing Configuration

### Enable Email Routing

Navigate to: **Email** → **Email Routing** → **Get started**

1. Click "Enable Email Routing"
2. Add destination email (your personal/business email)
3. Verify destination by clicking link in email

### Create Custom Addresses

```json
[
  {
    "address": "support@advancia.app",
    "destination": "your-email@gmail.com",
    "enabled": true
  },
  {
    "address": "admin@advancia.app",
    "destination": "your-email@gmail.com",
    "enabled": true
  },
  {
    "address": "noreply@advancia.app",
    "destination": "your-email@gmail.com",
    "enabled": true
  },
  {
    "address": "billing@advancia.app",
    "destination": "your-email@gmail.com",
    "enabled": true
  }
]
```

### DNS Records for Sending Email (SMTP Provider)

If using SendGrid, Mailgun, or similar for sending:

**SPF Record**:

```
Type: TXT
Name: @
Content: v=spf1 include:sendgrid.net include:_spf.google.com ~all
```

**DKIM Records** (Get from your email provider):

```
Type: TXT
Name: s1._domainkey
Content: k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA...
```

**DMARC Record**:

```CLOUDFLARE_API_TOKEN=your_custom_token_here
CLOUDFLARE_ZONE_ID=your_zone_id_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:admin@advancia.app
```

---

## 6️⃣ Cloudflare Workers (API Proxy)

### Worker Script: API Gateway with Security Headers

Navigate to: **Workers & Pages** → **Create Worker**

**Worker Name**: `advancia-api-gateway`

```javascript
// Cloudflare Worker - API Gateway for Advancia Pay Ledger
// Proxies api.advancia.app/* to backend.render.com
// Adds security headers and rate limiting

const BACKEND_ORIGIN = "https://advancia-backend.onrender.com";
const ALLOWED_ORIGINS = [
  "https://advancia.app",
  "https://www.advancia.app",
  "https://admin.advancia.app",
];

// Rate limiting using KV namespace (optional, requires KV setup)
const RATE_LIMIT = 100; // requests per minute
const RATE_WINDOW = 60; // seconds

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Security: Block requests without proper origin
  const origin = request.headers.get("Origin");
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return new Response("Forbidden: Invalid origin", { status: 403 });
  }

  // Rate limiting by IP (basic implementation)
  const clientIP = request.headers.get("CF-Connecting-IP");
  const rateLimitKey = `ratelimit:${clientIP}`;

  // Skip rate limit check for now (requires KV namespace)
  // In production, use: await checkRateLimit(rateLimitKey);

  // Rewrite URL to backend origin
  const backendUrl = new URL(url.pathname + url.search, BACKEND_ORIGIN);

  // Clone request and update headers
  const modifiedRequest = new Request(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: "follow",
  });

  // Add custom headers
  modifiedRequest.headers.set("X-Forwarded-Host", url.hostname);
  modifiedRequest.headers.set("X-Real-IP", clientIP);
  modifiedRequest.headers.set("X-Cloudflare-Worker", "advancia-api-gateway");

  try {
    // Fetch from backend
    const response = await fetch(modifiedRequest);

    // Clone response to modify headers
    const modifiedResponse = new Response(response.body, response);

    // Add security headers
    modifiedResponse.headers.set("X-Content-Type-Options", "nosniff");
    modifiedResponse.headers.set("X-Frame-Options", "DENY");
    modifiedResponse.headers.set("X-XSS-Protection", "1; mode=block");
    modifiedResponse.headers.set(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );
    modifiedResponse.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );

    // CORS headers
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      modifiedResponse.headers.set("Access-Control-Allow-Origin", origin);
      modifiedResponse.headers.set("Access-Control-Allow-Credentials", "true");
      modifiedResponse.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      modifiedResponse.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-API-Key, X-Admin-Key"
      );
    }

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: modifiedResponse.headers,
      });
    }

    return modifiedResponse;
  } catch (error) {
    console.error("Worker error:", error);
    return new Response("Service temporarily unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain",
        "Retry-After": "60",
      },
    });
  }
}

// Rate limiting helper (requires KV namespace)
async function checkRateLimit(key) {
  // Implement using Workers KV:
  // const count = await RATELIMIT_KV.get(key);
  // if (count && parseInt(count) > RATE_LIMIT) {
  //   throw new Error('Rate limit exceeded');
  // }
  // await RATELIMIT_KV.put(key, (parseInt(count) || 0) + 1, { expirationTtl: RATE_WINDOW });
}
```

### Deploy Worker

1. Click "Deploy"
2. Navigate to **Triggers** → **Add route**
3. Route: `api.advancia.app/*`
4. Zone: `advancia.app`

---

## 7️⃣ Performance & Monitoring

### Auto Minify

Navigate to: **Speed** → **Optimization**

- ✅ JavaScript
- ✅ CSS
- ✅ HTML

### Rocket Loader

- ⚠️ **Keep OFF for Next.js** (causes hydration issues)

### Web Analytics

Navigate to: **Analytics & Logs** → **Web Analytics**

1. Click "Enable Web Analytics"
2. Copy the beacon script
3. Add to `frontend/src/app/layout.tsx`:

```tsx
<Script
  src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'
  strategy="afterInteractive"
/>
```

### Performance Monitoring

Navigate to: **Speed** → **Observatory**

- Run regular speed tests
- Monitor Core Web Vitals
- Get recommendations

---

## 8️⃣ Automation - Terraform Configuration

Create: `.infrastructure/cloudflare/main.tf`

```hcl
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "domain" {
  description = "Root domain"
  type        = string
  default     = "advancia.app"
}

variable "backend_origin" {
  description = "Backend server origin"
  type        = string
  default     = "advancia-backend.onrender.com"
}

variable "frontend_origin" {
  description = "Frontend server origin"
  type        = string
  default     = "advancia-frontend.onrender.com"
}

# DNS Records
resource "cloudflare_record" "root" {
  zone_id = var.zone_id
  name    = "@"
  content = var.backend_origin
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Root domain to backend"
}

resource "cloudflare_record" "api" {
  zone_id = var.zone_id
  name    = "api"
  content = var.backend_origin
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "API subdomain"
}

resource "cloudflare_record" "www" {
  zone_id = var.zone_id
  name    = "www"
  content = var.frontend_origin
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "WWW subdomain"
}

resource "cloudflare_record" "admin" {
  zone_id = var.zone_id
  name    = "admin"
  content = var.frontend_origin
  type    = "CNAME"
  proxied = true
  ttl     = 1
  comment = "Admin dashboard"
}

# SSL Settings
resource "cloudflare_zone_settings_override" "ssl_settings" {
  zone_id = var.zone_id

  settings {
    ssl                      = "strict"
    always_use_https         = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
    automatic_https_rewrites = "on"
    opportunistic_encryption = "on"
  }
}

# Page Rules
resource "cloudflare_page_rule" "api_bypass_cache" {
  zone_id  = var.zone_id
  target   = "api.${var.domain}/api/*"
  priority = 1

  actions {
    cache_level = "bypass"
  }
}

resource "cloudflare_page_rule" "cache_static_assets" {
  zone_id  = var.zone_id
  target   = "${var.domain}/*.(js|css|jpg|jpeg|png|gif|svg|ico|woff|woff2)"
  priority = 2

  actions {
    cache_level         = "cache_everything"
    edge_cache_ttl      = 2592000
    browser_cache_ttl   = 14400
  }
}

# WAF Rules
resource "cloudflare_ruleset" "waf_custom" {
  zone_id     = var.zone_id
  name        = "Advancia WAF Rules"
  description = "Custom WAF rules for Advancia Pay Ledger"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    action      = "block"
    expression  = "(http.request.uri.path contains \"union\" and http.request.uri.path contains \"select\") or (http.request.uri.path contains \"<script\")"
    description = "Block SQL injection and XSS"
    enabled     = true
  }

  rules {
    action      = "block"
    expression  = "(http.request.uri.path contains \"/api/auth\") and (rate(ip.src, 10, 60s) > 10)"
    description = "Rate limit auth endpoints"
    enabled     = true
  }
}

# Worker Script
resource "cloudflare_worker_script" "api_gateway" {
  name    = "advancia-api-gateway"
  content = file("${path.module}/workers/api-gateway.js")
}

resource "cloudflare_worker_route" "api_route" {
  zone_id     = var.zone_id
  pattern     = "api.${var.domain}/*"
  script_name = cloudflare_worker_script.api_gateway.name
}

# Outputs
output "zone_id" {
  value = var.zone_id
}

output "nameservers" {
  value = data.cloudflare_zone.main.name_servers
}

data "cloudflare_zone" "main" {
  zone_id = var.zone_id
}
```

Create: `.infrastructure/cloudflare/variables.tfvars`

```hcl
zone_id           = "YOUR_ZONE_ID_HERE"
domain            = "advancia.app"
backend_origin    = "advancia-backend.onrender.com"
frontend_origin   = "advancia-frontend.onrender.com"
```

---

## 8️⃣ Automation - GitHub Actions Workflow

Create: `.github/workflows/cloudflare-setup.yml`

```yaml
name: Cloudflare Setup Automation
on:
  workflow_dispatch:
    inputs:
      action:
        description: "Action to perform"
        required: true
        default: "setup-dns"
        type: choice
        options:
          - setup-dns
          - setup-ssl
          - setup-waf
          - setup-all
  push:
    branches:
      - main
    paths:
      - ".infrastructure/cloudflare/**"

env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  ZONE_ID: ${{ secrets.CLOUDFLARE_ZONE_ID }}
  DOMAIN: advancia.app
  BACKEND_ORIGIN: advancia-backend.onrender.com
  FRONTEND_ORIGIN: advancia-frontend.onrender.com

jobs:
  setup-cloudflare:
    runs-on: ubuntu-latest
    name: Configure Cloudflare

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y curl jq

      - name: Setup DNS Records
        if: github.event.inputs.action == 'setup-dns' || github.event.inputs.action == 'setup-all'
        run: |
          echo "🧩 Creating DNS Records..."

          # Root domain (A record or CNAME)
          curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
              "type":"CNAME",
              "name":"@",
              "content":"'$BACKEND_ORIGIN'",
              "proxied":true,
              "ttl":1,
              "comment":"Root domain"
            }'

          # API subdomain
          curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
              "type":"CNAME",
              "name":"api",
              "content":"'$BACKEND_ORIGIN'",
              "proxied":true,
              "ttl":1,
              "comment":"API subdomain"
            }'

          # WWW subdomain
          curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
              "type":"CNAME",
              "name":"www",
              "content":"'$FRONTEND_ORIGIN'",
              "proxied":true,
              "ttl":1,
              "comment":"WWW subdomain"
            }'

          # Admin subdomain
          curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
              "type":"CNAME",
              "name":"admin",
              "content":"'$FRONTEND_ORIGIN'",
              "proxied":true,
              "ttl":1,
              "comment":"Admin dashboard"
            }'

          echo "✅ DNS records created"

      - name: Configure SSL/TLS
        if: github.event.inputs.action == 'setup-ssl' || github.event.inputs.action == 'setup-all'
        run: |
          echo "🔒 Configuring SSL/TLS..."

          # Set SSL mode to Full (strict)
          curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"value":"strict"}'

          # Enable Always Use HTTPS
          curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/always_use_https" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"value":"on"}'

          # Enable Automatic HTTPS Rewrites
          curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/automatic_https_rewrites" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"value":"on"}'

          # Set minimum TLS version
          curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/min_tls_version" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"value":"1.2"}'

          echo "✅ SSL/TLS configured"

      - name: Setup WAF Rules
        if: github.event.inputs.action == 'setup-waf' || github.event.inputs.action == 'setup-all'
        run: |
          echo "🛡️ Creating WAF rules..."

          # Create ruleset for custom WAF rules
          curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/rulesets" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{
              "name": "Advancia Custom WAF",
              "description": "Custom security rules for Advancia",
              "kind": "zone",
              "phase": "http_request_firewall_custom",
              "rules": [
                {
                  "action": "block",
                  "expression": "(http.request.uri.path contains \"union\" and http.request.uri.path contains \"select\") or (http.request.uri.path contains \"<script\")",
                  "description": "Block SQL injection and XSS",
                  "enabled": true
                },
                {
                  "action": "challenge",
                  "expression": "http.request.uri.path contains \"/api/admin\"",
                  "description": "Challenge admin requests",
                  "enabled": true
                }
              ]
            }'

          echo "✅ WAF rules created"

      - name: Enable Performance Features
        if: github.event.inputs.action == 'setup-all'
        run: |
          echo "⚡ Enabling performance features..."

          # Enable Brotli
          curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/brotli" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"value":"on"}'

          # Enable Auto Minify
          curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/minify" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"value":{"css":"on","html":"on","js":"on"}}'

          echo "✅ Performance features enabled"

      - name: Summary
        run: |
          echo "🎉 Cloudflare setup completed!"
          echo "Domain: $DOMAIN"
          echo "Zone ID: $ZONE_ID"
          echo ""
          echo "Next steps:"
          echo "1. Verify DNS propagation: https://dnschecker.org"
          echo "2. Test SSL: https://www.ssllabs.com/ssltest/"
          echo "3. Check Cloudflare Analytics dashboard"
```

---

## 📝 GitHub Secrets to Add

Navigate to: **Repository Settings** → **Secrets and variables** → **Actions**

Add these secrets:

```yaml
CLOUDFLARE_API_TOKEN: "YOUR_API_TOKEN_HERE"
CLOUDFLARE_ZONE_ID: "YOUR_ZONE_ID_HERE"
```

To get API Token:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use template: "Edit zone DNS"
4. Select your zone: advancia.app
5. Copy token and add to GitHub Secrets

To get Zone ID:

1. Go to Cloudflare dashboard
2. Select your domain
3. Scroll down in Overview tab
4. Copy "Zone ID" on the right sidebar

---

## ✅ Manual Verification Checklist

After automation completes:

- [ ] **DNS Propagation**: Check https://dnschecker.org for `advancia.app`
- [ ] **SSL Certificate**: Verify at https://www.ssllabs.com/ssltest/
- [ ] **HTTPS Redirect**: Visit `http://advancia.app` → should redirect to `https://`
- [ ] **API Endpoint**: Test `https://api.advancia.app/api/health`
- [ ] **WWW Redirect**: `https://www.advancia.app` should work
- [ ] **Admin Access**: `https://admin.advancia.app` should load
- [ ] **Email Routing**: Send test email to `support@advancia.app`
- [ ] **WAF Rules**: Check Security Events in dashboard
- [ ] **Analytics**: Verify traffic appears in Analytics tab
- [ ] **Performance**: Run Lighthouse test on frontend

---

## 🔧 Troubleshooting

### DNS not propagating

- Wait 24-48 hours for full propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Check nameservers point to Cloudflare

### SSL errors

- Ensure backend has valid SSL certificate
- Check SSL mode is "Full (strict)"
- Verify backend accepts HTTPS connections

### API CORS errors

- Add origin to backend CORS whitelist
- Verify Worker script CORS headers
- Check browser console for specific error

### Rate limiting issues

- Adjust rate limit thresholds in WAF rules
- Whitelist your IP for testing
- Check Security Events log

---

## 📚 Additional Resources

- [Cloudflare API Docs](https://developers.cloudflare.com/api/)
- [Terraform Cloudflare Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Email Routing Guide](https://developers.cloudflare.com/email-routing/)

---

**Setup Complete! 🚀** Your Advancia Pay Ledger is now protected and accelerated by Cloudflare.

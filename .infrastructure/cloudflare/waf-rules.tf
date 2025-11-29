# Cloudflare Configuration

## WAF Rules (Managed via Terraform or Dashboard)

resource "cloudflare_ruleset" "advancia_waf" {
  zone_id     = var.cloudflare_zone_id
  name        = "Advancia Security Ruleset"
  description = "Custom WAF rules for Advancia Pay Ledger"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  # Block known bad bots
  rules {
    action      = "block"
    expression  = "(cf.client.bot) or (cf.threat_score gt 30)"
    description = "Block malicious bots and high threat scores"
    enabled     = true
  }

  # Rate limit login attempts
  rules {
    action      = "block"
    expression  = <<-EOT
      (http.request.uri.path contains "/api/auth/login" or
       http.request.uri.path contains "/api/auth/admin-login") and
      cf.edge.server_port eq 443 and
      rate(2m) > 10
    EOT
    description = "Rate limit authentication endpoints"
    enabled     = true
  }

  # Block SQL injection patterns
  rules {
    action      = "block"
    expression  = <<-EOT
      (http.request.uri.query contains "UNION" and
       http.request.uri.query contains "SELECT") or
      (http.request.body.raw contains "' OR '1'='1") or
      (http.request.body.raw contains "; DROP TABLE")
    EOT
    description = "Block SQL injection attempts"
    enabled     = true
  }

  # Block XSS patterns
  rules {
    action      = "block"
    expression  = <<-EOT
      (http.request.uri.query contains "<script") or
      (http.request.body.raw contains "<script") or
      (http.request.uri.query contains "javascript:")
    EOT
    description = "Block XSS attempts"
    enabled     = true
  }

  # Protect admin routes
  rules {
    action      = "challenge"
    expression  = <<-EOT
      (http.request.uri.path contains "/admin" or
       http.request.uri.path contains "/api/admin") and
      not ip.src in $trusted_admin_ips
    EOT
    description = "Challenge requests to admin endpoints"
    enabled     = true
  }

  # Block cryptocurrency scam domains
  rules {
    action      = "block"
    expression  = <<-EOT
      (http.referer contains "fake-crypto") or
      (http.referer contains "scam") or
      (http.user_agent contains "cryptominer")
    EOT
    description = "Block known scam referrers"
    enabled     = true
  }

  # Geographic restrictions (optional)
  rules {
    action      = "block"
    expression  = "ip.geoip.country in {\"KP\" \"RU\" \"IR\"}"
    description = "Block sanctioned countries"
    enabled     = var.enable_geo_blocking
  }

  # API abuse protection
  rules {
    action      = "challenge"
    expression  = <<-EOT
      (http.request.uri.path contains "/api/") and
      (not http.request.headers["authorization"] contains "Bearer") and
      (not http.request.uri.path contains "/api/auth/") and
      (not http.request.uri.path contains "/api/health")
    EOT
    description = "Challenge unauthenticated API requests"
    enabled     = true
  }
}

# DDoS Protection Settings
resource "cloudflare_zone_settings_override" "advancia" {
  zone_id = var.cloudflare_zone_id

  settings {
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    browser_check           = "on"
    cache_level             = "aggressive"
    challenge_ttl           = 1800
    development_mode        = "off"
    email_obfuscation       = "on"
    hotlink_protection      = "on"
    ip_geolocation          = "on"
    min_tls_version         = "1.2"
    opportunistic_encryption = "on"
    security_level          = "high"
    server_side_exclude     = "on"
    ssl                     = "strict"
    tls_1_3                 = "zrt"
    waf                     = "on"
    websockets              = "on"
  }
}

# Rate Limiting Rules
resource "cloudflare_rate_limit" "api_rate_limit" {
  zone_id   = var.cloudflare_zone_id
  threshold = 100
  period    = 60
  match {
    request {
      url_pattern = "*advancia.app/api/*"
      schemes     = ["HTTPS"]
      methods     = ["GET", "POST", "PUT", "DELETE", "PATCH"]
    }
    response {
      statuses       = [200, 201, 202, 301, 429]
      origin_traffic = true
    }
  }
  action {
    mode    = "simulate" # Change to "ban" in production
    timeout = 3600
    response {
      content_type = "application/json"
      body         = "{\"error\":\"Rate limit exceeded\",\"retry_after\":3600}"
    }
  }
  disabled    = false
  description = "API rate limiting - 100 requests per minute"
}

# Page Rules for Caching
resource "cloudflare_page_rule" "static_assets" {
  zone_id  = var.cloudflare_zone_id
  target   = "advancia.app/_next/static/*"
  priority = 1

  actions {
    cache_level       = "cache_everything"
    edge_cache_ttl    = 2678400 # 31 days
    browser_cache_ttl = 2678400
  }
}

resource "cloudflare_page_rule" "api_no_cache" {
  zone_id  = var.cloudflare_zone_id
  target   = "advancia.app/api/*"
  priority = 2

  actions {
    cache_level = "bypass"
    disable_apps = true
  }
}

# IP Access Rules for Trusted Admins
resource "cloudflare_ip_list" "trusted_admin_ips" {
  account_id  = var.cloudflare_account_id
  name        = "trusted_admin_ips"
  kind        = "ip"
  description = "Trusted IP addresses for admin access"

  item {
    value   = "YOUR_OFFICE_IP/32"
    comment = "Office IP"
  }
}

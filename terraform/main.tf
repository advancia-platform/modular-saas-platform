terraform {
  required_version = ">= 1.14.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "~> 1.22"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Backend configuration for state management
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Providers
provider "vercel" {
  api_token = var.vercel_api_token
  team      = var.vercel_team_id
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "postgresql" {
  host            = var.postgres_host
  port            = var.postgres_port
  database        = var.postgres_database
  username        = var.postgres_username
  password        = var.postgres_password
  sslmode         = var.postgres_sslmode
  connect_timeout = 15
}

# Random secrets generation
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = true
}

resource "random_password" "session_secret" {
  length  = 64
  special = true
}

resource "random_password" "otp_secret" {
  length  = 32
  special = false
}

resource "random_password" "wallet_encryption_key" {
  length  = 32
  special = false
}

# Vercel Project for Frontend
resource "vercel_project" "frontend" {
  name      = var.project_name
  framework = "nextjs"

  git_repository = {
    type              = "github"
    repo              = var.github_repo
    production_branch = "main"
  }

  build_command    = "cd frontend && npm install && npm run build"
  output_directory = "frontend/.next"
  install_command  = "echo 'Skipping root install'"

  environment = [
    {
      key    = "NEXT_PUBLIC_API_URL"
      value  = "https://${var.backend_domain}/api"
      target = ["production", "preview"]
    },
    {
      key    = "NEXT_PUBLIC_FRONTEND_URL"
      value  = "https://${var.frontend_domain}"
      target = ["production"]
    },
    {
      key    = "NEXT_TELEMETRY_DISABLED"
      value  = "1"
      target = ["production", "preview", "development"]
    }
  ]
}

# Vercel Domain Configuration
resource "vercel_project_domain" "frontend_domain" {
  project_id = vercel_project.frontend.id
  domain     = var.frontend_domain
}

# Cloudflare Zone for DNS
data "cloudflare_zone" "main" {
  name = var.cloudflare_zone
}

# Cloudflare DNS Records
resource "cloudflare_record" "frontend" {
  zone_id = data.cloudflare_zone.main.id
  name    = var.frontend_subdomain
  content = "cname.vercel-dns.com"
  type    = "CNAME"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "backend" {
  zone_id = data.cloudflare_zone.main.id
  name    = var.backend_subdomain
  content = var.render_backend_ip
  type    = "A"
  proxied = true
  ttl     = 1
}

# Cloudflare Email Routing Configuration
resource "cloudflare_email_routing_settings" "email_routing" {
  zone_id = data.cloudflare_zone.main.id
  enabled = true
}

# MX Records for Cloudflare Email Routing
resource "cloudflare_record" "mx_1" {
  zone_id  = data.cloudflare_zone.main.id
  name     = var.frontend_subdomain
  content  = "mx1.email.cloudflare.net"
  type     = "MX"
  priority = 10
  ttl      = 300
}

resource "cloudflare_record" "mx_2" {
  zone_id  = data.cloudflare_zone.main.id
  name     = var.frontend_subdomain
  content  = "mx2.email.cloudflare.net"
  type     = "MX"
  priority = 20
  ttl      = 300
}

# TXT Record for SPF (Cloudflare Email Routing)
resource "cloudflare_record" "spf" {
  zone_id = data.cloudflare_zone.main.id
  name    = var.frontend_subdomain
  content = "v=spf1 include:_spf.mx.cloudflare.net ~all"
  type    = "TXT"
  ttl     = 300
}

# Cloudflare Email Routing Rule
resource "cloudflare_email_routing_rule" "catch_all" {
  zone_id = data.cloudflare_zone.main.id
  name    = "Resend Catch-All"
  enabled = true

  matcher {
    type = "all"
  }

  action {
    type  = "forward"
    value = [var.resend_domain]
  }
}
resource "cloudflare_ruleset" "waf_custom_rules" {
  zone_id = data.cloudflare_zone.main.id
  name    = "WAF Custom Rules - ${var.project_name}"
  kind    = "zone"
  phase   = "http_request_firewall_custom"

  rules {
    action      = "block"
    description = "Block common SQL injection attempts"
    enabled     = true
    expression  = "(http.request.uri.query contains \"' OR '1'='1\" or http.request.uri.query contains \"UNION SELECT\")"
  }

  rules {
    action      = "challenge"
    description = "Challenge suspicious user agents"
    enabled     = true
    expression  = "(http.user_agent contains \"sqlmap\" or http.user_agent contains \"nikto\")"
  }

  rules {
    action      = "block"
    description = "Rate limit API endpoints"
    enabled     = true
    expression  = "(http.request.uri.path contains \"/api/\" and rate(http.request.uri.path, 1m) > 100)"
  }
}

# Cloudflare Page Rules
resource "cloudflare_page_rule" "cache_static_assets" {
  zone_id  = data.cloudflare_zone.main.id
  target   = "*.${var.frontend_domain}/static/*"
  priority = 1

  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 31536000 # 1 year
  }
}

resource "cloudflare_page_rule" "api_no_cache" {
  zone_id  = data.cloudflare_zone.main.id
  target   = "${var.backend_domain}/api/*"
  priority = 2

  actions {
    cache_level = "bypass"
  }
}

# PostgreSQL Database Resources
resource "postgresql_database" "advancia" {
  name              = var.postgres_database
  owner             = var.postgres_username
  template          = "template0"
  lc_collate        = "en_US.UTF-8"
  connection_limit  = -1
  allow_connections = true
}

# PostgreSQL Extensions
resource "postgresql_extension" "uuid_ossp" {
  name     = "uuid-ossp"
  database = postgresql_database.advancia.name
}

resource "postgresql_extension" "pgcrypto" {
  name     = "pgcrypto"
  database = postgresql_database.advancia.name
}

# Outputs
output "vercel_project_id" {
  value       = vercel_project.frontend.id
  description = "Vercel project ID"
}

output "vercel_project_url" {
  value       = "https://${var.frontend_domain}"
  description = "Frontend URL"
}

output "cloudflare_zone_id" {
  value       = data.cloudflare_zone.main.id
  description = "Cloudflare Zone ID"
}

output "jwt_secret" {
  value       = random_password.jwt_secret.result
  description = "Generated JWT secret"
  sensitive   = true
}

output "jwt_refresh_secret" {
  value       = random_password.jwt_refresh_secret.result
  description = "Generated JWT refresh secret"
  sensitive   = true
}

output "session_secret" {
  value       = random_password.session_secret.result
  description = "Generated session secret"
  sensitive   = true
}

output "otp_secret" {
  value       = random_password.otp_secret.result
  description = "Generated OTP secret"
  sensitive   = true
}

output "wallet_encryption_key" {
  value       = random_password.wallet_encryption_key.result
  description = "Generated wallet encryption key"
  sensitive   = true
}

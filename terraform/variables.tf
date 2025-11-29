# Project Configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "advancia-pay-ledger"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

# GitHub Repository
variable "github_repo" {
  description = "GitHub repository in format owner/repo"
  type        = string
  default     = "muchaeljohn739337-cloud/-modular-saas-platform"
}

# Vercel Configuration
variable "vercel_api_token" {
  description = "Vercel API token for authentication"
  type        = string
  sensitive   = true
}

variable "vercel_team_id" {
  description = "Vercel team ID (optional)"
  type        = string
  default     = null
}

# Domain Configuration
variable "frontend_domain" {
  description = "Frontend domain name"
  type        = string
  default     = "advanciapayledger.com"
}

variable "backend_domain" {
  description = "Backend API domain name"
  type        = string
  default     = "api.advanciapayledger.com"
}

variable "frontend_subdomain" {
  description = "Frontend subdomain (use @ for root domain)"
  type        = string
  default     = "@"
}

variable "backend_subdomain" {
  description = "Backend API subdomain"
  type        = string
  default     = "api"
}

# Cloudflare Configuration
variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone" {
  description = "Cloudflare zone name (domain)"
  type        = string
  default     = "advanciapayledger.com"
}

# Render Backend Configuration
variable "render_backend_ip" {
  description = "Render backend service IP address"
  type        = string
  default     = "1.1.1.1" # Replace with actual Render IP
}

# PostgreSQL Configuration
variable "postgres_host" {
  description = "PostgreSQL host address"
  type        = string
  default     = "localhost"
}

variable "postgres_port" {
  description = "PostgreSQL port"
  type        = number
  default     = 5432
}

variable "postgres_database" {
  description = "PostgreSQL database name"
  type        = string
  default     = "advancia"
}

variable "postgres_username" {
  description = "PostgreSQL username"
  type        = string
  sensitive   = true
}

variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "postgres_sslmode" {
  description = "PostgreSQL SSL mode"
  type        = string
  default     = "require"
}

# Application Secrets (if not using random generation)
variable "jwt_secret" {
  description = "JWT secret key (leave empty to generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "cryptomus_api_key" {
  description = "Cryptomus API key"
  type        = string
  sensitive   = true
}

variable "cryptomus_merchant_id" {
  description = "Cryptomus merchant ID"
  type        = string
  sensitive   = true
}

variable "email_user" {
  description = "SMTP email username"
  type        = string
  sensitive   = true
}

variable "email_password" {
  description = "SMTP email password"
  type        = string
  sensitive   = true
}

variable "smtp_host" {
  description = "SMTP host"
  type        = string
  default     = "smtp.gmail.com"
}

variable "smtp_port" {
  description = "SMTP port"
  type        = number
  default     = 587
}

# Monitoring Configuration
variable "sentry_dsn" {
  description = "Sentry DSN for error tracking"
  type        = string
  default     = ""
  sensitive   = true
}

# Email Configuration
variable "resend_domain" {
  description = "Resend domain for email routing (e.g., yourdomain@resend.dev)"
  type        = string
  default     = "advancia@resend.dev" # Replace with your actual Resend domain
}

# Rate Limiting
variable "api_rate_limit" {
  description = "API rate limit per minute"
  type        = number
  default     = 100
}

# Resource Scaling
variable "backend_instance_count" {
  description = "Number of backend instances"
  type        = number
  default     = 2
}

variable "postgres_max_connections" {
  description = "PostgreSQL max connections"
  type        = number
  default     = 100
}

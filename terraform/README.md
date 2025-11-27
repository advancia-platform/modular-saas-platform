# Terraform IaC for Advancia Pay Ledger

This directory contains Terraform configuration for managing infrastructure as code (IaC) for the Advancia Pay Ledger platform.

## 🏗️ Infrastructure Components

- **Vercel**: Frontend Next.js deployment
- **Cloudflare**: DNS, CDN, WAF, and DDoS protection
- **PostgreSQL**: Database configuration and extensions
- **Security**: Auto-generated secrets for JWT, sessions, encryption

## 📋 Prerequisites

1. **Terraform**: v1.14.0 or later (already installed)
2. **Accounts Required**:
   - Vercel account with API token
   - Cloudflare account with API token
   - PostgreSQL database (Render or local)
   - Stripe account (for payments)
   - Cryptomus account (for crypto payments)

## 🚀 Quick Start

### 1. Configure Variables

```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your actual values
notepad terraform.tfvars
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

This will:

- Download required providers (Vercel, Cloudflare, PostgreSQL)
- Initialize the backend state file
- Prepare the working directory

### 3. Review the Plan

```bash
terraform plan
```

Review all changes that will be made to your infrastructure.

### 4. Apply Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm the changes.

## 📁 File Structure

```
terraform/
├── main.tf                    # Main infrastructure configuration
├── variables.tf               # Variable definitions
├── terraform.tfvars.example   # Example values (commit-safe)
├── terraform.tfvars           # Actual values (DO NOT COMMIT)
├── terraform.tfstate          # State file (auto-generated)
└── README.md                  # This file
```

## 🔐 Security Best Practices

### Secrets Management

**NEVER commit these files:**

- `terraform.tfvars` - Contains sensitive credentials
- `terraform.tfstate` - May contain sensitive data
- `*.backup` - Backup state files

**Already in .gitignore:**

```gitignore
terraform/terraform.tfvars
terraform/*.tfstate
terraform/*.tfstate.backup
terraform/.terraform/
```

### Generated Secrets

Terraform automatically generates secure secrets for:

- JWT signing keys (64 characters)
- JWT refresh tokens (64 characters)
- Session secrets (64 characters)
- OTP secrets (32 characters)
- Wallet encryption keys (32 characters)

View generated secrets:

```bash
terraform output jwt_secret
terraform output session_secret
```

## 🌐 Managed Resources

### Vercel Resources

- `vercel_project.frontend` - Next.js frontend project
- `vercel_project_domain.frontend_domain` - Custom domain configuration

### Cloudflare Resources

- `cloudflare_record.frontend` - DNS A record for frontend
- `cloudflare_record.backend` - DNS A record for API
- `cloudflare_ruleset.waf_custom_rules` - WAF security rules
- `cloudflare_page_rule.cache_static_assets` - CDN caching
- `cloudflare_page_rule.api_no_cache` - API cache bypass

### PostgreSQL Resources

- `postgresql_database.advancia` - Main database
- `postgresql_extension.uuid_ossp` - UUID generation
- `postgresql_extension.pgcrypto` - Cryptographic functions

### Security Resources

- `random_password.*` - Auto-generated secure secrets

## 📊 Common Commands

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Format configuration files
terraform fmt

# Preview changes
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# List all resources
terraform state list

# View specific output
terraform output vercel_project_url

# Destroy all resources (CAUTION!)
terraform destroy
```

## 🔄 Workflow

### Development Workflow

1. Make changes to `.tf` files
2. Run `terraform fmt` to format
3. Run `terraform validate` to check syntax
4. Run `terraform plan` to preview changes
5. Run `terraform apply` to deploy changes

### Production Deployment

1. Review changes in `terraform plan` output
2. Ensure all variables in `terraform.tfvars` are correct
3. Run `terraform apply` and review the plan again
4. Type `yes` to confirm deployment
5. Verify outputs and test deployed resources

## 🛠️ Troubleshooting

### Provider Authentication Issues

```bash
# Verify Vercel token
curl -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user

# Verify Cloudflare token
curl -H "Authorization: Bearer $CLOUDFLARE_TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify
```

### State Lock Issues

```bash
# Remove lock manually (use with caution)
rm -f .terraform.tflock.info
```

### Reset Terraform

```bash
# Remove all Terraform artifacts
rm -rf .terraform/
rm -f terraform.tfstate*
rm -f .terraform.lock.hcl

# Re-initialize
terraform init
```

## 📝 Environment Variables

Alternatively, you can use environment variables instead of `terraform.tfvars`:

```bash
# Vercel
export TF_VAR_vercel_api_token="your_token"

# Cloudflare
export TF_VAR_cloudflare_api_token="your_token"

# PostgreSQL
export TF_VAR_postgres_username="your_username"
export TF_VAR_postgres_password="your_password"

# Run Terraform
terraform plan
```

## 🔗 Useful Links

- [Terraform Documentation](https://www.terraform.io/docs)
- [Vercel Provider](https://registry.terraform.io/providers/vercel/vercel/latest/docs)
- [Cloudflare Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [PostgreSQL Provider](https://registry.terraform.io/providers/cyrilgdn/postgresql/latest/docs)

## ⚠️ Important Notes

1. **State File**: The `terraform.tfstate` file contains the current state of your infrastructure. Back it up regularly!

2. **Render Backend**: This configuration doesn't manage Render resources directly (Render doesn't have an official Terraform provider). Use `render.yaml` for Render deployments.

3. **Database Migrations**: Run Prisma migrations separately:

   ```bash
   cd ../backend
   npx prisma migrate deploy
   ```

4. **Environment Sync**: After applying Terraform, update backend environment variables in Render dashboard with generated secrets.

## 🎯 Next Steps

After running `terraform apply`:

1. Copy generated secrets to Render dashboard:

   ```bash
   terraform output jwt_secret
   terraform output session_secret
   # ... copy other secrets
   ```

2. Verify DNS propagation:

   ```bash
   nslookup advanciapayledger.com
   nslookup api.advanciapayledger.com
   ```

3. Test frontend deployment:

   ```bash
   curl https://advanciapayledger.com
   ```

4. Test backend API:

   ```bash
   curl https://api.advanciapayledger.com/api/health
   ```

## 📞 Support

For issues or questions:

- Check `terraform plan` output for errors
- Review Terraform logs with `TF_LOG=DEBUG`
- Consult provider documentation
- Review `../TROUBLESHOOTING.md` for platform-specific issues

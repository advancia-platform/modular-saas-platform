---
applyTo: "**"
description: Azure development and deployment instructions for Advancia Pay Ledger
---

# Azure Development & Deployment Instructions

## Project Context

This is a self-hosted SaaS fintech platform (Advancia Pay Ledger) with:

- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Frontend**: Next.js 14 (App Router) + Turbopack
- **Database**: PostgreSQL (via Prisma)
- **Hosting**: Render (backend) + Vercel (frontend) + Cloudflare (CDN/DNS)

## Azure Integration Points

### 1. Azure Cosmos DB (Alternative to PostgreSQL)

When migrating to Azure Cosmos DB for PostgreSQL:

```bash
# Connection string format for Azure Cosmos DB PostgreSQL
DATABASE_URL="postgresql://user:password@server.postgres.cosmos.azure.com:5432/database?sslmode=require"
```

**Best Practices**:

- Use Hierarchical Partition Keys for multi-tenant isolation (userId, tenantId)
- Model data to minimize cross-partition queries
- Enable connection pooling via PgBouncer

### 2. Azure Key Vault (Secrets Management)

Replace `.env` secrets with Azure Key Vault:

```typescript
// backend/src/config/azure-keyvault.ts
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const credential = new DefaultAzureCredential();
const vaultUrl = process.env.AZURE_KEYVAULT_URL;
const client = new SecretClient(vaultUrl, credential);

export async function getSecret(name: string): Promise<string> {
  const secret = await client.getSecret(name);
  return secret.value ?? "";
}
```

### 3. Azure Container Apps (Deployment)

For containerized deployment:

```yaml
# azure-container-apps.yaml
name: advancia-backend
properties:
  configuration:
    ingress:
      external: true
      targetPort: 4000
    secrets:
      - name: database-url
        value: ${DATABASE_URL}
  template:
    containers:
      - name: backend
        image: advancia/backend:latest
        resources:
          cpu: 0.5
          memory: 1Gi
        env:
          - name: DATABASE_URL
            secretRef: database-url
```

### 4. Azure Application Insights (Monitoring)

Add to backend:

```typescript
// backend/src/instrumentation.ts
import { useAzureMonitor } from "@azure/monitor-opentelemetry";

useAzureMonitor({
  azureMonitorExporterOptions: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
});
```

### 5. Azure Static Web Apps (Frontend Alternative)

For frontend deployment:

```yaml
# .github/workflows/azure-swa.yml
name: Deploy to Azure Static Web Apps
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_SWA_TOKEN }}
          app_location: "frontend"
          output_location: ".next"
```

## Environment Variables for Azure

Add these to your `.env.production`:

```dotenv
# Azure Cosmos DB PostgreSQL
DATABASE_URL="postgresql://..."

# Azure Key Vault
AZURE_KEYVAULT_URL="https://advancia-vault.vault.azure.net/"

# Azure Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=..."

# Azure Storage (for backups)
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_CONTAINER="backups"
```

## MCP Server Configuration

The project uses Model Context Protocol servers for AI-assisted development:

```json
// .vscode/mcp.json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "${env:DATABASE_URL}" }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${env:GITHUB_TOKEN}" }
    }
  }
}
```

## Critical Development Rules

1. **Prisma Client**: Always run `npx prisma generate` after schema changes
2. **Decimal Handling**: Use `serializeDecimal*()` helpers for financial data
3. **Auth Middleware**: Use `authenticateTokenWithSession` for new routes
4. **Socket.IO**: Emit events only after DB commits
5. **Secrets**: Never commit `.env` files; use Azure Key Vault in production

## Deployment Checklist

- [ ] Run `npm run check` (type-check + lint + test)
- [ ] Verify Prisma migrations: `npx prisma migrate deploy`
- [ ] Check environment variables in Azure portal
- [ ] Enable Application Insights for monitoring
- [ ] Configure Azure CDN for static assets
- [ ] Set up Azure Backup for database

## Terraform for Azure

```hcl
# terraform/azure.tf
provider "azurerm" {
  features {}
}

resource "azurerm_cosmosdb_postgresql_cluster" "main" {
  name                = "advancia-db"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"

  node_count          = 1
  coordinator_storage = 131072
  coordinator_vcore   = 2
}
```

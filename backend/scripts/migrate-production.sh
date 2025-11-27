#!/bin/bash
# Production database migration script

set -e  # Exit on error

echo "🚀 Running Production Database Migrations..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | xargs)
fi

# Verify DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    exit 1
fi

# Show connection info (masked password)
MASKED_URL=$(echo $DATABASE_URL | sed 's/:[^:@]*@/:***@/')
echo "📊 Database: $MASKED_URL"

# Run migrations
echo "📝 Applying Prisma migrations..."
npx prisma migrate deploy

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Verify connection
echo "✅ Testing database connection..."
node -e "
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.\$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    return prisma.\$disconnect();
  })
  .then(() => pool.end())
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  });
"

echo "✅ Migration complete!"

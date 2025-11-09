#!/bin/bash
# Reset Prisma migrations for PostgreSQL
rm -rf prisma/migrations
mkdir -p prisma/migrations

echo "Migrations reset for fresh PostgreSQL deployment"

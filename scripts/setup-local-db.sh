#!/usr/bin/env bash
set -euo pipefail

export PATH="/usr/local/opt/postgresql@16/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"

echo "Starting PostgreSQL..."
if command -v brew >/dev/null 2>&1; then
  brew services start postgresql@16 2>/dev/null || true
fi

sleep 2

echo "Creating database and user..."
psql postgres -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'helpdesk') THEN
    CREATE USER helpdesk WITH PASSWORD 'helpdesk' CREATEDB;
  END IF;
END
$$;
SELECT 'CREATE DATABASE helpdesk OWNER helpdesk'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'helpdesk')\gexec
GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk;
SQL

psql -d helpdesk -v ON_ERROR_STOP=1 <<'SQL'
GRANT ALL ON SCHEMA public TO helpdesk;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO helpdesk;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO helpdesk;
SQL

echo "Pushing Prisma schema..."
cd "$(dirname "$0")/../apps/api"
npx prisma db push
npx prisma generate

echo ""
echo "Local database ready at:"
echo "  postgresql://helpdesk:helpdesk@localhost:5432/helpdesk"
echo ""
echo "Data persists across restarts. Start the app with: npm run dev"

-- Run once on production if TeamsConnection is missing:
--   Render Shell:  npm run prisma:push --workspace=apps/api
-- Or paste this SQL in the Postgres console.

CREATE TABLE IF NOT EXISTS "TeamsConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamsUserId" TEXT,
    "teamsEmail" TEXT,
    "tenantId" TEXT,
    "tenantName" TEXT,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
    "preferences" JSONB,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeamsConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeamsConnection_userId_key" ON "TeamsConnection"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TeamsConnection_userId_fkey'
  ) THEN
    ALTER TABLE "TeamsConnection"
      ADD CONSTRAINT "TeamsConnection_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

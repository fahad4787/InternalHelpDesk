import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const logger = new Logger('EnsureTeamsConnectionTable');

let ensured = false;
let ensuring: Promise<void> | null = null;

export async function ensureTeamsConnectionTable(
  prisma: PrismaService,
): Promise<void> {
  if (ensured) return;
  if (ensuring) {
    await ensuring;
    return;
  }

  ensuring = (async () => {
    await prisma.$executeRawUnsafe(`
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TeamsConnection_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "TeamsConnection_userId_key"
      ON "TeamsConnection"("userId")
    `);
    await prisma.$executeRawUnsafe(`
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
    `);
    ensured = true;
    logger.log('TeamsConnection table is ready');
  })();

  try {
    await ensuring;
  } catch (error) {
    ensuring = null;
    logger.error('Failed to ensure TeamsConnection table', error);
    throw error;
  } finally {
    ensuring = null;
  }
}

import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const logger = new Logger('EnsureSalesforceConnectionTable');

let ensured = false;
let ensuring: Promise<void> | null = null;

export async function ensureSalesforceConnectionTable(
  prisma: PrismaService,
): Promise<void> {
  if (ensured) return;
  if (ensuring) {
    await ensuring;
    return;
  }

  ensuring = (async () => {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SalesforceConnection" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "salesforceUserId" TEXT,
        "salesforceEmail" TEXT,
        "instanceUrl" TEXT,
        "encryptedAccessToken" TEXT,
        "encryptedRefreshToken" TEXT,
        "tokenExpiresAt" TIMESTAMP(3),
        "status" "IntegrationStatus" NOT NULL DEFAULT 'NOT_CONNECTED',
        "preferences" JSONB,
        "lastSyncedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SalesforceConnection_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SalesforceConnection_userId_key"
      ON "SalesforceConnection"("userId")
    `);
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'SalesforceConnection_userId_fkey'
        ) THEN
          ALTER TABLE "SalesforceConnection"
            ADD CONSTRAINT "SalesforceConnection_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
    ensured = true;
    logger.log('SalesforceConnection table is ready');
  })();

  try {
    await ensuring;
  } catch (error) {
    ensuring = null;
    logger.error('Failed to ensure SalesforceConnection table', error);
    throw error;
  } finally {
    ensuring = null;
  }
}

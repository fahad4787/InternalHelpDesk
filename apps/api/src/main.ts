import tls from 'node:tls';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PrismaService } from './database/prisma.service';

try {
  tls.setDefaultCACertificates(tls.getCACertificates('system'));
} catch {}

async function connectDatabase(prisma: PrismaService) {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma.$connect();
      console.log('Database connected');
      await ensureTeamsConnectionTable(prisma);
      return;
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed`, error);
      if (attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

async function ensureTeamsConnectionTable(prisma: PrismaService) {
  try {
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
        "updatedAt" TIMESTAMP(3) NOT NULL,
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
  } catch (error) {
    console.error('Failed to ensure TeamsConnection table', error);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = Number(process.env.PORT ?? configService.get('PORT') ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:3000',
  );

  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://internal-help-desk-web-q2fw.vercel.app',
    ],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const server = app.getHttpAdapter();
  server.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Workhub API is running',
      data: { health: '/api/health' },
    });
  });

  const prisma = app.get(PrismaService);
  await connectDatabase(prisma);

  await app.listen(port, host);
  console.log(`API running on http://${host}:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});

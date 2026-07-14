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
      'https://internalhelpdesk.freelcloud.co',
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

  await app.listen(port, host);
  console.log(`API running on http://${host}:${port}/api`);

  await connectDatabase(app.get(PrismaService));
}

bootstrap().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});

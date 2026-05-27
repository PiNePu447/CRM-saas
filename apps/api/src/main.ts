import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from '@fastify/helmet';
import { AppModule } from './app/app.module';

function assertRequiredEnv(isProd: boolean) {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  if ((process.env.JWT_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  if ((process.env.JWT_REFRESH_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }
  if (isProd && !process.env.CORS_ORIGIN) {
    throw new Error('CORS_ORIGIN must be set in production to prevent open CORS');
  }
}

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';

  assertRequiredEnv(isProd);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: !isProd }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(helmet as any, {
    contentSecurityPolicy: isProd,
    crossOriginEmbedderPolicy: false,
  });

  const globalPrefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : 'http://localhost:4200',
    credentials: true,
  });

  if (!isProd) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('CRM API')
      .setDescription('CRM SaaS Multi-tenant REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document);
    Logger.log(`Swagger docs at http://localhost:${process.env.API_PORT ?? 3000}/${globalPrefix}/docs`);
  }

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  Logger.log(`Application running on http://localhost:${port}/${globalPrefix}`);
}

bootstrap();

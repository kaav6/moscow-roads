import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { RequestIdInterceptor } from './common/request-id.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const logger = new NestLogger('Bootstrap');

  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:9099').split(',').map(s => s.trim());
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.enableCors({ origin: corsOrigins, credentials: false });
  app.setGlobalPrefix('api/v1', { exclude: ['actuator/(.*)', 'api-docs', 'api-docs-json'] });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.useWebSocketAdapter(new WsAdapter(app));

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Moscow Roads API')
      .setDescription('ЦОДД traffic operator console API')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api-docs', app, doc);

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 8080);
  await app.listen(port, '0.0.0.0');
  logger.log(`Nest application successfully started on :${port}`);
  logger.log(`Swagger UI: http://localhost:${port}/api-docs`);
}

bootstrap().catch(err => {
  console.error('[bootstrap] failed', err);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import compression from 'compression';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './lib/all-exceptions.filter';
import { DevHttpLoggingInterceptor } from './lib/dev-http-logging.interceptor';
import { attachDevRuntimeMethodLogging } from './lib/dev-runtime-method-logger';
import { isDevLoggingEnabled } from './lib/dev-logging.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  app.use(compression());
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());
  app.enableCors({ origin: '*', credentials: true });
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  if (isDevLoggingEnabled()) {
    app.useGlobalInterceptors(new DevHttpLoggingInterceptor());
    attachDevRuntimeMethodLogging(app);
  }

  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true'
  ) {
    const config = new DocumentBuilder()
      .setTitle('Property Operations Platform')
      .setDescription('Basic auth + user API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('user')
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);
  }

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();

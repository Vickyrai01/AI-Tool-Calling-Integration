import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

    app.use(
    rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

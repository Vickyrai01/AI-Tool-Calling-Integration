import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser() as any);

  const frontendOrigins = [
    process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    /\.vercel\.app$/,
  ].filter(Boolean);

  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();

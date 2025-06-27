import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpStatus, ValidationPipe } from "@nestjs/common";
import { initializeTransactionalContext } from "typeorm-transactional";
import * as passport from 'passport';
import * as process from "node:process";

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe({
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
  }));

  app.enableCors({ origin: '*', methods: '*', allowedHeaders: '*' });
  app.use(passport.initialize());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    credentials: false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    origin: '*',
  });

  await app.listen(3000);
}
bootstrap();

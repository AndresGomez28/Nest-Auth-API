import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  app.setGlobalPrefix('v1/')
  await app.listen(port);
  console.log(`server listening at http://localhost:${port}`);
}
bootstrap();

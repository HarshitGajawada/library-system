import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Library API')
    .setDescription(
      'REST API for Library Management System - Books, Authors, Users, and Borrowings',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User registration and login')
    .addTag('Books', 'Book management')
    .addTag('Authors', 'Author management')
    .addTag('Users', 'User management')
    .addTag('Borrowings', 'Book borrowing management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();


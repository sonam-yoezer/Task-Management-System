import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Task Management System API')
    .setDescription('API documentation for the Task Management System')
    .setVersion('1.0')
    .addBearerAuth() // Optional: Enables JWT support in Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Swagger UI will be available at /api
  
  await app.listen(process.env.PORT ?? 3000,);
}
bootstrap();

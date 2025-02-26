import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerMiddleware } from './common/logger.middleware';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { setupSwagger } from './config/swagger.config';

const PORT = process.env.PORT || 5000;
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe());
    app.use(new LoggerMiddleware().use);

    setupSwagger(app);
    await app.listen(PORT);
    console.log(`Server started on port ${PORT}`);
    console.log(`Swagger:  http://localhost:${PORT}/api/docs`);
}
bootstrap();

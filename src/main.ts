import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerMiddleware } from './common/logger.middleware';
import { AllExceptionsFilter } from './filters/all-exception.filter';
import { setupSwagger } from './config/swagger.config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const PORT = process.env.PORT || 5000;
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe());
    app.use(new LoggerMiddleware().use);

    setupSwagger(app);
    const corsOptions: CorsOptions = {
        origin: 'http://localhost:5173', // Allow the frontend domain
        methods: 'GET, POST, PATCH, DELETE', // Allow the necessary HTTP methods
        allowedHeaders: 'Content-Type, Authorization', // Allow headers like Authorization
        credentials: true, // Allow cookies if needed
    };

    app.enableCors(corsOptions);
    await app.listen(PORT);
    console.log(`Server started on port ${PORT}`);
    console.log(`Swagger:  http://localhost:${PORT}/api/docs`);
}
bootstrap();

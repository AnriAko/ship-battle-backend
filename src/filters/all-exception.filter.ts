import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from 'src/common/winston-logger';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const { method, originalUrl } = request;

        let status = 500;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const response = exception.getResponse();
            message =
                typeof response === 'string'
                    ? response
                    : (response as any).message || message;
        }

        const logMessage = `${method} ${originalUrl} ${status} - ${message}`;

        if (status >= 500) {
            logger.error(logMessage, { stack: exception.stack });
        } else {
            logger.warn(logMessage);
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: originalUrl,
            error: message,
        });
    }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from './winston-logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl } = req;
        const startTime = Date.now();

        res.on('finish', () => {
            const { statusCode } = res;
            const responseTime = Date.now() - startTime;

            if (statusCode >= 500) {
                logger.error(
                    `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`
                );
            } else {
                logger.info(
                    `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`
                );
            }
        });

        next();
    }
}

import * as winston from 'winston';
import { loggerConfig } from '../config/logger.config';

export const logger = winston.createLogger({
    level: loggerConfig.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.File({
            filename: loggerConfig.filePath,
            level: 'info',
        }),
        new winston.transports.File({
            filename: loggerConfig.errorFilePath,
            level: 'error',
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        }),
    ],
});

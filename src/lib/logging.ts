import env from "../constants/env";
import fs from 'fs';
import winston, { format } from "winston";

import 'winston-daily-rotate-file';

const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || '3';

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

const logger = winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            format: format.combine(format.timestamp(), format.json()),
            maxFiles: '14d',
            level: 'info',
            dirname: LOG_DIR,
            datePattern: 'YYYY-MM-DD',
            filename: '%DATE%-info.log'
        }),
        new winston.transports.DailyRotateFile({
            format: format.combine(format.timestamp(), format.json()),
            maxFiles: '14d',
            level: 'error',
            dirname: LOG_DIR,
            datePattern: 'YYYY-MM-DD',
            filename: '%DATE%-error.log'
        })
    ]
});

if (!env.isProduction || !env.isProd) {
    logger.add(
        new winston.transports.Console({
            format: format.combine(format.colorize(), format.simple()),
            level: 'info',
        })
    );
}

export const logStream = {
    write(message: string | object) {
        logger.info(message.toString());
    }
};

export default logger;

import { Prisma, PrismaClient } from '@prisma/client';
import HttpStatusCode from '../api/shared/status';
import { HttpEquivalentPrismaError } from '../interfaces';
import logger from './logging';
import env from '../constants/env';
import { userMiddleware } from './prisma/middleware';

const logQuery = (e: Prisma.QueryEvent) => {
    logger.warning(`${e.query}`);
};

export const handlePrismaErrors = (e: Prisma.PrismaClientKnownRequestError) => {
    const completeErrorObject: HttpEquivalentPrismaError = {};

    let targetField = 'UNKNOWN';
    let cause = 'UNKNOWN';

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.meta) {
            targetField = e.meta['target']?.toString() ?? 'UNKNOWN';
            cause = e.meta['cause']?.toString() ?? 'UNKNOWN';

            if (cause != 'UNKNOWN' && targetField == 'UNKNOWN') {
                const extractedKeys = cause.match(/(.*?)/);
                if (extractedKeys && extractedKeys?.length != 0) {
                    targetField = extractedKeys[0].toLocaleLowerCase().replace(/'/g, '');
                }
            }
        }

        if (e.code === 'P2000') {
            completeErrorObject.message = 'Provided field value length is longer than expected';
            completeErrorObject.error = {
                errorMessage: completeErrorObject.message,
                key: targetField
            };
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        } else if (e.code === 'P2001') {
            completeErrorObject.message = 'The search record does not exists in the conditions';
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        } else if (e.code === 'P2002') {
            completeErrorObject.message = 'Unique constraint failed on the field';
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        } else if (e.code === 'P2003') {
            completeErrorObject.message = 'Foreign key constraint failed on the field';
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        } else if (e.code === 'P2004') {
            completeErrorObject.message = 'A constraint failed on the database';
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        } else if (e.code === 'P2005') {
            completeErrorObject.message = 'Invalid field type of the value';
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        } else if (e.code === 'P2006') {
            completeErrorObject.message = 'The provided key is not valid for the database model';
            completeErrorObject.httpStatus = HttpStatusCode.INTERNAL_SERVER_ERROR;
        } else if (e.code === 'P2007') {
            completeErrorObject.message = 'Data validation error for a given field';
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        } else if (e.code === 'P2017' || e.code === 'P2018') {
            completeErrorObject.message = `Invalid relational value for the ${targetField}`;
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        } else if (e.code === 'P2025') {
            completeErrorObject.message = 'Related fields are not found';
            completeErrorObject.httpStatus = HttpStatusCode.BAD_REQUEST;
        }
    }

    completeErrorObject.error = {
        errorMessage: completeErrorObject.message ?? 'UNKNOWN ERROR',
        key: targetField
    };

    return completeErrorObject;
};

const getClient = () => {
    const prisma = new PrismaClient({
        log: env.LOG_QUERY ? [{
            emit: 'event',
            level: 'query'
        }] : [{
            emit: 'event',
            level: 'error'
        }],
        errorFormat: env.LOG_QUERY ? 'pretty' : 'minimal'
    });

    if (env.LOG_QUERY) {
        prisma.$on('query', logQuery);
    }

    return prisma;
};

const globalForPrisma = global as unknown as {

    prisma: PrismaClient

}

let prisma: PrismaClient = globalForPrisma.prisma;

if (env.LOG_QUERY) {
    prisma = getClient();
} else {
    prisma = new PrismaClient({})
}

if (env.isProd) globalForPrisma.prisma = prisma

prisma.$use(userMiddleware);

export default prisma;

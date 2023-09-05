import { Request, Response } from "express";
import HttpStatusCode from "../api/shared/status";
import { APIError, DBValidationError } from "../exceptions";
import { Prisma } from "@prisma/client";
import { handlePrismaErrors } from "../lib/prisma";
import { UNKNOWN_ERROR } from "../constants/operationalErrors";
import logger from "../lib/logging";
import * as jose from 'jose';

interface IResponse {
    status: number;
    message: {
        message: string;
        data?: any;
    };
}

const sendResponse = (
    res: Response,
    type: 'success' | 'error',
    options: {
        status?: number,
        message: string,
        data?: any
    }
) => {

    let { message, status, data } = options;

    if (!status) {
        if (type === 'success') {
            status = HttpStatusCode.OK;
        } else {
            status = HttpStatusCode.INTERNAL_SERVER_ERROR;
        }
    }

    const response: IResponse = {
        status: status,
        message: {
            message: message
        }
    };

    if (data) {
        response.message.data = data;
    }

    return res.status(status).json(response).end();
};

const throwErrorResponse = (res: Response, e: any) => {

    if (e instanceof APIError) {
        const errorData = {
            error: {
                operationErrorCode: e.operationErrorCode ?? UNKNOWN_ERROR
            }
        };

        return sendResponse(res, 'error', {
            message: e.message,
            status: e.statusCode,
            data: errorData
        });
    } else if (e instanceof DBValidationError) {
        return sendResponse(res, 'error', {
            message: e.message,
            status: HttpStatusCode.BAD_REQUEST
        });
    } else if (e instanceof jose.errors.JWTInvalid || e instanceof jose.errors.JOSEAlgNotAllowed || e instanceof jose.errors.JWSInvalid || e instanceof jose.errors.JWTExpired) {
        return sendResponse(res, 'error', {
            message: 'unauthorized',
            status: HttpStatusCode.UNAUTHORIZED
        });
    } else if (e instanceof Prisma.NotFoundError) {
        return sendResponse(res, 'error', {
            message: 'Resource not found',
            status: HttpStatusCode.NOT_FOUND
        });
    } else if (e instanceof Prisma.PrismaClientKnownRequestError) {
        const prismaError: Prisma.PrismaClientKnownRequestError = e as Prisma.PrismaClientKnownRequestError;
        const errorInfo = handlePrismaErrors(prismaError);
        return sendResponse(res, 'error', {
            message: errorInfo.message ?? 'Bad Request Error',
            status: errorInfo.httpStatus,
            data: {
                error: errorInfo.error
            }
        });
    }

    logger.error(JSON.stringify(e));

};
 

export {
    sendResponse,
    throwErrorResponse
}
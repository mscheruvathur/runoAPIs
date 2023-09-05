import z from 'zod';
import { sendResponse } from '../../utils/response';
import { NextFunction, Request, Response } from 'express';
import HttpStatusCode from '../shared/status';

export const zodValidation = (schema: z.ZodObject<z.ZodRawShape, 'strip'>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsedSchema = await schema.parseAsync(req)
            if (parsedSchema.body) {
                req.body = parsedSchema.body
            }

            if (parsedSchema.params) {
                req.params = parsedSchema.params
            }

            if (parsedSchema.query) {
                req.query = parsedSchema.query
            }
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return sendResponse(res, 'error', {
                    status: HttpStatusCode.BAD_REQUEST,
                    message: error.errors[0].message,
                    data: {
                        errors: error.issues.map(e => {
                            return {
                                key: e.path,
                                label: e.path,
                                errorCode: e.code,
                                message: e.message
                            }
                        })
                    }
                });
            }
        }
    }
}
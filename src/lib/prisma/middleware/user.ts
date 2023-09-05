import { Prisma } from '@prisma/client';

const userMiddleware: Prisma.Middleware = async (params, next) => {
    return next(params);
}

export default userMiddleware;
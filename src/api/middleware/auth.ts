import { Request, Response, NextFunction } from "express"
import { sendResponse, throwErrorResponse } from "../../utils/response"
import prisma from "../../lib/prisma";
import { verifyToken } from "../../utils/jwt";
import { IAccessTokenPayload, IRefreshTokenPayload } from "../../interfaces";
import { APIError } from "../../exceptions";
import HttpStatusCode from "../shared/status";
import UserController from "../controller/auth";
export enum AuthImportant {
    Loose,
    Strict
}

const strictAuth = async ( req: Request, res: Response, next: NextFunction ) => {
    try {
        const accessToken = req.cookies[ '_acc-tkn' ] ?? req.headers[ 'authorization' ];
        const refreshToken = req.cookies[ '_rff-tkn' ] ?? req.headers[ 'refresh' ];



        if ( accessToken && refreshToken ) {
            const sessionInfo = await prisma.userSession.findFirst( {
                where: {
                    accessToken,
                    refreshToken,
                    isRevoked: false
                }
            } );

            if ( sessionInfo ) {
                const accessTokenPayload: IAccessTokenPayload = await verifyToken( accessToken );
                const refreshTokenPayload: IRefreshTokenPayload = await verifyToken( refreshToken );
                if ( accessTokenPayload && refreshTokenPayload ) {
                    const userObjectId = accessTokenPayload[ 'uuid' ] ?? '';
                    const userController = new UserController( userObjectId );
                    const user = await userController.currentUser();
                    req.user = user;
                    next();
                } else {
                    throw APIError.Unauthorized();
                }
            } else {
                throw APIError.Unauthorized();
            }
        }
    } catch ( err ) {
        return throwErrorResponse( res, err )
    }
}

const looseAuth = async ( req: Request, res: Response, next: NextFunction ) => {

    try {

        const accessToken = req.cookies[ '_acc-tkn' ] ?? req.headers[ 'authorization' ];
        const refreshToken = req.cookies[ '_rff-tkn' ] ?? req.headers[ 'refresh' ];

        if ( accessToken && refreshToken ) {
            const sessionInfo = await prisma.userSession.findFirst( {
                where: {
                    accessToken,
                    refreshToken,
                    isRevoked: false
                }
            } );

            if ( sessionInfo ) {
                const accessTokenPayload: IAccessTokenPayload = await verifyToken( accessToken );
                const refreshTokenPayload: IRefreshTokenPayload = await verifyToken( refreshToken );

                if ( accessTokenPayload && refreshTokenPayload ) {
                    const userObjectId = accessTokenPayload[ 'uuid' ] ?? '';

                    const userController = new UserController( userObjectId );
                    const user = await userController.currentUser();

                    req.user = user;
                    next();
                }
            } else {
                next();
            }
        } else {
            next();
        }
    } catch ( err ) {
        next();
    }

}

export const useAuth = ( importance: AuthImportant ) => {
    if ( importance === AuthImportant.Strict ) {
        return ( req: Request, res: Response, next: NextFunction ) => strictAuth( req, res, next );
    } else if ( importance === AuthImportant.Loose ) {
        return ( req: Request, res: Response, next: NextFunction ) => looseAuth( req, res, next );
    } else {
        return ( req: Request, res: Response ) =>
            sendResponse( res, 'error', {
                message: 'unauthorized',
                status: HttpStatusCode.UNAUTHORIZED
            } );
    }
};

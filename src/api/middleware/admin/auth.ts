import { Request, Response, NextFunction } from "express"
import prisma from "../../../lib/prisma";
import { IAccessTokenPayload, IRefreshTokenPayload } from "../../../interfaces";
import { verifyToken } from "../../../utils/jwt";
import { APIError } from "../../../exceptions";
import { throwErrorResponse } from "../../../utils/response";
export const strictAuth = async ( req: Request, res: Response, next: NextFunction ) => {
    try {
        const accessToken = req.cookies[ '_a_acc-tkn' ] ?? req.headers[ 'authorization' ];
        const refreshToken = req.cookies[ '_a_rff-tkn' ] ?? req.headers[ 'refresh' ];

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
                    const employeeObjectId = accessTokenPayload[ 'uuid' ] ?? '';

                    const admin = await prisma.admin.findFirst( {
                        where: {
                            id: employeeObjectId
                        }
                    } )

                    req.admin = admin;
                    next();
                }
            } else {
                throw APIError.Unauthorized();
            }
        } else {
            throw APIError.Unauthorized();
        }
    } catch ( err ) {
        return throwErrorResponse( res, err )
    }
}
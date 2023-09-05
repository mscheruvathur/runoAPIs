import { Request, Response } from "express"
import { sendResponse, throwErrorResponse } from "../../../utils/response"
import HttpStatusCode from "../../shared/status"
import prisma from "../../../lib/prisma"
import argon2 from 'argon2';
import { APIError } from "../../../exceptions";
import { v4 as uuidv4 } from 'uuid';
import { IAccessTokenPayload, IRefreshTokenPayload } from "../../../interfaces";
import { createAccessToken, createRefreshToken } from "../../../utils/jwt";
import env from "../../../constants/env";
import { addDays, addHours } from 'date-fns';
export class AdminController {
    static async login ( req: Request, res: Response ) {
        try {

            const { email, password } = req.body
            const existAdmin = await prisma.admin.findUnique( {
                where: { email: email },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    password: true
                }
            } )

            if ( !existAdmin ) {
                throw APIError.NotFound( 'User with this mobile was not found' )
            }

            if ( await argon2.verify( existAdmin.password, password ) ) {

                const refreshTokenKey = uuidv4();
                const accessTokenKey = uuidv4();

                const accessTokenPayload: IAccessTokenPayload = {
                    name: existAdmin.name,
                    email: existAdmin.email,
                    utk: accessTokenKey,
                    uuid: existAdmin.id,
                };

                const refreshTokenPayload: IRefreshTokenPayload = {
                    key: refreshTokenKey
                };

                const accessToken = await createAccessToken( accessTokenPayload );
                const refreshToken = await createRefreshToken( refreshTokenPayload );

                if ( !accessToken || !refreshToken ) {
                    throw APIError.Unauthorized()
                }

                await prisma.adminSession.create( {
                    data: {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        refreshTokenKey: refreshTokenKey,
                        isRevoked: false,
                        location: "",
                        latitude: 0.1,
                        longitude: 0.1,
                        ipAddress: "",
                        admin: {
                            connect: {
                                id: existAdmin.id
                            }
                        }
                    }
                } );


                const currentDate = new Date( Date.now() );

                res.cookie( '_a_rff-tkn', refreshToken, {
                    domain: env.COOKIE_DOMAIN,
                    httpOnly: true,
                    secure: env.COOKIE_SECURE,
                    sameSite: env.COOKIE_SAME_SITE,
                    expires: addDays( currentDate, 7 )
                } );

                res.cookie( '_a_acc-tkn', accessToken, {
                    domain: env.COOKIE_DOMAIN,
                    httpOnly: true,
                    secure: env.COOKIE_SECURE,
                    sameSite: env.COOKIE_SAME_SITE,
                    expires: addHours( currentDate, 2 )
                } );

                return sendResponse( res, 'success', {
                    status: HttpStatusCode.OK,
                    message: "Login successful",
                    data: {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    }
                } )
            }
            throw APIError.NotFound( 'Invalid password' )

        } catch ( err ) {
            return throwErrorResponse( res, err )
        }
    }
}
import prisma from "../../lib/prisma";
import argon2 from 'argon2';
import { sendResponse, throwErrorResponse } from "../../utils/response";
import { APIError } from "../../exceptions";
import { Request, Response } from "express";
import HttpStatusCode from "../shared/status";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';
import { IAccessTokenPayload, IRefreshTokenPayload } from "../../interfaces";
import { createAccessToken, createRefreshToken } from "../../utils/jwt";
import env from "../../constants/env";
import { addDays, addHours } from 'date-fns';
import { ObjectId } from "mongodb";
import { IUser } from "../../interfaces";

export default class UserController {
    userId: string
    constructor ( userId: string ) {
        this.userId = userId;
    }

    async currentUser (): Promise<IUser> {

        // eslint-disable-next-line no-useless-catch
        try {
            const user = await prisma.user.findUnique( {
                where: { id: this.userId }
            } );
            if ( user ) {
                if ( !user.id ) {
                    user.id = new ObjectId().toString();
                }
                return user
            } else {
                throw APIError.NotFound( 'Failed to find the current User.' );
            }
        } catch ( err ) {
            throw err;
        }
    }
    static async register ( req: Request, res: Response ) {
        try {
            const { name, email, mobile, password, age, aadhar, pincode } = req.body

            const doesExist = await prisma.user.findUnique( {
                where: {
                    email: email
                },
                select: {
                    id: true
                }
            } )


            if ( doesExist ) {
                throw APIError.Conflict( 'User with this email already exists' )
            }

            const user = await prisma.user.create( {
                data: {
                    name: name,
                    email: email,
                    age: age,
                    pincode: pincode,
                    aadhar: aadhar,
                    mobile: mobile,
                    password: await argon2.hash( password )
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    mobile: true
                }
            } );

            if ( !user ) {
                throw APIError.BadRequest( 'User registration failed' )
            }

            return sendResponse( res, "success", {
                status: HttpStatusCode.CREATED,
                message: "User registered successfully",
                data: user
            } )

        } catch ( err ) {
            return throwErrorResponse( res, err )
        }
    }

    static async login ( req: Request, res: Response ) {
        try {
            const { mobile, password } = req.body

            const existUser = await prisma.user.findUnique( {
                where: {
                    mobile: mobile
                },
                select: {
                    id: true,
                    password: true,
                    email: true,
                    name: true,
                }
            } );

            if ( !existUser ) {
                throw APIError.NotFound( 'User with this mobile was not found' )
            }

            if ( await argon2.verify( existUser.password, password ) ) {

                const refreshTokenKey = uuidv4();
                const accessTokenKey = uuidv4();

                const accessTokenPayload: IAccessTokenPayload = {
                    name: existUser.name,
                    email: existUser.email,
                    utk: accessTokenKey,
                    uuid: existUser.id,
                };

                const refreshTokenPayload: IRefreshTokenPayload = {
                    key: refreshTokenKey
                };

                const accessToken = await createAccessToken( accessTokenPayload );
                const refreshToken = await createRefreshToken( refreshTokenPayload );

                if ( !accessToken || !refreshToken ) {
                    throw APIError.Unauthorized()
                }

                await prisma.userSession.create( {
                    data: {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        refreshTokenKey: refreshTokenKey,
                        isRevoked: false,
                        location: "",
                        latitude: 0.1,
                        longitude: 0.1,
                        ipAddress: "",
                        user: {
                            connect: {
                                id: existUser.id
                            }
                        }
                    }
                } );


                const currentDate = new Date( Date.now() );

                res.cookie( '_rff-tkn', refreshToken, {
                    domain: env.COOKIE_DOMAIN,
                    httpOnly: true,
                    secure: env.COOKIE_SECURE,
                    sameSite: env.COOKIE_SAME_SITE,
                    expires: addDays( currentDate, 7 )
                } );

                res.cookie( '_acc-tkn', accessToken, {
                    domain: env.COOKIE_DOMAIN,
                    httpOnly: true,
                    secure: env.COOKIE_SECURE,
                    sameSite: env.COOKIE_SAME_SITE,
                    expires: addHours( currentDate, 2 )
                } );

                return sendResponse( res, 'success', {
                    status: HttpStatusCode.OK,
                    message: 'User logged in',
                    data: {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    }
                } )
            }
        } catch ( err ) {
            return throwErrorResponse( res, err )
        }

    }


    static async update ( req: Request, res: Response ) {
        try {
            const { name, mobile } = req.body
            const { userId } = req.params

            const doesExist = await prisma.user.findUnique( {
                where: {
                    id: userId
                },
                select: {
                    id: true
                }
            } );

            if ( !doesExist ) {
                throw APIError.BadRequest( 'Invalid user Id' )
            }

            const userUpdateInput: Prisma.UserUpdateInput = {}

            if ( name ) {
                userUpdateInput.name = name
            }

            if ( mobile ) {
                userUpdateInput.mobile = mobile
            }

            const updatedUser = await prisma.user.update( {
                where: {
                    id: userId
                },
                data: userUpdateInput,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    mobile: true
                }
            } )

            if ( updatedUser ) {
                return sendResponse( res, 'success', {
                    status: HttpStatusCode.OK,
                    message: "User profile updated successfully.",
                    data: updatedUser
                } )
            }
            throw APIError.BadRequest( 'Failed to update user profile.' )

        } catch ( err ) {
            return throwErrorResponse( res, err )
        }
    }

}
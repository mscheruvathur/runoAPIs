import { Request, Response } from "express";
import { adminUserFilterSchema } from "../../schema/admin/user";
import { Prisma } from "@prisma/client";
import prisma from "../../../lib/prisma";
import { sendResponse, throwErrorResponse } from "../../../utils/response";
import HttpStatusCode from "../../shared/status";

export class AdminUserController {
    static async filter ( req: Request, res: Response ) {
        try {
            const { vaccinationStatus, age, pincode } = await adminUserFilterSchema.parseAsync( req.query );
            const userFilter: Prisma.UserWhereInput = {}

            if ( vaccinationStatus ) {
                userFilter.vaccination = {
                    vaccinationStatus: {
                        every: {
                            type: vaccinationStatus
                        }
                    }
                }
            }

            if ( age ) {
                userFilter.age = age
            }

            if ( pincode ) {
                userFilter.pincode = pincode
            }


            const users = await prisma.user.findMany( {
                where: userFilter,
                select: {
                    id: true,
                    aadhar: true,
                    age: true,
                    email: true,
                    mobile: true,
                    name: true,
                    pincode: true,
                    vaccination: {
                        select: {
                            isActive: true,
                            isCleared: true,
                            vaccinationStatus: {
                                select: {
                                    slotTime: true,
                                    status: true,
                                    type: true,
                                    timeOfVaccination: {
                                        select: {
                                            timeFrom: true,
                                            timeTo: true,
                                            date: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } )

            return sendResponse( res, 'success', {
                status: HttpStatusCode.OK,
                message: 'User fetched successfully',
                data: users
            } )

        } catch ( err ) {
            return throwErrorResponse( res, err )
        }
    }
}
import { Request, Response } from "express"
import { sendResponse, throwErrorResponse } from "../../utils/response"
import HttpStatusCode from "../shared/status"
import prisma from "../../lib/prisma"
import { APIError } from "../../exceptions";
import { VaccinationStatus } from "@prisma/client";
import { getAvailableTime } from "../../utils/time-range";
import { userSlotCheckingSchema } from "../schema/slot";
export class UserSlotController {
    static async register ( req: Request, res: Response ) {

        try {

            const { slotTime } = req.body;

            const availableTime = await getAvailableTime( new Date( slotTime ) )
            if ( !availableTime ) throw APIError.Conflict( 'no time.' )
            const { date: generatedSlotDate, from: generatedSlotTime, to: generatedSlotEndTime } = availableTime;

            const user = req.user;

            const doesCleared = await prisma.vaccination.findUnique( {
                where: {
                    userId: user.id,
                },
                select: {
                    isCleared: true,
                    vaccinationStatus: true,
                    id: true,
                }
            } )

            if ( doesCleared && doesCleared.isCleared ) {
                throw APIError.Conflict( 'You have completed your vaccination.' )
            }

            if ( !doesCleared ) {
                const firstDose = await prisma.vaccination.create( {
                    data: {
                        vaccinationId: user.aadhar,
                        user: {
                            connect: {
                                id: user.id
                            }
                        },
                        isActive: true,
                        vaccinationStatus: {
                            create: {
                                slotTime: new Date( slotTime ),
                                timeOfVaccination: {
                                    create: {
                                        date: generatedSlotDate,
                                        timeFrom: generatedSlotTime,
                                        timeTo: generatedSlotEndTime
                                    }
                                },
                                status: "scheduled",
                                type: 'first'
                            }
                        }
                    }
                } );

                if ( firstDose ) {
                    return sendResponse( res, 'success', {
                        status: HttpStatusCode.CREATED,
                        message: 'Successfully registered your first dose',
                        data: firstDose
                    } )
                }
            }

            if ( doesCleared && !doesCleared.isCleared ) {

                const status = doesCleared.vaccinationStatus;

                if ( status.length == 2 && status[ 1 ].status === "cleared" ) throw APIError.Conflict( 'You have completed your vaccination.' );

                if ( status.length == 1 ) {
                    if ( status[ 0 ].status !== "cleared" ) throw APIError.Conflict( `Please clarify your first dose and status is :${ status[ 0 ].status }` );
                    const secondDose = await prisma.vaccinationStatus.create( {
                        data: {
                            vaccination: {
                                connect: {
                                    id: doesCleared.id
                                }
                            },
                            slotTime: new Date( slotTime ),
                            timeOfVaccination: {
                                create: {
                                    date: generatedSlotDate,
                                    timeFrom: generatedSlotTime,
                                    timeTo: generatedSlotEndTime
                                }
                            },
                            status: "scheduled",
                            type: 'second'
                        }
                    } );


                    if ( secondDose ) {
                        return sendResponse( res, 'success', {
                            status: HttpStatusCode.CREATED,
                            message: 'Successfully registered your second dose',
                            data: secondDose
                        } )
                    }
                }
                throw new APIError( 'Could not register', HttpStatusCode.BAD_REQUEST )
            }

        } catch ( err ) {
            return throwErrorResponse( res, err )
        }
    }

    static async availability ( req: Request, res: Response ) {
        try {

            const { slotTime } = await userSlotCheckingSchema.parseAsync( req.query );

            if ( !slotTime ) throw new APIError( 'Invalid slot time.', HttpStatusCode.BAD_REQUEST )

            const availableTime = await getAvailableTime( new Date( slotTime ) )
            if ( !availableTime ) throw new APIError( 'Available time not found', HttpStatusCode.NOT_FOUND )

            return sendResponse( res, 'success', {
                status: HttpStatusCode.OK,
                message: "Fetched successfully",
                data: availableTime[ 'availableTimes' ]
            } )

        } catch ( err ) {
            return throwErrorResponse( res, err );
        }
    }

    static async update ( req: Request, res: Response ) {
        try {

            const { status } = req.body;

            const vaccinationInfo = await prisma.vaccination.findUnique( {
                where: { userId: req.user.id },
                select: {
                    vaccinationStatus: true,
                    id: true,
                    isCleared: true,
                    isActive: true
                }
            } )

            if ( vaccinationInfo && vaccinationInfo.isActive && !vaccinationInfo.isCleared ) {
                const statusInfo = vaccinationInfo.vaccinationStatus;

                let updatedInfo: VaccinationStatus

                if ( statusInfo.length == 1 ) {
                    if ( statusInfo[ 0 ].status == status ) throw new APIError( 'You have already cleared your first dose', HttpStatusCode.BAD_REQUEST );
                    updatedInfo = await prisma.vaccinationStatus.update( {
                        where: {
                            id_vaccinationId: {
                                id: statusInfo[ 0 ].id,
                                vaccinationId: vaccinationInfo.id
                            }
                        },
                        data: { status: status }
                    } )
                }

                if ( statusInfo.length == 2 ) {
                    if ( statusInfo[ 0 ].status !== "cleared" ) throw new APIError( 'first dose not cleared', HttpStatusCode.BAD_REQUEST );
                    if ( statusInfo[ 1 ].status === "cleared" ) throw new APIError( 'You have already cleared your vaccination', HttpStatusCode.BAD_REQUEST );

                    updatedInfo = await prisma.vaccinationStatus.update( {
                        where: {
                            id_vaccinationId: {
                                id: statusInfo[ 1 ].id,
                                vaccinationId: vaccinationInfo.id
                            }
                        },
                        data: { status: status }
                    } )

                    await prisma.vaccination.update( {
                        where: {
                            userId: req.user.id
                        },
                        data: { isCleared: true, isActive: false }
                    } );
                }

                return sendResponse( res, 'success', {
                    status: HttpStatusCode.OK,
                    message: 'Successfully updated',
                    data: updatedInfo
                } )


            }
            throw APIError.Conflict( 'You have completed your vaccination.' )


        } catch ( err ) {
            return throwErrorResponse( res, err )
        }
    }

}
import { Request, Response } from "express";
import prisma from "../../../lib/prisma";
import { sendResponse, throwErrorResponse } from "../../../utils/response";
import HttpStatusCode from "../../shared/status";
import { adminSlotCheckingSchema } from "../../schema/admin/slot";
import { format } from "date-fns";
import { APIError } from "../../../exceptions";


export class AdminSlotController {
    static async registeredSlots ( req: Request, res: Response ) {
        try {

            const { slotTime } = await adminSlotCheckingSchema.parseAsync( req.query );
            if ( !slotTime ) throw new APIError( 'Invalid slot time.', HttpStatusCode.BAD_REQUEST )
            const slotDate = format( new Date( slotTime ), "yyyy-MM-dd" ).toLowerCase();

            const firstDose = await prisma.vaccination.findMany( {
                where: {
                    vaccinationStatus: {
                        every: {
                            status: "scheduled",
                            type: "first",
                            timeOfVaccination: {
                                every: {
                                    date: slotDate
                                }
                            }
                        }
                    },
                },
                select: {
                    id: true,
                    isActive: true,
                    isCleared: true,
                    user: {
                        select: {
                            name: true,
                            age: true,
                            pincode: true
                        }
                    },
                    vaccinationStatus: {
                        select: {
                            slotTime: true,
                            status: true,
                            type: true,
                            timeOfVaccination: {
                                select: {
                                    date: true,
                                    timeFrom: true,
                                    timeTo: true,
                                }
                            }
                        }
                    },
                    vaccinationId: true
                }
            } )

            const secondDose = await prisma.vaccination.findMany( {
                where: {
                    vaccinationStatus: {
                        every: {
                            status: "scheduled",
                            type: "second",
                            timeOfVaccination: {
                                every: {
                                    date: slotDate
                                }
                            }
                        }
                    }
                }, select: {
                    id: true,
                    isActive: true,
                    isCleared: true,
                    user: {
                        select: {
                            name: true,
                            age: true,
                            pincode: true
                        }
                    },
                    vaccinationStatus: {
                        select: {
                            slotTime: true,
                            status: true,
                            type: true,
                            timeOfVaccination: {
                                select: {
                                    date: true,
                                    timeFrom: true,
                                    timeTo: true,
                                }
                            }
                        }
                    },
                    vaccinationId: true
                }
            } )

            return sendResponse( res, 'success', {
                status: HttpStatusCode.OK,
                message: '',
                data: {
                    firstDose: firstDose,
                    secondDose: secondDose
                }
            } )
        } catch ( err ) {
            return throwErrorResponse( res, err )
        }
    }
}
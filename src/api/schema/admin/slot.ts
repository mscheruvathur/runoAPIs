import { z } from 'zod';
export const adminSlotCheckingSchema = z.object( {
    slotTime: z.string( {
        required_error: 'slotTime must be provided'
    } )

} )
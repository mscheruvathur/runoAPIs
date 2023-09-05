import { z } from 'zod';

export const userSlotRegisteringSchema = z.object( {
    body: z.object( {
        slotTime: z.string( {
            required_error: 'booking time required'
        } )
    } )
} );

export const userSlotUpdatingSchema = z.object( {
    body: z.object( {
        status: z.enum( [ 'scheduled', 'cancelled', 'cleared' ] )
    } )
} )

export const userSlotCheckingSchema = z.object( {
    slotTime: z.string( {
        required_error: 'slotTime must be provided'
    } )

} )
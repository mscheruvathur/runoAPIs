import { z } from 'zod'
export const adminUserFilterSchema = z.object( {

    vaccinationStatus: z.enum( [ 'first', 'second' ] ).optional(),
    age: z.string().optional(),
    pincode: z.string().optional(),

} )
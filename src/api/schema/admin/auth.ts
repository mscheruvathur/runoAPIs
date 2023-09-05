import { z } from 'zod'
export const adminAuthLoginSchema = z.object( {
    body: z.object( {
        email: z.string( {
            required_error: "Email ID is Required"
        } ).email( 'Wrong Email ID' ),

        password: z.string( {
            required_error: "Password is required"
        } )
    } )
} )
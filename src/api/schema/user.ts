import z from 'zod';

const mobileRegExp = /^[+]\d{1,2}\d{10}/;

export const userRegistrationSchema = z.object( {
    body: z.object( {
        name: z.string( {
            required_error: "User name is Required"
        } ),

        email: z.string( {
            required_error: "Email ID is Required"
        } ).email( 'Wrong Email ID' ),

        mobile: z.string( {
            required_error: "Mobile number is required"
        } ).regex( mobileRegExp, 'Wrong mobile number' ),

        password: z.string( {
            required_error: "User password is required"
        } ).min( 8, 'Minimum password length should be 8' ).max( 30, 'Maximum password length should not be more than 30.' ),

        age: z.string( {
            required_error: "User name is Required"
        } ),
        pincode: z.string( {
            required_error: "User name is Required"
        } ),
        aadhar: z.string( {
            required_error: "User name is Required"
        } ),
    } )
} )

export const userUpdatingSchema = z.object( {
    params: z.object( {
        userId: z.string( {
            required_error: "User ID is required to update a specific user"
        } )
    } ),

    body: z.object( {
        name: z.string().optional(),
        mobile: z.string().regex( mobileRegExp, 'Wrong mobile number' ).optional()
    } )
} )

export const userLoginSchema = z.object( {
    body: z.object( {
        mobile: z.string( {
            required_error: "Mobile number is required"
        } ).regex( mobileRegExp, 'Wrong mobile number' ),

        password: z.string( {
            required_error: "Password is required"
        } )
    } )
} )
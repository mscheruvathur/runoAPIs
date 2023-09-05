import { JWTPayload } from "jose";


export interface IAccessTokenPayload extends JWTPayload {
    name?: string;
    email?: string;
    utk?: string;
    uuid?: string;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    jti?: string;
    nbf?: number;
    exp?: number;
    iat?: number;
    scopes?: string
}

export interface IRefreshTokenPayload extends JWTPayload {
    key?: string;
    iss?: string;
    sub?: string;
    aud?: string | string[];
    jti?: string;
    nbf?: number;
    exp?: number;
    iat?: number;
}

export interface HttpEquivalentPrismaError {
    httpStatus?: number;
    message?: string;
    error?: {
        key: string;
        errorMessage: string;
    };
}

interface IUser {
    id: string;
    name: string;
    email: string;
    mobile: string;
    age: string;
    pincode: string;
    aadhar: string;
    password: string;

}

export type { IUser }
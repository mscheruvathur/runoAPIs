import * as jose from 'jose';
import { IAccessTokenPayload, IRefreshTokenPayload } from '../interfaces';
import fs from 'fs/promises';
import { JWT_PRIVATE_KEY_PATH, JWT_PUBLIC_KEY_PATH, JWT_ALGORITHM } from '../constants/settings';
import env from '../constants/env';

let privateKeyObject: jose.KeyLike;
let publicKeyObject: jose.KeyLike;

let publicKey: string;
let privateKey: string;

const loadKeys = async () => {

    privateKey = await fs.readFile(JWT_PRIVATE_KEY_PATH, {
        encoding: 'utf-8'
    });
    publicKey = await fs.readFile(JWT_PUBLIC_KEY_PATH, {
        encoding: 'utf-8'
    });

    privateKeyObject = await jose.importPKCS8(privateKey, JWT_ALGORITHM, {
        extractable: true
    });
    publicKeyObject = await jose.importSPKI(publicKey, JWT_ALGORITHM, {
        extractable: true
    });
    return true;
};

const createAccessToken = async (payload: IAccessTokenPayload, cp = Boolean(false), scopes: Array<string> = []) => {

    if (scopes.length > 0) {
        payload['scopes'] = scopes.join(" ")
    }

    const jwt = new jose.SignJWT({
        ...payload,
    })
        .setAudience(cp ? env.JWT_INTERNAL_USER_AUDIENCE : env.JWT_AUDIENCE)
        .setIssuer(env.JWT_ISSUER)
        .setIssuedAt()
        .setSubject(payload.uuid?.toString() ?? '')
        .setExpirationTime('2h')
        .setProtectedHeader({
            alg: JWT_ALGORITHM
        })
        .sign(privateKeyObject);
    return jwt;
};

const createRefreshToken = async (payload: IRefreshTokenPayload, cp = false) => {
    const jwt = new jose.SignJWT({
        ...payload
    })
        .setAudience(cp ? env.JWT_INTERNAL_USER_AUDIENCE : env.JWT_AUDIENCE)
        .setIssuer(env.JWT_ISSUER)
        .setExpirationTime('7d')
        .setProtectedHeader({
            alg: JWT_ALGORITHM
        })
        .setIssuedAt()
        .sign(privateKeyObject);
    return jwt;
};

const createPasswordResetToken = async (user: { id: string; email: string }, cp = false) => {
    const payload = {
        uuid: user.id,
        email: user.email,
        useCase: 'password-reset'
    };

    const jwt = new jose.SignJWT(payload)
        .setAudience(cp ? env.JWT_INTERNAL_USER_AUDIENCE : env.JWT_AUDIENCE)
        .setIssuer(env.JWT_ISSUER)
        .setExpirationTime('10m')
        .setSubject(user.id)
        .setProtectedHeader({
            alg: JWT_ALGORITHM
        })
        .sign(privateKeyObject);
    return jwt;
};

const verifyToken = async (token: string, cp = false): Promise<jose.JWTPayload> => {
    const verifiedInfo = await jose.jwtVerify(token, publicKeyObject, {
        algorithms: [JWT_ALGORITHM],
        audience: cp ? env.JWT_INTERNAL_USER_AUDIENCE : env.JWT_AUDIENCE,
        issuer: env.JWT_ISSUER
    });
    return verifiedInfo.payload;
};

const createUserVerificationToken = async (userId: string, email: string) => {
    const payload = {
        uuid: userId,
        email: email,
        useCase: 'account-verification'
    };

    const jwt = new jose.SignJWT(payload)
        .setAudience(env.JWT_AUDIENCE)
        .setIssuer(env.JWT_ISSUER)
        .setExpirationTime('24h')
        .setSubject(userId)
        .setProtectedHeader({
            alg: JWT_ALGORITHM
        })
        .sign(privateKeyObject);
    return jwt;
};

export { privateKey, publicKey, createAccessToken, createRefreshToken, loadKeys, verifyToken, createPasswordResetToken, createUserVerificationToken };

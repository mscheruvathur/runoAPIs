import { cleanEnv, str, json, port, makeValidator, num, url, bool, EnvError } from 'envalid';
import { config } from 'dotenv';

config();


const isValidURL = ( url: string ) => {
    try {
        const urlObject = new URL( url );
        return urlObject.protocol === 'https:' || urlObject.protocol === 'http:';
    } catch ( e ) {
        return false;
    }
};

const validateCORSOrigins = makeValidator( ( origins ) => {
    const splitOrigins = origins.split( ' ' );
    if ( splitOrigins.length === 1 ) {
        if ( isValidURL( origins ) ) {
            return splitOrigins[ 0 ].trim();
        } else {
            throw new EnvError( 'defined origins should be urls' );
        }
    } else {
        for ( const origin of splitOrigins ) {
            if ( !isValidURL( origin ) ) {
                throw new EnvError( `${ origin } is not a valid url` );
            }
        }
        return splitOrigins;
    }
} );


const env = cleanEnv(
    process.env, {
    DATABASE_URL: str( {
        desc: 'DATABASE_URL for MongoDB database'
    } ),

    PORT: port( { default: 3001, devDefault: 3001, desc: 'Port on which Express server will start' } ),
    BASE_API_URL: str( { default: `http://localhost:3001`, devDefault: `http://localhost:3001`, desc: 'Host and Port together' } ),

    NODE_ENV: str( { choices: [ 'development', 'production', 'staging' ] } ),

    CORS_ORIGINS: validateCORSOrigins(),
    LOG_QUERY: bool(),

    // JWT Config
    JWT_AUDIENCE: str(),
    JWT_ISSUER: str(),
    JWT_INTERNAL_USER_AUDIENCE: str(),

    COOKIE_DOMAIN: str(),
    COOKIE_SECURE: bool(),
    COOKIE_SAME_SITE: str( {
        choices: [ 'lax', 'strict', 'none' ] as const,
        default: 'strict'
    } )
},
    {}
);

export default env;
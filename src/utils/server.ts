import cors from "cors";
import env from "../constants/env";
import express, { Express, Request, Response, NextFunction } from "express";
import * as ua from 'express-useragent';
import helmet from 'helmet';
import cookieParser from "cookie-parser";
import logStream from "../lib/logging";
import morgan from "morgan";

import userRouter from "../api/routes/user";
import adminRouter from "../api/routes/admin";
import userSlotRouter from "../api/routes/slot";
import { AuthImportant, useAuth } from "../api/middleware/auth";
import { throwErrorResponse } from "./response";

export default async function createServer () {

    const app: Express = express();
    app.use(
        cors( {
            origin: env.CORS_ORIGINS,
            credentials: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'
        } )
    );

    app.set( 'trust proxy', true );

    app.use( ua.express() );

    app.use( helmet() );

    app.use(
        morgan( ':method :url :status :res[content-length] - :response-time ms', {
            stream: logStream
        } )
    );

    app.use(
        express.json( {
            limit: '100kb'
        } )
    );

    app.use(
        express.urlencoded( {
            extended: true,
            limit: '100kb'
        } )
    );

    app.use( cookieParser() );
    const strictAuthMiddleware = useAuth( AuthImportant.Strict );

    const versionPrefix = '/api/v1';


    app.use( `${ versionPrefix }/auth/user`, userRouter );
    app.use( `${ versionPrefix }/vaccination`, strictAuthMiddleware, userSlotRouter );
    app.use( `${ versionPrefix }/admin`, adminRouter );

    app.use( ( err: Error, req: Request, res: Response, next: NextFunction ) => {
        const response = throwErrorResponse( res, err )

        if ( !response ) next();
        else return response;

    } );

    return {
        app
    }
}

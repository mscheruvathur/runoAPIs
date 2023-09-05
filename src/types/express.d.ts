import { Admin } from '@prisma/client';
import { IUser } from '../interfaces';


declare global {
    namespace Express {
        interface Request {
            user: IUser;
            admin: Admin;

        }
        interface Response {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tempResponse: any;
        }
    }
}

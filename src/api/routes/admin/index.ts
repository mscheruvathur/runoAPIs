import adminAuthRouter from "./auth";
import adminUserRouter from "./user";
import adminSlotRouter from "./slot";
import { NextFunction, Request, Response, Router } from "express";
import { strictAuth } from "../../middleware/admin/auth";

const strictAuthMiddleware = ( req: Request, res: Response, next: NextFunction ) => strictAuth( req, res, next )

const adminRouter = Router();

adminRouter.use( '/auth', adminAuthRouter );
adminRouter.use( '/user', strictAuthMiddleware, adminUserRouter );
adminRouter.use( '/vaccination', strictAuthMiddleware, adminSlotRouter )

export default adminRouter;
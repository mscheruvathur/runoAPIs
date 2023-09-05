import adminAuthRouter from "./auth";
import adminUserRouter from "./user";
import adminSlotRouter from "./slot";
import { Router } from "express";

const adminRouter = Router();

adminRouter.use( '/auth', adminAuthRouter );
adminRouter.use( '/user', adminUserRouter );
adminRouter.use( '/vaccination', adminSlotRouter )

export default adminRouter;
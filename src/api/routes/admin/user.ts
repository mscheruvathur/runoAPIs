import { AdminUserController } from "../../controller/admin";
import { Router } from "express";


const adminUserRouter = Router();

adminUserRouter.get( '/', AdminUserController.filter );
export default adminUserRouter;
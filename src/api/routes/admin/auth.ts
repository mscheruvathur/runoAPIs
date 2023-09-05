import { AdminController } from "../../controller/admin/auth";
import { Router } from "express";
import { zodValidation } from "../../middleware/request_validator";
import { adminAuthLoginSchema } from "../../schema/admin/auth";
// import { strictAuth } from "../../middleware/admin/auth";

const adminAuthRouter = Router();

adminAuthRouter.post( '/login', zodValidation( adminAuthLoginSchema ), AdminController.login )
export default adminAuthRouter
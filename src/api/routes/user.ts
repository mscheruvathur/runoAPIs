import UserController from "../controller/auth";
import { Router } from "express";
import { zodValidation } from "../middleware/request_validator";
import { userRegistrationSchema, userLoginSchema, userUpdatingSchema } from "../schema/user";
import { AuthImportant, useAuth } from "../middleware/auth";

const userRouter = Router()
const strictAuthMiddleware = useAuth( AuthImportant.Strict );

userRouter.post( '/', zodValidation( userRegistrationSchema ), UserController.register )
userRouter.patch( '/', strictAuthMiddleware, zodValidation( userUpdatingSchema ), UserController.update )
userRouter.post( '/login', zodValidation( userLoginSchema ), UserController.login )

export default userRouter;
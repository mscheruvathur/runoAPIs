import { UserSlotController } from "../controller/slot";
import { Router } from "express";
import { zodValidation } from "../middleware/request_validator";
import { userSlotRegisteringSchema, userSlotUpdatingSchema } from "../schema/slot";

const userSlotRouter = Router();

userSlotRouter.post( '/slot/register', zodValidation( userSlotRegisteringSchema ), UserSlotController.register )
userSlotRouter.get( '/slot/check', UserSlotController.availability )
userSlotRouter.patch( '/slot/update', zodValidation( userSlotUpdatingSchema ), UserSlotController.update )
export default userSlotRouter;
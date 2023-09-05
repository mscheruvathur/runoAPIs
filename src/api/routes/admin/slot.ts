
import { AdminSlotController } from "../../controller/admin";
import { Router } from "express";

const adminSlotRouter = Router();

adminSlotRouter.get( '/slot', AdminSlotController.registeredSlots )
export default adminSlotRouter;
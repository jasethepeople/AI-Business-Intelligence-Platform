import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activityRouter from "./activity";
import businessesRouter from "./businesses";
import dashboardRouter from "./dashboard";
import discoveryRouter from "./discovery";

const router: IRouter = Router();

router.use(healthRouter);
router.use(activityRouter);
router.use(businessesRouter);
router.use(dashboardRouter);
router.use(discoveryRouter);

export default router;

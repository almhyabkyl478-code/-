import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leavesRouter from "./leaves";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leavesRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import imagesRouter from "./images";
import projectsRouter from "./projects";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(imagesRouter);
router.use(projectsRouter);
router.use(settingsRouter);

export default router;

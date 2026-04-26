import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import storageRouter from "./storage";
import imagesRouter from "./images";
import projectsRouter from "./projects";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(storageRouter);
router.use(imagesRouter);
router.use(projectsRouter);

export default router;

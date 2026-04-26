import { Router, type IRouter } from "express";
import healthRouter from "./health";
import contactRouter from "./contact";
import storageRouter from "./storage";
import imagesRouter from "./images";

const router: IRouter = Router();

router.use(healthRouter);
router.use(contactRouter);
router.use(storageRouter);
router.use(imagesRouter);

export default router;

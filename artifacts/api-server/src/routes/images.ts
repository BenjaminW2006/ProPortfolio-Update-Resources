import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { siteImagesTable } from "@workspace/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { GetImagesResponse, SetImageSlotBody, SetImageSlotResponse, SetImageSlotParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function requireCsrfHeader(req: Request, res: Response, next: NextFunction): void {
  if (req.headers["x-csrf-protection"] === "1") {
    next();
    return;
  }
  res.status(403).json({ error: "CSRF check failed" });
}

router.get("/images", async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(siteImagesTable).where(isNotNull(siteImagesTable.slot));
    res.json(GetImagesResponse.parse(rows.map((r) => ({ slot: r.slot!, objectPath: r.objectPath }))));
  } catch (error) {
    req.log.error({ err: error }, "Error fetching image slots");
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

router.post("/images/:slot", requireAuth, requireCsrfHeader, async (req: Request, res: Response) => {
  const paramsParsed = SetImageSlotParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid slot" });
    return;
  }

  const bodyParsed = SetImageSlotBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Missing or invalid body" });
    return;
  }

  const { slot } = paramsParsed.data;
  const { objectPath } = bodyParsed.data;

  try {
    await db
      .insert(siteImagesTable)
      .values({ slot, objectPath })
      .onConflictDoUpdate({ target: siteImagesTable.slot, set: { objectPath, uploadedAt: new Date() } });

    const [row] = await db.select().from(siteImagesTable).where(eq(siteImagesTable.slot, slot));
    res.json(SetImageSlotResponse.parse({ slot: row.slot, objectPath: row.objectPath }));
  } catch (error) {
    req.log.error({ err: error }, "Error saving image slot");
    res.status(500).json({ error: "Failed to save image slot" });
  }
});

router.delete("/images/:slot", requireAuth, requireCsrfHeader, async (req: Request, res: Response) => {
  const paramsParsed = SetImageSlotParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid slot" });
    return;
  }

  const { slot } = paramsParsed.data;

  try {
    await db.delete(siteImagesTable).where(eq(siteImagesTable.slot, slot));
    res.json({ success: true, slot });
  } catch (error) {
    req.log.error({ err: error }, "Error deleting image slot");
    res.status(500).json({ error: "Failed to delete image slot" });
  }
});

export default router;

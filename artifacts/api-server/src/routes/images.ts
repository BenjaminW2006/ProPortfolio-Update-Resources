import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { db } from "@workspace/db";
import { siteImagesTable, siteSettingsTable } from "@workspace/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { GetImagesResponse, SetImageSlotBody, SetImageSlotResponse, SetImageSlotParams } from "@workspace/api-zod";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

// Strict rate limit on the login endpoint — 10 attempts per 15 minutes per IP.
// This blocks brute-force password attacks without affecting normal usage.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait 15 minutes and try again." },
  skipSuccessfulRequests: true,
});

function requireAdminSession(req: Request, res: Response, next: NextFunction): void {
  if (req.session.isAdmin) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

function requireCsrfHeader(req: Request, res: Response, next: NextFunction): void {
  if (req.headers["x-csrf-protection"] === "1") {
    next();
    return;
  }
  res.status(403).json({ error: "CSRF check failed" });
}

router.post("/admin/login", loginRateLimiter, requireCsrfHeader, async (req: Request, res: Response) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    req.log.warn("ADMIN_PASSWORD not set — rejecting admin login");
    res.status(503).json({ error: "Admin access not configured." });
    return;
  }
  const { password } = req.body as { password?: string };
  if (!password) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }

  try {
    const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, 1));
    if (row) {
      const parsed = JSON.parse(row.data) as { adminPasswordHash?: string };
      if (parsed.adminPasswordHash) {
        const valid = await bcrypt.compare(password, parsed.adminPasswordHash);
        if (!valid) {
          res.status(401).json({ error: "Incorrect password." });
          return;
        }
        req.session.isAdmin = true;
        res.json({ ok: true });
        return;
      }
    }
  } catch (err) {
    req.log.warn({ err }, "Could not check DB password hash, falling back to env");
  }

  if (password !== adminPassword) {
    res.status(401).json({ error: "Incorrect password." });
    return;
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

router.post("/admin/logout", requireAdminSession, requireCsrfHeader, (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/admin/ping", requireAdminSession, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

router.get("/images", async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(siteImagesTable).where(isNotNull(siteImagesTable.slot));
    res.json(GetImagesResponse.parse(rows.map((r) => ({ slot: r.slot!, objectPath: r.objectPath }))));
  } catch (error) {
    req.log.error({ err: error }, "Error fetching image slots");
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

router.post("/images/:slot", requireAdminSession, requireCsrfHeader, async (req: Request, res: Response) => {
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

router.delete("/images/:slot", requireAdminSession, requireCsrfHeader, async (req: Request, res: Response) => {
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

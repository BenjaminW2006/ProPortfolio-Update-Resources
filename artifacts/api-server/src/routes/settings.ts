import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const ServiceSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const SiteSettingsSchema = z.object({
  companyName: z.string(),
  tagline1: z.string(),
  tagline2: z.string(),
  tagline3: z.string(),
  phone: z.string(),
  email: z.string(),
  serviceArea: z.string(),
  services: z.array(ServiceSchema),
  colorBg: hexColor.default("#0f172a"),
  colorText: hexColor.default("#f1f5f9"),
  colorAccent: hexColor.default("#2563eb"),
  colorHeader: hexColor.default("#0f172a"),
});

type SiteSettings = z.infer<typeof SiteSettingsSchema>;

const DEFAULT_SETTINGS: SiteSettings = {
  companyName: "Upstate Palmetto Property Services",
  tagline1: "Hard Work.",
  tagline2: "Done Right.",
  tagline3: "Every Time.",
  phone: "(864) 434-2842",
  email: "Upstate-Palmetto@outlook.com",
  serviceArea: "Upstate South Carolina",
  colorBg: "#0f172a",
  colorText: "#f1f5f9",
  colorAccent: "#2563eb",
  colorHeader: "#0f172a",
  services: [
    { title: "General Handyman", description: "Fixing what's broken. Door repairs, fixture installation, drywall patching, and everyday maintenance around the house." },
    { title: "Painting", description: "Interior and exterior painting, trim work, deck staining, and touch-ups with meticulous attention to detail." },
    { title: "Pressure Washing", description: "Restore your home's curb appeal. Driveways, siding, decks, patios, and walkways cleaned safely and thoroughly." },
    { title: "Carpentry & Woodwork", description: "Custom trim, crown molding, baseboards, wainscoting, and minor wood repairs that add character to your home." },
    { title: "Deck & Fence Repair", description: "Board replacement, structural reinforcement, sealing, and complete restoration for your outdoor living spaces." },
    { title: "Gutter Cleaning", description: "Prevent water damage. Thorough removal of leaves and debris, downspout flushing, and minor repairs." },
    { title: "Property Maintenance", description: "Recurring scheduled maintenance for landlords, property managers, and homeowners who want peace of mind." },
    { title: "Minor Landscaping", description: "Shrub trimming, mulch installation, yard cleanup, and basic exterior aesthetic improvements." },
  ],
};

async function getCurrentSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, 1));
  if (!row) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(row.data) as unknown;
    const result = SiteSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...(parsed as object) });
    return result.success ? result.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function requireAdminSession(req: Request, res: Response, next: NextFunction): void {
  if (req.session.isAdmin) { next(); return; }
  res.status(401).json({ error: "Unauthorized" });
}

function requireCsrfHeader(req: Request, res: Response, next: NextFunction): void {
  if (req.headers["x-csrf-protection"] === "1") { next(); return; }
  res.status(403).json({ error: "CSRF check failed" });
}

router.get("/settings", async (req: Request, res: Response) => {
  try {
    const settings = await getCurrentSettings();
    res.json(settings);
  } catch (error) {
    req.log.error({ err: error }, "Error fetching settings");
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.patch("/settings", requireAdminSession, requireCsrfHeader, async (req: Request, res: Response) => {
  try {
    const current = await getCurrentSettings();
    const merged = { ...current, ...(req.body as Partial<SiteSettings>) };
    const validated = SiteSettingsSchema.safeParse(merged);
    if (!validated.success) {
      res.status(400).json({ error: "Invalid settings" });
      return;
    }
    const dataStr = JSON.stringify(validated.data);
    await db
      .insert(siteSettingsTable)
      .values({ id: 1, data: dataStr })
      .onConflictDoUpdate({
        target: siteSettingsTable.id,
        set: { data: dataStr, updatedAt: new Date() },
      });
    res.json(validated.data);
  } catch (error) {
    req.log.error({ err: error }, "Error updating settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

router.post("/settings/reset", requireAdminSession, requireCsrfHeader, async (req: Request, res: Response) => {
  try {
    const dataStr = JSON.stringify(DEFAULT_SETTINGS);
    await db
      .insert(siteSettingsTable)
      .values({ id: 1, data: dataStr })
      .onConflictDoUpdate({
        target: siteSettingsTable.id,
        set: { data: dataStr, updatedAt: new Date() },
      });
    res.json(DEFAULT_SETTINGS);
  } catch (error) {
    req.log.error({ err: error }, "Error resetting settings");
    res.status(500).json({ error: "Failed to reset settings" });
  }
});

export default router;

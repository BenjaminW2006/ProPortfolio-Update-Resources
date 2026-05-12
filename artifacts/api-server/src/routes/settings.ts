import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { siteSettingsTable, siteImagesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

const ServiceSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const GalleryItemSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/, "Key must be lowercase letters, numbers, and hyphens only"),
  label: z.string(),
  description: z.string(),
});

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const SiteSettingsSchema = z.object({
  companyName: z.string(),
  navAcronym: z.string().default(""),
  tagline1: z.string(),
  tagline2: z.string(),
  tagline3: z.string(),
  heroSubtitle: z.string().default("Professional services tailored to your needs. We show up on time, work with care, and stand behind everything we do."),
  aboutTitle: z.string().default("A Team You Can Count On."),
  aboutText: z.string().default("We built this business because we saw a need for reliable, honest professionals in our community. We don't cut corners or leave messes. When we make a commitment, we keep it."),
  servicesHeading: z.string().default("What We Offer"),
  servicesSubtitle: z.string().default("From small repairs to major projects, we bring professional tools and real expertise to every job."),
  phone: z.string(),
  email: z.string(),
  serviceArea: z.string(),
  services: z.array(ServiceSchema),
  galleries: z.array(GalleryItemSchema).default([
    { key: "interior", label: "Interior", description: "Indoor projects and finished spaces" },
    { key: "exterior", label: "Exterior", description: "Outdoor work and curb appeal projects" },
  ]),
  colorBg: hexColor.default("#0f172a"),
  colorText: hexColor.default("#f1f5f9"),
  colorAccent: hexColor.default("#2563eb"),
  colorHeader: hexColor.default("#0f172a"),
  colorTileBg: hexColor.default("#0f172a"),
  colorTileBorder: hexColor.default("#2563eb"),
  colorHeroBg: hexColor.default("#0f172a"),
  colorHeroText: hexColor.default("#f1f5f9"),
  colorServicesBg: hexColor.default("#f8fafc"),
  colorServicesText: hexColor.default("#0f172a"),
  colorServicesCardBg: hexColor.default("#ffffff"),
  colorAboutBg: hexColor.default("#ffffff"),
  colorAboutText: hexColor.default("#0f172a"),
  colorContactBg: hexColor.default("#ffffff"),
  colorContactText: hexColor.default("#0f172a"),
  colorContactCardBg: hexColor.default("#eff6ff"),
  colorContactIconBg: hexColor.default("#2563eb"),
  colorContactIconColor: hexColor.default("#ffffff"),
  colorGalleryBg: hexColor.default("#0f172a"),
  colorGalleryText: hexColor.default("#f1f5f9"),
  fontHeading: z.string().default("Playfair Display"),
  fontBody: z.string().default("Inter"),
  heroCta1Text: z.string().default("Get a Quote"),
  heroCta2Text: z.string().default("View Our Work"),
  galleryPageTitle: z.string().default("Our Work"),
  galleryPageSubtitle: z.string().default("Browse our completed project galleries."),
  sectionOrder: z.array(z.string()).default(["hero", "services", "about"]),
  showHero: z.boolean().default(true),
  showGalleries: z.boolean().default(true),
  showServices: z.boolean().default(true),
  showAbout: z.boolean().default(true),
  onboardingComplete: z.boolean().default(false),
});

type SiteSettings = z.infer<typeof SiteSettingsSchema>;

const DEFAULT_SETTINGS: SiteSettings = {
  companyName: "Your Business Name",
  navAcronym: "",
  tagline1: "Quality Work.",
  tagline2: "Done Right.",
  tagline3: "Every Time.",
  heroSubtitle: "Professional services tailored to your needs. We show up on time, work with care, and stand behind everything we do.",
  aboutTitle: "A Team You Can Count On.",
  aboutText: "We built this business because we saw a need for reliable, honest professionals in our community. We don't cut corners or leave messes. When we make a commitment, we keep it.",
  servicesHeading: "What We Offer",
  servicesSubtitle: "From small repairs to major projects, we bring professional tools and real expertise to every job.",
  phone: "(555) 000-0000",
  email: "hello@yourbusiness.com",
  serviceArea: "Your City, State",
  colorBg: "#0f172a",
  colorText: "#f1f5f9",
  colorAccent: "#2563eb",
  colorHeader: "#0f172a",
  colorTileBg: "#0f172a",
  colorTileBorder: "#2563eb",
  colorHeroBg: "#0f172a",
  colorHeroText: "#f1f5f9",
  colorServicesBg: "#f8fafc",
  colorServicesText: "#0f172a",
  colorServicesCardBg: "#ffffff",
  colorAboutBg: "#ffffff",
  colorAboutText: "#0f172a",
  colorContactBg: "#ffffff",
  colorContactText: "#0f172a",
  colorContactCardBg: "#eff6ff",
  colorGalleryBg: "#0f172a",
  colorGalleryText: "#f1f5f9",
  fontHeading: "Playfair Display",
  fontBody: "Inter",
  heroCta1Text: "Get a Quote",
  heroCta2Text: "View Our Work",
  sectionOrder: ["hero", "services", "about"],
  galleries: [
    { key: "interior", label: "Interior", description: "Indoor projects and finished spaces" },
    { key: "exterior", label: "Exterior", description: "Outdoor work and curb appeal projects" },
  ],
  services: [
    { title: "General Repairs", description: "Fixing what's broken. Door repairs, fixture installation, drywall patching, and everyday maintenance." },
    { title: "Painting", description: "Interior and exterior painting, trim work, deck staining, and touch-ups with attention to detail." },
    { title: "Pressure Washing", description: "Restore curb appeal. Driveways, siding, decks, patios, and walkways cleaned safely and thoroughly." },
    { title: "Carpentry & Woodwork", description: "Custom trim, molding, wainscoting, and minor wood repairs that add character to your space." },
    { title: "Deck & Fence Work", description: "Board replacement, structural reinforcement, sealing, and full restoration for outdoor spaces." },
    { title: "Gutter Cleaning", description: "Prevent water damage with thorough removal of leaves and debris, downspout flushing, and minor repairs." },
    { title: "Property Maintenance", description: "Recurring scheduled maintenance for landlords, property managers, and homeowners who want peace of mind." },
    { title: "Landscaping", description: "Shrub trimming, mulch installation, yard cleanup, and basic exterior aesthetic improvements." },
  ],
  showHero: true,
  showGalleries: true,
  showServices: true,
  showAbout: true,
  onboardingComplete: false,
};

export async function getCurrentSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(siteSettingsTable).where(eq(siteSettingsTable.id, 1));
  if (!row) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(row.data) as Record<string, unknown>;
    // Migration: existing installs predate onboardingComplete — if they have
    // a real company name already saved, treat onboarding as done.
    if (!("onboardingComplete" in parsed) && parsed.companyName && parsed.companyName !== DEFAULT_SETTINGS.companyName) {
      parsed.onboardingComplete = true;
    }
    const result = SiteSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...parsed });
    return result.success ? result.data : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function requireCsrfHeader(req: Request, res: Response, next: NextFunction): void {
  if (req.headers["x-csrf-protection"] === "1") { next(); return; }
  res.status(403).json({ error: "CSRF check failed" });
}

router.get("/settings", async (req: Request, res: Response) => {
  try {
    const settings = await getCurrentSettings();
    const [logoRow] = await db.select().from(siteImagesTable).where(eq(siteImagesTable.slot, "logo"));
    const logoUrl = logoRow ? `/api/storage${logoRow.objectPath}` : null;
    res.json({ ...settings, logoUrl });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching settings");
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.get("/admin/settings", requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = await getCurrentSettings();
    const [logoRow] = await db.select().from(siteImagesTable).where(eq(siteImagesTable.slot, "logo"));
    const logoUrl = logoRow ? `/api/storage${logoRow.objectPath}` : null;
    res.json({ ...settings, logoUrl });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching admin settings");
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.patch("/settings", requireAuth, requireCsrfHeader, async (req: Request, res: Response) => {
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
    const [logoRowPatch] = await db.select().from(siteImagesTable).where(eq(siteImagesTable.slot, "logo"));
    const logoUrlPatch = logoRowPatch ? `/api/storage${logoRowPatch.objectPath}` : null;
    res.json({ ...validated.data, logoUrl: logoUrlPatch });
  } catch (error) {
    req.log.error({ err: error }, "Error updating settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

router.post("/settings/reset", requireAuth, requireCsrfHeader, async (req: Request, res: Response) => {
  try {
    const dataStr = JSON.stringify(DEFAULT_SETTINGS);
    await db
      .insert(siteSettingsTable)
      .values({ id: 1, data: dataStr })
      .onConflictDoUpdate({
        target: siteSettingsTable.id,
        set: { data: dataStr, updatedAt: new Date() },
      });
    const [logoRowReset] = await db.select().from(siteImagesTable).where(eq(siteImagesTable.slot, "logo"));
    const logoUrlReset = logoRowReset ? `/api/storage${logoRowReset.objectPath}` : null;
    res.json({ ...DEFAULT_SETTINGS, logoUrl: logoUrlReset });
  } catch (error) {
    req.log.error({ err: error }, "Error resetting settings");
    res.status(500).json({ error: "Failed to reset settings" });
  }
});

export default router;

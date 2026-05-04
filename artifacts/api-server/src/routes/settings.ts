import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable, siteImagesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";

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

const TestimonialSchema = z.object({
  name: z.string(),
  location: z.string(),
  text: z.string(),
});

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const SiteSettingsSchema = z.object({
  companyName: z.string(),
  tagline1: z.string(),
  tagline2: z.string(),
  tagline3: z.string(),
  heroSubtitle: z.string().default("Professional services tailored to your needs. We show up on time, work with care, and stand behind everything we do."),
  aboutTitle: z.string().default("A Team You Can Count On."),
  aboutText: z.string().default("We built this business because we saw a need for reliable, honest professionals in our community. We don't cut corners or leave messes. When we make a commitment, we keep it."),
  aboutQuote: z.string().default("Good work isn't just about how it looks — it's about how it lasts."),
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
  testimonials: z.array(TestimonialSchema).default([
    { name: "Customer Name", location: "City, State", text: "Replace this with a real review from one of your happy customers. Testimonials build trust and help new visitors feel confident reaching out." },
    { name: "Customer Name", location: "City, State", text: "Add another review here. Ask satisfied customers to share their experience — even a few sentences makes a big difference." },
    { name: "Customer Name", location: "City, State", text: "A third testimonial rounds out this section. Consider including customers who highlight different services or aspects of your work." },
  ]),
  colorBg: hexColor.default("#0f172a"),
  colorText: hexColor.default("#f1f5f9"),
  colorAccent: hexColor.default("#2563eb"),
  colorHeader: hexColor.default("#0f172a"),
  showHero: z.boolean().default(true),
  showGalleries: z.boolean().default(true),
  showServices: z.boolean().default(true),
  showAbout: z.boolean().default(true),
  showTestimonials: z.boolean().default(true),
  setupComplete: z.boolean().default(false),
  adminEmail: z.string().default(""),
  adminPasswordHash: z.string().default(""),
});

type SiteSettings = z.infer<typeof SiteSettingsSchema>;

const DEFAULT_SETTINGS: SiteSettings = {
  companyName: "Your Business Name",
  tagline1: "Quality Work.",
  tagline2: "Done Right.",
  tagline3: "Every Time.",
  heroSubtitle: "Professional services tailored to your needs. We show up on time, work with care, and stand behind everything we do.",
  aboutTitle: "A Team You Can Count On.",
  aboutText: "We built this business because we saw a need for reliable, honest professionals in our community. We don't cut corners or leave messes. When we make a commitment, we keep it.",
  aboutQuote: "Good work isn't just about how it looks — it's about how it lasts.",
  servicesHeading: "What We Offer",
  servicesSubtitle: "From small repairs to major projects, we bring professional tools and real expertise to every job.",
  phone: "(555) 000-0000",
  email: "hello@yourbusiness.com",
  serviceArea: "Your City, State",
  colorBg: "#0f172a",
  colorText: "#f1f5f9",
  colorAccent: "#2563eb",
  colorHeader: "#0f172a",
  galleries: [
    { key: "interior", label: "Interior", description: "Indoor projects and finished spaces" },
    { key: "exterior", label: "Exterior", description: "Outdoor work and curb appeal projects" },
  ],
  testimonials: [
    { name: "Customer Name", location: "City, State", text: "Replace this with a real review from one of your happy customers. Testimonials build trust and help new visitors feel confident reaching out." },
    { name: "Customer Name", location: "City, State", text: "Add another review here. Ask satisfied customers to share their experience — even a few sentences makes a big difference." },
    { name: "Customer Name", location: "City, State", text: "A third testimonial rounds out this section. Consider including customers who highlight different services or aspects of your work." },
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
  showTestimonials: true,
  setupComplete: false,
  adminEmail: "",
  adminPasswordHash: "",
};

export async function getCurrentSettings(): Promise<SiteSettings> {
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
    const raw = await getCurrentSettings();
    // Strip private fields — never expose these to unauthenticated callers
    const { adminPasswordHash, adminEmail: _e, ...settings } = raw;
    // Fetch logo slot for the public navbar
    const [logoRow] = await db.select().from(siteImagesTable).where(eq(siteImagesTable.slot, "logo"));
    const logoUrl = logoRow ? `/api/storage${logoRow.objectPath}` : null;
    // Expose a safe boolean so the frontend knows whether admin setup is complete
    res.json({ ...settings, hasAdminPassword: Boolean(adminPasswordHash), logoUrl });
  } catch (error) {
    req.log.error({ err: error }, "Error fetching settings");
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.get("/admin/settings", requireAdminSession, async (req: Request, res: Response) => {
  try {
    const raw = await getCurrentSettings();
    const { adminPasswordHash: _h, ...settings } = raw;
    res.json(settings);
  } catch (error) {
    req.log.error({ err: error }, "Error fetching admin settings");
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
    const { adminPasswordHash: _h, ...safe } = validated.data;
    res.json(safe);
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

router.post("/settings/first-run", requireCsrfHeader, async (req: Request, res: Response) => {
  try {
    const current = await getCurrentSettings();

    // Allow unauthenticated first-run when:
    // 1. Setup has never been completed (!current.setupComplete), OR
    // 2. No admin password has been set yet (!current.adminPasswordHash) — covers the case
    //    where the wizard was run before the admin account step existed.
    // Once a password is configured, re-running setup requires an active admin session.
    const isFirstTime = !current.setupComplete || !current.adminPasswordHash;
    if (!isFirstTime && !req.session.isAdmin) {
      res.status(403).json({ error: "Please sign in to the admin panel before re-running setup." });
      return;
    }

    const rawBody = req.body as Record<string, unknown>;

    // Accept a plain adminPassword, hash it server-side, and discard the plain value.
    // When no password is set yet, a valid password is REQUIRED to complete setup.
    let adminPasswordHash = current.adminPasswordHash;
    const incomingPassword = rawBody.adminPassword;
    if (typeof incomingPassword === "string" && incomingPassword.length >= 8) {
      adminPasswordHash = await bcrypt.hash(incomingPassword, 12);
    } else if (!current.adminPasswordHash) {
      // No existing hash and no valid new password — refuse to complete first-run
      res.status(400).json({ error: "A password of at least 8 characters is required to complete setup." });
      return;
    }
    delete rawBody.adminPassword;
    delete rawBody.adminPasswordHash;

    const merged = {
      ...current,
      ...(rawBody as Partial<SiteSettings>),
      adminPasswordHash,
      setupComplete: true,
    };

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

    const { adminPasswordHash: savedHash, adminEmail: _e, ...safe } = validated.data;
    res.json({ ...safe, hasAdminPassword: Boolean(savedHash) });
  } catch (error) {
    req.log.error({ err: error }, "Error during first-run setup");
    res.status(500).json({ error: "Failed to save setup" });
  }
});

export default router;

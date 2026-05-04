import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEFAULT_SETTINGS = {
  companyName: "Your Business Name",
  tagline1: "Quality Work.",
  tagline2: "Done Right.",
  tagline3: "Every Time.",
  phone: "(555) 000-0000",
  email: "hello@yourbusiness.com",
  serviceArea: "Your City, State",
  services: [
    {
      title: "General Repairs",
      description:
        "Fixing what's broken. Door repairs, fixture installation, drywall patching, and everyday maintenance.",
    },
    {
      title: "Painting",
      description:
        "Interior and exterior painting, trim work, deck staining, and touch-ups with attention to detail.",
    },
    {
      title: "Pressure Washing",
      description:
        "Restore curb appeal. Driveways, siding, decks, patios, and walkways cleaned safely and thoroughly.",
    },
    {
      title: "Carpentry & Woodwork",
      description:
        "Custom trim, molding, wainscoting, and minor wood repairs that add character to your space.",
    },
    {
      title: "Deck & Fence Work",
      description:
        "Board replacement, structural reinforcement, sealing, and full restoration for outdoor spaces.",
    },
    {
      title: "Gutter Cleaning",
      description:
        "Prevent water damage with thorough removal of leaves and debris, downspout flushing, and minor repairs.",
    },
    {
      title: "Property Maintenance",
      description:
        "Recurring scheduled maintenance for landlords, property managers, and homeowners who want peace of mind.",
    },
    {
      title: "Landscaping",
      description:
        "Shrub trimming, mulch installation, yard cleanup, and basic exterior aesthetic improvements.",
    },
  ],
};

async function seed() {
  const data = JSON.stringify(DEFAULT_SETTINGS);
  await pool.query(
    `INSERT INTO site_settings (id, data) VALUES (1, $1)
     ON CONFLICT (id) DO NOTHING`,
    [data],
  );
  console.log("site_settings seeded with defaults (skipped if row exists)");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

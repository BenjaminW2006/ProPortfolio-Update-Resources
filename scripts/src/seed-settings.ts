import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DEFAULT_SETTINGS = {
  companyName: "Upstate Palmetto Property Services",
  tagline1: "Hard Work.",
  tagline2: "Done Right.",
  tagline3: "Every Time.",
  phone: "(864) 434-2842",
  email: "Upstate-Palmetto@outlook.com",
  serviceArea: "Upstate South Carolina",
  services: [
    {
      title: "General Handyman",
      description:
        "Fixing what's broken. Door repairs, fixture installation, drywall patching, and everyday maintenance around the house.",
    },
    {
      title: "Painting",
      description:
        "Interior and exterior painting, trim work, deck staining, and touch-ups with meticulous attention to detail.",
    },
    {
      title: "Pressure Washing",
      description:
        "Restore your home's curb appeal. Driveways, siding, decks, patios, and walkways cleaned safely and thoroughly.",
    },
    {
      title: "Carpentry & Woodwork",
      description:
        "Custom trim, crown molding, baseboards, wainscoting, and minor wood repairs that add character to your home.",
    },
    {
      title: "Deck & Fence Repair",
      description:
        "Board replacement, structural reinforcement, sealing, and complete restoration for your outdoor living spaces.",
    },
    {
      title: "Gutter Cleaning",
      description:
        "Prevent water damage. Thorough removal of leaves and debris, downspout flushing, and minor repairs.",
    },
    {
      title: "Property Maintenance",
      description:
        "Recurring scheduled maintenance for landlords, property managers, and homeowners who want peace of mind.",
    },
    {
      title: "Minor Landscaping",
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

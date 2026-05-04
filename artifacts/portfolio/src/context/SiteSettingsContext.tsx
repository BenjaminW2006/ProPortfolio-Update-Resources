import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

export interface ServiceItem {
  title: string;
  description: string;
}

export interface GalleryItem {
  key: string;
  label: string;
  description: string;
}

export interface SiteSettings {
  companyName: string;
  tagline1: string;
  tagline2: string;
  tagline3: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  aboutQuote: string;
  servicesHeading: string;
  servicesSubtitle: string;
  phone: string;
  email: string;
  serviceArea: string;
  services: ServiceItem[];
  galleries: GalleryItem[];
  colorBg: string;
  colorText: string;
  colorAccent: string;
  colorHeader: string;
  showHero: boolean;
  showGalleries: boolean;
  showServices: boolean;
  showAbout: boolean;
  setupComplete: boolean;
  adminEmail: string;
  hasAdminPassword: boolean;
  logoUrl: string | null;
}

export const DEFAULT_SETTINGS: SiteSettings = {
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
  galleries: [
    { key: "interior", label: "Interior", description: "Indoor projects and finished spaces" },
    { key: "exterior", label: "Exterior", description: "Outdoor work and curb appeal projects" },
  ],
  colorBg: "#0f172a",
  colorText: "#f1f5f9",
  colorAccent: "#2563eb",
  colorHeader: "#0f172a",
  showHero: true,
  showGalleries: true,
  showServices: true,
  showAbout: true,
  setupComplete: false,
  adminEmail: "",
  hasAdminPassword: false,
  logoUrl: null,
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return DEFAULT_SETTINGS;
      return res.json() as Promise<SiteSettings>;
    },
    staleTime: 60 * 1000,
    retry: false,
  });

  const settings = data ?? DEFAULT_SETTINGS;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--site-bg", settings.colorBg);
    root.style.setProperty("--site-text", settings.colorText);
    root.style.setProperty("--site-accent", settings.colorAccent);
    root.style.setProperty("--site-header", settings.colorHeader);
  }, [settings.colorBg, settings.colorText, settings.colorAccent, settings.colorHeader]);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}

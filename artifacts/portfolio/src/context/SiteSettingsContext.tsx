import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

export interface ServiceItem {
  title: string;
  description: string;
}

export interface SiteSettings {
  companyName: string;
  tagline1: string;
  tagline2: string;
  tagline3: string;
  phone: string;
  email: string;
  serviceArea: string;
  services: ServiceItem[];
  colorBg: string;
  colorText: string;
  colorAccent: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  companyName: "Upstate Palmetto Property Services",
  tagline1: "Hard Work.",
  tagline2: "Done Right.",
  tagline3: "Every Time.",
  phone: "(864) 434-2842",
  email: "Upstate-Palmetto@outlook.com",
  serviceArea: "Upstate South Carolina",
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
  colorBg: "#0f172a",
  colorText: "#f1f5f9",
  colorAccent: "#2563eb",
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
  }, [settings.colorBg, settings.colorText, settings.colorAccent]);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  navAcronym: string;
  tagline1: string;
  tagline2: string;
  tagline3: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
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
  colorTileBg: string;
  colorTileBorder: string;
  colorHeroBg: string;
  colorHeroText: string;
  colorServicesBg: string;
  colorServicesText: string;
  colorServicesCardBg: string;
  colorAboutBg: string;
  colorAboutText: string;
  colorContactBg: string;
  colorContactText: string;
  colorContactCardBg: string;
  colorGalleryBg: string;
  colorGalleryText: string;
  fontHeading: string;
  fontBody: string;
  heroCta1Text: string;
  heroCta2Text: string;
  sectionOrder: string[];
  showHero: boolean;
  showGalleries: boolean;
  showServices: boolean;
  showAbout: boolean;
  onboardingComplete: boolean;
  logoUrl: string | null;
}

export const DEFAULT_SETTINGS: SiteSettings = {
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
  showHero: true,
  showGalleries: true,
  showServices: true,
  showAbout: true,
  onboardingComplete: false,
  logoUrl: null,
};

const CACHE_KEY = "site-settings-cache";
const PREVIEW_KEY = "site-editor-preview";

function readCache(): SiteSettings | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SiteSettings) : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(settings: SiteSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {}
}

// Detect if this page is embedded in the visual editor iframe.
// SiteSettingsProvider mounts once at the app root, so checking the initial
// URL params is reliable even if the user navigates within the iframe later.
const isEditorFrame =
  typeof window !== "undefined" &&
  window !== window.top &&
  new URLSearchParams(window.location.search).has("editor");

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const cached = readCache();

  const { data } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return DEFAULT_SETTINGS;
      return res.json() as Promise<SiteSettings>;
    },
    placeholderData: cached ?? DEFAULT_SETTINGS,
    staleTime: 60 * 1000,
    retry: false,
  });

  // Live preview override — populated from localStorage when embedded in the editor.
  const [previewOverride, setPreviewOverride] = useState<Partial<SiteSettings>>(() => {
    if (!isEditorFrame) return {};
    try {
      const raw = localStorage.getItem(PREVIEW_KEY);
      return raw ? (JSON.parse(raw) as Partial<SiteSettings>) : {};
    } catch {
      return {};
    }
  });

  const settings = { ...DEFAULT_SETTINGS, ...(data ?? cached ?? {}), ...previewOverride };

  useEffect(() => {
    if (data) writeCache(data);
  }, [data]);

  // When in the editor iframe, listen for the admin panel writing new preview
  // settings to localStorage — storage events fire cross-window on same origin.
  useEffect(() => {
    if (!isEditorFrame) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== PREVIEW_KEY) return;
      try {
        setPreviewOverride(e.newValue ? (JSON.parse(e.newValue) as Partial<SiteSettings>) : {});
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--site-bg", settings.colorBg);
    root.style.setProperty("--site-text", settings.colorText);
    root.style.setProperty("--site-accent", settings.colorAccent);
    root.style.setProperty("--site-header", settings.colorHeader);
    root.style.setProperty("--site-tile-bg", settings.colorTileBg);
    root.style.setProperty("--site-tile-border", settings.colorTileBorder);
  }, [settings.colorBg, settings.colorText, settings.colorAccent, settings.colorHeader, settings.colorTileBg, settings.colorTileBorder]);

  useEffect(() => {
    const load = (family: string) => {
      if (!family) return;
      const id = `gfont-${family.replace(/\s+/g, "-")}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;700&display=swap`;
      document.head.appendChild(link);
    };
    load(settings.fontHeading);
    load(settings.fontBody);
    const root = document.documentElement;
    root.style.setProperty("--font-heading", `'${settings.fontHeading}', serif`);
    root.style.setProperty("--font-body", `'${settings.fontBody}', sans-serif`);
  }, [settings.fontHeading, settings.fontBody]);

  useEffect(() => {
    if (settings.companyName) {
      document.title = settings.companyName;
    }
  }, [settings.companyName]);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface ImageRecord {
  slot: string;
  objectPath: string;
}

function useCloudImage(slot: string, fallback: string): string {
  const { data } = useQuery<ImageRecord[]>({
    queryKey: ["images"],
    queryFn: async () => {
      const res = await fetch("/api/images");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const record = data?.find((r) => r.slot === slot);
  if (record) return `/api/storage${record.objectPath}`;
  return fallback;
}

export default function Hero() {
  const heroBg = useCloudImage("hero-bg", "/images/hero-bg.png");
  const settings = useSiteSettings();

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply z-10" />
        <img
          src={heroBg}
          alt="Professional work"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="container relative z-20 mx-auto px-4 md:px-6">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <CheckCircle2 className="w-4 h-4 text-site-accent" />
              <span>Locally Owned & Operated in {settings.serviceArea}</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 font-serif">
              {settings.tagline1} <br />
              {settings.tagline2} <br />
              <span className="text-site-accent">{settings.tagline3}</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl leading-relaxed">
              {settings.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-site-accent text-white text-lg h-14 px-8 hover:opacity-90" asChild>
                <a href="/contact">
                  Get a Free Quote <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg h-14 px-8 backdrop-blur-sm" asChild>
                <a href="#services">Our Services</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

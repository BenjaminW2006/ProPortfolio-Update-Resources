import { motion } from "framer-motion";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Hero() {
  const settings = useSiteSettings();

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      <div className="container relative z-20 mx-auto px-4 md:px-6">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 font-serif">
              {settings.tagline1} <br />
              {settings.tagline2} <br />
              <span className="text-site-accent">{settings.tagline3}</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl leading-relaxed">
              {settings.heroSubtitle}
            </p>

          </motion.div>
        </div>
      </div>
    </section>
  );
}

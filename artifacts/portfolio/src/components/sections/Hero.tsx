import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Hero() {
  const settings = useSiteSettings();
  const { heroCta1Text, heroCta2Text } = settings;

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

            {(heroCta1Text || heroCta2Text) && (
              <div className="flex flex-wrap gap-4">
                {heroCta1Text && (
                  <Link href="/contact">
                    <span className="inline-block px-8 py-3.5 rounded-lg font-semibold text-white bg-site-accent hover:opacity-90 transition-opacity cursor-pointer">
                      {heroCta1Text}
                    </span>
                  </Link>
                )}
                {heroCta2Text && (
                  <Link href="/gallery">
                    <span className="inline-block px-8 py-3.5 rounded-lg font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors cursor-pointer">
                      {heroCta2Text}
                    </span>
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

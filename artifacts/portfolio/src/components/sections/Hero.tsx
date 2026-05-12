import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { EditorSection } from "@/components/editor/EditorSection";

export default function Hero() {
  const settings = useSiteSettings();
  const { heroCta1Text, heroCta2Text } = settings;

  return (
    <EditorSection section="hero">
      <section
        id="hero"
        className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden"
        style={{ backgroundColor: "var(--site-hero-bg)", color: "var(--site-hero-text)" }}
      >
        <div className="container relative z-20 mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 font-serif" style={{ color: "var(--site-hero-text)" }}>
                {settings.tagline1} <br />
                {settings.tagline2} <br />
                <span style={{ color: "var(--site-accent)" }}>{settings.tagline3}</span>
              </h1>

              <p className="text-lg md:text-xl mb-8 max-w-2xl leading-relaxed opacity-80" style={{ color: "var(--site-hero-text)" }}>
                {settings.heroSubtitle}
              </p>

              {(heroCta1Text || heroCta2Text) && (
                <div className="flex flex-wrap gap-4">
                  {heroCta1Text && (
                    <Link href="/contact">
                      <span
                        className="inline-block px-8 py-3.5 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                        style={{ backgroundColor: "var(--site-accent)" }}
                      >
                        {heroCta1Text}
                      </span>
                    </Link>
                  )}
                  {heroCta2Text && (
                    <Link href="/gallery">
                      <span
                        className="inline-block px-8 py-3.5 rounded-lg font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                        style={{ borderColor: "color-mix(in srgb, var(--site-hero-text) 30%, transparent)", color: "var(--site-hero-text)" }}
                      >
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
    </EditorSection>
  );
}

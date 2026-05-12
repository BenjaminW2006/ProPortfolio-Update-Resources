import { motion } from "framer-motion";
import { Link } from "wouter";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { EditorSection } from "@/components/editor/EditorSection";

export default function Hero() {
  const settings = useSiteSettings();
  const { heroCta1Text, heroCta2Text, colorHeroBg, colorHeroText, colorAccent } = settings;

  return (
    <EditorSection section="hero">
      <section
        id="hero"
        className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden"
        style={{ backgroundColor: colorHeroBg, color: colorHeroText }}
      >
        <div className="container relative z-20 mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 font-serif" style={{ color: colorHeroText }}>
                {settings.tagline1} <br />
                {settings.tagline2} <br />
                <span style={{ color: colorAccent }}>{settings.tagline3}</span>
              </h1>

              <p className="text-lg md:text-xl mb-8 max-w-2xl leading-relaxed opacity-80" style={{ color: colorHeroText }}>
                {settings.heroSubtitle}
              </p>

              {(heroCta1Text || heroCta2Text) && (
                <div className="flex flex-wrap gap-4">
                  {heroCta1Text && (
                    <Link href="/contact">
                      <span
                        className="inline-block px-8 py-3.5 rounded-lg font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                        style={{ backgroundColor: colorAccent }}
                      >
                        {heroCta1Text}
                      </span>
                    </Link>
                  )}
                  {heroCta2Text && (
                    <Link href="/gallery">
                      <span
                        className="inline-block px-8 py-3.5 rounded-lg font-semibold border hover:opacity-80 transition-opacity cursor-pointer"
                        style={{ borderColor: `${colorHeroText}4d`, color: colorHeroText }}
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

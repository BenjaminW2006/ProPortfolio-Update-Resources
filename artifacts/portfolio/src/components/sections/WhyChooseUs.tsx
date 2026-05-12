import { motion } from "framer-motion";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { EditorSection } from "@/components/editor/EditorSection";

export default function WhyChooseUs() {
  const { aboutTitle, aboutText, colorAboutBg, colorAboutText } = useSiteSettings();

  return (
    <EditorSection section="about">
      <section
        id="why-choose-us"
        className="py-24"
        style={{ backgroundColor: colorAboutBg, color: colorAboutText }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif" style={{ color: colorAboutText }}>
              {aboutTitle}
            </h2>
            <p className="text-lg leading-relaxed opacity-75" style={{ color: colorAboutText }}>
              {aboutText}
            </p>
          </motion.div>
        </div>
      </section>
    </EditorSection>
  );
}

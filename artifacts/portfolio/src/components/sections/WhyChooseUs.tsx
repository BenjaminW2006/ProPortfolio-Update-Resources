import { motion } from "framer-motion";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function WhyChooseUs() {
  const { aboutTitle, aboutText } = useSiteSettings();

  return (
    <section id="why-choose-us" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-serif">
            {aboutTitle}
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            {aboutText}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

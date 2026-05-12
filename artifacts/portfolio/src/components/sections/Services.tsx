import { motion } from "framer-motion";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { EditorSection } from "@/components/editor/EditorSection";

export default function Services() {
  const { services, servicesHeading, servicesSubtitle } = useSiteSettings();

  return (
    <EditorSection section="services">
      <section
        id="services"
        className="py-24"
        style={{ backgroundColor: "var(--site-services-bg)", color: "var(--site-services-text)" }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold mb-4 font-serif"
              style={{ color: "var(--site-services-text)" }}
            >
              {servicesHeading}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg opacity-70"
              style={{ color: "var(--site-services-text)" }}
            >
              {servicesSubtitle}
            </motion.p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
                className="p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow group w-full sm:w-72"
                style={{
                  backgroundColor: "var(--site-services-card-bg)",
                  borderColor: "color-mix(in srgb, var(--site-services-text) 10%, transparent)",
                }}
              >
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--site-services-text)" }}>{service.title}</h3>
                <p className="leading-relaxed opacity-70" style={{ color: "var(--site-services-text)" }}>{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </EditorSection>
  );
}

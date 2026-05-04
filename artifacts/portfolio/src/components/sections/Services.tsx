import { motion } from "framer-motion";
import { Wrench, PaintRoller, Droplets, Hammer, Home, CheckSquare, Shovel, Scissors, Settings } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const ICONS = [
  <Wrench className="w-8 h-8" />,
  <PaintRoller className="w-8 h-8" />,
  <Droplets className="w-8 h-8" />,
  <Hammer className="w-8 h-8" />,
  <Home className="w-8 h-8" />,
  <Shovel className="w-8 h-8" />,
  <CheckSquare className="w-8 h-8" />,
  <Scissors className="w-8 h-8" />,
  <Settings className="w-8 h-8" />,
];

export default function Services() {
  const { services } = useSiteSettings();

  return (
    <section id="services" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif"
          >
            No Job Too Small. <br className="md:hidden" /> Every Job Done Right.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-600"
          >
            We handle the punch list so you can enjoy your weekend. From structural fixes to aesthetic upgrades, we bring professional tools and expertise to every project.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index % 4) * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
            >
              <div className="service-icon w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                {ICONS[index % ICONS.length]}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
              <p className="text-slate-600 leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

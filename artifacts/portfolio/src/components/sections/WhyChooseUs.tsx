import { motion } from "framer-motion";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function WhyChooseUs() {
  const { aboutTitle, aboutText, aboutQuote } = useSiteSettings();

  return (
    <section id="why-choose-us" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-serif">
                {aboutTitle}
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                {aboutText}
              </p>
            </motion.div>
          </div>

          <div className="lg:w-1/2 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src="/images/carpentry.png"
                alt="Quality work in progress"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-8">
                <p className="text-white font-medium text-lg">"{aboutQuote}"</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

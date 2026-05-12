import { motion } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Portfolio() {
  const { galleries = [] } = useSiteSettings();

  return (
    <section id="portfolio" className="py-24 bg-site text-site">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {galleries.map((gallery, i) => (
            <motion.div
              key={gallery.key}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Link href={`/gallery/${gallery.key}`}>
                <span
                  className="group relative flex flex-col items-center justify-center aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer bg-site-tile border-4 border-site-tile focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 transition-opacity duration-300 hover:opacity-90"
                  aria-label={`Open ${gallery.label} gallery`}
                >
                  <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-3 group-hover:-translate-y-1 transition-transform duration-300">
                    {gallery.label}
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-site-accent text-sm font-medium group-hover:-translate-y-1 transition-transform duration-300 delay-[20ms]">
                    View gallery
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

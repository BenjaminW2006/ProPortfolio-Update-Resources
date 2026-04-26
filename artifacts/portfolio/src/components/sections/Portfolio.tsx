import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

interface ImageRecord {
  slot: string;
  objectPath: string;
}

const PROJECTS = [
  {
    slot: "project-deck-restoration",
    title: "Deck Restoration",
    category: "Carpentry & Staining",
    fallback: "/images/deck-repair.png",
  },
  {
    slot: "project-exterior-paint",
    title: "Exterior House Painting",
    category: "Painting",
    fallback: "/images/exterior-paint.png",
  },
  {
    slot: "project-driveway-cleaning",
    title: "Driveway Cleaning",
    category: "Pressure Washing",
    fallback: "/images/pressure-washing.png",
  },
  {
    slot: "project-custom-trim",
    title: "Custom Trim Work",
    category: "Carpentry",
    fallback: "/images/carpentry.png",
  },
];

export default function Portfolio() {
  const { data: images = [] } = useQuery<ImageRecord[]>({
    queryKey: ["images"],
    queryFn: async () => {
      const res = await fetch("/api/images");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const imageMap = Object.fromEntries(images.map((img) => [img.slot, img]));

  function getImageSrc(slot: string, fallback: string): string {
    const record = imageMap[slot];
    if (record) return `/api/storage${record.objectPath}`;
    return fallback;
  }

  return (
    <section id="portfolio" className="min-h-screen bg-slate-900 text-white pt-28 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-blue-400 font-medium tracking-widest uppercase text-sm mb-4"
          >
            Our Work
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 font-serif"
          >
            Proof is in the Property.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Take a look at some of our recent projects around the Upstate area. We take pride in delivering clean, professional results every time.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {PROJECTS.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-slate-800"
            >
              <img
                src={getImageSrc(project.slot, project.fallback)}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

              <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                <span className="text-blue-400 font-medium text-sm tracking-wider uppercase mb-2 block">
                  {project.category}
                </span>
                <h3 className="text-2xl font-bold text-white">
                  {project.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

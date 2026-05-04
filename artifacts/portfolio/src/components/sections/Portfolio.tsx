import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface Project {
  id: number;
  name: string;
  category: string | null;
  coverObjectPath: string | null;
}

interface ImageSlot {
  slot: string;
  objectPath: string;
}

function getImageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

export default function Portfolio() {
  const { galleries = [] } = useSiteSettings();

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: imageSlots = [] } = useQuery<ImageSlot[]>({
    queryKey: ["tile-images"],
    queryFn: async () => {
      const res = await fetch("/api/images");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  function getCover(key: string, slot: string): string | null {
    const slotMatch = imageSlots.find((s) => s.slot === slot);
    if (slotMatch) return getImageUrl(slotMatch.objectPath);
    const projectMatch = projects.find((p) => p.category === key && p.coverObjectPath);
    return projectMatch?.coverObjectPath ? getImageUrl(projectMatch.coverObjectPath) : null;
  }

  function getCount(key: string): number {
    return projects.filter((p) => p.category === key).length;
  }

  return (
    <section id="portfolio" className="py-24 bg-site text-site">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {galleries.map((gallery, i) => {
            const slot = `tile-${gallery.key}`;
            const cover = getCover(gallery.key, slot);
            const count = getCount(gallery.key);

            return (
              <motion.div
                key={gallery.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <Link href={`/gallery/${gallery.key}`}>
                  <span
                    className="group relative block aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label={`Open ${gallery.label} gallery`}
                  >
                    {cover ? (
                      <img
                        src={cover}
                        alt={gallery.label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-site" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                      <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-4 group-hover:-translate-y-1 transition-transform duration-300">
                        {gallery.label}
                      </h2>
                      <span className="inline-flex items-center gap-2 text-site-accent text-sm font-medium group-hover:-translate-y-1 transition-transform duration-300 delay-[20ms]">
                        {count > 0 ? `View ${count} project${count !== 1 ? "s" : ""}` : "View gallery"}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

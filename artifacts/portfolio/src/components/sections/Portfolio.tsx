import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

interface ImageRecord {
  slot: string;
  objectPath: string;
}

const CATEGORIES = [
  {
    key: "interior",
    label: "Interior",
    description: "Kitchen, bathroom, trim, and indoor projects",
    slots: Array.from({ length: 6 }, (_, i) => `interior-${i + 1}`),
  },
  {
    key: "exterior",
    label: "Exterior",
    description: "Decks, siding, painting, and outdoor work",
    slots: Array.from({ length: 6 }, (_, i) => `exterior-${i + 1}`),
  },
] as const;

export default function Portfolio() {
  const { data: imageRecords = [] } = useQuery<ImageRecord[]>({
    queryKey: ["images"],
    queryFn: async () => {
      const res = await fetch("/api/images");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const imageMap = Object.fromEntries(
    imageRecords.map((r) => [r.slot, `/api/storage${r.objectPath}`])
  );

  function getCoverImage(slots: readonly string[]): string | null {
    for (const slot of slots) {
      if (imageMap[slot]) return imageMap[slot];
    }
    return null;
  }

  function getCount(slots: readonly string[]): number {
    return slots.filter((slot) => imageMap[slot]).length;
  }

  return (
    <section id="portfolio" className="min-h-screen bg-slate-900 text-white pt-28 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {CATEGORIES.map((category, i) => {
            const cover = getCoverImage(category.slots);
            const count = getCount(category.slots);

            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <Link href={`/gallery/${category.key}`}>
                  <span className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                    {cover ? (
                      <img
                        src={cover}
                        alt={category.label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-slate-800" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/90" />

                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                      <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-2 group-hover:-translate-y-1 transition-transform duration-300">
                        {category.label}
                      </h2>
                      <p className="text-slate-300 text-sm mb-4 group-hover:-translate-y-1 transition-transform duration-300 delay-[20ms]">
                        {category.description}
                      </p>
                      <span className="inline-flex items-center gap-2 text-blue-300 text-sm font-medium group-hover:-translate-y-1 transition-transform duration-300 delay-[40ms]">
                        {count > 0 ? `View ${count} photo${count !== 1 ? "s" : ""}` : "View gallery"}
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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

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

function Gallery({
  label,
  images,
  onClose,
}: {
  label: string;
  images: string[];
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white text-xl font-semibold font-serif">{label}</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          aria-label="Close gallery"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {images.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
          <ImageIcon className="w-14 h-14" />
          <p className="text-lg">No images uploaded yet</p>
          <p className="text-sm text-slate-600">Add images from the admin dashboard</p>
        </div>
      ) : (
        <div
          className="flex-1 flex flex-col items-center justify-center p-4 gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-4xl flex items-center justify-center">
            {images.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-0 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
            )}

            <AnimatePresence mode="wait">
              <motion.img
                key={current}
                src={images[current]}
                alt={`${label} photo ${current + 1}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </AnimatePresence>

            {images.length > 1 && (
              <button
                onClick={next}
                className="absolute right-0 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-center max-w-4xl">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === current ? "border-blue-400 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <p className="text-slate-500 text-sm">
            {current + 1} / {images.length}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function Portfolio() {
  const [openCategory, setOpenCategory] = useState<(typeof CATEGORIES)[number] | null>(null);

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

  function getCategoryImages(slots: readonly string[]): string[] {
    return slots.flatMap((slot) => (imageMap[slot] ? [imageMap[slot]] : []));
  }

  function getCoverImage(slots: readonly string[]): string | null {
    for (const slot of slots) {
      if (imageMap[slot]) return imageMap[slot];
    }
    return null;
  }

  const openGallery = (category: (typeof CATEGORIES)[number]) => {
    setOpenCategory(category);
  };

  return (
    <section id="portfolio" className="min-h-screen bg-slate-900 text-white pt-28 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {CATEGORIES.map((category, i) => {
            const cover = getCoverImage(category.slots);
            const count = getCategoryImages(category.slots).length;

            return (
              <motion.button
                key={category.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                onClick={() => openGallery(category)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label={`Open ${category.label} gallery`}
              >
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
                  <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-2 group-hover:translate-y-[-4px] transition-transform duration-300">
                    {category.label}
                  </h2>
                  <p className="text-slate-300 text-sm mb-4 group-hover:translate-y-[-4px] transition-transform duration-300 delay-[20ms]">
                    {category.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-blue-300 text-sm font-medium group-hover:translate-y-[-4px] transition-transform duration-300 delay-[40ms]">
                    {count > 0 ? `View ${count} photo${count !== 1 ? "s" : ""}` : "View gallery"}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {openCategory && (
          <Gallery
            label={openCategory.label}
            images={getCategoryImages(openCategory.slots)}
            onClose={() => setOpenCategory(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

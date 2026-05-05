import { useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X, ImageIcon, ArrowLeft, Calendar } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface ProjectImage {
  id: number;
  objectPath: string;
  uploadedAt?: string;
  label?: "before" | "after" | null;
}

interface ProjectDetail {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  category: "interior" | "exterior" | null;
  coverObjectPath: string | null;
  createdAt: string;
  images: ProjectImage[];
}

function getImageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  }
  return raw;
}

function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c + 1) % images.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      <div
        className="flex items-center justify-end px-6 py-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div
        className="flex-1 flex flex-col items-center justify-center p-4 gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-5xl flex items-center justify-center">
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
              alt={`Photo ${current + 1}`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl"
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
                  i === current
                    ? "border-blue-400 opacity-100"
                    : "border-transparent opacity-50 hover:opacity-80"
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
    </motion.div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: project, isLoading, isError } = useQuery<ProjectDetail>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Project not found");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!projectId,
  });

  const labelOrder = (l?: "before" | "after" | null) => l === "before" ? 0 : l === "after" ? 2 : 1;
  const sortedImages = project
    ? [...project.images].sort((a, b) => labelOrder(a.label) - labelOrder(b.label))
    : [];
  const allImages: string[] = sortedImages.map((img) => getImageUrl(img.objectPath));

  const backHref =
    project?.category === "interior" ? "/gallery/interior" :
    project?.category === "exterior" ? "/gallery/exterior" :
    "/gallery";

  const backLabel =
    project?.category === "interior" ? "Interior Projects" :
    project?.category === "exterior" ? "Exterior Projects" :
    "All Projects";

  return (
    <div className="min-h-screen bg-site text-site flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <Link href={backHref}>
            <span className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer mb-8">
              <ArrowLeft className="w-4 h-4" />
              {backLabel}
            </span>
          </Link>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError || !project ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-600 gap-4">
              <ImageIcon className="w-16 h-16" />
              <p className="text-xl">Project not found</p>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">{project.name}</h1>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-400 text-base mb-4">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    {formatDate(project.date)}
                  </span>
                </div>
                {project.description && (
                  <p className="text-slate-300 text-lg max-w-3xl leading-relaxed">{project.description}</p>
                )}
              </div>

              {allImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-600 gap-4">
                  <ImageIcon className="w-16 h-16" />
                  <p className="text-xl">No photos yet</p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.06 } },
                  }}
                >
                  {sortedImages.map((img, i) => (
                    <motion.button
                      key={img.id}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                      }}
                      onClick={() => setLightboxIndex(i)}
                      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 border border-slate-700"
                      aria-label={`View photo ${i + 1}`}
                    >
                      <img
                        src={getImageUrl(img.objectPath)}
                        alt={`${project.name} photo ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      {img.label && (
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
                          img.label === "before"
                            ? "bg-amber-500/90 text-white"
                            : "bg-emerald-500/90 text-white"
                        }`}>
                          {img.label === "before" ? "Before" : "After"}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {lightboxIndex !== null && allImages.length > 0 && (
          <Lightbox
            images={allImages}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

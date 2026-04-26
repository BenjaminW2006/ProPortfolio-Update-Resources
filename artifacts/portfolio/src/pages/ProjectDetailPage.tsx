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
}

interface ProjectDetail {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  coverObjectPath: string | null;
  createdAt: string;
  images: ProjectImage[];
}

function getImageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
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

  const allImages: string[] = project
    ? project.images.map((img) => getImageUrl(img.objectPath))
    : [];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <Link href="/gallery">
            <span className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer mb-8">
              <ArrowLeft className="w-4 h-4" />
              All Projects
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
                    {project.date}
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
                  {allImages.map((src, i) => (
                    <motion.button
                      key={i}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                      }}
                      onClick={() => setLightboxIndex(i)}
                      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      aria-label={`View photo ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt={`${project.name} photo ${i + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
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

import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, MapPin, Calendar } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Project {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  coverObjectPath: string | null;
  createdAt: string;
}

function getImageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

export default function GalleryPage() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold font-serif">Our Work</h1>
            <p className="text-slate-400 mt-3 text-lg">Browse completed projects from Upstate Palmetto Property Services.</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-600 gap-4">
              <ImageIcon className="w-16 h-16" />
              <p className="text-xl">No projects yet</p>
              <p className="text-sm text-slate-700">Check back soon for completed work.</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.07 } },
              }}
            >
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                  }}
                >
                  <Link href={`/gallery/project/${project.id}`}>
                    <span className="group block rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                        {project.coverObjectPath ? (
                          <img
                            src={getImageUrl(project.coverObjectPath)}
                            alt={project.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700">
                            <ImageIcon className="w-14 h-14" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>
                      <div className="p-5">
                        <h2 className="text-lg font-semibold font-serif text-white group-hover:text-blue-300 transition-colors">
                          {project.name}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-sm">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {project.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {project.location}
                          </span>
                        </div>
                      </div>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

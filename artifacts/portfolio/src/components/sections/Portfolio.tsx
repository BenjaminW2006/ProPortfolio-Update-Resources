import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronRight, ImageIcon, MapPin, Calendar } from "lucide-react";

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

export default function Portfolio() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const recent = projects.slice(0, 4);

  return (
    <section id="portfolio" className="min-h-screen bg-slate-900 text-white pt-28 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold font-serif">Our Work</h2>
          </div>
          {projects.length > 0 && (
            <Link href="/gallery">
              <span className="hidden sm:inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium cursor-pointer">
                View all projects
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-700 gap-4">
            <ImageIcon className="w-16 h-16" />
            <p className="text-xl text-slate-600">No projects yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {recent.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link href={`/gallery/project/${project.id}`}>
                    <span className="group block rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                        {project.coverObjectPath ? (
                          <img
                            src={getImageUrl(project.coverObjectPath)}
                            alt={project.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-700">
                            <ImageIcon className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white font-semibold font-serif text-lg leading-tight group-hover:text-blue-300 transition-colors">
                            {project.name}
                          </h3>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-sm">
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
            </div>

            {projects.length > 4 && (
              <div className="mt-10 text-center">
                <Link href="/gallery">
                  <span className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer">
                    View all {projects.length} projects
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

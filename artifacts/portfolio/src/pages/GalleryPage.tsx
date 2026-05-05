import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Calendar, ArrowLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface Project {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  category: string | null;
  coverObjectPath: string | null;
  createdAt: string;
}

interface ImageSlot {
  slot: string;
  objectPath: string;
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

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
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
            <h2 className="text-lg font-semibold font-serif text-white group-hover:text-site-accent transition-colors">
              {project.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {formatDate(project.date)}
              </span>
            </div>
          </div>
        </span>
      </Link>
    </motion.div>
  );
}

function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
    >
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </motion.div>
  );
}

function GalleryIndex({
  galleries,
  projects,
  imageSlots,
}: {
  galleries: Array<{ key: string; label: string; description: string }>;
  projects: Project[];
  imageSlots: ImageSlot[];
}) {
  function getCover(key: string): string | null {
    const slotMatch = imageSlots.find((s) => s.slot === `tile-${key}`);
    if (slotMatch) return getImageUrl(slotMatch.objectPath);
    const projectMatch = projects.find((p) => p.category === key && p.coverObjectPath);
    return projectMatch?.coverObjectPath ? getImageUrl(projectMatch.coverObjectPath) : null;
  }

  function getCount(key: string): number {
    return projects.filter((p) => p.category === key).length;
  }

  if (galleries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-600 gap-4">
        <ImageIcon className="w-16 h-16" />
        <p className="text-xl">No galleries yet</p>
        <p className="text-sm text-slate-700">Check back soon for completed work.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {galleries.map((gallery, i) => {
        const cover = getCover(gallery.key);
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
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800" />
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
  );
}

export default function GalleryPage({ category }: { category?: string }) {
  const { galleries = [], companyName } = useSiteSettings();

  const { data: allProjects = [], isLoading: projectsLoading } = useQuery<Project[]>({
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

  const gallery = galleries.find((g) => g.key === category);
  const filteredProjects = category
    ? allProjects.filter((p) => p.category === category)
    : allProjects;

  const heading = gallery ? gallery.label : "Our Work";
  const sub = gallery
    ? gallery.description
    : `Browse our completed project galleries.`;

  const isLoading = projectsLoading;

  return (
    <div className="min-h-screen bg-site text-site flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          {category && (
            <Link href="/gallery">
              <span className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer mb-8">
                <ArrowLeft className="w-4 h-4" />
                All Galleries
              </span>
            </Link>
          )}

          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold font-serif">{heading}</h1>
            {!category && (
              <p className="text-slate-400 mt-3 text-lg">
                {`Browse completed projects from ${companyName}.`}
              </p>
            )}
            {gallery?.description && (
              <p className="text-slate-400 mt-3 text-lg">{gallery.description}</p>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-site-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : category ? (
            filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-600 gap-4">
                <ImageIcon className="w-16 h-16" />
                <p className="text-xl">No projects yet</p>
                <p className="text-sm text-slate-700">Check back soon for completed work.</p>
              </div>
            ) : (
              <ProjectGrid projects={filteredProjects} />
            )
          ) : (
            <GalleryIndex
              galleries={galleries}
              projects={allProjects}
              imageSlots={imageSlots}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

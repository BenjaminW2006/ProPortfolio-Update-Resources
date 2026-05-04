import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Calendar, ArrowLeft } from "lucide-react";
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
        <span className="group block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-2xl">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 group-hover:border-slate-500 transition-colors">
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
          <div className="mt-3 px-1">
            <h2 className="text-base font-semibold font-serif text-white group-hover:text-site-accent transition-colors truncate">
              {project.name}
            </h2>
            <span className="flex items-center gap-1.5 text-slate-400 text-sm mt-0.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {formatDate(project.date)}
            </span>
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

function ProjectGroups({ projects, galleryOrder }: { projects: Project[]; galleryOrder: Array<{ key: string; label: string }> }) {
  const grouped: Record<string, Project[]> = {};
  for (const p of projects) {
    const key = p.category ?? "uncategorized";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  const sections: Array<{ key: string; label: string; items: Project[] }> = [
    ...galleryOrder
      .filter((g) => grouped[g.key]?.length > 0)
      .map((g) => ({ key: g.key, label: g.label, items: grouped[g.key] })),
    ...(grouped.uncategorized?.length > 0
      ? [{ key: "uncategorized", label: "Other Projects", items: grouped.uncategorized }]
      : []),
  ];

  if (sections.length === 1 && sections[0].key !== "uncategorized") {
    return <ProjectGrid projects={sections[0].items} />;
  }

  return (
    <div className="space-y-16">
      {sections.map((section) => (
        <div key={section.key}>
          <h2 className="text-2xl font-bold font-serif mb-6 text-site">{section.label}</h2>
          <ProjectGrid projects={section.items} />
        </div>
      ))}
    </div>
  );
}

export default function GalleryPage({ category }: { category?: string }) {
  const { galleries = [], companyName } = useSiteSettings();

  const { data: allProjects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const projects = category
    ? allProjects.filter((p) => p.category === category)
    : allProjects;

  const gallery = galleries.find((g) => g.key === category);
  const heading = gallery ? gallery.label : "Our Work";
  const sub = gallery
    ? gallery.description
    : `Browse completed projects from ${companyName}.`;

  return (
    <div className="min-h-screen bg-site text-site flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          {category && (
            <Link href="/">
              <span className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm cursor-pointer mb-8">
                <ArrowLeft className="w-4 h-4" />
                Home
              </span>
            </Link>
          )}
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold font-serif">{heading}</h1>
            <p className="text-slate-400 mt-3 text-lg">{sub}</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-site-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-600 gap-4">
              <ImageIcon className="w-16 h-16" />
              <p className="text-xl">No projects yet</p>
              <p className="text-sm text-slate-700">Check back soon for completed work.</p>
            </div>
          ) : category ? (
            <ProjectGrid projects={projects} />
          ) : (
            <ProjectGroups projects={projects} galleryOrder={galleries} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

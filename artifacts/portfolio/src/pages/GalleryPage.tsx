import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, Calendar } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Project {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  category: "interior" | "exterior" | null;
  coverObjectPath: string | null;
  createdAt: string;
}

const CATEGORY_ORDER = ["interior", "exterior"] as const;
const CATEGORY_LABELS: Record<string, string> = { interior: "Interior", exterior: "Exterior" };

function getImageUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
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
            <h2 className="text-lg font-semibold font-serif text-white group-hover:text-blue-300 transition-colors">
              {project.name}
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {project.date}
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

function ProjectGroups({ projects }: { projects: Project[] }) {
  const grouped: Record<string, Project[]> = { interior: [], exterior: [], uncategorized: [] };
  for (const p of projects) {
    const key = p.category ?? "uncategorized";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  const sections: Array<{ key: string; label: string; items: Project[] }> = [
    ...CATEGORY_ORDER
      .filter((k) => grouped[k]?.length > 0)
      .map((k) => ({ key: k, label: CATEGORY_LABELS[k], items: grouped[k] })),
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
          <h2 className="text-2xl font-bold font-serif mb-6 text-white">{section.label}</h2>
          <ProjectGrid projects={section.items} />
        </div>
      ))}
    </div>
  );
}

const CATEGORY_TITLES: Record<string, { heading: string; sub: string }> = {
  interior: { heading: "Interior Projects", sub: "Indoor work completed by Upstate Palmetto Property Services." },
  exterior: { heading: "Exterior Projects", sub: "Outdoor work completed by Upstate Palmetto Property Services." },
};

export default function GalleryPage({ category }: { category?: "interior" | "exterior" }) {
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

  const { heading, sub } = category
    ? CATEGORY_TITLES[category]
    : { heading: "Our Work", sub: "Browse completed projects from Upstate Palmetto Property Services." };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold font-serif">{heading}</h1>
            <p className="text-slate-400 mt-3 text-lg">{sub}</p>
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
          ) : category ? (
            <ProjectGrid projects={projects} />
          ) : (
            <ProjectGroups projects={projects} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

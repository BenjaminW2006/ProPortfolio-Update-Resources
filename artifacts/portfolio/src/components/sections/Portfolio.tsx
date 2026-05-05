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
      </div>
    </section>
  );
}

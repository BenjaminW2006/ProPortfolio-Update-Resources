import { motion } from "framer-motion";
import { Link } from "wouter";
import { Home, TreePine } from "lucide-react";

const tiles = [
  {
    label: "Interior",
    href: "/gallery/interior",
    icon: Home,
    description: "Drywall, painting, trim, flooring, and more",
    gradient: "from-slate-800 to-slate-900",
    accent: "group-hover:text-blue-300",
    border: "hover:border-blue-500/50",
  },
  {
    label: "Exterior",
    href: "/gallery/exterior",
    icon: TreePine,
    description: "Decks, siding, pressure washing, landscaping, and more",
    gradient: "from-slate-800 to-slate-900",
    accent: "group-hover:text-emerald-300",
    border: "hover:border-emerald-500/50",
  },
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="min-h-screen bg-slate-900 text-white pt-28 pb-24 flex items-center">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-serif">Our Work</h2>
          <p className="text-slate-400 mt-3 text-lg">Tap a category to browse completed projects.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {tiles.map((tile, i) => {
            const Icon = tile.icon;
            return (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <Link href={tile.href}>
                  <span
                    className={`group block rounded-3xl overflow-hidden bg-gradient-to-br ${tile.gradient} border border-slate-700 ${tile.border} transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 shadow-xl hover:shadow-2xl hover:-translate-y-1`}
                  >
                    <div className="flex flex-col items-center justify-center py-20 px-8 gap-5 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-slate-700/60 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-slate-300" />
                      </div>
                      <div>
                        <h3 className={`text-3xl font-bold font-serif text-white ${tile.accent} transition-colors`}>
                          {tile.label}
                        </h3>
                        <p className="text-slate-400 mt-2 text-sm leading-relaxed">{tile.description}</p>
                      </div>
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

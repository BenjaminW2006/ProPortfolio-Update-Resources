import { motion } from "framer-motion";
import logo from "@assets/Upstate_Palmetto_Property_Services_Logo_(1)_1777217420385.png";

const projects = [
  {
    title: "Deck Restoration",
    category: "Carpentry & Staining",
    image: "/images/deck-repair.png"
  },
  {
    title: "Exterior House Painting",
    category: "Painting",
    image: "/images/exterior-paint.png"
  },
  {
    title: "Driveway Cleaning",
    category: "Pressure Washing",
    image: "/images/pressure-washing.png"
  },
  {
    title: "Custom Trim Work",
    category: "Carpentry",
    image: "/images/carpentry.png"
  }
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="relative min-h-screen bg-slate-900 text-white pt-28 pb-24 overflow-hidden">
      {/* Palm tree background watermark */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[900px] max-w-none opacity-[0.12]"
          style={{ filter: "brightness(0) invert(1)", mixBlendMode: "overlay" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-blue-400 font-medium tracking-widest uppercase text-sm mb-4"
          >
            Our Work
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6 font-serif"
          >
            Proof is in the Property.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            Take a look at some of our recent projects around the Upstate area. We take pride in delivering clean, professional results every time.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-slate-800"
            >
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

              <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                <span className="text-blue-400 font-medium text-sm tracking-wider uppercase mb-2 block">
                  {project.category}
                </span>
                <h3 className="text-2xl font-bold text-white">
                  {project.title}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

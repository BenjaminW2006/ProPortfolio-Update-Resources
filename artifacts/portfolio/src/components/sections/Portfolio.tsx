import { motion } from "framer-motion";

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
    <section id="portfolio" className="py-24 bg-slate-900 text-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold mb-4 font-serif"
          >
            Proof is in the Property.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            Take a look at some of our recent projects around the Upstate area. We take pride in delivering clean, professional results every time.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
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

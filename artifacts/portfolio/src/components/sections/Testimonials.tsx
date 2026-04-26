import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah M.",
    location: "Greenville, SC",
    text: "They showed up exactly when they said they would, fixed our back deck, and even cleaned up the yard afterward. It's so hard to find reliable help these days, but Upstate Palmetto is the real deal."
  },
  {
    name: "James T.",
    location: "Spartanburg, SC",
    text: "Had my entire driveway and siding pressure washed before putting our house on the market. The difference was night and day. Very professional crew, polite, and great pricing."
  },
  {
    name: "Eleanor & David W.",
    location: "Easley, SC",
    text: "We hired them to replace some rotting trim and paint the exterior. The craftsmanship is excellent. They didn't rush the prep work, which makes all the difference. Highly recommend."
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-blue-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif"
          >
            Word on the Street
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-600"
          >
            Don't just take our word for it. Here's what your neighbors have to say.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-slate-700 italic flex-grow mb-6">
                "{review.text}"
              </blockquote>
              <div className="mt-auto pt-6 border-t border-slate-100">
                <p className="font-bold text-slate-900">{review.name}</p>
                <p className="text-sm text-slate-500">{review.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

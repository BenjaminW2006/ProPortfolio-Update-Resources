import { motion } from "framer-motion";
import { ShieldCheck, Clock, MapPin, BadgeCheck } from "lucide-react";

export default function WhyChooseUs() {
  return (
    <section id="why-choose-us" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 font-serif">
                A Neighbor You Can Trust With Your Keys.
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                We started Upstate Palmetto Property Services because we saw a need for reliable, honest contractors in our community. We don't believe in cutting corners or leaving messes. When we shake your hand, we mean it.
              </p>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">Licensed & Insured</h4>
                    <p className="text-slate-600">Full coverage for your peace of mind. We take the risk out of home repairs.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">Punctual & Respectful</h4>
                    <p className="text-slate-600">We show up when we say we will, and we treat your property like our own.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">Local to the Upstate</h4>
                    <p className="text-slate-600">We live here, we work here. We care about the reputation we build in our community.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">Guaranteed Quality</h4>
                    <p className="text-slate-600">We aren't finished until the job is done to your satisfaction and our standards.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:w-1/2 w-full">
             <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl"
            >
              <img 
                src="/images/carpentry.png" 
                alt="Detailed carpentry work" 
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-8">
                <p className="text-white font-medium text-lg">"Craftsmanship isn't just about how it looks, it's about how it lasts."</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

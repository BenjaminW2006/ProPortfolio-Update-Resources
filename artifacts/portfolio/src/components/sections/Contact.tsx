import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Contact() {
  const settings = useSiteSettings();
  const phoneRaw = settings.phone.replace(/\D/g, "");

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 font-serif">
            Get in Touch
          </h2>
          <p className="text-lg text-slate-600">
            Ready to start your project? Reach out and we'll get back to you promptly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-blue-50 rounded-2xl border border-blue-100 divide-y divide-blue-100"
        >
          <a
            href={`tel:${phoneRaw}`}
            className="flex items-center gap-5 p-7 hover:bg-blue-100 transition-colors rounded-t-2xl group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-0.5">Phone</p>
              <p className="text-xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                {settings.phone}
              </p>
            </div>
          </a>

          <a
            href={`mailto:${settings.email}`}
            className="flex items-center gap-5 p-7 hover:bg-blue-100 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-0.5">Email</p>
              <p className="text-xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                {settings.email}
              </p>
            </div>
          </a>

          <div className="flex items-center gap-5 p-7 rounded-b-2xl">
            <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-0.5">Service Area</p>
              <p className="text-xl font-bold text-blue-900">
                {settings.serviceArea}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

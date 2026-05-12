import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Contact() {
  const settings = useSiteSettings();
  const phoneRaw = settings.phone.replace(/\D/g, "");
  const { colorContactBg, colorContactText, colorContactCardBg, colorAccent, colorContactIconBg, colorContactIconColor } = settings;

  return (
    <section
      id="contact"
      className="py-24"
      style={{ backgroundColor: colorContactBg, color: colorContactText }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif" style={{ color: colorContactText }}>
            Get in Touch
          </h2>
          <p className="text-lg opacity-70" style={{ color: colorContactText }}>
            Ready to start your project? Reach out and we'll get back to you promptly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl border divide-y overflow-hidden"
          style={{
            backgroundColor: colorContactCardBg,
            borderColor: `${colorAccent}30`,
            ['--divide-color' as string]: `${colorAccent}20`,
          }}
        >
          <a
            href={`tel:${phoneRaw}`}
            className="flex items-center gap-5 p-7 transition-colors rounded-t-2xl group hover:brightness-95"
            style={{ backgroundColor: colorContactCardBg }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: colorContactIconBg }}
            >
              <Phone className="w-5 h-5" style={{ color: colorContactIconColor }} />
            </div>
            <div>
              <p className="text-sm mb-0.5 opacity-60" style={{ color: colorContactText }}>Phone</p>
              <p className="text-xl font-bold" style={{ color: colorContactText }}>
                {settings.phone}
              </p>
            </div>
          </a>

          <a
            href={`mailto:${settings.email}`}
            className="flex items-center gap-5 p-7 transition-colors group hover:brightness-95"
            style={{ backgroundColor: colorContactCardBg, borderColor: `${colorAccent}20` }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: colorContactIconBg }}
            >
              <Mail className="w-5 h-5" style={{ color: colorContactIconColor }} />
            </div>
            <div>
              <p className="text-sm mb-0.5 opacity-60" style={{ color: colorContactText }}>Email</p>
              <p className="text-xl font-bold" style={{ color: colorContactText }}>
                {settings.email}
              </p>
            </div>
          </a>

          <div
            className="flex items-center gap-5 p-7 rounded-b-2xl"
            style={{ backgroundColor: colorContactCardBg, borderColor: `${colorAccent}20` }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: colorContactIconBg }}
            >
              <MapPin className="w-5 h-5" style={{ color: colorContactIconColor }} />
            </div>
            <div>
              <p className="text-sm mb-0.5 opacity-60" style={{ color: colorContactText }}>Service Area</p>
              <p className="text-xl font-bold" style={{ color: colorContactText }}>
                {settings.serviceArea}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

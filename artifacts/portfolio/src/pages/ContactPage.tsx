import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function ContactPage() {
  const { companyName, phone, email, serviceArea } = useSiteSettings();

  const items = [
    { icon: Phone, label: "Phone", value: phone, href: `tel:${phone}` },
    { icon: Mail, label: "Email", value: email, href: `mailto:${email}` },
    { icon: MapPin, label: "Service Area", value: serviceArea, href: null },
  ];

  return (
    <div className="min-h-screen bg-site">
      <Navbar />
      <main className="pt-32 pb-24 px-4">
        <div className="max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-site-text mb-2">Get in Touch</h1>
            <p className="text-site-text/60 mb-12">
              Reach out directly — we're happy to answer questions and schedule a visit.
            </p>

            <div className="flex flex-col gap-5">
              {items.map(({ icon: Icon, label, value, href }) => (
                <div
                  key={label}
                  className="flex items-center gap-5 p-5 rounded-2xl border border-white/10 bg-white/5"
                >
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "color-mix(in srgb, var(--site-accent) 20%, transparent)" }}>
                    <Icon className="w-5 h-5" style={{ color: "var(--site-accent)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-widest text-site-text/40 mb-0.5">
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="text-lg font-medium text-site-text hover:opacity-75 transition-opacity truncate block"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-lg font-medium text-site-text truncate">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {companyName && (
              <p className="mt-12 text-center text-sm text-site-text/30">
                {companyName}
              </p>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { Fragment } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Home() {
  const { showHero, showAbout, showServices, sectionOrder } = useSiteSettings();

  const sectionMap: Record<string, React.ReactNode> = {
    hero: showHero ? <Hero /> : <div className="h-20" />,
    services: (showServices ?? true) ? <Services /> : null,
    about: showAbout ? <WhyChooseUs /> : null,
  };

  const order = sectionOrder?.length ? sectionOrder : ["hero", "services", "about"];

  return (
    <div className="min-h-screen bg-site">
      <Navbar />
      <main>
        {order.map((key) => {
          const section = sectionMap[key];
          return section ? <Fragment key={key}>{section}</Fragment> : null;
        })}
      </main>
      <Footer />
    </div>
  );
}

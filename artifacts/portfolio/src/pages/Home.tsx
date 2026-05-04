import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Home() {
  const { showHero, showServices, showAbout } = useSiteSettings();

  return (
    <div className="min-h-screen bg-site">
      <Navbar />
      <main>
        {showHero ? <Hero /> : <div className="h-20" />}
        {showServices && <Services />}
        {showAbout && <WhyChooseUs />}
      </main>
      <Footer />
    </div>
  );
}

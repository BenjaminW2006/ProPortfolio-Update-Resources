import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Portfolio from "@/components/sections/Portfolio";
import Services from "@/components/sections/Services";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Testimonials from "@/components/sections/Testimonials";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Home() {
  const { showHero, showGalleries, showServices, showAbout, showTestimonials } = useSiteSettings();

  return (
    <div className="min-h-screen bg-site">
      <Navbar />
      <main>
        {showHero ? <Hero /> : <div className="h-20" />}
        {showGalleries && <Portfolio />}
        {showServices && <Services />}
        {showAbout && <WhyChooseUs />}
        {showTestimonials && <Testimonials />}
      </main>
      <Footer />
    </div>
  );
}

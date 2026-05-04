import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Contact from "@/components/sections/Contact";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-site">
      <Navbar />
      <main className="pt-20">
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

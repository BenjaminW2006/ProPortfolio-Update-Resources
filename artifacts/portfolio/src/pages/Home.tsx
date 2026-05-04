import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Portfolio from "@/components/sections/Portfolio";

export default function Home() {
  return (
    <div className="min-h-screen bg-site">
      <Navbar />
      <main>
        <Portfolio />
      </main>
      <Footer />
    </div>
  );
}

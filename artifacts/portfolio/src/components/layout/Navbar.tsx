import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logo from "@assets/Upstate_Palmetto_Property_Services_Logo_(1)_1777217420385.png";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-900/98 backdrop-blur-sm shadow-lg py-3"
          : "bg-slate-900/80 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Upstate Palmetto Property Services"
            className="h-12 w-auto object-contain"
          />
        </a>

        <span className="hidden md:block text-slate-300 text-sm font-medium tracking-wide">
          Upstate Palmetto Property Services
        </span>

        <button
          className="md:hidden p-2 text-slate-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-lg py-4 px-4">
          <p className="text-slate-300 text-center font-medium">Upstate Palmetto Property Services</p>
        </div>
      )}
    </nav>
  );
}

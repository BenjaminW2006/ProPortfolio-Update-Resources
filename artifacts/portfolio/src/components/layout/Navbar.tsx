import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { GiPalmTree } from "react-icons/gi";
import { Menu, X } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const settings = useSiteSettings();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinkClass = (path: string) =>
    `block text-base font-medium transition-colors duration-200 px-4 py-3 rounded-md ${
      location === path
        ? "text-white bg-white/10"
        : "text-slate-300 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-sm ${
        isScrolled ? "shadow-lg py-3" : "py-4"
      }`}
      style={{
        backgroundColor: isScrolled
          ? "color-mix(in srgb, var(--site-header) 98%, transparent)"
          : "color-mix(in srgb, var(--site-header) 82%, transparent)",
      }}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/">
          <span className="flex items-center gap-2 text-white text-xl font-semibold tracking-wide cursor-pointer hover:opacity-90 transition-opacity">
            <GiPalmTree className="text-2xl shrink-0" />
            {settings.companyName}
          </span>
        </Link>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-nav-menu"
          className="backdrop-blur-sm border-t border-white/10 px-4 pb-4 pt-2"
          style={{ backgroundColor: "color-mix(in srgb, var(--site-header) 98%, transparent)" }}
        >
          <Link href="/">
            <span className={navLinkClass("/")}>Home</span>
          </Link>
          <Link href="/contact">
            <span className={navLinkClass("/contact")}>Contact</span>
          </Link>
        </div>
      )}
    </nav>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors duration-200 px-3 py-1 rounded-md ${
      location === path
        ? "text-white bg-white/10"
        : "text-slate-300 hover:text-white hover:bg-white/10"
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block text-base font-medium transition-colors duration-200 px-4 py-3 rounded-md ${
      location === path
        ? "text-white bg-white/10"
        : "text-slate-300 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-900/98 backdrop-blur-sm shadow-lg py-3"
          : "bg-slate-900/80 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/">
          <span className="text-white text-xl font-semibold tracking-wide cursor-pointer hover:opacity-90 transition-opacity">
            Upstate Palmetto Property Services
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/">
            <span className={navLinkClass("/")}>Home</span>
          </Link>
          <Link href="/contact">
            <span className={navLinkClass("/contact")}>Contact</span>
          </Link>
        </div>

        <button
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-menu"
        >
          <span
            className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-nav-menu" className="md:hidden bg-slate-900/98 backdrop-blur-sm border-t border-white/10 px-4 pb-4 pt-2">
          <Link href="/">
            <span className={mobileNavLinkClass("/")}>Home</span>
          </Link>
          <Link href="/contact">
            <span className={mobileNavLinkClass("/contact")}>Contact</span>
          </Link>
        </div>
      )}
    </nav>
  );
}

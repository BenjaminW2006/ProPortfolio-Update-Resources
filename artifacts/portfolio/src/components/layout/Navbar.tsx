import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-colors duration-200 px-3 py-1 rounded-md ${
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
        <div className="flex items-center gap-1">
          <Link href="/">
            <span className={navLinkClass("/")}>Home</span>
          </Link>
          <Link href="/contact">
            <span className={navLinkClass("/contact")}>Contact</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
